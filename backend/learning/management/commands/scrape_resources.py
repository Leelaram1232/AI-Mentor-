from django.core.management.base import BaseCommand

from learning.models import CareerPath, LearningResource, Tag
from scraping.freecodecamp import scrape_freecodecamp_news


class Command(BaseCommand):
    help = "Scrape learning resources and store them in the database"

    def add_arguments(self, parser):
        parser.add_argument("--source", default="freecodecamp", choices=["freecodecamp"])
        parser.add_argument("--tag", default="javascript")
        parser.add_argument("--limit", type=int, default=10)
        parser.add_argument("--career-path-slug", default="")

    def handle(self, *args, **options):
        source = options["source"]
        tag = options["tag"]
        limit = options["limit"]
        cpslug = options["career_path_slug"]

        career_path = None
        if cpslug:
            career_path = CareerPath.objects.filter(slug=cpslug).first()
            if not career_path:
                self.stdout.write(self.style.ERROR(f"Career path slug not found: {cpslug}"))
                return

        if source == "freecodecamp":
            scraped = scrape_freecodecamp_news(tag=tag, limit=limit)
        else:
            scraped = []

        created = 0
        for r in scraped:
            obj, was_created = LearningResource.objects.get_or_create(
                url=r.url,
                defaults={
                    "title": r.title,
                    "description": r.description,
                    "topic": r.topic,
                    "thumbnail_url": r.thumbnail_url,
                    "resource_type": r.resource_type,
                    "difficulty": r.difficulty,
                    "source": r.source,
                },
            )
            if was_created:
                created += 1

            tags = []
            for t in r.tags:
                tag_obj, _ = Tag.objects.get_or_create(name=t[:64])
                tags.append(tag_obj)
            obj.tags.set(tags)

            if career_path:
                obj.career_paths.add(career_path)

        self.stdout.write(self.style.SUCCESS(f"Scrape complete. Created {created} new resources."))

