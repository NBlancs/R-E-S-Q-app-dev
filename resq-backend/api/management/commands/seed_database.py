from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.models import Alert, Camera, Incident, UserProfile


class Command(BaseCommand):
    help = "Seed the full RESQ dataset for local development or Render PostgreSQL"

    @transaction.atomic
    def handle(self, *args, **options):
        user_model = get_user_model()

        users = [
            {
                "username": "admin",
                "email": "admin@gmail.com",
                "password": "admin123",
                "role": UserProfile.ROLE_ADMIN,
                "avatar": "https://example.com/avatar.png",
            },
            {
                "username": "bfp",
                "email": "bfp@gmail.com",
                "password": "bfp123",
                "role": UserProfile.ROLE_BFP,
                "avatar": "",
            },
            {
                "username": "student",
                "email": "student@example.com",
                "password": "student123",
                "role": UserProfile.ROLE_BFP,
                "avatar": "",
            },
        ]

        user_map = {}
        for item in users:
            user, _ = user_model.objects.get_or_create(username=item["username"])
            user.email = item["email"]
            user.set_password(item["password"])
            user.save()

            UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    "role": item["role"],
                    "avatar": item["avatar"],
                },
            )
            user_map[item["username"]] = user

        now = timezone.now()

        camera_map = {}
        for item in [
            {
                "camera_code": "CAM-001",
                "name": "Entrance Gate",
                "location": "Main Building",
                "status": Camera.STATUS_ONLINE,
                "last_active": now,
                "footage_url": "",
            },
            {
                "camera_code": "CAM-002",
                "name": "Parking Lot A",
                "location": "North Wing",
                "status": Camera.STATUS_OFFLINE,
                "last_active": now,
                "footage_url": "",
            },
            {
                "camera_code": "CAM-003",
                "name": "Lobby Camera",
                "location": "Reception",
                "status": Camera.STATUS_ONLINE,
                "last_active": now,
                "footage_url": "",
            },
            {
                "camera_code": "CAM-004",
                "name": "Warehouse Cam",
                "location": "Zone D",
                "status": Camera.STATUS_ONLINE,
                "last_active": now,
                "footage_url": "",
            },
        ]:
            camera, _ = Camera.objects.update_or_create(
                camera_code=item["camera_code"],
                defaults={
                    "name": item["name"],
                    "location": item["location"],
                    "status": item["status"],
                    "last_active": item["last_active"],
                    "footage_url": item["footage_url"],
                },
            )
            camera_map[item["camera_code"]] = camera

        incident_items = [
            {
                "incident_code": "INC-001",
                "incident_type": Incident.TYPE_FIRE,
                "location": "Zone A - North",
                "detection_method": Incident.METHOD_HEAT_SENSOR,
                "time_reported": now,
                "status": Incident.STATUS_RESOLVED,
                "camera": camera_map["CAM-001"],
                "reported_by": user_map["admin"],
                "notes": "Fire detected and resolved by response team.",
            },
            {
                "incident_code": "INC-002",
                "incident_type": Incident.TYPE_GAS,
                "location": "Zone C - Lobby",
                "detection_method": Incident.METHOD_CAMERA_AI,
                "time_reported": now,
                "status": Incident.STATUS_INVESTIGATING,
                "camera": camera_map["CAM-002"],
                "reported_by": user_map["bfp"],
                "notes": "Gas trace under validation.",
            },
            {
                "incident_code": "INC-003",
                "incident_type": Incident.TYPE_SMOKE,
                "location": "Zone D - Storage",
                "detection_method": Incident.METHOD_CAMERA_AI,
                "time_reported": now,
                "status": Incident.STATUS_OPEN,
                "camera": camera_map["CAM-004"],
                "reported_by": user_map["student"],
                "notes": "Smoke detected by camera AI",
            },
        ]

        for item in incident_items:
            Incident.objects.update_or_create(
                incident_code=item["incident_code"],
                defaults={
                    "incident_type": item["incident_type"],
                    "location": item["location"],
                    "detection_method": item["detection_method"],
                    "time_reported": item["time_reported"],
                    "status": item["status"],
                    "camera": item["camera"],
                    "reported_by": item["reported_by"],
                    "notes": item["notes"],
                },
            )

        alert_items = [
            {
                "alert_code": "ALERT-001",
                "title": "Fire Detected - Zone A",
                "location": "Sector 4 - Warehouse",
                "priority": Alert.PRIORITY_HIGH,
                "acknowledged": False,
                "acknowledged_at": None,
            },
            {
                "alert_code": "ALERT-002",
                "title": "Gas Detected - Zone B",
                "location": "Office Block 2",
                "priority": Alert.PRIORITY_MEDIUM,
                "acknowledged": True,
                "acknowledged_at": now,
            },
        ]

        for item in alert_items:
            Alert.objects.update_or_create(
                alert_code=item["alert_code"],
                defaults={
                    "title": item["title"],
                    "location": item["location"],
                    "priority": item["priority"],
                    "acknowledged": item["acknowledged"],
                    "acknowledged_at": item["acknowledged_at"],
                },
            )

        self.stdout.write(self.style.SUCCESS("Full RESQ dataset seeded successfully."))