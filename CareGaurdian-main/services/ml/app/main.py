"""FastAPI application: baseline-ml service."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .routers import anomalies, baseline, episodes, transform

app = FastAPI(
    title="baseline-ml",
    description="ML service for healthcare episode baselining, anomaly detection, and similarity.",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS — mirror Node.js backend defaults
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(baseline.router)
app.include_router(anomalies.router)
app.include_router(episodes.router)
app.include_router(transform.router)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "baseline-ml"}