from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import Camera, Incident, UserProfile


class Command(BaseCommand):
    help = "Seed demo users, cameras, and incidents for RESQ backend"

    def handle(self, *args, **options):
        user_model = get_user_model()

        admin_user, _ = user_model.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@gmail.com"},
        )
        admin_user.email = "admin@gmail.com"
        admin_user.set_password("admin123")
        admin_user.save()
        UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={"role": UserProfile.ROLE_ADMIN},
        )

        bfp_user, _ = user_model.objects.get_or_create(
            username="bfp",
            defaults={"email": "bfp@gmail.com"},
        )
        bfp_user.email = "bfp@gmail.com"
        bfp_user.set_password("bfp123")
        bfp_user.save()
        UserProfile.objects.get_or_create(
            user=bfp_user,
            defaults={"role": UserProfile.ROLE_BFP},
        )

        cam1, _ = Camera.objects.update_or_create(
            camera_code="CAM-001",
            defaults={
                "name": "Entrance Gate",
                "location": "Main Building",
                "status": Camera.STATUS_ONLINE,
                "last_active": timezone.now(),
            },
        )
        cam2, _ = Camera.objects.update_or_create(
            camera_code="CAM-002",
            defaults={
                "name": "Parking Lot A",
                "location": "North Wing",
                "status": Camera.STATUS_OFFLINE,
                "last_active": timezone.now(),
            },
        )
        Camera.objects.update_or_create(
            camera_code="CAM-003",
            defaults={
                "name": "Lobby Camera",
                "location": "Reception",
                "status": Camera.STATUS_ONLINE,
                "last_active": timezone.now(),
            },
        )

        Incident.objects.update_or_create(
            incident_code="INC-001",
            defaults={
                "incident_type": Incident.TYPE_FIRE,
                "location": "Zone A - North",
                "detection_method": Incident.METHOD_HEAT_SENSOR,
                "time_reported": timezone.now(),
                "status": Incident.STATUS_RESOLVED,
                "camera": cam1,
                "reported_by": admin_user,
                "notes": "Fire detected and resolved by response team.",
            },
        )
        Incident.objects.update_or_create(
            incident_code="INC-002",
            defaults={
                "incident_type": Incident.TYPE_GAS,
                "location": "Zone C - Lobby",
                "detection_method": Incident.METHOD_CAMERA_AI,
                "time_reported": timezone.now(),
                "status": Incident.STATUS_INVESTIGATING,
                "camera": cam2,
                "reported_by": bfp_user,
                "notes": "Gas trace under validation.",
            },
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
