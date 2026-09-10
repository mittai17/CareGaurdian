"""REST router for baseline computation."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from baselines.calculator import BaselineCalculator

from ..schemas import BaselineRequest, BaselineResult

router = APIRouter()
_calculator = BaselineCalculator()


@router.post("/baseline/compute", response_model=BaselineResult)
def compute_baseline(req: BaselineRequest) -> BaselineResult:
    result = _calculator.compute(req.values)
    return BaselineResult(
        status=result.status,
        mean=result.mean,
        std=result.std,
        p25=result.p25,
        p50=result.p50,
        p75=result.p75,
        sampleSize=result.sampleSize,
        confidence=result.confidence if result.confidence != "INSUFFICIENT_DATA" else "INSUFFICIENT_DATA",
        computedAt=datetime.now(timezone.utc),
    )