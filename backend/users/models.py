from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    photo = models.ImageField(upload_to="avatars/", blank=True, null=True)
    education_level = models.CharField(max_length=120, blank=True)
    bio = models.TextField(blank=True)
    skills = models.TextField(blank=True)  # comma-separated list

    def __str__(self):
        return f"Profile({self.user_id})"

