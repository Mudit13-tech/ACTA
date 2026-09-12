"""
Behavioural tests for the action loop and the trust layer.

These assert the boundaries from the plan: the agent pays automatically inside
your limits, stops and asks outside them, and is blocked outright past the caps.
"""

import uuid

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from agent.management.commands.seed_catalog import CATALOG
from agent.models import ActivityEvent, Offer, Policy, Run, RunStatus


class ActaAPITestCase(APITestCase):
    """Shared harness: a seeded catalog and a device that drives runs to the end."""

    @classmethod
    def setUpTestData(cls):
        for row in CATALOG:
            Offer.objects.create(**row)

    def setUp(self):
        self.device = 'dev-' + uuid.uuid4().hex[:8]
        self.client.credentials(HTTP_X_ACTA_DEVICE=self.device)

    def policy(self):
        return Policy.objects.get(device_key=self.device)

    def set_policy(self, **patch):
        response = self.client.patch(reverse('policy'), patch, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        return response.data

    def drive(self, goal, budget=20000, approve=True, limit=40):
        """Starts a run and polls it the way the client does, until it settles."""
        response = self.client.post(reverse('run-list'), {'goal': goal, 'budget': budget}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        run = response.data

        for _ in range(limit):
            if run['status'] == 'awaiting-approval':
                route = 'run-approve' if approve else 'run-decline'
                run = self.client.post(reverse(route, args=[run['id']]), {}, format='json').data['run']
                continue
            if run['status'] not in ('running', 'monitoring'):
                break
            payload = self.client.post(reverse('run-advance', args=[run['id']]), {}, format='json').data
            run = payload['run']
            if not payload['moved']:
                break
        return run


class GoalParsingTests(ActaAPITestCase):
    def test_reads_budget_category_and_condition_from_plain_language(self):
        response = self.client.post(
            reverse('goal-preview'),
            {'goal': 'Buy the best headphones under ₹10,000 if they are at least 20% off', 'budget': 50000},
            format='json',
        )
        self.assertEqual(response.data['budget'], 10000)
        self.assertEqual(response.data['category'], 'shopping')
        self.assertEqual(response.data['minDiscountPct'], 20)

    def test_falls_back_to_the_slider_budget_when_the_goal_names_none(self):
        response = self.client.post(
            reverse('goal-preview'), {'goal': 'Book a table for four at 8 PM', 'budget': 5000}, format='json'
        )
        self.assertEqual(response.data['budget'], 5000)
        self.assertEqual(response.data['category'], 'reservation')


class ActionLoopTests(ActaAPITestCase):
    def test_runs_the_whole_loop_and_pays_once_approved(self):
        run = self.drive('Find me a highly rated hotel in Goa for 3 nights under ₹15,000 and book it')

        self.assertEqual(run['status'], RunStatus.COMPLETED)
        self.assertTrue(run['receipt']['verified'])
        self.assertLessEqual(run['receipt']['amount'], 15000)
        self.assertTrue(all(s['status'] not in ('pending', 'active') for s in run['stages']))

    def test_declining_pays_nothing(self):
        run = self.drive('Find me a hotel in Goa for 3 nights under ₹15,000', approve=False)

        self.assertEqual(run['status'], RunStatus.DECLINED)
        self.assertIsNone(run['receipt'])

    def test_waits_for_the_discount_condition_before_buying(self):
        run = self.drive('Buy the best headphones under ₹10,000 if they are at least 20% off')

        self.assertGreaterEqual(len(run['watch']), 3, 'the monitor stage should observe the price')
        # 20% off the ₹11,499 list price.
        self.assertLessEqual(run['receipt']['amount'], 9199)
        self.assertEqual(run['status'], RunStatus.COMPLETED)

    def test_stops_rather_than_overspend_when_nothing_fits(self):
        run = self.drive('Find me a hotel in Goa under ₹3,000', budget=3000)

        self.assertEqual(run['status'], RunStatus.BLOCKED)
        self.assertEqual(run['pickId'], '')
        self.assertIsNone(run['receipt'])


class TrustLayerTests(ActaAPITestCase):
    def test_pays_automatically_when_every_boundary_is_satisfied(self):
        self.set_policy(autoApproveLimit=2000, trustedVendors=['The Fig Tree', 'Osteria Brava'])

        run = self.drive('Book a table for four at 8 PM', budget=5000)

        approval = next(s for s in run['stages'] if s['id'] == 'approval')
        self.assertEqual(approval['status'], 'skipped')
        self.assertEqual(run['status'], RunStatus.COMPLETED)
        self.assertTrue(run['verdict']['autoPay'])

    def test_asks_when_the_amount_is_above_the_auto_approve_limit(self):
        response = self.client.post(
            reverse('run-list'),
            {'goal': 'Find me a hotel in Goa for 3 nights under ₹15,000', 'budget': 20000},
            format='json',
        )
        run = response.data
        for _ in range(20):
            if run['status'] != RunStatus.RUNNING:
                break
            run = self.client.post(reverse('run-advance', args=[run['id']]), {}, format='json').data['run']

        self.assertEqual(run['status'], RunStatus.AWAITING_APPROVAL)
        self.assertTrue(run['verdict']['needsApproval'])
        self.assertIsNone(run['receipt'], 'nothing may be charged while approval is pending')

    def test_asks_about_a_new_vendor_even_below_the_limit(self):
        self.set_policy(autoApproveLimit=5000, requireApprovalNewVendor=True, trustedVendors=[])

        run = self.drive('Book a table for four at 8 PM', budget=5000)

        self.assertTrue(any('new vendor' in r for r in run['verdict']['reasons']))

    def test_daily_cap_blocks_outright_instead_of_asking(self):
        self.set_policy(dailyCap=20000, autoApproveLimit=2000)
        self.drive('Find me a hotel in Goa for 3 nights under ₹15,000')

        run = self.drive('Find me a hotel in Goa for 3 nights under ₹15,000')

        self.assertEqual(run['status'], RunStatus.BLOCKED)
        self.assertTrue(any('daily cap' in r for r in run['verdict']['reasons']))
        self.assertIsNone(run['receipt'])

    def test_hard_ceiling_cannot_be_approved_past(self):
        self.set_policy(hardCeiling=10000, dailyCap=10000, autoApproveLimit=1000)

        run = self.drive('Find me a hotel in Goa for 3 nights under ₹15,000')

        self.assertEqual(run['status'], RunStatus.BLOCKED)
        self.assertFalse(run['verdict']['needsApproval'], 'a blocked task is never offered for approval')

    def test_approving_can_trust_the_vendor_for_next_time(self):
        response = self.client.post(
            reverse('run-list'),
            {'goal': 'Find me a hotel in Goa for 3 nights under ₹15,000', 'budget': 20000},
            format='json',
        )
        run = response.data
        for _ in range(20):
            if run['status'] != RunStatus.RUNNING:
                break
            run = self.client.post(reverse('run-advance', args=[run['id']]), {}, format='json').data['run']

        vendor = next(o for o in run['offers'] if o['id'] == run['pickId'])['vendor']
        self.client.post(reverse('run-approve', args=[run['id']]), {'trustVendor': True}, format='json')

        self.assertIn(vendor, self.policy().trusted_vendors)


class PolicyApiTests(ActaAPITestCase):
    def test_a_new_device_starts_from_the_documented_defaults(self):
        data = self.client.get(reverse('policy')).data

        self.assertEqual(data['autoApproveLimit'], 2000)
        self.assertTrue(data['autoPayEnabled'])
        self.assertEqual(data['trustedVendors'], [])

    def test_rejects_a_policy_that_contradicts_itself(self):
        response = self.client.patch(
            reverse('policy'), {'autoApproveLimit': 90000, 'dailyCap': 25000}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_requires_a_device_header(self):
        self.client.credentials()
        self.assertEqual(self.client.get(reverse('policy')).status_code, status.HTTP_400_BAD_REQUEST)

    def test_one_device_cannot_read_another_devices_run(self):
        run = self.drive('Book a table for four at 8 PM', budget=5000)
        self.client.credentials(HTTP_X_ACTA_DEVICE='dev-someone-else')

        response = self.client.get(reverse('run-detail', args=[run['id']]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ActivityTests(ActaAPITestCase):
    def test_logs_every_step_and_tracks_todays_spend(self):
        run = self.drive('Find me a hotel in Goa for 3 nights under ₹15,000')
        data = self.client.get(reverse('activity')).data

        kinds = {e['kind'] for e in data['events']}
        self.assertTrue({'started', 'approved', 'paid', 'verified'} <= kinds, kinds)
        self.assertEqual(data['spentToday'], run['receipt']['amount'])

    def test_clearing_history_keeps_anything_still_in_flight(self):
        settled = self.drive('Book a table for four at 8 PM', budget=5000)
        live = self.client.post(
            reverse('run-list'), {'goal': 'Find me a hotel in Goa under ₹15,000', 'budget': 20000}, format='json'
        ).data

        self.client.delete(reverse('activity'))

        self.assertFalse(Run.objects.filter(pk=settled['id']).exists())
        self.assertTrue(Run.objects.filter(pk=live['id']).exists())
        self.assertTrue(ActivityEvent.objects.filter(run_id=live['id']).exists())


class GuardTests(ActaAPITestCase):
    def test_cannot_approve_a_run_that_is_not_waiting(self):
        run = self.client.post(
            reverse('run-list'), {'goal': 'Book a table for four at 8 PM', 'budget': 5000}, format='json'
        ).data

        response = self.client.post(reverse('run-approve', args=[run['id']]), {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_rejects_an_empty_goal(self):
        response = self.client.post(reverse('run-list'), {'goal': '   ', 'budget': 5000}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_advancing_a_settled_run_reports_no_movement(self):
        run = self.drive('Book a table for four at 8 PM', budget=5000)

        payload = self.client.post(reverse('run-advance', args=[run['id']]), {}, format='json').data

        self.assertFalse(payload['moved'])
