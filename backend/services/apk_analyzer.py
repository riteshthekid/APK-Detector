"""
APK Analyzer Service using Androguard.
Extracts features from an APK file for ML classification.
"""
from __future__ import annotations
import os
import re
import hashlib
import logging
from typing import Dict, List, Any, Tuple

from ml.feature_config import (
    DANGEROUS_PERMISSIONS,
    SUSPICIOUS_API_CALLS,
    SUSPICIOUS_URL_PATTERNS,
)

logger = logging.getLogger(__name__)


# ─── Description map for permissions ─────────────────────────────────────────
PERMISSION_DESCRIPTIONS = {
    "READ_SMS": "Read SMS messages — may intercept OTP codes",
    "RECEIVE_SMS": "Receive SMS — may capture OTPs silently",
    "SEND_SMS": "Send SMS without user interaction",
    "READ_CONTACTS": "Access all contact information",
    "CAMERA": "Access device camera",
    "RECORD_AUDIO": "Record microphone audio",
    "ACCESS_FINE_LOCATION": "Precise GPS location tracking",
    "SYSTEM_ALERT_WINDOW": "Draw overlays over other apps (phishing risk)",
    "BIND_DEVICE_ADMIN": "Device administrator rights",
    "RECEIVE_BOOT_COMPLETED": "Auto-start on device boot",
    "REQUEST_INSTALL_PACKAGES": "Install additional APKs silently",
    "READ_PHONE_STATE": "Read phone identifiers (IMEI, SIM info)",
    "READ_EXTERNAL_STORAGE": "Read files from storage",
    "WRITE_EXTERNAL_STORAGE": "Write files to storage",
    "GET_TASKS": "Monitor running applications",
    "PACKAGE_USAGE_STATS": "Monitor which apps are in use",
}


def _sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def _extract_urls(strings: List[str]) -> List[str]:
    url_re = re.compile(r"https?://[^\s\"'<>]+", re.IGNORECASE)
    found = set()
    for s in strings:
        for match in url_re.findall(str(s)):
            found.add(match)
    return list(found)


