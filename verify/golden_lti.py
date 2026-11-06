"""Reference results for src/sim/lti.ts from python-control.

Run:  python3 verify/golden_lti.py   (writes tests/golden/lti.json)
"""

import json
from pathlib import Path

import control
import numpy as np

T_SAMPLES = [0.5, 1.0, 2.0, 4.0, 8.0]


def step_case(name, num, den, closed=False):
    G = control.tf(num, den)
    if closed:
        G = control.feedback(G, 1)
    t = np.linspace(0, 30, 300_001)
    r = control.step_response(G, T=t)
    y = np.interp(T_SAMPLES, r.time, r.outputs)
    info = control.step_info(G, T=t, SettlingTimeThreshold=0.02)
    return {
        "name": name, "num": num, "den": den, "closed": closed,
        "samples": [{"t": a, "y": float(b)} for a, b in zip(T_SAMPLES, y)],
        "overshootPct": float(info["Overshoot"]),
        "settlingTime": float(info["SettlingTime"]),
        "poles": sorted([[float(p.real), float(p.imag)] for p in control.poles(G)]),
    }


def margin_case(name, num, den):
    gm, pm, w180, wc = control.margin(control.tf(num, den))
    return {"name": name, "num": num, "den": den, "gmDb": float(20 * np.log10(gm)), "pm": float(pm), "w180": float(w180), "wc": float(wc)}


def main():
    out = {
        "generator": f"python-control {control.__version__}",
        "steps": [
            step_case("underdamped 2nd order", [4.0], [1.0, 0.8, 4.0]),
            step_case("3rd order with zero", [1.0, 2.0], [1.0, 3.0, 4.0, 2.0]),
            step_case("closed loop of 5/(s(s+1)(s+3))", [5.0], [1.0, 4.0, 3.0, 0.0], closed=True),
        ],
        "margins": [
            margin_case("5/(s(s+1)(s+3))", [5.0], [1.0, 4.0, 3.0, 0.0]),
            margin_case("30(s+1)/(s(s+0.5)(s+4)(s+6))", [30.0, 30.0], [1.0, 10.5, 29.0, 12.0, 0.0]),
        ],
        "roots": [
            {"poly": [1.0, 7.0, 10.0, 10.0], "roots": sorted([[float(r.real), float(r.imag)] for r in np.roots([1.0, 7.0, 10.0, 10.0])])},
            {"poly": [1.0, 2.0, 3.0, 4.0, 5.0], "roots": sorted([[float(r.real), float(r.imag)] for r in np.roots([1.0, 2.0, 3.0, 4.0, 5.0])])},
        ],
    }
    path = Path(__file__).resolve().parent.parent / "tests" / "golden" / "lti.json"
    path.write_text(json.dumps(out, indent=2) + "\n")
    print("wrote", path)


if __name__ == "__main__":
    main()
