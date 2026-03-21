from dataclasses import dataclass


@dataclass(frozen=True)
class ScrapedResource:
    title: str
    description: str
    topic: str
    url: str
    thumbnail_url: str
    difficulty: str  # beginner/intermediate/advanced
    tags: list[str]
    source: str
    resource_type: str  # article/video/course/tutorial/project

