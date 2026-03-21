from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from learning.models import CareerPath, UserPreference
from .models import Profile


User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        email = validated_data["email"].lower().strip()
        password = validated_data["password"]
        # Username is still required by AbstractUser; derive a stable placeholder.
        username = email.split("@")[0][:150] or "user"
        user = User.objects.create_user(email=email, username=username, password=password)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_new_password"]:
            raise serializers.ValidationError({"confirm_new_password": "Passwords do not match."})
        validate_password(attrs["new_password"], self.context["user"])
        return attrs


class ProfileDetailSerializer(serializers.Serializer):
    # User info
    email = serializers.EmailField(read_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    # Profile fields
    education_level = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    skills = serializers.CharField(required=False, allow_blank=True)
    photo_url = serializers.CharField(read_only=True)

    # Preference fields
    interests = serializers.CharField(required=False, allow_blank=True)
    experience_level = serializers.CharField(required=False, allow_blank=True)
    selected_career_path_id = serializers.IntegerField(required=False, allow_null=True)

    def to_representation(self, instance):
        user = instance
        profile, _ = Profile.objects.get_or_create(user=user)
        pref, _ = UserPreference.objects.get_or_create(user=user)

        return {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "education_level": profile.education_level,
            "bio": profile.bio,
            "skills": profile.skills,
            "photo_url": profile.photo.url if profile.photo else "",
            "interests": pref.interests,
            "experience_level": pref.experience_level,
            "selected_career_path_id": pref.selected_career_path_id,
        }

    def update(self, instance, validated_data):
        user = instance
        profile, _ = Profile.objects.get_or_create(user=user)
        pref, _ = UserPreference.objects.get_or_create(user=user)

        # User names
        first_name = validated_data.get("first_name")
        last_name = validated_data.get("last_name")
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        user.save()

        # Profile fields
        for field in ["education_level", "bio", "skills"]:
            if field in validated_data:
                setattr(profile, field, validated_data[field])
        profile.save()

        # Preference fields
        if "interests" in validated_data:
            pref.interests = validated_data["interests"]
        if "experience_level" in validated_data:
            pref.experience_level = validated_data["experience_level"]
        if "selected_career_path_id" in validated_data:
            cp_id = validated_data["selected_career_path_id"]
            if cp_id is None:
                pref.selected_career_path = None
            else:
                try:
                    pref.selected_career_path = CareerPath.objects.get(id=cp_id)
                except CareerPath.DoesNotExist:
                    pass
        pref.save()

        return user

