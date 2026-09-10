"""Baseline computation against which future episodes are compared."""

from __future__ import annotations

import numpy as np
from pydantic import BaseModel


class BaselineResult(BaseModel):
    """Statistical summary of a baseline series."""

    status: str
    mean: float | None
    std: float | None
    p25: float | None
    p50: float | None
    p75: float | None
    sampleSize: int
    confidence: str


def _confidence_for_n(n: int, std: float | None) -> str:
    """Confidence tier based on sample size and variance."""
    if std is None or std == 0:
        return "INSUFFICIENT_DATA"
    if n >= 20:
        return "HIGH"
    if n >= 10:
        return "MODERATE"
    if n >= 5:
        return "LOW"
    return "INSUFFICIENT_DATA"


class BaselineCalculator:
    """Computes mean/std/percentiles and a confidence tier for a series.

    Confidence:
      - HIGH   when n >= 20 and std > 0
      - MODERATE when n >= 10
      - LOW    when n >= 5
      - INSUFFICIENT_DATA otherwise
    """

    def compute(self, series: list[float]) -> BaselineResult:
        n = len(series)
        # Guard: insufficient samples (spec: status COMPUTED only when len>=5)
        if n < 5:
            return BaselineResult(
                status="INSUFFICIENT_DATA",
                mean=None,
                std=None,
                p25=None,
                p50=None,
                p75=None,
                sampleSize=n,
                confidence="INSUFFICIENT_DATA",
            )

        arr = np.asarray(series, dtype=np.float64)
        mean = float(arr.mean())
        # std with ddof=1; guard n<2 (already guaranteed n>=5 here but keep safe)
        if n < 2:
            std_val = 0.0
        else:
            std_val = float(arr.std(ddof=1))

        p25 = float(np.percentile(arr, 25))
        p50 = float(np.percentile(arr, 50))
        p75 = float(np.percentile(arr, 75))
        confidence = _confidence_for_n(n, std_val)
        return BaselineResult(
            status="COMPUTED",
            mean=mean,
            std=std_val,
            p25=p25,
            p50=p50,
            p75=p75,
            sampleSize=n,
            confidence=confidence,
        )