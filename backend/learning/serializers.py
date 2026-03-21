from rest_framework import serializers

from .models import CareerPath, LearningResource, Tag, UserActivity, UserPreference


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class CareerPathSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerPath
        fields = ["id", "slug", "title", "description"]


class LearningResourceSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = LearningResource
        fields = [
            "id",
            "title",
            "description",
            "topic",
            "url",
            "thumbnail_url",
            "resource_type",
            "difficulty",
            "tags",
            "source",
        ]


class UserPreferenceSerializer(serializers.ModelSerializer):
    selected_career_path = CareerPathSerializer(read_only=True)
    selected_career_path_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = UserPreference
        fields = ["selected_career_path", "selected_career_path_id", "experience_level", "interests"]

    def update(self, instance, validated_data):
        selected_id = validated_data.pop("selected_career_path_id", None)
        if selected_id is not None:
            instance.selected_career_path_id = selected_id
        return super().update(instance, validated_data)


class UserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = ["id", "resource", "action", "progress", "created_at"]
        read_only_fields = ["id", "created_at"]

