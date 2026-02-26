# ═══════════════════════════════════════════════════════════════════════════════
#  BANKING APP POLICY DATABASE
#  Contains all rules, whitelists, and compliance checks for detecting
#  fake / malicious banking and payment APKs.
# ═══════════════════════════════════════════════════════════════════════════════

# ── 1. KNOWN LEGITIMATE BANKING APP PACKAGES ────────────────────────────────
# These are the official package names published by actual banks/payment apps.
# An APK using these names without matching the official certificate is an
# IMPERSONATION attack.

LEGITIMATE_BANKING_PACKAGES = {

    # ── Indian Public Sector Banks ───────────────────────────────────────────
    "com.sbi.SBIFreedomPlus":         "State Bank of India — Yono SBI",
    "com.sbi.SBIAnyWhere":            "State Bank of India — YONO Lite",
    "com.sbi.lotusindia":             "State Bank of India — Corporate Banking",
    "com.baroda.mpassbook":           "Bank of Baroda — M-Connect Plus",
    "com.bob.mconnect":               "Bank of Baroda — BOB World",
    "com.punjabNationalBank.pnbOne":  "Punjab National Bank — PNB One",
    "com.csam.icici.bank.imobile":    "ICICI Bank — iMobile Pay",
    "com.csam.icici.bank.imobile_new":"ICICI Bank — iMobile (New)",
    "com.enstage.wibmo.hdfc":         "HDFC Bank — MobileBanking App",
    "com.snapwork.hdfc":              "HDFC Bank — PayZapp",
    "com.axis.mobile":                "Axis Bank — Mobile Banking",
    "com.kotak.mobile.android":       "Kotak Mahindra Bank — Mobile Banking",
    "com.fss.canmobile":              "Canara Bank — Candi Mobile Banking",
    "com.indusind.ibmobile":          "IndusInd Bank — IndusMobile",
    "com.IndusMobileBanking":         "IndusInd Bank — IndusMobile (alt)",
    "com.yesbank.mobile":             "Yes Bank — YES Mobile",
    "com.RBLBankLtd.mbanking":        "RBL Bank — MoBank",
    "com.idfcfirstbank.mobileapp":    "IDFC First Bank — ONE Mobile",
    "com.dbs.dbs_dbsmobile_sg":       "DBS Bank India",
    "com.federalbank.FedMobile":      "Federal Bank — FedMobile",
    "com.karnataka.banking.kbl":      "Karnataka Bank — KBL Mobile",
    "com.saraswat.smartbanking":      "Saraswat Bank — Smart Banking",
    "in.icici.omnichannel":           "ICICI Bank — Pockets",
    "com.freecharge.payment":         "Freecharge",
    "org.npci.upiapp":                "BHIM — NPCI Official UPI App",
    "in.org.npci.upiapp":             "BHIM UPI (alternate listing)",

    # ── Indian Private / Neo Banks & Payment Apps ────────────────────────────
    "net.one97.paytm":                "Paytm — One97 Communications",
    "com.phonepe.app":                "PhonePe — Walmart",
    "com.google.android.apps.nbuor":  "Google Pay India (Tez)",
    "com.mobikwik_new":               "MobiKwik — Zaakpay",
    "com.amazon.mShop.android.shopping": "Amazon Pay",
    "in.amazon.mShop.android.shopping": "Amazon Shopping / Pay (India)",
    "com.dreamplug.androidapp":       "CRED",
    "in.juspay.hyperpay":             "JusPay — HyperPay SDK (not standalone)",
    "com.razorpay.payments.app":      "Razorpay",
    "com.billdesk.android":           "BillDesk Pay",
    "com.airtel.money":               "Airtel Payments Bank",
    "com.jio.myjio":                  "Jio Payments Bank",
    "com.ola.money":                  "Ola Money",
    "com.slicepay.app":               "Slice — Fintech Card App",
    "com.jupiter.app":                "Jupiter Bank (Fi)",
    "com.epifi.fi":                   "Fi Money (Federal Bank Neo-bank)",
    "co.niyo.niyo":                   "Niyo Global",

    # ── International Banks ──────────────────────────────────────────────────
    "com.chase.sig.android":          "JPMorgan Chase Bank",
    "com.bankofamerica.digitalbanking": "Bank of America",
    "com.usbank.mobilebanking":       "US Bank",
    "com.wellsfargo.mobile":          "Wells Fargo Mobile",
    "com.citi.citimobile":            "Citibank Mobile",
    "com.barclays.android.barclaysmobilebanking": "Barclays Mobile Banking",
    "com.hsbc.hsbcnet":               "HSBC Mobile Banking",
    "com.lloyds.banking.mobile":      "Lloyds Bank Mobile Banking",
    "com.starlingbank.android":       "Starling Bank",
    "com.monzo.android":              "Monzo Bank",
    "com.n26.android":                "N26 Bank",
    "com.revolut.revolut":            "Revolut",
    "com.paypal.android.p2pmobile":   "PayPal",
    "com.cashapp":                    "Cash App (Block Inc.)",
    "com.venmo":                      "Venmo",
    "com.zelle":                      "Zelle",
    "com.wise":                       "Wise (TransferWise)",
    "com.coinbase.android":           "Coinbase",
    "com.stripe.android":             "Stripe (SDK — not standalone)",

    # ── Indian Insurance / Investment Adjacent ───────────────────────────────
    "com.liciapp":                    "LIC India Official App",
    "com.zerodha.kite3":              "Zerodha Kite",
    "com.growwapp":                   "Groww Investments",
    "com.upstox.market":              "Upstox",
    "com.angelbroking.stock":         "Angel One",
}

