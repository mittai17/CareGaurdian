"""REST router for text-to-feature transformation (medical-lay terms)."""

from __future__ import annotations

import re

from fastapi import APIRouter

from ..schemas import FeatureRequest, FeatureResponse

router = APIRouter()

# Deterministic medical-lay term dictionary.
# Longer/specific phrases are matched before single words, so "near fall"
# wins over "fall", and "forgot med" wins over "medication".
RULES: list[tuple[str, list[str]]] = [
    ("CONFUSION", ["confus", "forget", "disorient", "memory"]),
    ("NEAR_FALL", ["near fall", "almost fell", "almost fall"]),
    ("FALL", ["fell", "fall", "trip", "stumble"]),
    ("APPETITE", ["not eating", "appetite", "ate nothing", "eat"]),
    ("SLEEP", ["insomnia", "sleep", "awake", "rest"]),
    ("MOBILITY", ["stairs", "mobility", "mobil", "walk", "moving"]),
    ("MOOD", ["depress", "anxious", "agitat", "sad", "mood"]),
    ("PAIN", ["pain", "hurt", "ache"]),
    ("MEDICATION", ["medication", "pill", "medicine", "dose", "forgot med"]),
]


def _match_category(text_lower: str, patterns: list[str]) -> int:
    """Count occurrences of any of the patterns in the normalized text."""
    count = 0
    for pat in patterns:
        count += len(re.findall(re.escape(pat), text_lower))
    return count


@router.post("/transform/text-to-features", response_model=FeatureResponse)
def transform_text(req: FeatureRequest) -> FeatureResponse:
    text_lower = req.text.lower()

    # Longer phrases first (they were placed at the head of RULES already for
    # NEAR_FALL; ensure ordering is preserved).
    ordered_rules = sorted(
        RULES,
        key=lambda item: max(len(p) for p in item[1]),
        reverse=True,
    )

    matched: dict[str, int] = {}
    for category, patterns in ordered_rules:
        count = _match_category(text_lower, patterns)
        if count > 0:
            matched[category] = count

    summary = (
        ", ".join(f"{cat} x{n}" for cat, n in matched.items())
        if matched
        else "No known medical features detected"
    )

    return FeatureResponse(
        matchedCategories=matched,
        count=sum(matched.values()),
        summary=summary,
    )