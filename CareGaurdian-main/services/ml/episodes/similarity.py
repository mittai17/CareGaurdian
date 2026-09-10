"""Episode similarity: Jaccard + set-cosine + numeric-cosine fusion."""

from __future__ import annotations

import math

import numpy as np

from pydantic import BaseModel


class EpisodeMatch(BaseModel):
    """Similarity of one candidate episode against the current episode."""

    similarity: float
    matchedIndex: int
    matchingSignals: list[str]
    missingSignals: list[str]
    confidence: str


class EpisodeSimilarityEngine:
    """Combines set-based (Jaccard + set-cosine) and numeric (cosine) signals."""

    def similarity(
        self,
        signature_a: list[str],
        signature_b: list[str],
        numeric_a: dict[str, float],
        numeric_b: dict[str, float],
    ) -> dict:
        set_a: set[str] = set(signature_a)
        set_b: set[str] = set(signature_b)

        # Jaccard = |A n B| / |A u B|
        intersection = set_a & set_b
        union = set_a | set_b
        jaccard = len(intersection) / len(union) if union else 0.0

        # Set cosine = |A n B| / sqrt(|A| * |B|)
        denom = math.sqrt(len(set_a) * len(set_b))
        set_cosine = len(intersection) / denom if denom > 0 else 0.0

        # Numeric cosine over shared keys
        keys = sorted(set(numeric_a.keys()) & set(numeric_b.keys()))
        numeric_cosine: float = 0.0
        if keys:
            vec_a = np.asarray([numeric_a[k] for k in keys], dtype=np.float64)
            vec_b = np.asarray([numeric_b[k] for k in keys], dtype=np.float64)
            norm_a = np.linalg.norm(vec_a)
            norm_b = np.linalg.norm(vec_b)
            if norm_a > 0 and norm_b > 0:
                numeric_cosine = float(np.dot(vec_a, vec_b) / (norm_a * norm_b))

        combined = 0.5 * jaccard + 0.3 * set_cosine + 0.2 * numeric_cosine
        return {
            "jaccard": jaccard,
            "cosineOverSets": set_cosine,
            "numericCosine": numeric_cosine,
            "combined": combined,
        }

    def topK(
        self,
        signatures: list[list[str]],
        numeric: list[dict[str, float]],
        k: int = 3,
    ) -> list[EpisodeMatch]:
        """Compute similarity of `signatures[0]` vs each candidate index 1..n-1.

        `signatures[0]` and `numeric[0]` represent the current episode.
        Returns the top-k candidates sorted by similarity descending.
        """
        if not signatures or not numeric or len(signatures) != len(numeric):
            return []

        current_sig = signatures[0]
        current_num = numeric[0]
        current_set = set(current_sig)

        scored: list[EpisodeMatch] = []
        for idx in range(1, len(signatures)):
            cand_sig = signatures[idx]
            idx_score = idx  # matchedIndex = candidate's position in the source list
            sim = self.similarity(current_sig, cand_sig, current_num, numeric[idx])

            matching = sorted(set(current_sig) & set(cand_sig))
            missing = sorted(current_set - set(cand_sig))

            combined = sim["combined"]

            if combined >= 0.7:
                confidence = "HIGH"
            elif combined >= 0.55:
                confidence = "MODERATE"
            else:
                confidence = "LOW"

            scored.append(
                EpisodeMatch(
                    similarity=combined,
                    matchedIndex=idx_score,
                    matchingSignals=matching,
                    missingSignals=missing,
                    confidence=confidence,
                )
            )

        scored.sort(key=lambda m: m.similarity, reverse=True)
        return scored[:k]