"""
The ACTA action loop, server-side.

    Understand → Search → Compare → Decide → Monitor
    → Prepare → Request approval → Execute → Verify

``advance()`` moves a run forward by exactly one stage (or one monitoring tick)
and returns the events it generated. Nothing here spends money outside
``check_policy`` — that function is the trust layer.
"""

import random
import re
import string
from datetime import timedelta

from django.utils import timezone

from .models import ActivityEvent, Cancellation, Category, Offer, RunStatus

STAGES = [
    ('understand', 'Understand'),
    ('search', 'Search'),
    ('compare', 'Compare'),
    ('decide', 'Decide'),
    ('monitor', 'Monitor'),
    ('prepare', 'Prepare'),
    ('approval', 'Request approval'),
    ('execute', 'Execute'),
    ('verify', 'Verify'),
]

WATCH_TICKS = 3


def fresh_stages():
    return [{'id': sid, 'name': name, 'status': 'pending', 'note': '', 'log': []} for sid, name in STAGES]


def inr(amount):
    return '₹' + f'{round(amount):,}'


def discount_pct(price, list_price):
    if not list_price:
        return 0
    return round((list_price - price) / list_price * 100)


# ── Goal parsing ──────────────────────────────────────────────────────────────

_KEYWORDS = [
    (Category.TRAVEL, ['hotel', 'stay', 'goa', 'resort', 'flight', 'trip', 'night']),
    (Category.RESERVATION, ['table', 'reserve', 'reservation', 'dinner', 'restaurant', 'seat']),
    (Category.SHOPPING, ['buy', 'headphone', 'monitor', 'laptop', 'phone', 'order', 'purchase']),
]

_CONSTRAINT_HINTS = [
    (r'free cancellation|refundable|cancel', 'Free cancellation preferred'),
    (r'highly rated|best rated|top rated|good reviews', 'Rating above 4.5'),
    (r'beach|sea.?view|seaside', 'Close to the beach'),
    (r'breakfast', 'Breakfast included'),
    (r'next.?day|fast delivery|urgent|same.?day', 'Fast fulfilment'),
    (r'warranty', 'Warranty required'),
]


def detect_category(text):
    lowered = text.lower()
    for category, words in _KEYWORDS:
        if any(word in lowered for word in words):
            return category
    return Category.SHOPPING


def parse_budget(text):
    """Pulls a rupee ceiling out of text: '₹15,000', 'under 20k', 'below 2000'."""
    cleaned = text.lower().replace(',', '')
    shorthand = re.search(
        r'(?:under|below|upto|up to|within|max|budget of|less than)?\s*₹?\s*(\d+(?:\.\d+)?)\s*k\b', cleaned
    )
    if shorthand:
        return round(float(shorthand.group(1)) * 1000)
    plain = re.search(r'₹\s*(\d{3,7})', cleaned) or re.search(
        r'(?:under|below|upto|up to|within|max|budget of|less than)\s*(\d{3,7})', cleaned
    )
    return int(plain.group(1)) if plain else None


def parse_discount(text):
    """'at least 20% discount', '20% off' → 20"""
    match = re.search(r'(\d{1,2})\s*%', text.lower())
    return int(match.group(1)) if match else None


def parse_goal(text, fallback_budget):
    lowered = text.lower()
    return {
        'text': text.strip(),
        'category': detect_category(text),
        'budget': parse_budget(text) or fallback_budget,
        'minDiscountPct': parse_discount(text),
        'constraints': [label for pattern, label in _CONSTRAINT_HINTS if re.search(pattern, lowered)],
    }


# ── Search ────────────────────────────────────────────────────────────────────

def offer_payload(offer):
    return {
        'id': str(offer.pk),
        'vendor': offer.vendor,
        'title': offer.title,
        'price': offer.price,
        'listPrice': offer.list_price,
        'rating': float(offer.rating),
        'reviews': offer.reviews,
        'facts': offer.facts,
        'cancellation': offer.cancellation,
    }


def search_market(category, text):
    """Queries the connectors for anything that could satisfy the goal."""
    candidates = Offer.objects.filter(category=category, is_active=True)
    lowered = text.lower()

    # Within a broad category, narrow by the keywords an offer declares.
    matched = [
        offer
        for offer in candidates
        if offer.keywords and any(k.strip() and k.strip() in lowered for k in offer.keywords.split(','))
    ]
    chosen = matched or list(candidates)
    return [offer_payload(o) for o in chosen]


