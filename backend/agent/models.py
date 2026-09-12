"""
Data model for ACTA — the trust and transaction layer for AI agents.

Identity note: the app has no sign-in yet, so policies and runs are scoped by a
device key the client generates and persists. ``user`` is kept nullable so real
accounts can adopt existing rows once JWT sign-in lands.
"""

from django.conf import settings
from django.db import models


class Category(models.TextChoices):
    SHOPPING = 'shopping', 'Shopping'
    TRAVEL = 'travel', 'Travel'
    RESERVATION = 'reservation', 'Reservation'


class Cancellation(models.TextChoices):
    FREE = 'free', 'Free cancellation'
    PAID = 'paid', 'Paid cancellation'
    NONE = 'none', 'Non-refundable'


class RunStatus(models.TextChoices):
    RUNNING = 'running', 'Running'
    MONITORING = 'monitoring', 'Monitoring'
    AWAITING_APPROVAL = 'awaiting-approval', 'Awaiting approval'
    COMPLETED = 'completed', 'Completed'
    DECLINED = 'declined', 'Declined'
    BLOCKED = 'blocked', 'Blocked'


class Offer(models.Model):
    """Supply-side inventory. Stands in for the merchant connectors in the plan."""

    category = models.CharField(max_length=16, choices=Category.choices)
    vendor = models.CharField(max_length=120)
    title = models.CharField(max_length=200)
    price = models.PositiveIntegerField(help_text='Current price in ₹')
    list_price = models.PositiveIntegerField(help_text='Pre-discount price in ₹')
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=4.0)
    reviews = models.PositiveIntegerField(default=0)
    facts = models.JSONField(default=list, blank=True)
    cancellation = models.CharField(max_length=8, choices=Cancellation.choices, default=Cancellation.FREE)
    keywords = models.CharField(
        max_length=200,
        blank=True,
        help_text='Comma-separated terms used to narrow a goal to this offer',
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['category', 'price']

    def __str__(self):
        return f'{self.vendor} — {self.title}'

    @property
    def discount_pct(self):
        if self.list_price <= 0:
            return 0
        return round((self.list_price - self.price) / self.list_price * 100)


class Policy(models.Model):
    """Programmable autonomy — the boundaries the agent may never step outside."""

    device_key = models.CharField(max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name='policies'
    )

    auto_pay_enabled = models.BooleanField(default=True)
    auto_approve_limit = models.PositiveIntegerField(default=2000)
    daily_cap = models.PositiveIntegerField(default=25000)
    hard_ceiling = models.PositiveIntegerField(default=100000)
    require_approval_new_vendor = models.BooleanField(default=True)
    require_approval_paid_cancellation = models.BooleanField(default=True)
    trusted_vendors = models.JSONField(default=list, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'policies'

    def __str__(self):
        return f'Policy for {self.device_key[:12]}'


class Run(models.Model):
    """One task: a goal, the loop that chased it, and what it cost."""

    device_key = models.CharField(max_length=64, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name='runs'
    )

    goal_text = models.TextField()
    category = models.CharField(max_length=16, choices=Category.choices)
    budget = models.PositiveIntegerField()
    min_discount_pct = models.PositiveIntegerField(null=True, blank=True)
    constraints = models.JSONField(default=list, blank=True)

    status = models.CharField(max_length=24, choices=RunStatus.choices, default=RunStatus.RUNNING)

    # Loop state. These blobs are stored exactly as the API emits them so the
    # client renders them without a translation step.
    stages = models.JSONField(default=list)
    offers = models.JSONField(default=list, blank=True)
    watch = models.JSONField(default=list, blank=True)
    pick_id = models.CharField(max_length=32, blank=True)
    verdict = models.JSONField(null=True, blank=True)
    receipt = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.goal_text[:48]} ({self.status})'

    @property
    def pick(self):
        return next((o for o in self.offers if o.get('id') == self.pick_id), None)

    @property
    def is_live(self):
        return self.status in (RunStatus.RUNNING, RunStatus.MONITORING)


class ActivityEvent(models.Model):
    """Audit trail — every action the agent took, and why."""

    class Kind(models.TextChoices):
        STARTED = 'started', 'Started'
        APPROVED = 'approved', 'Approved'
        DECLINED = 'declined', 'Declined'
        PAID = 'paid', 'Paid'
        VERIFIED = 'verified', 'Verified'
        BLOCKED = 'blocked', 'Blocked'
        WATCHING = 'watching', 'Watching'

    device_key = models.CharField(max_length=64, db_index=True)
    run = models.ForeignKey(Run, on_delete=models.CASCADE, related_name='events')
    kind = models.CharField(max_length=16, choices=Kind.choices)
    title = models.CharField(max_length=160)
    detail = models.TextField(blank=True)
    amount = models.PositiveIntegerField(null=True, blank=True)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-at']

    def __str__(self):
        return f'{self.kind}: {self.title}'
