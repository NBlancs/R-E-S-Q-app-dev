from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
import uuid

from .models import Alert, Camera, Incident, UserProfile
from .serializers import (
	AlertSerializer,
	CameraSerializer,
	IncidentSerializer,
	RegisterSerializer,
	ProfileUpdateSerializer,
	UserProfileSerializer,
)

User = get_user_model()


class RegisterView(APIView):
	permission_classes = [permissions.AllowAny]

	def post(self, request):
		serializer = RegisterSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		token, _ = Token.objects.get_or_create(user=user)
		profile = user.profile

		return Response(
			{
				"message": "User registered successfully.",
				"token": token.key,
				"user": UserProfileSerializer(profile).data,
			},
			status=status.HTTP_201_CREATED,
		)


class LoginView(APIView):
	permission_classes = [permissions.AllowAny]

	def post(self, request):
		email = str(request.data.get("email", "")).strip().lower()
		password = str(request.data.get("password", ""))

		if not email or not password:
			return Response(
				{"detail": "Email and password are required."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		user = User.objects.filter(email__iexact=email).first()
		if not user or not user.check_password(password):
			return Response(
				{"detail": "Invalid credentials."},
				status=status.HTTP_401_UNAUTHORIZED,
			)

		token, _ = Token.objects.get_or_create(user=user)
		profile, _ = UserProfile.objects.get_or_create(user=user)

		return Response(
			{
				"message": "Login successful.",
				"token": token.key,
				"user": UserProfileSerializer(profile).data,
			}
		)


class ProfileView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request):
		profile, _ = UserProfile.objects.get_or_create(user=request.user)
		return Response(UserProfileSerializer(profile).data)

	def patch(self, request):
		profile, _ = UserProfile.objects.get_or_create(user=request.user)
		serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
		serializer.is_valid(raise_exception=True)
		updated_profile = serializer.save()
		return Response(UserProfileSerializer(updated_profile).data)

	def put(self, request):
		return self.patch(request)


class CameraViewSet(viewsets.ModelViewSet):
	queryset = Camera.objects.all()
	serializer_class = CameraSerializer
	permission_classes = [permissions.IsAuthenticated]


class IncidentViewSet(viewsets.ModelViewSet):
	queryset = Incident.objects.select_related("camera", "reported_by").all()
	serializer_class = IncidentSerializer
	permission_classes = [permissions.IsAuthenticated]


class AlertViewSet(viewsets.ModelViewSet):
	queryset = Alert.objects.all().order_by("-created_at")
	serializer_class = AlertSerializer
	permission_classes = [permissions.IsAuthenticated]

	@action(detail=True, methods=["post"])
	def acknowledge(self, request, pk=None):
		alert = self.get_object()
		alert.acknowledged = True
		alert.acknowledged_at = timezone.now()
		alert.save(update_fields=["acknowledged", "acknowledged_at", "updated_at"])
		return Response(AlertSerializer(alert).data)

	@action(detail=True, methods=["post"])
	def unread(self, request, pk=None):
		alert = self.get_object()
		alert.acknowledged = False
		alert.acknowledged_at = None
		alert.save(update_fields=["acknowledged", "acknowledged_at", "updated_at"])
		return Response(AlertSerializer(alert).data)

	@action(detail=True, methods=["post"])
	def dismiss(self, request, pk=None):
		alert = self.get_object()
		alert.acknowledged = True
		alert.acknowledged_at = alert.acknowledged_at or timezone.now()
		alert.dismissed = True
		alert.dismissed_at = timezone.now()
		alert.save(update_fields=["acknowledged", "acknowledged_at", "dismissed", "dismissed_at", "updated_at"])
		return Response(AlertSerializer(alert).data)


def _build_event_code(prefix):
	return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_fire_event(request):
	location = str(request.data.get("location", "")).strip()
	latitude = request.data.get("latitude")
	longitude = request.data.get("longitude")
	confidence = request.data.get("confidence")
	camera_id = request.data.get("camera")
	notes = str(request.data.get("notes", "")).strip()
	status_value = str(request.data.get("status", Incident.STATUS_OPEN)).strip().lower() or Incident.STATUS_OPEN

	if not location:
		return Response({"detail": "Location is required."}, status=status.HTTP_400_BAD_REQUEST)

	try:
		latitude_value = float(latitude)
		longitude_value = float(longitude)
		confidence_value = float(confidence)
	except (TypeError, ValueError):
		return Response({"detail": "Valid latitude, longitude, and confidence are required."}, status=status.HTTP_400_BAD_REQUEST)

	if confidence_value < 0 or confidence_value > 1:
		return Response({"detail": "Confidence must be between 0 and 1."}, status=status.HTTP_400_BAD_REQUEST)

	if status_value not in {Incident.STATUS_OPEN, Incident.STATUS_INVESTIGATING, Incident.STATUS_RESOLVED}:
		status_value = Incident.STATUS_OPEN

	camera = None
	if camera_id not in (None, "", "null"):
		camera = Camera.objects.filter(pk=camera_id).first()

	event_id = uuid.uuid4().hex
	alert_title = f"Fire Detected - {location}"
	created_at = timezone.now()

	with transaction.atomic():
		alert = Alert.objects.create(
			alert_code=_build_event_code("FIRE"),
			event_id=event_id,
			title=alert_title,
			location=location,
			priority=Alert.PRIORITY_HIGH,
			confidence=confidence_value,
			acknowledged=False,
			dismissed=False,
		)

		incident = Incident.objects.create(
			incident_code=_build_event_code("INC"),
			event_id=event_id,
			incident_type=Incident.TYPE_FIRE,
			location=location,
			detection_method=Incident.METHOD_CAMERA_AI,
			time_reported=created_at,
			latitude=latitude_value,
			longitude=longitude_value,
			confidence=confidence_value,
			status=status_value,
			camera=camera,
			reported_by=request.user,
			notes=notes or f"Confirmed fire detection at {confidence_value * 100:.1f}% confidence.",
		)

	return Response(
		{
			"event_id": event_id,
			"alert": AlertSerializer(alert).data,
			"incident": IncidentSerializer(incident).data,
		},
		status=status.HTTP_201_CREATED,
	)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def system_overview(request):
	return Response(
		{
			"camera_count": Camera.objects.count(),
			"incident_count": Incident.objects.count(),
			"open_incidents": Incident.objects.filter(
				status__in=[Incident.STATUS_OPEN, Incident.STATUS_INVESTIGATING]
			).count(),
			"resolved_incidents": Incident.objects.filter(
				status=Incident.STATUS_RESOLVED
			).count(),
		}
	)
