"""
The agent API.

Identity: there is no sign-in yet, so every request carries an ``X-ACTA-Device``
header the client generates once and stores. Policies, runs and activity are
scoped to it. Swap ``DeviceScopedView.owner`` for ``request.user`` when JWT
sign-in lands — nothing else changes.
"""

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import engine
from .models import ActivityEvent, Offer, Policy, Run, RunStatus
from .serializers import (
    ActivityEventSerializer,
    GoalPreviewSerializer,
    OfferSerializer,
    PolicySerializer,
    RunSerializer,
    StartRunSerializer,
)

DEVICE_HEADER = 'HTTP_X_ACTA_DEVICE'


class DeviceScopedView(APIView):
    """Base view that resolves the caller's device key and its policy."""

    @property
    def device_key(self):
        key = (self.request.META.get(DEVICE_HEADER) or '').strip()[:64]
        if not key:
            raise MissingDevice()
        return key

    def get_policy(self):
        policy, _ = Policy.objects.get_or_create(device_key=self.device_key)
        return policy

    def handle_exception(self, exc):
        if isinstance(exc, MissingDevice):
            return Response(
                {'detail': 'Missing X-ACTA-Device header.'}, status=status.HTTP_400_BAD_REQUEST
            )
        return super().handle_exception(exc)


class MissingDevice(Exception):
    pass


def events_since(run, marker):
    """Activity the loop generated during this request, newest last."""
    return ActivityEventSerializer(
        run.events.filter(at__gte=marker).order_by('at'), many=True
    ).data


class HealthView(APIView):
    def get(self, request):
        return Response({'status': 'ok', 'offers': Offer.objects.filter(is_active=True).count()})


class CatalogView(APIView):
    """What the connectors can see. Read-only — the agent shops here."""

    def get(self, request):
        offers = Offer.objects.filter(is_active=True)
        category = request.query_params.get('category')
        if category:
            offers = offers.filter(category=category)
        return Response(OfferSerializer(offers, many=True).data)


