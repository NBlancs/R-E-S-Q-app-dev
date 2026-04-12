from django.contrib.auth import get_user_model
from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Camera, Incident, UserProfile
from .serializers import (
	CameraSerializer,
	IncidentSerializer,
	RegisterSerializer,
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


class CameraViewSet(viewsets.ModelViewSet):
	queryset = Camera.objects.all()
	serializer_class = CameraSerializer
	permission_classes = [permissions.IsAuthenticated]


class IncidentViewSet(viewsets.ModelViewSet):
	queryset = Incident.objects.select_related("camera", "reported_by").all()
	serializer_class = IncidentSerializer
	permission_classes = [permissions.IsAuthenticated]


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
