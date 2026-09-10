"""Pydantic request/response models for every ML endpoint."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


# ----------------------------- Baselining -----------------------------


class MetricSeries(BaseModel):
    values: list[float] = Field(..., description="The time-series measurements")
    minSamples: int = Field(5, gt=0, description="Minimum sample size for a reliable baseline")


class BaselineResult(BaseModel):
    status: str
    mean: float | None
    std: float | None
    p25: float | None
    p50: float | None
    p75: float | None
    sampleSize: int
    confidence: str
    computedAt: datetime


class BaselineRequest(MetricSeries):
    ...


# ----------------------------- Anomalies -----------------------------


class DeviationResult(BaseModel):
    index: int
    value: float
    zScore: float | None = None
    deviationPercent: float | None = None


class DeviationRequest(BaseModel):
    values: list[float]
    baselineMean: float
    baselineStd: float
    zThreshold: float = Field(2.0, gt=0, description="Z-score threshold for flagging")
    deviationPctThreshold: float = Field(
        15.0, gt=0, description="Absolute percent deviation threshold"
    )


class AnomalyRequest(BaseModel):
    values: list[float]
    method: str = "zscore"  # "zscore" | "iqr"
    window: int = Field(7, gt=0)


class AnomalyResult(BaseModel):
    method: str
    anomalies: list[DeviationResult]
    count: int


# ----------------------------- Episodes -----------------------------


class EpisodeCandidate(BaseModel):
    id: str
    signature: list[str]
    numeric: dict[str, float] = Field(default_factory=dict)


class EpisodeSimilarityRequest(BaseModel):
    currentSignature: list[str]
    currentNumeric: dict[str, float] = Field(default_factory=dict)
    candidates: list[EpisodeCandidate]
    k: int = Field(3, ge=1)


class EpisodeMatch(BaseModel):
    similarity: float
    matchedEpisodeId: str
    matchingSignals: list[str]
    missingSignals: list[str]
    confidence: str


class EpisodeSimilarityResult(BaseModel):
    matches: list[EpisodeMatch]
    generatedAt: datetime


# ----------------------------- Transform -----------------------------


class FeatureRequest(BaseModel):
    text: str


class FeatureResponse(BaseModel):
    matchedCategories: dict[str, int]
    count: int
    summary: str