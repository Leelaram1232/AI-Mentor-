from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import CareerPath, LearningResource, UserActivity, UserPreference
from .serializers import (
    CareerPathSerializer,
    LearningResourceSerializer,
    UserActivitySerializer,
    UserPreferenceSerializer,
)
from .recommender import recommend_for_user


class CareerPathViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CareerPath.objects.all().order_by("title")
    serializer_class = CareerPathSerializer
    permission_classes = [permissions.IsAuthenticated]


class LearningResourceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LearningResource.objects.all().order_by("-created_at")
    serializer_class = LearningResourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        career_path_id = self.request.query_params.get("career_path_id")
        if career_path_id:
            qs = qs.filter(career_paths__id=career_path_id)
        resource_type = self.request.query_params.get("type")
        if resource_type:
            qs = qs.filter(resource_type=resource_type)
        difficulty = self.request.query_params.get("difficulty")
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        return qs.distinct()


class PreferenceViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_or_create_pref(self, user):
        pref, _ = UserPreference.objects.get_or_create(user=user)
        return pref

    def retrieve(self, request):
        pref = self._get_or_create_pref(request.user)
        return Response(UserPreferenceSerializer(pref).data)

    def partial_update(self, request):
        pref = self._get_or_create_pref(request.user)
        serializer = UserPreferenceSerializer(pref, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserPreferenceSerializer(pref).data)

    @action(detail=False, methods=["get"])
    def recommendations(self, request):
        qs = recommend_for_user(request.user.id, limit=12)
        return Response({"results": LearningResourceSerializer(qs, many=True).data})


class UserActivityViewSet(viewsets.ModelViewSet):
    serializer_class = UserActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserActivity.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

