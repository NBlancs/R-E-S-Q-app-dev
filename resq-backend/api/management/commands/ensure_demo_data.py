from django.core.management import call_command
from django.core.management.base import BaseCommand

from api.models import Alert, Camera, Incident, UserProfile


class Command(BaseCommand):
    help = "Seed RESQ demo data only when the database is empty"

    def handle(self, *args, **options):
        has_data = any(
            queryset.exists()
            for queryset in (UserProfile.objects.all(), Alert.objects.all(), Camera.objects.all(), Incident.objects.all())
        )

        if has_data:
            self.stdout.write(self.style.SUCCESS('Database already contains data; skipping demo seed.'))
            return

        call_command('seed_database')