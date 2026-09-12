"""Seeds the connector inventory the agent shops from."""

from django.core.management.base import BaseCommand

from agent.models import Cancellation, Category, Offer

CATALOG = [
    # ── Shopping ──────────────────────────────────────────────────────────────
    {
        'category': Category.SHOPPING, 'vendor': 'Nexus Audio', 'title': 'Aurex NC-700 Wireless Headphones',
        'price': 9999, 'list_price': 11499, 'rating': 4.6, 'reviews': 2841,
        'facts': ['Active noise cancelling', '38 hr battery', '2 yr warranty'],
        'cancellation': Cancellation.FREE, 'keywords': 'headphone,headphones,earphone,audio',
    },
    {
        'category': Category.SHOPPING, 'vendor': 'ToneCraft', 'title': 'ToneCraft Studio One Over-Ear',
        'price': 8299, 'list_price': 9999, 'rating': 4.3, 'reviews': 1160,
        'facts': ['Hybrid ANC', '30 hr battery', 'Ships in 4 days'],
        'cancellation': Cancellation.PAID, 'keywords': 'headphone,headphones,earphone,audio',
    },
    {
        'category': Category.SHOPPING, 'vendor': 'Meridian Devices', 'title': 'Meridian Pulse Pro',
        'price': 11250, 'list_price': 14500, 'rating': 4.7, 'reviews': 5302,
        'facts': ['Adaptive ANC', '40 hr battery', 'Next-day delivery'],
        'cancellation': Cancellation.FREE, 'keywords': 'headphone,headphones,earphone,audio',
    },
    {
        'category': Category.SHOPPING, 'vendor': 'Orbit Display Co.', 'title': 'Orbit 27" QHD 165Hz Monitor',
        'price': 18990, 'list_price': 23999, 'rating': 4.5, 'reviews': 921,
        'facts': ['27" IPS QHD', '165Hz / 1ms', '3 yr on-site warranty'],
        'cancellation': Cancellation.FREE, 'keywords': 'monitor,display,screen,inch',
    },
    {
        'category': Category.SHOPPING, 'vendor': 'Lumen Works', 'title': 'Lumen 27" 4K Creator Display',
        'price': 24500, 'list_price': 27999, 'rating': 4.8, 'reviews': 430,
        'facts': ['27" 4K', '98% DCI-P3', 'USB-C 90W'],
        'cancellation': Cancellation.PAID, 'keywords': 'monitor,display,screen,inch',
    },
    # ── Travel ────────────────────────────────────────────────────────────────
    {
        'category': Category.TRAVEL, 'vendor': 'Casa Azul Goa', 'title': 'Casa Azul — Sea-view Deluxe, 3 nights',
        'price': 13800, 'list_price': 16200, 'rating': 4.7, 'reviews': 1284,
        'facts': ['Anjuna, 400m from beach', 'Breakfast included', 'Free cancellation till 24h'],
        'cancellation': Cancellation.FREE, 'keywords': '',
    },
    {
        'category': Category.TRAVEL, 'vendor': 'Palm Court Resorts', 'title': 'Palm Court — Garden Suite, 3 nights',
        'price': 11900, 'list_price': 12500, 'rating': 4.2, 'reviews': 640,
        'facts': ['Candolim', 'Pool access', 'Non-refundable rate'],
        'cancellation': Cancellation.NONE, 'keywords': '',
    },
    {
        'category': Category.TRAVEL, 'vendor': 'The Saltwater House', 'title': 'Saltwater House — Balcony Room, 3 nights',
        'price': 14600, 'list_price': 18900, 'rating': 4.8, 'reviews': 2110,
        'facts': ['Vagator, beachfront', 'Breakfast + airport pickup', 'Cancel till 48h'],
        'cancellation': Cancellation.FREE, 'keywords': '',
    },
    {
        'category': Category.TRAVEL, 'vendor': 'Coastline Stays', 'title': 'Coastline — Standard Twin, 3 nights',
        'price': 8700, 'list_price': 9400, 'rating': 3.9, 'reviews': 318,
        'facts': ['Calangute, 1.2km inland', 'No breakfast', 'Paid cancellation'],
        'cancellation': Cancellation.PAID, 'keywords': '',
    },
    # ── Reservations ──────────────────────────────────────────────────────────
    {
        'category': Category.RESERVATION, 'vendor': 'Osteria Brava', 'title': 'Osteria Brava — table for 4, 8:00 PM',
        'price': 2000, 'list_price': 2000, 'rating': 4.6, 'reviews': 890,
        'facts': ['Italian, 1.8 km away', 'Deposit ₹2,000 adjusted on bill', 'Cancel till 4h'],
        'cancellation': Cancellation.FREE, 'keywords': '',
    },
    {
        'category': Category.RESERVATION, 'vendor': 'Kessho', 'title': 'Kessho — counter seats for 4, 8:15 PM',
        'price': 4000, 'list_price': 4000, 'rating': 4.9, 'reviews': 412,
        'facts': ['Japanese omakase', 'Prepaid deposit', 'Non-refundable within 24h'],
        'cancellation': Cancellation.PAID, 'keywords': '',
    },
    {
        'category': Category.RESERVATION, 'vendor': 'The Fig Tree', 'title': 'The Fig Tree — garden table for 4, 8:30 PM',
        'price': 1500, 'list_price': 1500, 'rating': 4.4, 'reviews': 1530,
        'facts': ['Continental, 3 km away', 'Refundable hold', 'Free cancellation'],
        'cancellation': Cancellation.FREE, 'keywords': '',
    },
]


class Command(BaseCommand):
    help = 'Loads the demo connector inventory (idempotent).'

    def handle(self, *args, **options):
        created = updated = 0
        for row in CATALOG:
            _, was_created = Offer.objects.update_or_create(
                vendor=row['vendor'], title=row['title'], defaults=row
            )
            created += was_created
            updated += not was_created
        self.stdout.write(self.style.SUCCESS(f'Catalog ready — {created} created, {updated} updated.'))