# Short set of commonly impersonated package suffixes (for fast lookup)
LEGITIMATE_PACKAGE_PREFIXES = sorted({
    pkg.rsplit(".", 1)[0] for pkg in LEGITIMATE_BANKING_PACKAGES
})


# ── 2. COMMONLY IMPERSONATED BANK NAMES (in app labels) ─────────────────────
# These strings appearing in the app label of an APK that is NOT the official
# package are a red flag for phishing/impersonation.

IMPERSONATION_KEYWORDS = [
    "sbi", "state bank", "hdfc", "icici", "axis bank", "kotak", "pnb",
    "punjab national", "canara", "bank of baroda", "bob", "union bank",
    "indian bank", "central bank", "uco bank", "idfc", "yes bank",
    "indusind", "rbl bank", "federal bank", "south indian bank",
    "karnataka bank", "paytm", "phonepe", "bhim", "gpay", "google pay",
    "amazon pay", "mobikwik", "paypal", "freecharge", "airtel money",
    "jio money", "revolut", "monzo", "n26", "wise", "cashapp", "venmo",
    "barclays", "hsbc", "lloyds", "natwest", "santander", "chase",
    "bank of america", "wells fargo", "citibank",
]


# ── 3. RBI / PCI-DSS / OWASP MOBILE BANKING COMPLIANCE POLICIES ─────────────
# Each policy describes a mandatory or recommended rule.
# Fields:
#   id        – machine-readable code
#   name      – short title
#   authority – issuing body
#   severity  – "critical" | "high" | "medium" | "low"
#   rule      – human-readable policy description
#   check_fn  – name of checker function in policy_checker.py