def analyze_apk(apk_path: str) -> Dict[str, Any]:
    """
    Analyse an APK file using Androguard and return a feature dictionary.
    Falls back to stub data if Androguard cannot parse (e.g. demo .apk).
    """
    file_size_kb = os.path.getsize(apk_path) / 1024
    sha256 = _sha256_file(apk_path)

    try:
        from androguard.misc import AnalyzeAPK
        apk, dex_list, analysis = AnalyzeAPK(apk_path)

        package_name = apk.get_package() or "unknown.package"
        app_name = apk.get_app_name() or "Unknown App"
        version_name = apk.get_androidversion_name() or "?"
        version_code = str(apk.get_androidversion_code() or "?")
        try:
            min_sdk = int(apk.get_min_sdk_version() or 21)
        except (ValueError, TypeError):
            min_sdk = 21
        try:
            target_sdk = int(apk.get_target_sdk_version() or 30)
        except (ValueError, TypeError):
            target_sdk = 30

        permissions: List[str] = apk.get_permissions() or []

        # Collect all method calls from DEX analysis
        api_calls_found: List[str] = []
        try:
            for method in analysis.get_methods():
                desc = f"{method.class_name}->{method.name}"
                api_calls_found.append(desc)
        except Exception:
            api_calls_found = []

        # Strings for URL extraction
        raw_strings: List[str] = []
        try:
            for dex in dex_list:
                raw_strings.extend([s.get_value() for s in dex.get_strings()])
        except Exception:
            pass

        # Component exports
        try:
            receivers = apk.get_receivers()
            exported_receivers = len([
                r for r in receivers
                if apk.get_intent_filters("receiver", r)
            ])
        except Exception:
            exported_receivers = 0

        # Native libraries
        try:
            has_native = 1 if apk.get_libraries() else 0
        except Exception:
            has_native = 0

        # DexClassLoader / Reflection
        uses_dex_loader = int(any(
            "DexClassLoader" in m or "PathClassLoader" in m
            for m in api_calls_found
        ))
        uses_reflection = int(any(
            "reflect" in m.lower() for m in api_calls_found
        ))

    except Exception as exc:
        logger.warning(f"Androguard full parse failed ({exc}). Using basic APK inspection.")
        # --- Fallback: minimal extraction from zip (APK is a zip) ---
        import zipfile
        package_name = "com.unknown.app"
        app_name = os.path.basename(apk_path).replace(".apk", "")
        version_name = "1.0"
        version_code = "1"
        min_sdk = 21
        target_sdk = 30
        permissions = []
        api_calls_found = []
        raw_strings = []
        exported_receivers = 0
        has_native = 0
        uses_dex_loader = 0
        uses_reflection = 0

        try:
            with zipfile.ZipFile(apk_path, "r") as zf:
                namelist = zf.namelist()
                has_native = 1 if any(n.endswith(".so") for n in namelist) else 0
                # Try to read AndroidManifest.xml (binary XML, limited parsing)
                if "AndroidManifest.xml" in namelist:
                    manifest_bytes = zf.read("AndroidManifest.xml")
                    # Extract readable strings from binary XML
                    text = manifest_bytes.decode("utf-8", errors="ignore")
                    raw_strings.append(text)
                    # Simple regex for package/version in binary manifest
                    pkg = re.search(r"com\.[a-zA-Z0-9_.]+", text)
                    if pkg:
                        package_name = pkg.group(0)
        except Exception:
            pass

    # ── Compute derived features ──────────────────────────────────────────────
    dangerous_found = [p for p in permissions if p in DANGEROUS_PERMISSIONS]
    suspicious_apis_found = [
        api for api in SUSPICIOUS_API_CALLS
        if any(api in call for call in api_calls_found)
    ]
    urls_found = _extract_urls(raw_strings)
    suspicious_urls = [
        url for url in urls_found
        if any(pat in url.lower() for pat in SUSPICIOUS_URL_PATTERNS)
    ]

    has_device_admin = int(
        "android.permission.BIND_DEVICE_ADMIN" in permissions
        or any("DevicePolicyManager" in m for m in api_calls_found)
    )
    has_accessibility = int(
        "android.permission.BIND_ACCESSIBILITY_SERVICE" in permissions
        or any("AccessibilityService" in m for m in api_calls_found)
    )

    return {
        "package_name": package_name,
        "app_name": app_name,
        "version_name": version_name,
        "version_code": version_code,
        "min_sdk": min_sdk,
        "target_sdk": target_sdk,
        "file_size_kb": round(file_size_kb, 2),
        "sha256": sha256,
        "permissions": permissions,
        "dangerous_permissions": dangerous_found,
        "suspicious_apis": suspicious_apis_found,
        "suspicious_urls": suspicious_urls,
        "all_api_calls": api_calls_found,
        "has_device_admin": has_device_admin,
        "has_accessibility_service": has_accessibility,
        "exported_receivers": exported_receivers,
        "has_native_libs": has_native,
        "uses_dex_loader": uses_dex_loader,
        "uses_reflection": uses_reflection,
    }