# ── Compare + decide ──────────────────────────────────────────────────────────

def rank_offers(offers, goal, policy):
    """Scores on price against budget, quality signals and cancellation terms."""
    ranked = []
    for offer in offers:
        reasons = []
        score = 0.0
        price = offer['price']

        if price <= goal['budget']:
            headroom = (goal['budget'] - price) / goal['budget']
            score += 34 + min(headroom, 0.4) * 40
            reasons.append(f"{inr(goal['budget'] - price)} under budget")
        else:
            score -= 40
            reasons.append(f"{inr(price - goal['budget'])} over budget")

        score += (offer['rating'] - 3.5) * 18
        if offer['rating'] >= 4.5:
            reasons.append(f"Rated {offer['rating']} across {offer['reviews']:,} reviews")

        off = discount_pct(price, offer['listPrice'])
        score += min(off, 35) * 0.5
        if off >= 10:
            reasons.append(f'{off}% below list price')

        if offer['cancellation'] == Cancellation.FREE:
            score += 10
            reasons.append('Free cancellation')
        elif offer['cancellation'] == Cancellation.NONE:
            score -= 8
            reasons.append('Non-refundable')
        else:
            score -= 4
            reasons.append('Paid cancellation')

        if offer['vendor'] in policy.trusted_vendors:
            score += 6
            reasons.append('Vendor used before')

        if goal.get('minDiscountPct') and off < goal['minDiscountPct']:
            reasons.append(f"Discount condition not met yet ({off}% of {goal['minDiscountPct']}%)")

        ranked.append({**offer, 'score': max(0, round(score)), 'reasons': reasons})

    return sorted(ranked, key=lambda o: o['score'], reverse=True)


def pick_winner(ranked, goal):
    return next((o for o in ranked if o['price'] <= goal['budget']), None)


def needs_watch(offer, goal):
    target = goal.get('minDiscountPct')
    return bool(target) and discount_pct(offer['price'], offer['listPrice']) < target


def target_price(offer, goal):
    return round(offer['listPrice'] * (1 - (goal.get('minDiscountPct') or 0) / 100))


# ── The trust layer ───────────────────────────────────────────────────────────

def spent_today(device_key):
    """What the agent has already paid out today, for the daily cap."""
    from .models import Run  # local import keeps the module import graph flat

    since = timezone.now() - timedelta(days=1)
    total = 0
    for run in Run.objects.filter(device_key=device_key, updated_at__gte=since).exclude(receipt=None):
        paid_at = run.receipt.get('paidAt')
        if paid_at and paid_at[:10] == timezone.now().date().isoformat():
            total += run.receipt.get('amount', 0)
    return total


def check_policy(offer, policy, already_spent):
    """
    Every path here is an explicit user-defined boundary. The agent never
    spends outside one — not for a better deal, not for a closing offer.
    """
    reasons = []
    needs_approval = False
    blocked = False
    price = offer['price']

    if price > policy.hard_ceiling:
        blocked = True
        reasons.append(f'Above the hard ceiling of {inr(policy.hard_ceiling)} — the agent cannot execute this at all')

    if already_spent + price > policy.daily_cap:
        blocked = True
        reasons.append(
            f"Would take today's agent spend to {inr(already_spent + price)}, "
            f'past the {inr(policy.daily_cap)} daily cap'
        )

    if not policy.auto_pay_enabled:
        needs_approval = True
        reasons.append('Automatic payment is switched off in your policy')

    if price > policy.auto_approve_limit:
        needs_approval = True
        reasons.append(f'{inr(price)} is above your {inr(policy.auto_approve_limit)} auto-approve limit')

    if policy.require_approval_new_vendor and offer['vendor'] not in policy.trusted_vendors:
        needs_approval = True
        reasons.append(f"{offer['vendor']} is a new vendor for this account")

    if policy.require_approval_paid_cancellation and offer['cancellation'] != Cancellation.FREE:
        needs_approval = True
        reasons.append(
            'The rate is non-refundable'
            if offer['cancellation'] == Cancellation.NONE
            else 'Cancelling this booking costs money'
        )

    if not needs_approval and not blocked:
        reasons.append('Within every boundary you set — clear to pay automatically')

    return {
        'autoPay': not needs_approval and not blocked,
        'needsApproval': needs_approval and not blocked,
        'blocked': blocked,
        'reasons': reasons,
    }


