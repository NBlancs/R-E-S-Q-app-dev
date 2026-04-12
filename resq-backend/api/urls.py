from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CameraViewSet,
    IncidentViewSet,
    LoginView,
    ProfileView,
    RegisterView,
    system_overview,
)

router = DefaultRouter()
router.register("cameras", CameraViewSet, basename="camera")
router.register("incidents", IncidentViewSet, basename="incident")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/profile/", ProfileView.as_view(), name="profile"),
    path("system/overview/", system_overview, name="system-overview"),
    path("", include(router.urls)),
]
