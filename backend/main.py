"""
FastAPI Application Entry Point — Fake Banking APK Detector
"""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# In-memory stores
analysis_store: Dict[str, Any] = {}   # analysis_id → AnalysisResult
task_store: Dict[str, Any] = {}       # task_id → {status, step, message, result}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Preload the ML model on startup."""
    from services.ml_service import _load_model
    try:
        _load_model()
        logging.info("ML model loaded successfully.")
    except FileNotFoundError as e:
        logging.warning(f"Model not loaded: {e} — run `python -m ml.train` first.")
    yield


app = FastAPI(
    title="Fake APK Detector API",
    description=(
        "ML-powered static analysis API for detecting fake and malicious "
        "banking/payment Android APKs using Androguard + scikit-learn."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────────────────────────────
from routers.analyze import router as analyze_router
from routers.report import router as report_router

app.include_router(analyze_router)
app.include_router(report_router)


# ── Health check ────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    import os
    model_exists = os.path.exists(
        os.path.join(os.path.dirname(__file__), "ml", "model.joblib")
    )
    return {
        "status": "ok",
        "model_loaded": model_exists,
        "cached_analyses": len(analysis_store),
        "active_tasks": len([t for t in task_store.values() if t.get("status") == "processing"]),
    }


@app.get("/", tags=["System"])
async def root():
    return JSONResponse({
        "message": "Fake APK Detector API v1.0.0",
        "docs": "/docs",
        "health": "/health",
    })


# ── Dev runner ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    logging.basicConfig(level=logging.INFO)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
