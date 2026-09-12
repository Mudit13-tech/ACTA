"""
Serializers speak camelCase because the only client is a TypeScript app; the
models stay snake_case. JSON blobs (stages, offers, receipt) are already stored
in the client's shape and pass straight through.
"""

from rest_framework import serializers

from .models import ActivityEvent, Offer, Policy, Run


class OfferSerializer(serializers.ModelSerializer):
    listPrice = serializers.IntegerField(source='list_price')
    rating = serializers.FloatField()
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Offer
        fields = ['id', 'category', 'vendor', 'title', 'price', 'listPrice', 'rating', 'reviews', 'facts', 'cancellation']


class PolicySerializer(serializers.ModelSerializer):
    autoPayEnabled = serializers.BooleanField(source='auto_pay_enabled', required=False)
    autoApproveLimit = serializers.IntegerField(source='auto_approve_limit', min_value=0, required=False)
    dailyCap = serializers.IntegerField(source='daily_cap', min_value=0, required=False)
    hardCeiling = serializers.IntegerField(source='hard_ceiling', min_value=0, required=False)
    requireApprovalNewVendor = serializers.BooleanField(source='require_approval_new_vendor', required=False)
    requireApprovalPaidCancellation = serializers.BooleanField(
        source='require_approval_paid_cancellation', required=False
    )
    trustedVendors = serializers.ListField(
        source='trusted_vendors', child=serializers.CharField(max_length=120), required=False
    )

    class Meta:
        model = Policy
        fields = [
            'autoPayEnabled',
            'autoApproveLimit',
            'dailyCap',
            'hardCeiling',
            'requireApprovalNewVendor',
            'requireApprovalPaidCancellation',
            'trustedVendors',
        ]

    def validate(self, attrs):
        """The ceiling has to sit above the caps, or the policy contradicts itself."""
        merged = {
            'auto_approve_limit': attrs.get('auto_approve_limit', getattr(self.instance, 'auto_approve_limit', 0)),
            'daily_cap': attrs.get('daily_cap', getattr(self.instance, 'daily_cap', 0)),
            'hard_ceiling': attrs.get('hard_ceiling', getattr(self.instance, 'hard_ceiling', 0)),
        }
        if merged['auto_approve_limit'] > merged['daily_cap']:
            raise serializers.ValidationError('Auto-approve limit cannot exceed the daily cap.')
        if merged['daily_cap'] > merged['hard_ceiling']:
            raise serializers.ValidationError('Daily cap cannot exceed the hard ceiling.')
        return attrs


class RunSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    goal = serializers.SerializerMethodField()
    pickId = serializers.CharField(source='pick_id')
    createdAt = serializers.DateTimeField(source='created_at')

    class Meta:
        model = Run
        fields = ['id', 'goal', 'status', 'createdAt', 'stages', 'offers', 'watch', 'pickId', 'verdict', 'receipt']

    def get_goal(self, run):
        return {
            'text': run.goal_text,
            'category': run.category,
            'budget': run.budget,
            'minDiscountPct': run.min_discount_pct,
            'constraints': run.constraints,
        }


class ActivityEventSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    runId = serializers.CharField(source='run_id')

    class Meta:
        model = ActivityEvent
        fields = ['id', 'runId', 'at', 'kind', 'title', 'detail', 'amount']


class StartRunSerializer(serializers.Serializer):
    goal = serializers.CharField(max_length=500, trim_whitespace=True)
    budget = serializers.IntegerField(min_value=1, max_value=10_000_000)

    def validate_goal(self, value):
        if not value.strip():
            raise serializers.ValidationError('Tell the agent what you want done.')
        return value.strip()


class GoalPreviewSerializer(StartRunSerializer):
    """Same shape as starting a run — used for the live read-back before it runs."""
