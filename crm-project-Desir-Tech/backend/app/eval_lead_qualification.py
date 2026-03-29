"""
Deterministic regression checks for the lead qualification workflow.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from types import SimpleNamespace

from app.ai_factory_runtime import deterministic_qualification


def _default_cases_path() -> Path:
    return Path(__file__).with_name("evals") / "lead_qualification_cases.json"


def _assert_case(case: dict[str, object]) -> tuple[bool, str]:
    lead = SimpleNamespace(**dict(case["lead"]))
    qualification, _, risk_summary = deterministic_qualification(lead)

    expected_tier = str(case["expected_tier"])
    expected_stage = str(case["expected_stage"])
    expected_score_min = int(case["expected_score_min"])
    expected_score_max = int(case["expected_score_max"])
    actual_score = int(qualification["score"])
    actual_tier = str(qualification["tier"])
    actual_stage = str(qualification["recommended_stage"])

    failures: list[str] = []
    if actual_tier != expected_tier:
        failures.append(f"tier expected={expected_tier} actual={actual_tier}")
    if actual_stage != expected_stage:
        failures.append(f"stage expected={expected_stage} actual={actual_stage}")
    if actual_score < expected_score_min or actual_score > expected_score_max:
        failures.append(
            f"score expected={expected_score_min}-{expected_score_max} actual={actual_score}"
        )

    if failures:
        return False, f"FAIL {case['id']}: {'; '.join(failures)}"
    return True, f"PASS {case['id']}: score={actual_score} tier={actual_tier} stage={actual_stage} risk={risk_summary}"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run deterministic lead-qualification regression cases."
    )
    parser.add_argument(
        "--cases",
        default=str(_default_cases_path()),
        help="Path to the JSON case file.",
    )
    args = parser.parse_args()

    cases_path = Path(args.cases).resolve()
    with cases_path.open("r", encoding="utf-8") as handle:
        cases = json.load(handle)

    passed = 0
    failed = 0
    for case in cases:
        ok, message = _assert_case(case)
        print(message)
        if ok:
            passed += 1
        else:
            failed += 1

    print(f"summary: passed={passed} failed={failed} cases={len(cases)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
