from django.conf import settings
from django.db import models


class CareerPath(models.Model):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Tag(models.Model):
    name = models.CharField(max_length=64, unique=True)

    def __str__(self):
        return self.name


class LearningResource(models.Model):
    TYPE_CHOICES = [
        ("article", "Article"),
        ("video", "Video"),
        ("course", "Course"),
        ("tutorial", "Tutorial"),
        ("project", "Project"),
    ]

    DIFFICULTY_CHOICES = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    ]

    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    topic = models.CharField(max_length=120, blank=True)
    url = models.URLField(unique=True)
    thumbnail_url = models.URLField(blank=True)
    resource_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default="beginner")

    tags = models.ManyToManyField(Tag, blank=True, related_name="resources")
    career_paths = models.ManyToManyField(CareerPath, blank=True, related_name="resources")

    source = models.CharField(max_length=120, blank=True)  # e.g. freeCodeCamp, YouTube, OCW
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class UserPreference(models.Model):
    EXPERIENCE_LEVEL_CHOICES = [("fresher", "Fresher"), ("experienced", "Experienced")]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="preference")
    selected_career_path = models.ForeignKey(CareerPath, null=True, blank=True, on_delete=models.SET_NULL)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES, blank=True)
    interests = models.TextField(blank=True)  # comma-separated

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preference({self.user_id})"


class UserActivity(models.Model):
    ACTION_CHOICES = [
        ("view", "View"),
        ("start", "Start"),
        ("complete", "Complete"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activities")
    resource = models.ForeignKey(LearningResource, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    progress = models.PositiveSmallIntegerField(default=0)  # 0..100
    created_at = models.DateTimeField(auto_now_add=True)

