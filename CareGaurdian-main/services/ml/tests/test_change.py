"""Tests for ChangeDetector (detectors/change.py)."""

import pytest

from detectors.change import ChangeDetector


cd = ChangeDetector()


class TestDeviationDetection:
    """Deviation is detected when a value is >30% below mean."""

    def test_value_30pct_below_mean(self):
        baseline_mean = 100.0
        baseline_std = 10.0
        vals = [70.0]  # 30% below
        r = cd.detect(vals, baseline_mean, baseline_std)
        assert len(r) == 1
        assert r[0].direction == "down"
        assert r[0].deviationPercent == pytest.approx((70.0 - 100.0) / 100.0 * 100.0)

    def test_value_within_bounds_no_flag(self):
        # 5% deviation and z~0 should not be flagged
        vals = [105.0]
        r = cd.detect(vals, 100.0, 10.0)
        assert len(r) == 0

    def test_empty_values(self):
        assert cd.detect([], 10.0, 5.0) == []


class TestZThreshold:
    """Flag only when |zScore| > z_threshold."""

    def test_high_z_above_threshold(self):
        # val=150, mean=100, std=10 → z=5 > 2.0
        r = cd.detect([150.0], 100.0, 10.0, z_threshold=2.0, deviation_pct_threshold=100.0)
        assert len(r) == 1
        assert r[0].zScore == pytest.approx(5.0)

    def test_z_below_threshold_no_flag(self):
        # val=102, mean=100, std=10 → z=0.2 < 2.0 AND 2% dev < 15%
        r = cd.detect([102.0], 100.0, 10.0, z_threshold=2.0, deviation_pct_threshold=15.0)
        assert len(r) == 0

    def test_stricter_threshold_fewer_flags(self):
        vals = [125.0, 130.0, 140.0]
        r_loose = cd.detect(vals, 100.0, 10.0, z_threshold=2.0, deviation_pct_threshold=15.0)
        r_tight = cd.detect(vals, 100.0, 10.0, z_threshold=3.0, deviation_pct_threshold=15.0)
        # Tighter threshold should flag fewer or equal points
        assert len(r_tight) <= len(r_loose)


class TestStdZero:
    """When baseline std is 0, z-score logic handles division by zero."""

    def test_value_different_from_mean_std_zero(self):
        r = cd.detect([150.0], 100.0, 0.0, z_threshold=2.0, deviation_pct_threshold=15.0)
        # z becomes inf → should flag via deviation% alone
        assert len(r) == 1
        assert r[0].direction == "up"

    def test_value_equals_mean_std_zero(self):
        r = cd.detect([100.0], 100.0, 0.0, z_threshold=2.0, deviation_pct_threshold=15.0)
        # z=0, dev=0% → no flag
        assert len(r) == 0


class TestStableSeries:
    """Stable series should produce zero deviations."""

    def test_stable_values(self):
        stable = [100.0, 100.0, 100.0, 100.0, 100.0]
        r = cd.detect(stable, 100.0, 0.001, z_threshold=2.0, deviation_pct_threshold=15.0)
        assert len(r) == 0