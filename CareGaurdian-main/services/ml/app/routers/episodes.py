"""REST router for episode similarity."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from episodes.similarity import EpisodeSimilarityEngine

from ..schemas import (
    EpisodeSimilarityRequest,
    EpisodeSimilarityResult,
    EpisodeMatch,
)

router = APIRouter()
_engine = EpisodeSimilarityEngine()


@router.post("/episodes/similarity", response_model=EpisodeSimilarityResult)
def episode_similarity(req: EpisodeSimilarityRequest) -> EpisodeSimilarityResult:
    # Build candidate arrays: index 0 is the "current" episode's own signature/numeric,
    # and each following index is a candidate. The engine's topK treats index 0 as
    # reference and compares against 1..n-1.
    signatures: list[list[str]] = [req.currentSignature]
    numerics: list[dict[str, float]] = [req.currentNumeric]
    candidate_ids: list[str] = []

    for cand in req.candidates:
        signatures.append(cand.signature)
        numerics.append(cand.numeric)
        candidate_ids.append(cand.id)

    matches = _engine.topK(signatures, numerics, k=req.k)

    # Map matchedIndex (position in signatures list = position in candidates+1)
    result_matches = [
        EpisodeMatch(
            similarity=m.similarity,
            matchedEpisodeId=(
                candidate_ids[m.matchedIndex - 1]
                if 1 <= m.matchedIndex < len(candidate_ids) + 1
                else candidate_ids[0]
            ),
            matchingSignals=m.matchingSignals,
            missingSignals=m.missingSignals,
            confidence=m.confidence,
        )
        for m in matches
    ]

    return EpisodeSimilarityResult(
        matches=result_matches,
        generatedAt=datetime.now(timezone.utc),
    )