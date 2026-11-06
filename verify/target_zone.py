"""Compute the s-plane region where a pole pair meets the lesson 1 challenge spec.

Spec: overshoot under 10 % AND exact 2 % settling time under 2 s.
For each imaginary part omega_d, find the smallest sigma (real part -sigma) such that
every pole pair further left also meets the spec. Writes src/data/target-zone.json
as a polygon in s-plane coordinates (re, im), upper half only; the UI mirrors it.

Run:  python3 verify/target_zone.py
"""

import json
from pathlib import Path

import numpy as np

MAX_OVERSHOOT = 10.0  # percent
MAX_SETTLING = 2.0  # seconds
SIGMA_MAX = 3.5  # left edge of the plotted s-plane
T = np.linspace(0.0, 6.0, 12_001)


def step(sigma: float, wd: float) -> np.ndarray:
    if wd == 0.0:
        return 1 - np.exp(-sigma * T) * (1 + sigma * T)
    return 1 - np.exp(-sigma * T) * (np.cos(wd * T) + (sigma / wd) * np.sin(wd * T))


def meets_spec(sigma: float, wd: float) -> bool:
    y = step(sigma, wd)
    if 100 * (y.max() - 1) >= MAX_OVERSHOOT:
        return False
    outside = np.nonzero(np.abs(y - 1) > 0.02)[0]
    ts = T[outside[-1] + 1] if outside.size else 0.0
    return ts < MAX_SETTLING


def sigma_min(wd: float) -> float | None:
    """Smallest sigma such that all sigma' in [sigma, SIGMA_MAX] meet the spec."""
    sigmas = np.arange(SIGMA_MAX, 0.0, -0.005)
    best = None
    for s in sigmas:
        if meets_spec(float(s), wd):
            best = float(s)
        else:
            break
    return best


def main() -> None:
    edge = []
    for wd in np.arange(0.0, 3.0001, 0.05):
        s = sigma_min(float(round(wd, 4)))
        if s is not None:
            edge.append({"re": round(-s, 4), "im": round(float(wd), 4)})
    out = Path(__file__).resolve().parent.parent / "src" / "data" / "target-zone.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({
        "spec": {"maxOvershootPct": MAX_OVERSHOOT, "maxSettlingTime": MAX_SETTLING, "band": 0.02},
        "leftEdgeRe": -SIGMA_MAX,
        "boundary": edge,
    }, indent=2) + "\n")
    print(f"{len(edge)} boundary points; first {edge[0]}, last {edge[-1]}")


if __name__ == "__main__":
    main()