def build_feature_vector(features: Dict[str, Any]) -> list:
    """Convert raw feature dict → numeric vector for ML model."""
    import numpy as np

    n_perm_features = len(DANGEROUS_PERMISSIONS)
    n_api_features = len(SUSPICIOUS_API_CALLS)

    vec = []

    # Permission binary flags
    permissions_set = set(features.get("permissions", []))
    for perm in DANGEROUS_PERMISSIONS:
        vec.append(1.0 if perm in permissions_set else 0.0)

    # Suspicious API binary flags
    suspicious_apis_found = set(features.get("suspicious_apis", []))
    for api in SUSPICIOUS_API_CALLS:
        vec.append(1.0 if api in suspicious_apis_found else 0.0)

    # Extra numeric features
    vec.append(float(len(features.get("permissions", []))))
    vec.append(float(len(features.get("dangerous_permissions", []))))
    vec.append(float(len(features.get("suspicious_apis", []))))
    vec.append(float(len(features.get("suspicious_urls", []))))
    vec.append(float(features.get("has_device_admin", 0)))
    vec.append(float(features.get("has_accessibility_service", 0)))
    vec.append(float(features.get("exported_receivers", 0)))
    vec.append(float(features.get("min_sdk", 21)))
    vec.append(float(features.get("target_sdk", 30)))
    vec.append(float(features.get("uses_dex_loader", 0)))
    vec.append(float(features.get("uses_reflection", 0)))
    vec.append(float(features.get("has_native_libs", 0)))

    return vec


def build_permission_details(features: Dict[str, Any]) -> list:
    """Return a list of PermissionDetail dicts for the API response."""
    dangerous_set = set(features.get("dangerous_permissions", []))
    result = []
    for perm in features.get("permissions", []):
        short = perm.split(".")[-1]
        result.append({
            "name": perm,
            "is_dangerous": perm in dangerous_set,
            "description": PERMISSION_DESCRIPTIONS.get(short, ""),
        })
    return result


def build_risk_factors(features: Dict[str, Any], verdict: str) -> list:
    """Generate a list of risk factor dicts based on extracted features."""
    factors = []

    dp_count = len(features.get("dangerous_permissions", []))
    if dp_count >= 10:
        factors.append({
            "factor": "Excessive Dangerous Permissions",
            "severity": "high",
            "details": f"Requests {dp_count} dangerous permissions — far above typical banking apps (≤ 5).",
        })
    elif dp_count >= 5:
        factors.append({
            "factor": "Elevated Dangerous Permissions",
            "severity": "medium",
            "details": f"Requests {dp_count} dangerous permissions.",
        })

    if features.get("has_device_admin"):
        factors.append({
            "factor": "Device Administrator Rights",
            "severity": "high",
            "details": "App requests device admin privileges — can lock/wipe device.",
        })

    if features.get("has_accessibility_service"):
        factors.append({
            "factor": "Accessibility Service Abuse",
            "severity": "high",
            "details": "Uses Accessibility Service — known keylogging / overlay attack vector.",
        })

    sms_perms = [p for p in features.get("dangerous_permissions", []) if "SMS" in p]
    if sms_perms:
        factors.append({
            "factor": "SMS Interception Capability",
            "severity": "high",
            "details": f"Holds SMS permissions ({', '.join(p.split('.')[-1] for p in sms_perms)}) — can intercept OTP codes.",
        })

    if features.get("uses_dex_loader"):
        factors.append({
            "factor": "Dynamic Code Loading",
            "severity": "high",
            "details": "Uses DexClassLoader — can load and execute code at runtime, evading static analysis.",
        })

    if features.get("uses_reflection"):
        factors.append({
            "factor": "Reflection-based Obfuscation",
            "severity": "medium",
            "details": "Heavy use of Java reflection — common in code obfuscation and anti-analysis techniques.",
        })

    su = len(features.get("suspicious_urls", []))
    if su > 0:
        factors.append({
            "factor": "Suspicious Network Endpoints",
            "severity": "medium",
            "details": f"Contains {su} suspicious URL(s) (unencrypted HTTP, dynamic DNS, URL shorteners, etc.).",
        })

    sa = len(features.get("suspicious_apis", []))
    if sa > 5:
        factors.append({
            "factor": "High Suspicious API Usage",
            "severity": "medium",
            "details": f"Uses {sa} suspicious API calls commonly associated with malware.",
        })

    if features.get("min_sdk", 99) < 18:
        factors.append({
            "factor": "Very Low Minimum SDK",
            "severity": "low",
            "details": f"Targets SDK {features['min_sdk']} (very old Android) — unusual for legitimate banking apps.",
        })

    return factors
