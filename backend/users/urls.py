from django.urls import path

from .views import ChangePasswordView, LoginView, MeView, ProfileView, RegisterView


urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("profile/", ProfileView.as_view(), name="auth-profile"),
    path("profile/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
]