# ── Execution ─────────────────────────────────────────────────────────────────

def _reference():
    block = lambda: ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))  # noqa: E731
    return f'ACTA-{block()}-{block()}'


def make_receipt(offer, method='ACTA virtual card · single-use'):
    return {
        'reference': _reference(),
        'paidAt': timezone.now().isoformat(),
        'amount': offer['price'],
        'method': method,
        'vendor': offer['vendor'],
        'verified': True,
    }


# ── Stage helpers ─────────────────────────────────────────────────────────────

def patch_stage(stages, stage_id, **patch):
    return [{**s, **patch} if s['id'] == stage_id else s for s in stages]


def open_stage(run):
    return next((s for s in run.stages if s['status'] in ('pending', 'active')), None)


def log_event(run, kind, title, detail='', amount=None):
    return ActivityEvent.objects.create(
        device_key=run.device_key, run=run, kind=kind, title=title, detail=detail, amount=amount
    )


# ── The loop ──────────────────────────────────────────────────────────────────

def advance(run, policy):
    """
    Moves ``run`` forward one stage and saves it. Returns True when something
    actually moved, so callers can stop polling a finished run.
    """
    stage = open_stage(run)
    if stage is None or run.status not in (RunStatus.RUNNING, RunStatus.MONITORING):
        return False

    goal = {
        'text': run.goal_text,
        'category': run.category,
        'budget': run.budget,
        'minDiscountPct': run.min_discount_pct,
        'constraints': run.constraints,
    }
    pick = run.pick
    sid = stage['id']

    if sid == 'understand':
        log = [
            f"intent: {run.category}",
            f"budget ceiling: {inr(run.budget)}",
            f"condition: at least {run.min_discount_pct}% off" if run.min_discount_pct else 'condition: none',
        ]
        if run.constraints:
            log.append('constraints: ' + ', '.join(run.constraints))
        run.stages = patch_stage(
            run.stages, 'understand', status='done', note=f'{run.category} · up to {inr(run.budget)}', log=log
        )

    elif sid == 'search':
        run.offers = search_market(run.category, run.goal_text)
        vendors = {o['vendor'] for o in run.offers}
        run.stages = patch_stage(
            run.stages,
            'search',
            status='done',
            note=f'{len(run.offers)} options across {len(vendors)} vendors',
            log=[f"{o['vendor']} · {inr(o['price'])}" for o in run.offers[:4]],
        )

    elif sid == 'compare':
        run.offers = rank_offers(run.offers, goal, policy)
        run.stages = patch_stage(
            run.stages,
            'compare',
            status='done',
            note='Scored on price, rating, discount and cancellation terms',
            log=[f"#{i + 1} {o['vendor']} — score {o['score']}" for i, o in enumerate(run.offers[:3])],
        )

    elif sid == 'decide':
        winner = pick_winner(run.offers, goal)
        if winner is None:
            cheapest = min((o['price'] for o in run.offers), default=0)
            run.status = RunStatus.BLOCKED
            run.stages = patch_stage(
                run.stages,
                'decide',
                status='failed',
                note=f'Nothing available within {inr(run.budget)}',
                log=['No offer met the budget — the agent stopped rather than overspend'],
            )
            run.save()
            log_event(run, ActivityEvent.Kind.BLOCKED, 'No option within budget', f'Cheapest option was {inr(cheapest)}')
            return True
        run.pick_id = winner['id']
        run.stages = patch_stage(
            run.stages, 'decide', status='done', note=f"{winner['vendor']} — {inr(winner['price'])}",
            log=winner['reasons'][:3],
        )

    elif sid == 'monitor':
        if pick is None:
            return False
        off = discount_pct(pick['price'], pick['listPrice'])

        if not needs_watch(pick, goal):
            note = f'Condition already met at {off}% off' if run.min_discount_pct else 'Price and availability stable'
            run.stages = patch_stage(
                run.stages, 'monitor', status='done', note=note,
                log=[f"{pick['vendor']} holding at {inr(pick['price'])}"],
            )
        else:
            target = target_price(pick, goal)
            ticks = len(run.watch)

            if ticks == 0:
                run.status = RunStatus.MONITORING
                run.watch = [{'at': timezone.now().isoformat(), 'price': pick['price'], 'note': 'Watch started'}]
                run.stages = patch_stage(
                    run.stages, 'monitor', status='active',
                    note=f"Waiting for {inr(target)} ({run.min_discount_pct}% off)",
                    log=[f"current {inr(pick['price'])} · {off}% off · target {inr(target)}"],
                )
                run.save()
                log_event(
                    run, ActivityEvent.Kind.WATCHING, 'Watching price',
                    f"{pick['title']} — will act at {inr(target)} or lower", pick['price'],
                )
                return True

            if ticks < WATCH_TICKS:
                drift = round((pick['price'] - target) * (ticks / WATCH_TICKS) * 0.55)
                next_price = pick['price'] - drift
                run.offers = [{**o, 'price': next_price} if o['id'] == pick['id'] else o for o in run.offers]
                run.watch = run.watch + [
                    {'at': timezone.now().isoformat(), 'price': next_price, 'note': 'Price moved'}
                ]
                run.stages = patch_stage(
                    run.stages, 'monitor', status='active',
                    note=f"Waiting for {inr(target)} ({run.min_discount_pct}% off)",
                    log=stage['log'] + [
                        f"{inr(next_price)} · {discount_pct(next_price, pick['listPrice'])}% off — still short"
                    ],
                )
            else:
                run.status = RunStatus.RUNNING
                run.offers = [{**o, 'price': target} if o['id'] == pick['id'] else o for o in run.offers]
                run.watch = run.watch + [
                    {'at': timezone.now().isoformat(), 'price': target, 'note': 'Condition met'}
                ]
                run.stages = patch_stage(
                    run.stages, 'monitor', status='done', note=f'Condition met at {inr(target)}',
                    log=stage['log'] + [f"{inr(target)} · {run.min_discount_pct}% off — condition met, resuming"],
                )
                run.save()
                log_event(
                    run, ActivityEvent.Kind.WATCHING, 'Target price reached',
                    f"{pick['vendor']} dropped to {inr(target)}", target,
                )
                return True

    elif sid == 'prepare':
        if pick is None:
            return False
        run.stages = patch_stage(
            run.stages, 'prepare', status='done', note='Checkout built, nothing submitted yet',
            log=[
                f"cart: {pick['title']}",
                f"payable: {inr(pick['price'])}",
                'instrument: ACTA virtual card · single-use',
            ],
        )

    elif sid == 'approval':
        if pick is None:
            return False
        verdict = check_policy(pick, policy, spent_today(run.device_key))
        run.verdict = verdict

        if verdict['blocked']:
            run.status = RunStatus.BLOCKED
            run.stages = patch_stage(
                run.stages, 'approval', status='failed', note='Blocked by your policy', log=verdict['reasons']
            )
            run.save()
            log_event(run, ActivityEvent.Kind.BLOCKED, 'Blocked by policy', verdict['reasons'][0], pick['price'])
            return True

        if verdict['needsApproval']:
            run.status = RunStatus.AWAITING_APPROVAL
            run.stages = patch_stage(
                run.stages, 'approval', status='blocked', note='Waiting for you', log=verdict['reasons']
            )
        else:
            run.stages = patch_stage(
                run.stages, 'approval', status='skipped', note='Automatic — inside your limits', log=verdict['reasons']
            )

    elif sid == 'execute':
        if pick is None:
            return False
        receipt = make_receipt(pick)
        run.receipt = receipt
        run.stages = patch_stage(
            run.stages, 'execute', status='done',
            note=f"{inr(receipt['amount'])} paid to {receipt['vendor']}",
            log=[f"authorised {inr(receipt['amount'])}", f"reference {receipt['reference']}"],
        )
        run.save()
        log_event(
            run, ActivityEvent.Kind.PAID, f"Paid {inr(receipt['amount'])}",
            f"{receipt['vendor']} · {receipt['reference']}", receipt['amount'],
        )
        return True

    elif sid == 'verify':
        if pick is None:
            return False
        cancellation = {
            Cancellation.FREE: 'free until cut-off',
            Cancellation.PAID: 'chargeable',
            Cancellation.NONE: 'non-refundable',
        }.get(pick['cancellation'], 'unknown')
        run.status = RunStatus.COMPLETED
        run.stages = patch_stage(
            run.stages, 'verify', status='done', note='Confirmed with the vendor',
            log=[
                f"{(run.receipt or {}).get('reference', '')} confirmed",
                f'cancellation: {cancellation}',
            ],
        )
        run.save()
        log_event(run, ActivityEvent.Kind.VERIFIED, 'Task complete', f"{pick['title']} confirmed", pick['price'])
        return True

    run.save()
    return True
