from django.conf import settings
from django.db import models
from django.utils import timezone


class UserProfile(models.Model):
	ROLE_ADMIN = "admin"
	ROLE_BFP = "bfp"
	ROLE_CHOICES = [
		(ROLE_ADMIN, "Admin"),
		(ROLE_BFP, "BFP"),
	]

	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="profile",
	)
	role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_BFP)
	avatar = models.URLField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"{self.user.username} ({self.role})"


class Camera(models.Model):
	STATUS_ONLINE = "online"
	STATUS_OFFLINE = "offline"
	STATUS_MAINTENANCE = "maintenance"
	STATUS_CHOICES = [
		(STATUS_ONLINE, "Online"),
		(STATUS_OFFLINE, "Offline"),
		(STATUS_MAINTENANCE, "Maintenance"),
	]

	camera_code = models.CharField(max_length=20, unique=True)
	name = models.CharField(max_length=120)
	location = models.CharField(max_length=160)
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ONLINE)
	last_active = models.DateTimeField(default=timezone.now)
	footage_url = models.URLField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["camera_code"]

	def __str__(self):
		return f"{self.camera_code} - {self.name}"


class Incident(models.Model):
	TYPE_FIRE = "fire"
	TYPE_GAS = "gas"
	TYPE_SMOKE = "smoke"
	TYPE_OTHER = "other"
	TYPE_CHOICES = [
		(TYPE_FIRE, "Fire"),
		(TYPE_GAS, "Gas"),
		(TYPE_SMOKE, "Smoke"),
		(TYPE_OTHER, "Other"),
	]

	METHOD_HEAT_SENSOR = "heat_sensor"
	METHOD_CAMERA_AI = "camera_ai"
	METHOD_GAS_SENSOR = "gas_sensor"
	METHOD_MANUAL = "manual"
	METHOD_CHOICES = [
		(METHOD_HEAT_SENSOR, "Heat Sensor"),
		(METHOD_CAMERA_AI, "Camera AI"),
		(METHOD_GAS_SENSOR, "Gas Sensor"),
		(METHOD_MANUAL, "Manual"),
	]

	STATUS_OPEN = "open"
	STATUS_INVESTIGATING = "investigating"
	STATUS_RESOLVED = "resolved"
	STATUS_CHOICES = [
		(STATUS_OPEN, "Open"),
		(STATUS_INVESTIGATING, "Investigating"),
		(STATUS_RESOLVED, "Resolved"),
	]

	incident_code = models.CharField(max_length=20, unique=True)
	incident_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
	location = models.CharField(max_length=180)
	detection_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
	time_reported = models.DateTimeField(default=timezone.now)
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_INVESTIGATING)
	camera = models.ForeignKey(
		Camera,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="incidents",
	)
	reported_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="reported_incidents",
	)
	notes = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-time_reported"]

	def __str__(self):
		return f"{self.incident_code} ({self.incident_type})"
