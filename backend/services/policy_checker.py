"""
Banking Policy Checker Service
Runs each compliance policy check against raw extracted APK features
and returns a list of PolicyViolation dicts.
"""
from __future__ import annotations
from typing import Dict, Any, List

from ml.feature_config import (
    BANKING_POLICIES,
    LEGITIMATE_BANKING_PACKAGES,
    IMPERSONATION_KEYWORDS,
)

C2_PATTERNS = [
    "no-ip", "dyndns", "changeip", "afraid.org",
    "pastebin", "paste.ee", "hastebin",
    "bit.ly", "tinyurl", "t.co", "goo.gl", "rebrand.ly",
    "ngrok", "serveo", "localhost.run",
]

WEAK_CRYPTO_PATTERNS = ["MD5", "SHA1", "DES", "RC4", "3DES"]

ROOT_DETECTION_HINTS = [
    "isRooted", "RootBeer", "SafetyNet", "IntegrityAPI",
    "PlayIntegrity", "DeviceIntegrity", "su", "/system/bin/su",
    "com.topjohnwu.magisk", "busybox",
]

CERT_PINNING_HINTS = [
    "CertificatePinner", "TrustManager", "network_security_config",
    "SSLContext", "X509Certificate", "pinCertificates",
]

LOG_LEAK_HINTS = ["Log.d", "Log.v", "Log.e", "System.out.println"]


# ── Individual check functions ────────────────────────────────────────────────

def check_unencrypted_http(f: Dict) -> bool:
    """FAIL if suspicious_urls contains plain http:// endpoints."""
    for url in f.get("suspicious_urls", []):
        if url.startswith("http://"):
            return True
    return False


def check_sms_interception(f: Dict) -> bool:
    perms = set(f.get("permissions", []))
    return bool(perms & {
        "android.permission.READ_SMS",
        "android.permission.RECEIVE_SMS",
        "android.permission.SEND_SMS",
    })


def check_overlay_permission(f: Dict) -> bool:
    return "android.permission.SYSTEM_ALERT_WINDOW" in f.get("permissions", [])


def check_device_admin(f: Dict) -> bool:
    return bool(f.get("has_device_admin", 0))


def check_min_sdk(f: Dict) -> bool:
    """FAIL if targetSdk < 26 (Android 8 Oreo)."""
    return int(f.get("target_sdk", 33)) < 26


def check_install_packages(f: Dict) -> bool:
    return "android.permission.REQUEST_INSTALL_PACKAGES" in f.get("permissions", [])


def check_certificate_pinning(f: Dict) -> bool:
    """FAIL (flag ABSENT) if none of the pinning hints are found in API calls."""
    all_calls = " ".join(f.get("all_api_calls", []))
    return not any(hint in all_calls for hint in CERT_PINNING_HINTS)


def check_dex_loader(f: Dict) -> bool:
    return bool(f.get("uses_dex_loader", 0))


def check_log_leakage(f: Dict) -> bool:
    all_calls = " ".join(f.get("all_api_calls", []))
    return any(hint in all_calls for hint in LOG_LEAK_HINTS)


def check_weak_crypto(f: Dict) -> bool:
    all_calls = " ".join(f.get("all_api_calls", []))
    return any(pattern in all_calls for pattern in WEAK_CRYPTO_PATTERNS)


def check_root_detection(f: Dict) -> bool:
    """FAIL (flag ABSENT) if no root-detection hints found."""
    all_calls = " ".join(f.get("all_api_calls", []))
    return not any(hint in all_calls for hint in ROOT_DETECTION_HINTS)


def check_accessibility_abuse(f: Dict) -> bool:
    return bool(f.get("has_accessibility_service", 0))


def check_contact_calllog(f: Dict) -> bool:
    perms = set(f.get("permissions", []))
    return bool(perms & {
        "android.permission.READ_CONTACTS",
        "android.permission.WRITE_CONTACTS",
        "android.permission.READ_CALL_LOG",
    })


def check_camera_audio_combo(f: Dict) -> bool:
    """FAIL only when CAMERA+AUDIO co-exist with SMS/overlay (spyware cluster)."""
    perms = set(f.get("permissions", []))
    has_spy_core = perms & {
        "android.permission.READ_SMS",
        "android.permission.SYSTEM_ALERT_WINDOW",
    }
    has_cam_audio = perms & {
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
    }
    return bool(has_spy_core and has_cam_audio)


def check_background_location(f: Dict) -> bool:
    return "android.permission.ACCESS_BACKGROUND_LOCATION" in f.get("permissions", [])


def check_package_impersonation(f: Dict) -> bool:
    """FAIL if package name / app name resembles a known bank but isn't official."""
    pkg = f.get("package_name", "").lower()
    app_name = f.get("app_name", "").lower()

    # If it IS the official package, not a violation
    if f.get("package_name", "") in LEGITIMATE_BANKING_PACKAGES:
        return False

    # Check if it contains impersonation keywords but isn't official
    for kw in IMPERSONATION_KEYWORDS:
        if kw in pkg or kw in app_name:
            return True
    return False


def check_c2_urls(f: Dict) -> bool:
    all_urls = " ".join(f.get("suspicious_urls", []) + f.get("all_api_calls", []))
    return any(pattern in all_urls.lower() for pattern in C2_PATTERNS)


# ── Dispatcher ────────────────────────────────────────────────────────────────

_CHECK_FNS = {
    "check_unencrypted_http":     check_unencrypted_http,
    "check_sms_interception":     check_sms_interception,
    "check_overlay_permission":   check_overlay_permission,
    "check_device_admin":         check_device_admin,
    "check_min_sdk":              check_min_sdk,
    "check_install_packages":     check_install_packages,
    "check_certificate_pinning":  check_certificate_pinning,
    "check_dex_loader":           check_dex_loader,
    "check_log_leakage":          check_log_leakage,
    "check_weak_crypto":          check_weak_crypto,
    "check_root_detection":       check_root_detection,
    "check_accessibility_abuse":  check_accessibility_abuse,
    "check_contact_calllog":      check_contact_calllog,
    "check_camera_audio_combo":   check_camera_audio_combo,
    "check_background_location":  check_background_location,
    "check_package_impersonation":check_package_impersonation,
    "check_c2_urls":              check_c2_urls,
}


def run_policy_checks(features: Dict[str, Any]) -> List[Dict]:
    """
    Run all banking policies against the extracted APK features.
    Returns a list of violated policy dicts (passed policies are excluded).
    """
    violations = []
    for policy in BANKING_POLICIES:
        fn_name = policy.get("check", "")
        fn = _CHECK_FNS.get(fn_name)
        if fn is None:
            continue
        try:
            violated = fn(features)
        except Exception:
            violated = False

        if violated:
            violations.append({
                "policy_id":  policy["id"],
                "name":       policy["name"],
                "authority":  policy["authority"],
                "severity":   policy["severity"],
                "rule":       policy["rule"],
            })

    return violations


def policy_compliance_summary(violations: List[Dict]) -> Dict:
    """Summarise policy results."""
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for v in violations:
        counts[v["severity"]] = counts.get(v["severity"], 0) + 1

    total_policies = len(BANKING_POLICIES)
    passed = total_policies - len(violations)
    score = round((passed / total_policies) * 100, 1) if total_policies else 100.0

    return {
        "total_policies_checked": total_policies,
        "violations": len(violations),
        "passed": passed,
        "compliance_score": score,
        "severity_counts": counts,
    }
