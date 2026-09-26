#!/usr/bin/env python3
"""Market Risk Monitor Global+ v3.5.1.64 — Phase 14 historical validation tool.

Offline, reproducible point-in-time validation utility. It never downloads data and it
never mutates production model weights or thresholds.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import statistics
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Iterable

VERSION = "3.5.1.64"
SCHEMA = "MRM_HIST_VALIDATION_V1"
METHOD = "PIT_BACKTEST_V1"
HORIZONS = (21, 63, 126, 252)
CURRENT_THRESHOLDS = (25, 45, 60, 75)
MIN_LABELLED_FOR_SUGGESTION = 30
FACTOR_WEIGHTS = {
    "credit": 15.0,
    "fundingLiquidity": 20.0,
    "volatility": 15.0,
    "equityInternals": 10.0,
    "rates": 8.0,
    "macroGrowth": 10.0,
    "inflation": 5.0,
    "fx": 7.0,
    "commodities": 5.0,
    "correlationContagion": 5.0,
}
REFERENCE_STRESS = {
    "maxForwardDrawdownPct": -10.0,
    "hySpreadWideningBp": 100.0,
    "vixStressLevel": 35.0,
    "recessionOnset": True,
    "basis": "HEURISTIC_VALIDATION_TARGET_ONLY",
}
DEFAULT_EVENTS = [
    {"id": "DOT_COM", "label": "Dot-com bust", "start": "2000-03-10", "end": "2002-10-09", "boundaryType": "ANALYTICAL_REFERENCE_NOT_OFFICIAL"},
    {"id": "GFC", "label": "Global Financial Crisis", "start": "2007-07-01", "end": "2009-03-09", "boundaryType": "ANALYTICAL_REFERENCE_NOT_OFFICIAL"},
    {"id": "EUROZONE", "label": "Eurozone crisis", "start": "2010-04-23", "end": "2012-07-26", "boundaryType": "ANALYTICAL_REFERENCE_NOT_OFFICIAL"},
    {"id": "CHINA_OIL_2015_16", "label": "2015–2016 China / oil shock", "start": "2015-06-12", "end": "2016-02-11", "boundaryType": "ANALYTICAL_REFERENCE_NOT_OFFICIAL"},
    {"id": "Q4_2018", "label": "Q4 2018 sell-off", "start": "2018-10-01", "end": "2018-12-24", "boundaryType": "ANALYTICAL_REFERENCE_NOT_OFFICIAL"},
    {"id": "COVID", "label": "COVID market shock", "start": "2020-02-19", "end": "2020-03-23", "boundaryType": "ANALYTICAL_REFERENCE_NOT_OFFICIAL"},
    {"id": "RATES_INFLATION_2022", "label": "2022 rates / inflation shock", "start": "2022-01-03", "end": "2022-10-14", "boundaryType": "ANALYTICAL_REFERENCE_NOT_OFFICIAL"},
    {"id": "BANK_STRESS_2023", "label": "2023 bank stress", "start": "2023-03-08", "end": "2023-05-04", "boundaryType": "ANALYTICAL_REFERENCE_NOT_OFFICIAL"},
]


def iso_day(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if len(text) < 10:
        return None
    d = text[:10]
    try:
        date.fromisoformat(d)
    except ValueError:
        return None
    return d


def finite(value: Any) -> float | None:
    try:
        x = float(value)
    except (TypeError, ValueError):
        return None
    return x if math.isfinite(x) else None


@dataclass(frozen=True)
class Obs:
    d: str
    v: float


def normalize_series(rows: Iterable[dict[str, Any]]) -> list[Obs]:
    by_day: dict[str, float] = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        d = iso_day(row.get("date", row.get("d")))
        v = finite(row.get("value", row.get("v")))
        if d is not None and v is not None:
            by_day[d] = v
    return [Obs(d, by_day[d]) for d in sorted(by_day)]


def read_series_csv(path: Path | None) -> list[Obs]:
    if path is None:
        return []
    with path.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        return []
    # Accept date,value plus common value aliases, but require an explicit date column.
    keys = {k.lower(): k for k in rows[0] if k}
    date_key = keys.get("date") or keys.get("d")
    value_key = keys.get("value") or keys.get("v") or keys.get("close") or keys.get("score")
    if not date_key or not value_key:
        raise ValueError(f"{path}: expected date,value columns")
    return normalize_series({"date": r.get(date_key), "value": r.get(value_key)} for r in rows)


def read_snapshots(path: Path) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8-sig").strip()
    if not text:
        return []
    try:
        obj = json.loads(text)
    except json.JSONDecodeError:
        rows = []
        for line_no, line in enumerate(text.splitlines(), 1):
            if not line.strip():
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_no}: invalid JSONL: {exc}") from exc
        return rows
    if isinstance(obj, list):
        return obj
    if isinstance(obj, dict):
        for key in ("localPointInTimeSnapshots", "snapshots", "rows"):
            if isinstance(obj.get(key), list):
                return obj[key]
    raise ValueError(f"{path}: expected JSON array, JSONL, or object containing snapshots")


def vintage_eligibility(snapshot: dict[str, Any], strict: bool = True) -> dict[str, Any]:
    if not strict:
        return {"eligible": True, "reason": "STRICT_DISABLED"}
    as_of = iso_day(snapshot.get("asOf"))
    if as_of is None:
        return {"eligible": False, "reason": "INVALID_AS_OF"}
    pit = snapshot.get("pointInTime") or {}
    if pit.get("captureMode") == "LIVE_RUNTIME_SNAPSHOT" and pit.get("reconstructed") is not True:
        captured = iso_day(pit.get("capturedAt") or snapshot.get("capturedAt"))
        if captured is not None and captured < as_of:
            return {"eligible": False, "reason": "CAPTURE_BEFORE_AS_OF"}
        return {"eligible": True, "reason": "LIVE_RUNTIME_SNAPSHOT"}
    vintages = snapshot.get("vintageInputs") or pit.get("vintageInputs") or []
    if not vintages:
        return {"eligible": False, "reason": "VINTAGE_UNVERIFIED"}
    for item in vintages:
        available = iso_day((item or {}).get("availableAt"))
        if available is None:
            return {"eligible": False, "reason": "VINTAGE_UNVERIFIED", "input": (item or {}).get("name")}
        if available > as_of:
            return {"eligible": False, "reason": "LOOKAHEAD_INPUT", "input": (item or {}).get("name"), "availableAt": available}
    return {"eligible": True, "reason": "VINTAGE_VERIFIED"}


def last_index_on_or_before(series: list[Obs], target: str) -> int:
    lo, hi, ans = 0, len(series) - 1, -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if series[mid].d <= target:
            ans = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return ans


def rows_between(series: list[Obs], start_exclusive: str, end_inclusive: str) -> list[Obs]:
    return [x for x in series if start_exclusive < x.d <= end_inclusive]


def max_drawdown_pct(values: list[float]) -> float | None:
    if len(values) < 2:
        return None
    peak = values[0]
    worst = 0.0
    for value in values:
        peak = max(peak, value)
        if peak > 0:
            worst = min(worst, (value / peak - 1.0) * 100.0)
    return worst


def annualized_vol_pct(values: list[float]) -> float | None:
    rets = []
    for a, b in zip(values, values[1:]):
        if a != 0:
            rets.append(b / a - 1.0)
    if len(rets) < 2:
        return None
    return statistics.stdev(rets) * math.sqrt(252.0) * 100.0


def forward_outcome(
    as_of: str,
    horizon: int,
    market: list[Obs],
    hy: list[Obs],
    vix: list[Obs],
    recession: list[Obs],
) -> dict[str, Any]:
    i = last_index_on_or_before(market, as_of)
    if horizon not in HORIZONS:
        return {"status": "INVALID_HORIZON", "asOf": as_of, "horizon": horizon}
    if i < 0:
        return {"status": "NO_BASE_MARKET_VALUE", "asOf": as_of, "horizon": horizon}
    end_idx = i + horizon
    if end_idx >= len(market):
        return {
            "status": "INSUFFICIENT_FUTURE_DATA",
            "asOf": as_of,
            "horizon": horizon,
            "baseDate": market[i].d,
            "availableForwardTradingDays": max(0, len(market) - 1 - i),
        }
    path = market[i : end_idx + 1]
    end_date = path[-1].d
    base = path[0].v
    end = path[-1].v

    hi = last_index_on_or_before(hy, as_of)
    hy_base = hy[hi].v if hi >= 0 else None
    hy_future = rows_between(hy, as_of, end_date)
    hy_max = max((x.v for x in hy_future), default=None)

    vi = last_index_on_or_before(vix, as_of)
    vix_base = vix[vi].v if vi >= 0 else None
    vix_future = rows_between(vix, as_of, end_date)
    vix_max = max((x.v for x in vix_future), default=None)

    recession_rows = rows_between(recession, as_of, end_date)
    recession_available = bool(recession_rows)
    recession_hit = next((x for x in recession_rows if x.v >= 0.5), None)

    return {
        "status": "COMPLETE",
        "asOf": as_of,
        "horizon": horizon,
        "baseDate": path[0].d,
        "endDate": end_date,
        "baseValue": base,
        "endValue": end,
        "forwardReturnPct": ((end / base) - 1.0) * 100.0 if base else None,
        "maxForwardDrawdownPct": max_drawdown_pct([x.v for x in path]),
        "forwardVolatilityPct": annualized_vol_pct([x.v for x in path]),
        "hySpreadBaseBp": hy_base,
        "hySpreadMaxBp": hy_max,
        "hySpreadWideningBp": (hy_max - hy_base) if hy_max is not None and hy_base is not None else None,
        "vixBase": vix_base,
        "vixMax": vix_max,
        "recessionOnset": bool(recession_hit) if recession_available else None,
        "recessionOutcomeAvailable": recession_available,
        "recessionOnsetDate": recession_hit.d if recession_hit else None,
        "noLookaheadScoreInputs": True,
    }


def stress_target(outcome: dict[str, Any], config: dict[str, Any] = REFERENCE_STRESS) -> bool | None:
    if outcome.get("status") != "COMPLETE":
        return None
    flags: list[bool] = []
    dd = finite(outcome.get("maxForwardDrawdownPct"))
    hy = finite(outcome.get("hySpreadWideningBp"))
    vx = finite(outcome.get("vixMax"))
    rec = outcome.get("recessionOnset")
    if dd is not None:
        flags.append(dd <= float(config["maxForwardDrawdownPct"]))
    if hy is not None:
        flags.append(hy >= float(config["hySpreadWideningBp"]))
    if vx is not None:
        flags.append(vx >= float(config["vixStressLevel"]))
    if config.get("recessionOnset") and isinstance(rec, bool):
        flags.append(rec)
    return any(flags) if flags else None


def confusion(rows: list[dict[str, Any]], threshold: float) -> dict[str, Any]:
    tp = fp = tn = fn = 0
    for row in rows:
        score = finite(row.get("score"))
        target = row.get("target")
        if score is None or not isinstance(target, bool):
            continue
        pred = score >= threshold
        if pred and target:
            tp += 1
        elif pred:
            fp += 1
        elif target:
            fn += 1
        else:
            tn += 1
    precision = tp / (tp + fp) if tp + fp else None
    recall = tp / (tp + fn) if tp + fn else None
    fpr = fp / (fp + tn) if fp + tn else None
    fnr = fn / (fn + tp) if fn + tp else None
    specificity = tn / (tn + fp) if tn + fp else None
    balanced = (recall + specificity) / 2 if recall is not None and specificity is not None else None
    f1 = (2 * precision * recall / (precision + recall)) if precision is not None and recall is not None and precision + recall else None
    return {
        "threshold": threshold,
        "n": tp + fp + tn + fn,
        "tp": tp,
        "fp": fp,
        "tn": tn,
        "fn": fn,
        "precision": precision,
        "recall": recall,
        "falsePositiveRate": fpr,
        "falseNegativeRate": fnr,
        "specificity": specificity,
        "balancedAccuracy": balanced,
        "f1": f1,
        "confusionMatrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
    }


def roc_auc(rows: list[dict[str, Any]]) -> float | None:
    positives = [r for r in rows if r.get("target") is True and finite(r.get("score")) is not None]
    negatives = [r for r in rows if r.get("target") is False and finite(r.get("score")) is not None]
    if not positives or not negatives:
        return None
    wins = 0.0
    for p in positives:
        for n in negatives:
            ps, ns = float(p["score"]), float(n["score"])
            wins += 1.0 if ps > ns else 0.5 if ps == ns else 0.0
    return wins / (len(positives) * len(negatives))


def pr_auc(rows: list[dict[str, Any]]) -> float | None:
    valid = [r for r in rows if isinstance(r.get("target"), bool) and finite(r.get("score")) is not None]
    valid.sort(key=lambda r: float(r["score"]), reverse=True)
    positives = sum(r["target"] is True for r in valid)
    if positives == 0:
        return None
    tp = fp = 0
    last_recall = 0.0
    area = 0.0
    for row in valid:
        if row["target"]:
            tp += 1
        else:
            fp += 1
        recall = tp / positives
        precision = tp / (tp + fp)
        if row["target"]:
            area += (recall - last_recall) * precision
            last_recall = recall
    return area


def conditional_drawdown(rows: list[dict[str, Any]], threshold: float) -> dict[str, Any]:
    vals = [finite(r.get("maxForwardDrawdownPct")) for r in rows if finite(r.get("score")) is not None and float(r["score"]) >= threshold]
    vals = [v for v in vals if v is not None]
    return {
        "threshold": threshold,
        "n": len(vals),
        "meanMaxForwardDrawdownPct": statistics.mean(vals) if vals else None,
        "medianMaxForwardDrawdownPct": statistics.median(vals) if vals else None,
    }


def threshold_study(rows: list[dict[str, Any]]) -> dict[str, Any]:
    valid = [r for r in rows if finite(r.get("score")) is not None and isinstance(r.get("target"), bool)]
    current = [confusion(valid, t) for t in CURRENT_THRESHOLDS]
    candidates = [confusion(valid, t) for t in range(20, 81, 5)]
    has_both = any(r["target"] for r in valid) and any(not r["target"] for r in valid)
    suggested = None
    if len(valid) >= MIN_LABELLED_FOR_SUGGESTION and has_both:
        candidates_valid = [x for x in candidates if x["balancedAccuracy"] is not None]
        candidates_valid.sort(
            key=lambda x: (
                -float(x["balancedAccuracy"]),
                -(float(x["f1"]) if x["f1"] is not None else -1.0),
                abs(float(x["threshold"]) - 60.0),
            )
        )
        suggested = candidates_valid[0] if candidates_valid else None
    return {
        "status": "DIAGNOSTIC_SUGGESTION_AVAILABLE" if suggested else "INSUFFICIENT_HISTORY_FOR_SUGGESTION",
        "labelledRows": len(valid),
        "currentThresholds": current,
        "candidates": candidates,
        "historicallySuggestedThreshold": suggested["threshold"] if suggested else None,
        "suggestedMetrics": suggested,
        "selectionRule": "highest balanced accuracy, tie-break F1, then proximity to 60; diagnostic only",
        "productionThresholdChanged": False,
    }


def reweighted_score(factors: dict[str, Any], factor: str, multiplier: float) -> float | None:
    num = den = 0.0
    for name, weight in FACTOR_WEIGHTS.items():
        score = finite(factors.get(name))
        if score is None:
            continue
        w = weight * multiplier if name == factor else weight
        num += score * w
        den += w
    return num / den if den else None


def weight_sensitivity(snapshots: list[dict[str, Any]]) -> dict[str, Any]:
    rows = []
    for factor, base_weight in FACTOR_WEIGHTS.items():
        minus: list[float] = []
        plus: list[float] = []
        for snap in snapshots:
            factors = snap.get("factorScores") or {}
            base = reweighted_score(factors, factor, 1.0)
            lo = reweighted_score(factors, factor, 0.8)
            hi = reweighted_score(factors, factor, 1.2)
            if base is not None and lo is not None:
                minus.append(lo - base)
            if base is not None and hi is not None:
                plus.append(hi - base)
        abs_delta = [abs(x) for x in minus + plus]
        rows.append({
            "factor": factor,
            "baselineWeight": base_weight,
            "minus20MeanDelta": statistics.mean(minus) if minus else None,
            "plus20MeanDelta": statistics.mean(plus) if plus else None,
            "maxAbsoluteScoreDelta": max(abs_delta) if abs_delta else None,
            "observations": max(len(minus), len(plus)),
            "unstable": bool(abs_delta and max(abs_delta) >= 5.0),
        })
    return {
        "methodologyVersion": METHOD,
        "oneFactorAtATime": True,
        "productionWeightsChanged": False,
        "instabilityRule": "diagnostic flag when ±20% one-factor perturbation changes score by >=5 points in any tested snapshot",
        "rows": rows,
    }


def parse_events(path: Path | None) -> list[dict[str, Any]]:
    if path is None:
        return [dict(x) for x in DEFAULT_EVENTS]
    obj = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(obj, list):
        raise ValueError("events JSON must be an array")
    out = []
    for row in obj:
        if not isinstance(row, dict) or not iso_day(row.get("start")) or not iso_day(row.get("end")):
            raise ValueError("each event needs id/label/start/end")
        out.append(dict(row))
    return out


def event_lead(snapshots: list[dict[str, Any]], events: list[dict[str, Any]], threshold: float, lead_window_days: int) -> dict[str, Any]:
    usable = []
    for s in snapshots:
        d = iso_day(s.get("asOf"))
        score = finite(s.get("globalScore"))
        if d and score is not None:
            usable.append((d, score))
    usable.sort()
    event_rows = []
    leads: list[int] = []
    for e in events:
        start = date.fromisoformat(e["start"])
        lower = (start - timedelta(days=lead_window_days)).isoformat()
        warnings = [(d, s) for d, s in usable if lower <= d <= e["start"] and s >= threshold]
        first = warnings[0][0] if warnings else None
        lead = (start - date.fromisoformat(first)).days if first else None
        if lead is not None:
            leads.append(lead)
        event_rows.append({**e, "warningThreshold": threshold, "leadWindowDays": lead_window_days, "firstWarningDate": first, "warningLeadCalendarDays": lead, "warningObserved": first is not None})
    return {
        "warningThreshold": threshold,
        "leadWindowDays": lead_window_days,
        "medianWarningLeadCalendarDays": statistics.median(leads) if leads else None,
        "eventsWithWarning": len(leads),
        "eventCount": len(events),
        "rows": event_rows,
    }


def write_json(path: Path, obj: Any) -> None:
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=False) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]], fields: list[str] | None = None) -> None:
    if fields is None:
        fields = []
        seen = set()
        for row in rows:
            for key in row:
                if key not in seen and not isinstance(row[key], (dict, list)):
                    seen.add(key)
                    fields.append(key)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def run(args: argparse.Namespace) -> dict[str, Any]:
    snapshots_raw = read_snapshots(args.snapshots)
    eligible: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    for snap in snapshots_raw:
        if not isinstance(snap, dict):
            rejected.append({"reason": "INVALID_SNAPSHOT_TYPE"})
            continue
        score = finite(snap.get("globalScore"))
        as_of = iso_day(snap.get("asOf"))
        elig = vintage_eligibility(snap, strict=not args.allow_unverified_vintages)
        if score is None or as_of is None:
            rejected.append({"asOf": snap.get("asOf"), "reason": "MISSING_SCORE_OR_AS_OF"})
        elif not elig["eligible"]:
            rejected.append({"asOf": as_of, **elig})
        else:
            clean = dict(snap)
            clean["asOf"] = as_of
            clean["globalScore"] = score
            clean["pitEligibility"] = elig
            eligible.append(clean)
    eligible.sort(key=lambda s: s["asOf"])

    market = read_series_csv(args.market)
    hy = read_series_csv(args.hy_oas)
    vix = read_series_csv(args.vix)
    recession = read_series_csv(args.recession)
    events = parse_events(args.events)

    observations: list[dict[str, Any]] = []
    horizon_rows: dict[int, list[dict[str, Any]]] = {h: [] for h in HORIZONS}
    for snap in eligible:
        for h in HORIZONS:
            out = forward_outcome(snap["asOf"], h, market, hy, vix, recession)
            target = stress_target(out)
            row = {
                "asOf": snap["asOf"],
                "globalScore": snap["globalScore"],
                "rawBand": snap.get("rawBand"),
                "displayBand": snap.get("displayBand"),
                "horizon": h,
                **out,
                "target": target,
            }
            observations.append(row)
            if out.get("status") == "COMPLETE" and isinstance(target, bool):
                horizon_rows[h].append({"score": snap["globalScore"], "target": target, **out})

    metrics = []
    threshold_results: dict[str, Any] = {}
    for h in HORIZONS:
        rows = horizon_rows[h]
        threshold_results[str(h)] = threshold_study(rows)
        for threshold in CURRENT_THRESHOLDS:
            c = confusion(rows, threshold)
            cd = conditional_drawdown(rows, threshold)
            metrics.append({
                "horizon": h,
                "threshold": threshold,
                **{k: v for k, v in c.items() if k != "confusionMatrix"},
                "rocAuc": roc_auc(rows),
                "prAuc": pr_auc(rows),
                "conditionalDrawdownN": cd["n"],
                "conditionalMeanMaxDrawdownPct": cd["meanMaxForwardDrawdownPct"],
                "conditionalMedianMaxDrawdownPct": cd["medianMaxForwardDrawdownPct"],
                "confusionMatrix": c["confusionMatrix"],
            })

    sensitivity = weight_sensitivity(eligible)
    lead = event_lead(eligible, events, args.warning_threshold, args.lead_window_days)
    manifest = {
        "schema": SCHEMA,
        "methodologyVersion": METHOD,
        "toolVersion": VERSION,
        "strictPointInTime": not args.allow_unverified_vintages,
        "productionModelChanged": False,
        "productionWeightsChanged": False,
        "productionThresholdsChanged": False,
        "horizonsTradingDays": list(HORIZONS),
        "currentThresholds": list(CURRENT_THRESHOLDS),
        "referenceStressTarget": dict(REFERENCE_STRESS),
        "eventBoundaryNote": "Default dates are configurable analytical reference windows, not official causal/recession boundaries.",
        "inputFiles": {
            "snapshots": str(args.snapshots),
            "market": str(args.market),
            "hyOas": str(args.hy_oas) if args.hy_oas else None,
            "vix": str(args.vix) if args.vix else None,
            "recession": str(args.recession) if args.recession else None,
            "events": str(args.events) if args.events else None,
        },
    }
    summary = {
        "schema": SCHEMA,
        "methodologyVersion": METHOD,
        "eligibleSnapshots": len(eligible),
        "rejectedSnapshots": len(rejected),
        "marketObservations": len(market),
        "hyObservations": len(hy),
        "vixObservations": len(vix),
        "recessionObservations": len(recession),
        "completeOutcomeRows": sum(1 for r in observations if r.get("status") == "COMPLETE"),
        "labelledOutcomeRows": sum(len(v) for v in horizon_rows.values()),
        "realHistoricalValidationClaimed": False,
        "note": "Framework output only. Predictive validity is not claimed unless supplied snapshots are genuine point-in-time records and outcome series are complete/appropriate.",
    }

    outdir: Path = args.output_dir
    outdir.mkdir(parents=True, exist_ok=True)
    write_json(outdir / "manifest.json", manifest)
    write_json(outdir / "summary.json", summary)
    write_json(outdir / "rejected_snapshots.json", rejected)
    write_json(outdir / "threshold_study.json", threshold_results)
    write_json(outdir / "weight_sensitivity.json", sensitivity)
    write_json(outdir / "event_windows.json", events)
    write_json(outdir / "event_lead.json", lead)
    write_json(outdir / "observations.json", observations)
    write_csv(outdir / "observations.csv", observations)
    flat_metrics = []
    for row in metrics:
        flat = dict(row)
        cm = flat.pop("confusionMatrix")
        for k, v in cm.items():
            flat[k] = v
        flat_metrics.append(flat)
    write_csv(outdir / "metrics.csv", flat_metrics)
    write_json(outdir / "metrics.json", metrics)
    write_csv(outdir / "eligible_snapshots.csv", [
        {"asOf": s["asOf"], "globalScore": s["globalScore"], "rawBand": s.get("rawBand"), "displayBand": s.get("displayBand"), "pitReason": s.get("pitEligibility", {}).get("reason")}
        for s in eligible
    ])
    return summary


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Offline Phase-14 point-in-time historical validation for Market Risk Monitor Global+ v3.5.1.64")
    p.add_argument("--snapshots", type=Path, required=True, help="JSON/JSONL point-in-time score snapshots")
    p.add_argument("--market", type=Path, required=True, help="CSV date,value benchmark series")
    p.add_argument("--hy-oas", type=Path, default=None, help="optional CSV date,value HY OAS in bp")
    p.add_argument("--vix", type=Path, default=None, help="optional CSV date,value VIX")
    p.add_argument("--recession", type=Path, default=None, help="optional CSV date,value external recession indicator (>=0.5 = recession)")
    p.add_argument("--events", type=Path, default=None, help="optional JSON event-window array")
    p.add_argument("--output-dir", type=Path, required=True)
    p.add_argument("--warning-threshold", type=float, default=60.0, help="diagnostic event-warning threshold; does not alter production bands")
    p.add_argument("--lead-window-days", type=int, default=126)
    p.add_argument("--allow-unverified-vintages", action="store_true", help="disable strict PIT vintage rejection for exploratory work; clearly recorded in manifest")
    return p


def main() -> int:
    args = build_parser().parse_args()
    try:
        summary = run(args)
    except Exception as exc:
        print(f"ERROR: {exc}")
        return 2
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