BANKING_POLICIES = [
    # ── RBI Guidelines ───────────────────────────────────────────────────────
    {
        "id": "RBI-001",
        "name": "No Unencrypted Communication",
        "authority": "RBI (Master Direction on IT Framework, 2021)",
        "severity": "critical",
        "rule": (
            "All banking apps MUST use HTTPS/TLS for data transmission. "
            "Apps communicating over plain HTTP expose customer credentials and "
            "transaction data. [RBI IT Framework §9.2]"
        ),
        "check": "check_unencrypted_http",
    },
    {
        "id": "RBI-002",
        "name": "No SMS-OTP Interception",
        "authority": "RBI (Cyber Security Framework, 2016 & 2021 Amendments)",
        "severity": "critical",
        "rule": (
            "Banking apps MUST NOT silently intercept SMS messages. "
            "READ_SMS / RECEIVE_SMS permissions are not required for legitimate "
            "OTP verification (Android Autofill / SMS Retriever API should be used instead). "
            "[RBI Cyber Security Framework §5]"
        ),
        "check": "check_sms_interception",
    },
    {
        "id": "RBI-003",
        "name": "No Overlay / Screen Recording",
        "authority": "RBI (Digital Payment Security Controls, 2021)",
        "severity": "critical",
        "rule": (
            "Apps MUST NOT use SYSTEM_ALERT_WINDOW or screen-capture APIs "
            "without explicit user consent. Overlays are a primary phishing vector "
            "used to harvest credentials on top of legitimate apps. "
            "[RBI DPSC §6.3]"
        ),
        "check": "check_overlay_permission",
    },
    {
        "id": "RBI-004",
        "name": "No Device Administrator Privilege",
        "authority": "RBI (Cyber Security Framework §5)",
        "severity": "critical",
        "rule": (
            "Legitimate banking apps MUST NOT request BIND_DEVICE_ADMIN. "
            "Device admin rights allow the app to lock/wipe the device — "
            "a ransomware and fraud vector."
        ),
        "check": "check_device_admin",
    },
    {
        "id": "RBI-005",
        "name": "Minimum SDK Requirement",
        "authority": "RBI / Google Play Policy (2023)",
        "severity": "high",
        "rule": (
            "Banking apps MUST target Android SDK ≥ 26 (Android 8). "
            "Targeting very old SDK versions disables modern security features "
            "(scoped storage, permission revocation, Work Profile isolation). "
            "Google Play mandates targetSdkVersion ≥ 33 since 2023."
        ),
        "check": "check_min_sdk",
    },
    {
        "id": "RBI-006",
        "name": "No Silent APK Installation",
        "authority": "RBI / Google Play (REQUEST_INSTALL_PACKAGES)",
        "severity": "high",
        "rule": (
            "Banking apps MUST NOT hold REQUEST_INSTALL_PACKAGES permission. "
            "This allows the app to silently install additional (potentially malicious) "
            "APKs — a dropper malware technique."
        ),
        "check": "check_install_packages",
    },
    {
        "id": "RBI-007",
        "name": "Certificate Pinning Required",
        "authority": "RBI / OWASP MASVS-NETWORK-2",
        "severity": "high",
        "rule": (
            "Banking apps SHOULD implement certificate / public-key pinning so that "
            "Man-in-the-Middle (MITM) attacks using rogue CAs are prevented. "
            "Presence of network_security_config.xml with pinning hints or "
            "OkHttp CertificatePinner usage is a positive indicator."
        ),
        "check": "check_certificate_pinning",
    },
    # ── PCI-DSS Mobile Controls ──────────────────────────────────────────────
    {
        "id": "PCI-001",
        "name": "No Dynamic Code Loading",
        "authority": "PCI-DSS v4.0 Requirement 6.3.3 / OWASP MASVS-CODE-3",
        "severity": "high",
        "rule": (
            "Payment apps MUST NOT load executable code (DEX/JAR) from untrusted "
            "sources at runtime using DexClassLoader / PathClassLoader. "
            "This is a common technique to bypass static security scanning."
        ),
        "check": "check_dex_loader",
    },
    {
        "id": "PCI-002",
        "name": "No Sensitive Data in Logs",
        "authority": "PCI-DSS v4.0 Requirement 10.3 / OWASP MASVS-STORAGE-2",
        "severity": "high",
        "rule": (
            "Payment apps MUST NOT log card numbers, CVVs, PINs, or account numbers. "
            "Log.d/Log.e calls near payment transaction code are flagged."
        ),
        "check": "check_log_leakage",
    },
    {
        "id": "PCI-003",
        "name": "Encryption Algorithm Validation",
        "authority": "PCI-DSS v4.0 Requirement 4.2.1",
        "severity": "medium",
        "rule": (
            "Payment apps SHOULD use strong ciphers (AES-256, RSA-2048+). "
            "Use of MD5, SHA-1, or DES for cryptographic operations is non-compliant "
            "and indicates poor security practices."
        ),
        "check": "check_weak_crypto",
    },
    # ── OWASP MASVS Controls ─────────────────────────────────────────────────
    {
        "id": "MASVS-001",
        "name": "Root / Jailbreak Detection Absent",
        "authority": "OWASP MASVS-RESILIENCE-1",
        "severity": "medium",
        "rule": (
            "Legitimate banking apps SHOULD implement root/emulator detection. "
            "Absence of SafetyNet / Play Integrity API calls or known root-detection "
            "strings may indicate the app cannot protect against rooted-device attacks."
        ),
        "check": "check_root_detection",
    },
    {
        "id": "MASVS-002",
        "name": "Accessibility Service Abuse",
        "authority": "OWASP MASVS-PLATFORM-2 / Android Banking Trojan pattern",
        "severity": "critical",
        "rule": (
            "Apps requesting BIND_ACCESSIBILITY_SERVICE are a major red flag. "
            "Banking trojans (BankBot, Anubis, Cerberus, SharkBot) abuse this API "
            "to perform keylogging, screen scraping, and automated fund transfers."
        ),
        "check": "check_accessibility_abuse",
    },
    {
        "id": "MASVS-003",
        "name": "Excessive Contact / Call-Log Access",
        "authority": "OWASP MASVS-PRIVACY-1 / RBI Data Localisation",
        "severity": "medium",
        "rule": (
            "Banking apps have no legitimate need for READ_CONTACTS, WRITE_CONTACTS, "
            "or READ_CALL_LOG. Requesting these permissions indicates data harvesting "
            "beyond the app's stated scope."
        ),
        "check": "check_contact_calllog",
    },
    {
        "id": "MASVS-004",
        "name": "Camera / Microphone Without KYC Justification",
        "authority": "OWASP MASVS-PRIVACY-2",
        "severity": "low",
        "rule": (
            "CAMERA and RECORD_AUDIO permissions are legitimate for video KYC flows "
            "in banking apps. However, requesting these alongside SMS interception "
            "and overlay permissions in the same app implies spyware behaviour."
        ),
        "check": "check_camera_audio_combo",
    },
    {
        "id": "MASVS-005",
        "name": "Background Location Tracking",
        "authority": "OWASP MASVS-PRIVACY-3 / Google Play Policy",
        "severity": "medium",
        "rule": (
            "ACCESS_BACKGROUND_LOCATION is not required by any legitimate banking app. "
            "Continuous background location tracking is a surveillance behaviour "
            "and violates Google Play's banking app policy."
        ),
        "check": "check_background_location",
    },
    # ── Impersonation / Phishing Checks ─────────────────────────────────────
    {
        "id": "IMPERSONATE-001",
        "name": "Package Name Impersonation",
        "authority": "Google Play Impersonation Policy / RBI Cyber Fraud",
        "severity": "critical",
        "rule": (
            "The APK uses a package name or app label that closely resembles a known "
            "legitimate banking app but does NOT match the official package name. "
            "This is a classic phishing / impersonation attack."
        ),
        "check": "check_package_impersonation",
    },
    {
        "id": "IMPERSONATE-002",
        "name": "Suspicious Network C2 Indicators",
        "authority": "CERT-In Advisory / RBI Cyber Fraud Reporting",
        "severity": "high",
        "rule": (
            "The APK contains URLs pointing to dynamic-DNS services (no-ip, dyndns), "
            "URL shorteners (bit.ly, tinyurl), or paste-sites (pastebin) that are "
            "commonly used as Command-and-Control (C2) endpoints by banking malware."
        ),
        "check": "check_c2_urls",
    },
]

