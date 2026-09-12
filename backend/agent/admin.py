from django.contrib import admin

from .models import ActivityEvent, Offer, Policy, Run


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ['vendor', 'title', 'category', 'price', 'list_price', 'rating', 'cancellation', 'is_active']
    list_filter = ['category', 'cancellation', 'is_active']
    search_fields = ['vendor', 'title', 'keywords']


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = ['device_key', 'auto_pay_enabled', 'auto_approve_limit', 'daily_cap', 'hard_ceiling', 'updated_at']
    search_fields = ['device_key']


@admin.register(Run)
class RunAdmin(admin.ModelAdmin):
    list_display = ['goal_text', 'category', 'budget', 'status', 'created_at']
    list_filter = ['status', 'category']
    readonly_fields = ['stages', 'offers', 'watch', 'verdict', 'receipt']


@admin.register(ActivityEvent)
class ActivityEventAdmin(admin.ModelAdmin):
    list_display = ['at', 'kind', 'title', 'amount', 'device_key']
    list_filter = ['kind']