class PolicyView(DeviceScopedView):
    def get(self, request):
        return Response(PolicySerializer(self.get_policy()).data)

    def patch(self, request):
        policy = self.get_policy()
        serializer = PolicySerializer(policy, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class GoalPreviewView(APIView):
    """What the agent understood, before it commits to anything."""

    def post(self, request):
        serializer = GoalPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        goal = engine.parse_goal(serializer.validated_data['goal'], serializer.validated_data['budget'])
        return Response(goal)


class RunListView(DeviceScopedView):
    def get(self, request):
        runs = Run.objects.filter(device_key=self.device_key)[:30]
        return Response(RunSerializer(runs, many=True).data)

    @transaction.atomic
    def post(self, request):
        serializer = StartRunSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        goal = engine.parse_goal(serializer.validated_data['goal'], serializer.validated_data['budget'])

        run = Run.objects.create(
            device_key=self.device_key,
            goal_text=goal['text'],
            category=goal['category'],
            budget=goal['budget'],
            min_discount_pct=goal['minDiscountPct'],
            constraints=goal['constraints'],
            stages=engine.fresh_stages(),
        )
        engine.log_event(run, ActivityEvent.Kind.STARTED, 'Task started', goal['text'], goal['budget'])
        return Response(RunSerializer(run).data, status=status.HTTP_201_CREATED)


class RunDetailView(DeviceScopedView):
    def get_run(self, pk):
        return get_object_or_404(Run, pk=pk, device_key=self.device_key)

    def get(self, request, pk):
        return Response(RunSerializer(self.get_run(pk)).data)


class RunAdvanceView(RunDetailView):
    """Drives the loop one stage at a time. The client polls this while a run is live."""

    @transaction.atomic
    def post(self, request, pk):
        marker = timezone.now()
        run = Run.objects.select_for_update().get(pk=pk, device_key=self.device_key)
        moved = engine.advance(run, self.get_policy())
        run.refresh_from_db()
        return Response({'moved': moved, 'run': RunSerializer(run).data, 'events': events_since(run, marker)})


class RunApproveView(RunDetailView):
    @transaction.atomic
    def post(self, request, pk):
        run = self.get_run(pk)
        if run.status != RunStatus.AWAITING_APPROVAL:
            return Response({'detail': 'This task is not waiting for approval.'}, status=status.HTTP_409_CONFLICT)

        pick = run.pick
        if request.data.get('trustVendor') and pick:
            policy = self.get_policy()
            if pick['vendor'] not in policy.trusted_vendors:
                policy.trusted_vendors = [*policy.trusted_vendors, pick['vendor']]
                policy.save(update_fields=['trusted_vendors', 'updated_at'])

        approval = next(s for s in run.stages if s['id'] == 'approval')
        run.status = RunStatus.RUNNING
        run.stages = engine.patch_stage(
            run.stages, 'approval', status='done', note='Approved by you',
            log=[*approval['log'], 'approved by the account holder'],
        )
        run.save()
        marker = timezone.now()
        engine.log_event(
            run, ActivityEvent.Kind.APPROVED, 'You approved the payment',
            f"{pick['vendor']} · {engine.inr(pick['price'])}" if pick else run.goal_text,
            pick['price'] if pick else None,
        )
        return Response({'run': RunSerializer(run).data, 'events': events_since(run, marker)})


class RunDeclineView(RunDetailView):
    @transaction.atomic
    def post(self, request, pk):
        run = self.get_run(pk)
        if run.status != RunStatus.AWAITING_APPROVAL:
            return Response({'detail': 'This task is not waiting for approval.'}, status=status.HTTP_409_CONFLICT)

        approval = next(s for s in run.stages if s['id'] == 'approval')
        run.status = RunStatus.DECLINED
        run.stages = engine.patch_stage(
            run.stages, 'approval', status='failed', note='Declined by you — nothing was paid',
            log=[*approval['log'], 'declined — checkout discarded'],
        )
        run.save()
        marker = timezone.now()
        engine.log_event(run, ActivityEvent.Kind.DECLINED, 'You declined the payment', run.goal_text)
        return Response({'run': RunSerializer(run).data, 'events': events_since(run, marker)})


class RunFastForwardView(RunDetailView):
    """Skips the monitoring wait so the loop can be watched end to end."""

    @transaction.atomic
    def post(self, request, pk):
        run = self.get_run(pk)
        if run.status != RunStatus.MONITORING:
            return Response({'detail': 'This task is not waiting on a price.'}, status=status.HTTP_409_CONFLICT)

        pick = run.pick
        padding = max(0, engine.WATCH_TICKS - len(run.watch))
        run.watch = run.watch + [
            {'at': run.updated_at.isoformat(), 'price': pick['price'] if pick else 0, 'note': 'Skipped ahead'}
            for _ in range(padding)
        ]
        run.save(update_fields=['watch', 'updated_at'])
        return Response({'run': RunSerializer(run).data, 'events': []})


class ActivityView(DeviceScopedView):
    def get(self, request):
        events = ActivityEvent.objects.filter(device_key=self.device_key)[:100]
        return Response(
            {
                'events': ActivityEventSerializer(events, many=True).data,
                'spentToday': engine.spent_today(self.device_key),
            }
        )

    def delete(self, request):
        """Clears history but leaves anything still in flight alone."""
        live = Run.objects.filter(
            device_key=self.device_key,
            status__in=[RunStatus.RUNNING, RunStatus.MONITORING, RunStatus.AWAITING_APPROVAL],
        ).values_list('pk', flat=True)
        ActivityEvent.objects.filter(device_key=self.device_key).exclude(run_id__in=list(live)).delete()
        Run.objects.filter(device_key=self.device_key).exclude(pk__in=list(live)).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