# Quick-access policy ID → policy dict
POLICY_BY_ID = {p["id"]: p for p in BANKING_POLICIES}

# ── 4. DANGEROUS PERMISSIONS ─────────────────────────────────────────────────
# Dangerous permissions that may indicate malicious or fake banking apps
DANGEROUS_PERMISSIONS = [

    "android.permission.READ_SMS",
    "android.permission.RECEIVE_SMS",
    "android.permission.SEND_SMS",
    "android.permission.READ_CONTACTS",
    "android.permission.WRITE_CONTACTS",
    "android.permission.READ_CALL_LOG",
    "android.permission.WRITE_CALL_LOG",
    "android.permission.PROCESS_OUTGOING_CALLS",
    "android.permission.RECORD_AUDIO",
    "android.permission.CAMERA",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.ACCESS_BACKGROUND_LOCATION",
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.BIND_DEVICE_ADMIN",
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.DISABLE_KEYGUARD",
    "android.permission.GET_TASKS",
    "android.permission.REORDER_TASKS",
    "android.permission.PACKAGE_USAGE_STATS",
    "android.permission.READ_PHONE_STATE",
    "android.permission.CALL_PHONE",
    "android.permission.USE_BIOMETRIC",
    "android.permission.USE_FINGERPRINT",
    "android.permission.FOREGROUND_SERVICE",
    "android.permission.REQUEST_INSTALL_PACKAGES",
    "android.permission.CHANGE_NETWORK_STATE",
    "android.permission.INTERNET",
]

