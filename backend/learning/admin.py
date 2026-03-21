from django.contrib import admin

from .models import CareerPath, LearningResource, Tag, UserActivity, UserPreference


@admin.register(CareerPath)
class CareerPathAdmin(admin.ModelAdmin):
    list_display = ("id", "slug", "title", "created_at")
    search_fields = ("slug", "title")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(LearningResource)
class LearningResourceAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "resource_type", "difficulty", "source", "created_at")
    search_fields = ("title", "topic", "url", "source")
    list_filter = ("resource_type", "difficulty", "source")


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "selected_career_path", "experience_level", "updated_at")
    search_fields = ("user__email",)


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "resource", "action", "progress", "created_at")
    list_filter = ("action",)

