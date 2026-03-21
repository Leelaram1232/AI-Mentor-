from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CareerPathViewSet, LearningResourceViewSet, PreferenceViewSet, UserActivityViewSet


router = DefaultRouter()
router.register(r"career-paths", CareerPathViewSet, basename="career-path")
router.register(r"resources", LearningResourceViewSet, basename="resource")
router.register(r"activity", UserActivityViewSet, basename="activity")

urlpatterns = [
    path("", include(router.urls)),
    path("preferences/me/", PreferenceViewSet.as_view({"get": "retrieve", "patch": "partial_update"})),
    path("recommendations/me/", PreferenceViewSet.as_view({"get": "recommendations"})),
]

