from django.urls import path
from .views import parse_resume, scrape_jobs

urlpatterns = [
    path("parse-resume/", parse_resume, name="parse_resume"),
    path("scrape/", scrape_jobs, name="scrape_jobs"),
]
