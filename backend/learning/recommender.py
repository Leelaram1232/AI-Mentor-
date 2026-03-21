from __future__ import annotations

from collections import defaultdict
from typing import Iterable, List

from django.db.models import QuerySet
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .models import CareerPath, LearningResource, UserActivity, UserPreference


def _content_based_scores(resources: QuerySet[LearningResource], pref: UserPreference | None) -> dict[int, float]:
    """
    Simple content-based scorer using tags, topic, difficulty, and selected career path.
    Returns a dict of resource_id -> score.
    """
    if not resources.exists():
        return {}

    rows: list[str] = []
    ids: List[int] = []
    resource_tags: dict[int, set[str]] = {}
    for r in resources:
        tag_names = {t.lower() for t in r.tags.values_list("name", flat=True)}
        cp_slugs: Iterable[str] = r.career_paths.values_list("slug", flat=True)
        resource_tags[r.id] = tag_names
        text = " ".join(
            [
                (r.topic or ""),
                (r.difficulty or ""),
                " ".join(tag_names),
                " ".join(cp_slugs),
            ]
        )
        rows.append(text)
        ids.append(r.id)

    vectorizer = TfidfVectorizer(stop_words="english", max_features=500)
    X = vectorizer.fit_transform(rows)

    # Build a "user profile" vector from preference
    profile_tokens: list[str] = []
    interest_tokens: set[str] = set()
    if pref:
        if pref.selected_career_path_id:
            try:
                cp = CareerPath.objects.get(id=pref.selected_career_path_id)
                profile_tokens.append(cp.slug)
                profile_tokens.append(cp.title)
            except CareerPath.DoesNotExist:
                pass
        if pref.experience_level:
            profile_tokens.append(pref.experience_level)
        if pref.interests:
            # split comma-separated or space-separated interests
            raw = pref.interests.lower()
            for piece in raw.replace(",", " ").split():
                if piece.strip():
                    interest_tokens.add(piece.strip())
            profile_tokens.append(pref.interests)

    if not profile_tokens:
        # No profile → neutral scores
        return {rid: 0.0 for rid in ids}

    profile_text = " ".join(profile_tokens)
    user_vec = vectorizer.transform([profile_text])
    sims = cosine_similarity(user_vec, X).reshape(-1)

    base_scores = {rid: float(score) for rid, score in zip(ids, sims)}

    # Extra boost when resource tags intersect interests
    if interest_tokens:
        for rid in ids:
            tags = resource_tags.get(rid, set())
            if tags and interest_tokens.intersection(tags):
                base_scores[rid] += 0.25  # small but meaningful bump

    return base_scores


def _interaction_scores(user_id: int, resources: QuerySet[LearningResource]) -> dict[int, float]:
    """
    Very lightweight collaborative-style scorer just using this user's own activity.
    For a full collaborative filter we'd need more traffic; this keeps it simple for now.
    """
    events = (
        UserActivity.objects.filter(user_id=user_id, resource_id__in=resources.values_list("id", flat=True))
        .values("resource_id", "action", "progress")
        .iterator()
    )

    if not events:
        return {}

    weights = {"view": 1.0, "start": 2.0, "complete": 3.0}
    scores: dict[int, float] = defaultdict(float)

    for e in events:
        base = weights.get(e["action"], 0.5)
        prog = (e.get("progress") or 0) / 100.0
        scores[e["resource_id"]] += base * (1.0 + prog)

    return dict(scores)


def recommend_for_user(user_id: int, limit: int = 12):
    """
    Hybrid recommender:
    - content-based scores from tags/topic/career path
    - interaction scores from UserActivity
    Fallback: recent resources filtered by career path + difficulty.
    """
    try:
        pref = UserPreference.objects.filter(user_id=user_id).first()
        qs = LearningResource.objects.all()
        if pref and pref.selected_career_path_id:
            qs = qs.filter(career_paths__id=pref.selected_career_path_id)
        if pref and pref.experience_level == "experienced":
            qs = qs.exclude(difficulty="beginner")
        qs = qs.distinct()
        if not qs.exists():
            return list(LearningResource.objects.all().order_by("-created_at")[:limit])

        content_scores = _content_based_scores(qs, pref)
        interaction_scores = _interaction_scores(user_id, qs)

        # Hybrid: 0.7 * content + 0.3 * interactions (if present)
        all_ids = list(qs.values_list("id", flat=True))
        final_scores = []
        for rid in all_ids:
            c = content_scores.get(rid, 0.0)
            i = interaction_scores.get(rid, 0.0)
            score = 0.7 * c + 0.3 * i
            final_scores.append((rid, score))

        # If everything is zero, fallback to recency
        if not final_scores or all(s == 0.0 for _, s in final_scores):
            return list(qs.order_by("-created_at")[:limit])

        final_scores.sort(key=lambda x: x[1], reverse=True)
        top_ids = [rid for rid, _ in final_scores[:limit]]

        id_to_obj = {r.id: r for r in qs}
        ordered = [id_to_obj[rid] for rid in top_ids if rid in id_to_obj]
        return ordered
    except Exception:
        # Any ML error → safe fallback
        return list(LearningResource.objects.all().order_by("-created_at")[:limit])

