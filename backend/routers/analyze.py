"""
APK Analysis Router — background task + real-time status polling.

Flow:
  POST /analyze           → instantly returns {task_id}, starts background thread
  GET  /analyze/status/{task_id} → returns {status, step, message, result?}
"""
from __future__ import annotations
import os
import uuid
import tempfile
import logging
import threading
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, HTTPException

from models.schemas import AnalysisResult, AnalyzeResponse, AppMetadata
from services.apk_analyzer import (
    analyze_apk,
    build_feature_vector,
    build_permission_details,
    build_risk_factors,
)
from services.ml_service import predict
from services.policy_checker import run_policy_checks, policy_compliance_summary
from ml.feature_config import LEGITIMATE_BANKING_PACKAGES

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analyze", tags=["Analysis"])

MAX_FILE_SIZE_MB = 100


# ── Progress steps shown to the frontend ─────────────────────────────────────
STEP_MESSAGES = {
    0: "File received — preparing analysis…",
    1: "Androguard parsing APK structure…",
    2: "Extracting permissions, APIs & strings…",
    3: "Running ML classifier…",
    4: "Running banking policy compliance checks…",
    5: "Assembling report…",
    6: "Complete",
}


def _run_analysis(task_id: str, tmp_path: str, filename: str,
                  task_store: dict, analysis_store: dict):
    """
    Background thread: runs the full analysis pipeline and writes progress
    updates into task_store[task_id] at each step.
    """
    def progress(step: int):
        task_store[task_id]["step"] = step
        task_store[task_id]["message"] = STEP_MESSAGES.get(step, "")

    try:
        # Step 1 — Androguard parse
        progress(1)
        raw_features = analyze_apk(tmp_path)

        # Step 2 — Build feature vector
        progress(2)
        feature_vector = build_feature_vector(raw_features)
        perm_details = build_permission_details(raw_features)

        # Step 3 — ML inference
        progress(3)
        ml_result = predict(feature_vector)
        risk_factors = build_risk_factors(raw_features, ml_result["verdict"])

        # Step 4 — Policy checks
        progress(4)
        policy_violations = run_policy_checks(raw_features)
        compliance = policy_compliance_summary(policy_violations)

        # Step 5 — Assemble result
        progress(5)
        pkg_name = raw_features.get("package_name", "")
        is_known = pkg_name in LEGITIMATE_BANKING_PACKAGES
        known_name = LEGITIMATE_BANKING_PACKAGES.get(pkg_name)
        analysis_id = task_id  # reuse task_id as analysis_id for simpler lookup
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        metadata = AppMetadata(
            package_name=raw_features["package_name"],
            app_name=raw_features["app_name"],
            version_name=raw_features["version_name"],
            version_code=raw_features["version_code"],
            min_sdk=raw_features["min_sdk"],
            target_sdk=raw_features["target_sdk"],
            file_size_kb=raw_features["file_size_kb"],
            sha256=raw_features["sha256"],
        )

        result = AnalysisResult(
            analysis_id=analysis_id,
            filename=filename,
            timestamp=timestamp,
            verdict=ml_result["verdict"],
            risk_score=ml_result["risk_score"],
            confidence=ml_result["confidence"],
            metadata=metadata,
            permissions=[
                {"name": p["name"], "is_dangerous": p["is_dangerous"],
                 "description": p["description"]}
                for p in perm_details
            ],
            dangerous_permissions=raw_features["dangerous_permissions"],
            suspicious_apis=raw_features["suspicious_apis"],
            suspicious_urls=raw_features["suspicious_urls"],
            risk_factors=[
                {"factor": rf["factor"], "severity": rf["severity"],
                 "details": rf["details"]}
                for rf in risk_factors
            ],
            policy_violations=[
                {"policy_id": v["policy_id"], "name": v["name"],
                 "authority": v["authority"], "severity": v["severity"],
                 "rule": v["rule"]}
                for v in policy_violations
            ],
            compliance_summary=compliance,
            is_known_banking_app=is_known,
            known_app_name=known_name,
            feature_vector=feature_vector,
            model_version="1.0.0",
        )

        # Store result
        analysis_store[analysis_id] = result

        # Step 6 — Done
        progress(6)
        task_store[task_id]["status"] = "complete"
        task_store[task_id]["result"] = result.model_dump()

        logger.info(f"Analysis done: {task_id} → {ml_result['verdict']} "
                    f"({ml_result['risk_score']:.0f}%)")

    except Exception as exc:
        logger.exception(f"Analysis failed: {task_id}")
        task_store[task_id]["status"] = "error"
        task_store[task_id]["message"] = str(exc)

    finally:
        # Clean up temp file
        try:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
        except Exception:
            pass


# ── POST /analyze ─────────────────────────────────────────────────────────────

@router.post("")
async def analyze_apk_endpoint(
    file: UploadFile = File(..., description="Android APK file to analyse"),
):
    """
    Upload an APK. Returns a task_id immediately; analysis runs in background.
    Poll GET /analyze/status/{task_id} for real-time progress.
    """
    if not file.filename.lower().endswith(".apk"):
        raise HTTPException(status_code=400, detail="Only .apk files are accepted.")

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Max {MAX_FILE_SIZE_MB} MB.",
        )

    # Write to temp file
    with tempfile.NamedTemporaryFile(suffix=".apk", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    task_id = str(uuid.uuid4())

    # Initialise task entry
    from main import task_store, analysis_store
    task_store[task_id] = {
        "status": "processing",
        "step": 0,
        "message": STEP_MESSAGES[0],
        "result": None,
    }

    # Kick off background thread
    thread = threading.Thread(
        target=_run_analysis,
        args=(task_id, tmp_path, file.filename, task_store, analysis_store),
        daemon=True,
    )
    thread.start()

    logger.info(f"Task started: {task_id} ({file.filename}, {size_mb:.2f} MB)")
    return {"task_id": task_id, "status": "processing"}


# ── GET /analyze/status/{task_id} ────────────────────────────────────────────

@router.get("/status/{task_id}")
async def get_status(task_id: str):
    """
    Poll this endpoint to get real-time analysis progress.

    Returns:
      {status: processing|complete|error, step: 0-6, message: str, result?: {...}}
    """
    from main import task_store
    task = task_store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found. Has the server restarted?")
    return task
