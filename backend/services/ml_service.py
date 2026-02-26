"""
ML Inference Service — loads the trained model and scores APK features.
"""
from __future__ import annotations
import os
import logging
import numpy as np
import joblib

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "model.joblib")

_model = None


def _load_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                "Please run `python -m ml.train` first."
            )
        _model = joblib.load(MODEL_PATH)
        logger.info(f"Model loaded from {MODEL_PATH}")
    return _model


def predict(feature_vector: list) -> dict:
    """
    Run inference on a feature vector.

    Returns:
        dict with keys:
          - verdict:    "FAKE" | "LEGITIMATE" | "SUSPICIOUS"
          - confidence: 0–100 float
          - risk_score: 0–100 float
          - label:      0 (legit) | 1 (fake)
    """
    model = _load_model()

    X = np.array(feature_vector, dtype=np.float32).reshape(1, -1)
    label = int(model.predict(X)[0])
    proba = model.predict_proba(X)[0]   # [p_legit, p_fake]

    p_fake = float(proba[1])
    p_legit = float(proba[0])

    # Risk score 0–100
    risk_score = round(p_fake * 100, 1)

    # Verdict with a "SUSPICIOUS" middle-ground band
    if p_fake >= 0.65:
        verdict = "FAKE"
    elif p_fake >= 0.40:
        verdict = "SUSPICIOUS"
    else:
        verdict = "LEGITIMATE"

    confidence = round(max(p_fake, p_legit) * 100, 1)

    return {
        "verdict": verdict,
        "confidence": confidence,
        "risk_score": risk_score,
        "label": label,
    }
