"""Anomaly detection: Z-Score rolling window + IQR outlier detection."""

from __future__ import annotations

from typing import Any

import numpy as np


class ZScoreAnomalyDetector:
    """Flags anomalies relative to a rolling window of preceding points.

    For each point at index i where i >= window, computes the mean/std of the
    preceding `window` values and the z-score of the current point against it.
    A point is an anomaly when |z| > 2.0 (default). Requires window > 3.
    """

    def __init__(self, z_threshold: float = 2.0) -> None:
        self.z_threshold = z_threshold

    def zscore_rolling(self, values: list[float], window: int = 7) -> list[dict[str, Any]]:
        if window <= 3:
            # Require window > 3 to emit (spec)
            return []

        arr = np.asarray(values, dtype=np.float64)
        if len(arr) < window:
            return []

        anomalies: list[dict[str, Any]] = []
        for i in range(window, len(arr)):
            win = arr[i - window : i]
            mean = float(win.mean())
            std = float(win.std(ddof=1))
            if std == 0:
                z = 0.0
            else:
                z = (float(arr[i]) - mean) / std
            if abs(z) > self.z_threshold:
                anomalies.append(
                    {
                        "index": i,
                        "value": float(arr[i]),
                        "zScore": z,
                    }
                )
        return anomalies


class IQRAnomalyDetector:
    """Flags outliers using Q1-1.5*IQR / Q3+1.5*IQR fences."""

    def detect(self, values: list[float]) -> list[dict[str, Any]]:
        arr = np.asarray(values, dtype=np.float64)
        if arr.size == 0:
            return []

        q1 = float(np.percentile(arr, 25))
        q3 = float(np.percentile(arr, 75))
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr

        detection: list[dict[str, Any]] = []
        for i, v in enumerate(arr):
            val = float(v)
            if val < lower or val > upper:
                detection.append({"index": i, "value": val})
        return detection