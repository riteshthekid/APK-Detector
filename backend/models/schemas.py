"""
Pydantic schemas for the Fake APK Detector API.
"""
from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PermissionDetail(BaseModel):
    name: str
    is_dangerous: bool
    description: str = ""


class RiskFactor(BaseModel):
    factor: str
    severity: str  # "high" | "medium" | "low"
    details: str


class PolicyViolation(BaseModel):
    """Represents a single banking compliance policy violation."""
    policy_id: str          # e.g. "RBI-001"
    name: str               # Short policy title
    authority: str          # Issuing body (RBI, PCI-DSS, OWASP MASVS…)
    severity: str           # "critical" | "high" | "medium" | "low"
    rule: str               # Full policy rule text


class ComplianceSummary(BaseModel):
    """Overall compliance score across all banking policies."""
    total_policies_checked: int
    violations: int
    passed: int
    compliance_score: float = Field(..., ge=0, le=100)  # % of policies passed
    severity_counts: Dict[str, int]                     # {critical, high, medium, low}


class AppMetadata(BaseModel):
    package_name: str
    app_name: str
    version_name: str
    version_code: str
    min_sdk: int
    target_sdk: int
    file_size_kb: float
    sha256: str


class AnalysisResult(BaseModel):
    analysis_id: str
    filename: str
    timestamp: str
    verdict: str                          # "FAKE" | "LEGITIMATE" | "SUSPICIOUS"
    risk_score: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=100)
    metadata: AppMetadata
    permissions: List[PermissionDetail]
    dangerous_permissions: List[str]
    suspicious_apis: List[str]
    suspicious_urls: List[str]
    risk_factors: List[RiskFactor]
    # ── Banking Policy fields ────────────────────────────────────────────────
    policy_violations: List[PolicyViolation] = []
    compliance_summary: Optional[ComplianceSummary] = None
    is_known_banking_app: bool = False          # True if package is in the whitelist
    known_app_name: Optional[str] = None        # Official name if whitelist match
    # ────────────────────────────────────────────────────────────────────────
    feature_vector: Optional[List[float]] = None
    model_version: str = "1.0.0"


class AnalyzeResponse(BaseModel):
    success: bool
    message: str
    data: Optional[AnalysisResult] = None
    error: Optional[str] = None

