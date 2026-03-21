from django.core.management.base import BaseCommand

from learning.models import CareerPath, LearningResource, Tag


class Command(BaseCommand):
    help = "Seed demo career paths and learning resources"

    def handle(self, *args, **options):
        paths = [
            ("frontend-developer", "Frontend Developer", "Build modern web UIs with HTML, CSS, JavaScript, and React."),
            ("backend-developer", "Backend Developer", "Build APIs, databases, and scalable server-side systems."),
            ("data-science", "Data Science", "Analyze data, build models, and communicate insights."),
            ("cybersecurity", "Cybersecurity", "Learn how to protect systems, networks, and applications."),
        ]

        path_objs = {}
        for slug, title, desc in paths:
            obj, _ = CareerPath.objects.get_or_create(slug=slug, defaults={"title": title, "description": desc})
            path_objs[slug] = obj

        def tag(name):
            t, _ = Tag.objects.get_or_create(name=name)
            return t

        resources = [
            {
                "title": "JavaScript Algorithms and Data Structures",
                "description": "Practice core JavaScript fundamentals with hands-on exercises.",
                "topic": "JavaScript",
                "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
                "thumbnail_url": "",
                "resource_type": "course",
                "difficulty": "beginner",
                "source": "freeCodeCamp",
                "career_paths": ["frontend-developer", "backend-developer"],
                "tags": ["javascript", "fundamentals"],
            },
            {
                "title": "MIT OpenCourseWare: Introduction to Computer Science and Programming in Python",
                "description": "A foundational MIT course to learn programming and problem solving.",
                "topic": "Python",
                "url": "https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/",
                "thumbnail_url": "",
                "resource_type": "course",
                "difficulty": "beginner",
                "source": "MIT OCW",
                "career_paths": ["data-science", "backend-developer"],
                "tags": ["python", "cs"],
            },
            {
                "title": "How to Learn to Code — Guide",
                "description": "A practical guide to building skills through projects and consistency.",
                "topic": "Career",
                "url": "https://www.freecodecamp.org/news/how-to-learn-to-code/",
                "thumbnail_url": "",
                "resource_type": "article",
                "difficulty": "beginner",
                "source": "freeCodeCamp",
                "career_paths": ["frontend-developer", "backend-developer", "data-science", "cybersecurity"],
                "tags": ["career", "learning"],
            },
            {
                "title": "Frontend Developer Roadmap – freeCodeCamp",
                "description": "YouTube video walking through the modern frontend roadmap.",
                "topic": "Frontend",
                "url": "https://www.youtube.com/watch?v=Y6aYx_KKM7A",
                "thumbnail_url": "",
                "resource_type": "video",
                "difficulty": "beginner",
                "source": "YouTube",
                "career_paths": ["frontend-developer"],
                "tags": ["frontend", "roadmap", "javascript"],
            },
            {
                "title": "Backend Developer Roadmap – freeCodeCamp",
                "description": "YouTube guide for learning backend development fundamentals.",
                "topic": "Backend",
                "url": "https://www.youtube.com/watch?v=Gg2LXikL3L0",
                "thumbnail_url": "",
                "resource_type": "video",
                "difficulty": "beginner",
                "source": "YouTube",
                "career_paths": ["backend-developer"],
                "tags": ["backend", "apis", "databases"],
            },
            {
                "title": "Data Science for Beginners – Microsoft",
                "description": "Playlist-style introduction to core data science concepts.",
                "topic": "Data Science",
                "url": "https://www.youtube.com/watch?v=ua-CiDNNj30",
                "thumbnail_url": "",
                "resource_type": "video",
                "difficulty": "beginner",
                "source": "YouTube",
                "career_paths": ["data-science"],
                "tags": ["data-science", "python", "ml"],
            },
        ]

        created = 0
        for r in resources:
            obj, was_created = LearningResource.objects.get_or_create(
                url=r["url"],
                defaults={
                    "title": r["title"],
                    "description": r["description"],
                    "topic": r["topic"],
                    "thumbnail_url": r["thumbnail_url"],
                    "resource_type": r["resource_type"],
                    "difficulty": r["difficulty"],
                    "source": r["source"],
                },
            )
            if was_created:
                created += 1
            obj.career_paths.set([path_objs[s] for s in r["career_paths"]])
            obj.tags.set([tag(t) for t in r["tags"]])

        self.stdout.write(self.style.SUCCESS(f"Seed complete. Created {created} resources."))

