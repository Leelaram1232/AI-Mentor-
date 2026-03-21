import re
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from .sources import ScrapedResource


def scrape_freecodecamp_news(tag: str, limit: int = 10) -> list[ScrapedResource]:
    """
    Lightweight scraper for freeCodeCamp News tag pages.
    This is intentionally conservative to avoid brittle parsing.
    """
    url = f"https://www.freecodecamp.org/news/tag/{tag}/"
    html = requests.get(url, timeout=30).text
    soup = BeautifulSoup(html, "html.parser")

    results: list[ScrapedResource] = []

    # Articles are typically linked in headline anchors. We keep it simple:
    anchors = soup.select("a")
    seen = set()
    for a in anchors:
        href = a.get("href") or ""
        text = (a.get_text() or "").strip()
        if not href or not text:
            continue
        if "/news/" not in href:
            continue
        full = href if href.startswith("http") else urljoin("https://www.freecodecamp.org", href)
        if full in seen:
            continue
        seen.add(full)

        # Keep only article-like slugs
        if re.search(r"/news/[^/]+/?$", full) is None and "/news/" in full:
            pass

        results.append(
            ScrapedResource(
                title=text[:300],
                description="",
                topic=tag,
                url=full,
                thumbnail_url="",
                difficulty="beginner",
                tags=[tag, "freecodecamp"],
                source="freeCodeCamp",
                resource_type="article",
            )
        )
        if len(results) >= limit:
            break

    return results