# Suspicious API calls often found in malware
SUSPICIOUS_API_CALLS = [
    "Landroid/telephony/SmsManager;->sendTextMessage",
    "Landroid/telephony/TelephonyManager;->getDeviceId",
    "Landroid/telephony/TelephonyManager;->getSubscriberId",
    "Landroid/telephony/TelephonyManager;->getSimSerialNumber",
    "Landroid/content/ContentResolver;->query",
    "Ljava/lang/Runtime;->exec",
    "Ljava/lang/reflect/Method;->invoke",
    "Ldalvik/system/DexClassLoader;->loadClass",
    "Landroid/app/admin/DevicePolicyManager;->lockNow",
    "Landroid/app/admin/DevicePolicyManager;->resetPassword",
    "Landroid/net/Uri;->parse",
    "Landroid/webkit/WebView;->loadUrl",
    "Ljavax/crypto/Cipher;->getInstance",
    "Ljava/net/HttpURLConnection;->setRequestProperty",
    "Ljava/net/URL;->openConnection",
    "Landroid/os/Build;->getSerial",
    "Landroid/provider/Telephony",
]

# Suspicious URL patterns
SUSPICIOUS_URL_PATTERNS = [
    "http://",  # unencrypted traffic
    "ngrok",
    "no-ip",
    "dyndns",
    "pastebin",
    "raw.github",
    "bit.ly",
    "tinyurl",
]

# Legitimate banking app indicators
LEGIT_PACKAGE_PREFIXES = [
    "com.google",
    "com.amazon",
    "com.paypal",
    "com.chase",
    "net.one97",  # Paytm
    "com.phonepe",
    "in.org.npci.upiapp",  # BHIM
    "com.sbi",
    "com.axis",
    "com.hdfc",
    "com.icici",
    "com.kotak",
]

# Feature vector order for ML model
FEATURE_NAMES = (
    [f"perm_{p.split('.')[-1].lower()}" for p in DANGEROUS_PERMISSIONS]
    + [f"api_{i}" for i in range(len(SUSPICIOUS_API_CALLS))]
    + [
        "total_permissions",
        "dangerous_perm_count",
        "suspicious_api_count",
        "suspicious_url_count",
        "has_device_admin",
        "has_accessibility_service",
        "exports_receivers",
        "min_sdk",
        "target_sdk",
        "uses_dex_loader",
        "uses_reflection",
        "has_native_libs",
    ]
)
