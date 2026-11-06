"""Generate reference results for the second-order simulation with python-control.

Run:  python3 verify/generate_golden.py
Writes tests/golden/second_order.json, which tests/secondOrder.test.ts checks the
TypeScript simulation against.
"""

import json
from pathlib import Path

import control
import numpy as np

SIGMAS = [0.3, 0.8, 1.2, 2.0, 3.0]
OMEGA_DS = [0.0, 0.5, 1.2, 2.4, 3.0]
SAMPLE_TIMES = [0.25, 0.5, 1.0, 1.5, 2.0, 3.0, 5.0]


def case(sigma: float, omega_d: float) -> dict:
    wn2 = sigma**2 + omega_d**2
    sys = control.tf([wn2], [1.0, 2.0 * sigma, wn2])

    # Long, fine horizon so step_info's settling time is limited by physics, not sampling.
    t_end = max(40.0, 12.0 / sigma)
    t = np.linspace(0.0, t_end, 400_001)
    resp = control.step_response(sys, T=t)
    info = control.step_info(sys, T=t, SettlingTimeThreshold=0.02)

    samples = np.interp(SAMPLE_TIMES, resp.time, resp.outputs)
    return {
        "sigma": sigma,
        "omegaD": omega_d,
        "omegaN": float(np.sqrt(wn2)),
        "zeta": float(sigma / np.sqrt(wn2)),
        "overshootPct": float(info["Overshoot"]),
        "peakTime": float(info["PeakTime"]) if omega_d > 0 else None,
        "settlingTime": float(info["SettlingTime"]),
        "samples": [{"t": ts, "y": float(y)} for ts, y in zip(SAMPLE_TIMES, samples)],
    }


def main() -> None:
    cases = [case(s, w) for s in SIGMAS for w in OMEGA_DS]
    out = Path(__file__).resolve().parent.parent / "tests" / "golden" / "second_order.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"generator": f"python-control {control.__version__}", "cases": cases}, indent=2) + "\n")
    print(f"Wrote {len(cases)} cases to {out}")


if __name__ == "__main__":
    main()
