"""Tests for BaselineCalculator (baselines/calculator.py)."""

import numpy as np
import pytest

from baselines.calculator import BaselineCalculator


calc = BaselineCalculator()


class TestBaselineInsufficient:
    def test_three_samples_insufficient(self):
        r = calc.compute([1.0, 2.0, 3.0])
        assert r.status == "INSUFFICIENT_DATA"
        assert r.confidence == "INSUFFICIENT_DATA"
        assert r.sampleSize == 3
        assert r.mean is None
        assert r.std is None

    def test_empty_series_insufficient(self):
        r = calc.compute([])
        assert r.status == "INSUFFICIENT_DATA"

    def test_exactly_5_samples_computes(self):
        r = calc.compute([10.0, 20.0, 30.0, 40.0, 50.0])
        assert r.status == "COMPUTED"
        assert r.sampleSize == 5


class TestBaselineComputed:
    KNOWN = [12.0, 15.0, 14.0, 13.0, 16.0, 14.0, 13.5, 15.5, 14.5, 12.5,
             16.5, 13.0, 14.0, 15.0, 12.0]

    def test_mean_matches_numpy(self):
        r = calc.compute(self.KNOWN)
        assert r.status == "COMPUTED"
        arr = np.array(self.KNOWN)
        assert r.mean == pytest.approx(float(arr.mean()))

    def test_std_matches_numpy_ddof1(self):
        r = calc.compute(self.KNOWN)
        arr = np.array(self.KNOWN)
        assert r.std == pytest.approx(float(arr.std(ddof=1)))

    def test_percentiles(self):
        r = calc.compute(self.KNOWN)
        arr = np.array(self.KNOWN)
        assert r.p25 == pytest.approx(float(np.percentile(arr, 25)))
        assert r.p50 == pytest.approx(float(np.percentile(arr, 50)))
        assert r.p75 == pytest.approx(float(np.percentile(arr, 75)))


class TestConfidenceTiers:
    def test_high_confidence_n_ge_20_std_positive(self):
        series = list(range(20)) + [0.5] * 5  # n=25, std>0
        r = calc.compute(series)
        assert r.confidence == "HIGH"

    def test_moderate_confidence_n_ge_10(self):
        series = list(range(10))  # std>0
        r = calc.compute(series)
        assert r.confidence in ("MODERATE", "HIGH")

    def test_low_confidence_n_ge_5(self):
        series = [10.0] * 5  # std==0
        r = calc.compute(series)
        # std==0 → INSUFFICIENT_DATA per spec
        assert r.confidence == "INSUFFICIENT_DATA"

    def test_low_confidence_unique_values(self):
        r = calc.compute([1.0, 2.0, 3.0, 4.0, 5.0])
        assert r.confidence == "LOW"