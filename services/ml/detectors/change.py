"""Statistical deviation detection: compare new values against a baseline."""

from __future__ import annotations

import numpy as np

from pydantic import BaseModel


class DeviationRecord(BaseModel):
    """A single point flagged for deviation from the baseline."""

    index: int
    value: float
    zScore: float
    baselineMean: float
    deviationPercent: float
    direction: str


class ChangeDetector:
    """Detects deviations of new values against a known baseline.

    A point is flagged when |zScore| > z_threshold OR
    |deviationPercent| > deviation_pct_threshold.
    """

    def detect(
        self,
        values: list[float],
        baseline_mean: float,
        baseline_std: float,
        z_threshold: float = 2.0,
        deviation_pct_threshold: float = 15.0,
    ) -> list[DeviationRecord]:
        if not values:
            return []

        arr = np.asarray(values, dtype=np.float64)
        mean = float(baseline_mean)
        std = float(baseline_std)

        records: list[DeviationRecord] = []
        for i, val in enumerate(arr):
            v = float(val)

            # deviationPercent = (value - mean) / mean * 100
            if mean == 0:
                deviation_pct = float("inf")
            else:
                deviation_pct = (v - mean) / mean * 100.0

            # zScore = (value - mean) / std, with std==0 guard
            if std == 0:
                z_score = 0.0 if v == mean else float("inf")
            else:
                z_score = (v - mean) / std

            # Sensible max to avoid propagating NaN/inf into downstream JSON
            if not np.isfinite(z_score) and z_score > 0:
                z_score = 1e9
            elif not np.isfinite(z_score):
                z_score = -1e9
            if not np.isfinite(deviation_pct) and deviation_pct >= 0:
                deviation_pct = 1e9
            elif not np.isfinite(deviation_pct):
                deviation_pct = -1e9

            flagged = abs(z_score) > z_threshold or abs(deviation_pct) > deviation_pct_threshold
            if not flagged:
                continue

            # Cap z_score for repeatable / finite output but keep sign
            z_out = z_score
            direction = "up" if v > mean else ("down" if v < mean else "flat")
            records.append(
                DeviationRecord(
                    index=i,
                    value=v,
                    zScore=z_out,
                    baselineMean=mean,
                    deviationPercent=deviation_pct,
                    direction=direction,
                )
            )
        return records