"""REST router for anomaly detection."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from detectors.anomaly import IQRAnomalyDetector, ZScoreAnomalyDetector
from detectors.change import ChangeDetector

from ..schemas import (
    AnomalyRequest,
    AnomalyResult,
    DeviationRequest,
    DeviationResult,
)

router = APIRouter()
_zscore_detector = ZScoreAnomalyDetector()
_iqr_detector = IQRAnomalyDetector()
_change_detector = ChangeDetector()


@router.post("/anomalies/detect", response_model=AnomalyResult)
def detect_anomalies(req: AnomalyRequest) -> AnomalyResult:
    method = req.method.lower()
    if method == "zscore":
        raw = _zscore_detector.zscore_rolling(req.values, window=req.window)
        anomalies = [
            DeviationResult(
                index=r["index"],
                value=r["value"],
                zScore=r["zScore"],
                deviationPercent=None,
            )
            for r in raw
        ]
    elif method == "iqr":
        raw = _iqr_detector.detect(req.values)
        anomalies = [
            DeviationResult(index=r["index"], value=r["value"], zScore=None, deviationPercent=None)
            for r in raw
        ]
    else:
        raise HTTPException(status_code=422, detail="method must be 'zscore' or 'iqr'")

    return AnomalyResult(method=method, anomalies=anomalies, count=len(anomalies))


@router.post("/anomalies/change", response_model=list[DeviationResult])
def detect_changes(req: DeviationRequest) -> list[DeviationResult]:
    """Deviation detection vs a known baseline (used by /deviation endpoint)."""
    records = _change_detector.detect(
        req.values,
        baseline_mean=req.baselineMean,
        baseline_std=req.baselineStd,
        z_threshold=req.zThreshold,
        deviation_pct_threshold=req.deviationPctThreshold,
    )
    return [
        DeviationResult(
            index=r.index,
            value=r.value,
            zScore=r.zScore,
            deviationPercent=r.deviationPercent,
        )
        for r in records
    ]