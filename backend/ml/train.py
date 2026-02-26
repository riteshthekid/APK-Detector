"""
ML Training Script — APK Guardian
===================================
Data pipeline:
  1. Generate 10,000 synthetic APK feature vectors (4 sub-types)
  2. SMOTE  — oversample minority class variants to balance edge cases
  3. Noise Augmentation — inject Gaussian noise on numeric features +
                          random bit-flips on binary features to simulate
                          real-world APK variability
  4. Train Soft-Voting Ensemble: RF(500) + GB(300) + LR
  5. 5-fold stratified CV + full evaluation (Acc / Prec / Rec / F1 / AUC)

Usage
-----
  # Default (synthetic + SMOTE + noise):
  python -m ml.train

  # Skip SMOTE (faster):
  python -m ml.train --no-smote

  # Skip noise augmentation:
  python -m ml.train --no-noise

  # Use real APKs instead of synthetic:
  python -m ml.train --legit /path/to/legit --fake /path/to/fake

  # Grid-search RF hyperparameters (~30 min):
  python -m ml.train --grid-search

  # Custom sample count:
  python -m ml.train --samples 20000
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import (
    GradientBoostingClassifier,
    RandomForestClassifier,
    VotingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.feature_config import DANGEROUS_PERMISSIONS, SUSPICIOUS_API_CALLS, FEATURE_NAMES

# ── Config ─────────────────────────────────────────────────────────────────────
SEED            = 42
N_SAMPLES       = 10_000
MODEL_PATH      = os.path.join(os.path.dirname(__file__), "model.joblib")

N_PERM   = len(DANGEROUS_PERMISSIONS)
N_API    = len(SUSPICIOUS_API_CALLS)
N_BIN    = N_PERM + N_API   # binary feature count (permissions + API flags)
N_NUM    = 12               # numeric feature count (sdk, counts, etc.)
N_FEAT   = N_BIN + N_NUM


# ══════════════════════════════════════════════════════════════════════════════
# 1. SYNTHETIC DATASET  (4 realistic sub-types)
# ══════════════════════════════════════════════════════════════════════════════

def generate_synthetic_dataset(n_samples: int = N_SAMPLES, seed: int = SEED):
    """
    4 sub-types per class for richer decision-boundary coverage:
      Legit:  (a) standard banking app   (b) feature-rich legitimate app (gray-zone)
      Fake:   (c) aggressive malware     (d) stealthy repackaged trojan
    """
    rng = np.random.default_rng(seed)
    X, y = [], []
    half = n_samples // 2

    # ── Label 0: LEGITIMATE ──────────────────────────────────────────────────
    for _ in range(half):
        row  = np.zeros(N_FEAT, dtype=np.float32)
        base = N_BIN
        gray = rng.random() < 0.20          # 20% gray-zone (more perms, still legit)

        nd = rng.integers(0, 10 if gray else 6)
        row[rng.choice(N_PERM, size=nd, replace=False)] = 1

        na = rng.integers(0, 3 if gray else 2)
        row[N_PERM + rng.choice(N_API, size=na, replace=False)] = 1

        row[base+0]  = rng.integers(3, 20 if gray else 15)  # total_permissions
        row[base+1]  = nd                                    # dangerous_perm_count
        row[base+2]  = na                                    # suspicious_api_count
        row[base+3]  = rng.integers(0, 2)                   # suspicious_url_count
        row[base+4]  = 0                                     # has_device_admin
        row[base+5]  = 0                                     # has_accessibility_service
        row[base+6]  = rng.integers(0, 4)                   # exports_receivers
        row[base+7]  = rng.integers(21, 33)                 # min_sdk
        row[base+8]  = rng.integers(30, 34)                 # target_sdk
        row[base+9]  = 0                                     # uses_dex_loader
        row[base+10] = 0 if not gray else rng.integers(0,2) # uses_reflection
        row[base+11] = rng.integers(0, 2)                   # has_native_libs

        X.append(row); y.append(0)

    # ── Label 1: FAKE / MALICIOUS ────────────────────────────────────────────
    for _ in range(n_samples - half):
        row  = np.zeros(N_FEAT, dtype=np.float32)
        base = N_BIN
        stealthy = rng.random() < 0.40      # 40% stealthy (fewer obvious signals)

        nd = rng.integers(2, 9) if stealthy else rng.integers(5, min(20, N_PERM)+1)
        row[rng.choice(N_PERM, size=nd, replace=False)] = 1

        na = rng.integers(1, 5) if stealthy else rng.integers(3, min(15, N_API)+1)
        row[N_PERM + rng.choice(N_API, size=na, replace=False)] = 1

        row[base+0]  = rng.integers(8 if stealthy else 10, 30)  # total_permissions
        row[base+1]  = nd
        row[base+2]  = na
        row[base+3]  = rng.integers(0 if stealthy else 1, 10)   # suspicious_url_count
        row[base+4]  = rng.integers(0, 2)                        # has_device_admin
        row[base+5]  = rng.integers(0, 2)                        # has_accessibility_service
        row[base+6]  = rng.integers(1, 10)                       # exports_receivers
        row[base+7]  = rng.integers(16, 26)                      # min_sdk
        row[base+8]  = rng.integers(26, 33)                      # target_sdk
        row[base+9]  = rng.integers(0, 2)                        # uses_dex_loader
        row[base+10] = rng.integers(0, 2)                        # uses_reflection
        row[base+11] = rng.integers(0, 3)                        # has_native_libs

        X.append(row); y.append(1)

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32)
    idx = rng.permutation(len(y))
    return X[idx], y[idx]


# ══════════════════════════════════════════════════════════════════════════════
# 2. SMOTE  — Synthetic Minority Oversampling
# ══════════════════════════════════════════════════════════════════════════════

def apply_smote(X: np.ndarray, y: np.ndarray, seed: int = SEED) -> tuple[np.ndarray, np.ndarray]:
    """
    SMOTE generates synthetic interpolated samples between nearest neighbours
    in feature space. Applied only to the training fold (never the test set).

    Strategy  : 'auto' — balance the minority class to match majority
    k_neighbors: 7      — more neighbours = smoother interpolation for high-dim
    n_jobs    : -1      — use all CPU cores
    """
    try:
        from imblearn.over_sampling import SMOTE
    except ImportError:
        print("  ⚠  imbalanced-learn not installed — skipping SMOTE")
        print("     pip install imbalanced-learn")
        return X, y

    n_before = len(y)
    smote = SMOTE(
        sampling_strategy = "auto",
        k_neighbors       = 7,
        random_state      = seed,
    )
    X_res, y_res = smote.fit_resample(X, y)
    n_after = len(y_res)
    added   = n_after - n_before
    print(f"      SMOTE: {n_before:,} → {n_after:,} samples  (+{added:,} synthetic)")
    print(f"      Class balance: Legit={( y_res==0).sum():,}  Fake={(y_res==1).sum():,}")
    return X_res, y_res


# ══════════════════════════════════════════════════════════════════════════════
# 3. NOISE AUGMENTATION
# ══════════════════════════════════════════════════════════════════════════════

def apply_noise_augmentation(
    X: np.ndarray,
    y: np.ndarray,
    augment_fraction: float = 0.30,
    gaussian_std:     float = 0.05,
    bit_flip_prob:    float = 0.02,
    seed:             int   = SEED,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Augment training data by creating noisy copies of existing samples.

    Two noise types applied together:

    1. Gaussian noise on NUMERIC features (indices N_BIN..N_BIN+N_NUM)
       • Simulates measurement variation in SDK versions, URL counts, etc.
       • std=0.05 → small perturbation, preserves feature distribution

    2. Random bit-flips on BINARY features (indices 0..N_BIN)
       • Each bit independently flips with probability `bit_flip_prob`
       • Simulates rare edge cases — e.g., a legitimate app accidentally
         triggering a dangerous permission flag due to a dependency

    Parameters
    ----------
    augment_fraction : fraction of existing samples to duplicate with noise
                       0.30 → +30% extra augmented samples added to dataset
    gaussian_std     : std-dev for Gaussian noise on numeric features
    bit_flip_prob    : per-feature probability of flipping binary features
    """
    rng       = np.random.default_rng(seed + 999)   # different seed from generation
    n_aug     = int(len(X) * augment_fraction)
    aug_idx   = rng.choice(len(X), size=n_aug, replace=True)

    X_aug = X[aug_idx].copy()
    y_aug = y[aug_idx].copy()

    # ── Gaussian noise on numeric (continuous) features ───────────────────────
    numeric_slice       = slice(N_BIN, N_BIN + N_NUM)
    X_aug[:, numeric_slice] += rng.normal(0, gaussian_std, (n_aug, N_NUM)).astype(np.float32)
    # Clip SDK and count features to realistic ranges (they can't go negative)
    X_aug[:, numeric_slice]  = np.clip(X_aug[:, numeric_slice], 0, None)

    # ── Bit-flips on binary (0/1) permission and API features ────────────────
    flip_mask           = rng.random((n_aug, N_BIN)) < bit_flip_prob
    X_aug[:, :N_BIN]   = np.abs(X_aug[:, :N_BIN] - flip_mask.astype(np.float32))
    X_aug[:, :N_BIN]   = np.clip(X_aug[:, :N_BIN], 0, 1)

    X_out = np.vstack([X, X_aug])
    y_out = np.concatenate([y, y_aug])

    # Shuffle augmented + original together
    perm  = rng.permutation(len(y_out))
    print(f"      Noise Augmentation: {len(X):,} → {len(X_out):,} samples "
          f"(+{n_aug:,} noisy copies, σ={gaussian_std}, flip_p={bit_flip_prob})")
    return X_out[perm], y_out[perm]


# ══════════════════════════════════════════════════════════════════════════════
# 4. REAL APK LOADER
# ══════════════════════════════════════════════════════════════════════════════

def load_real_dataset(legit_folder: str, fake_folder: str):
    """Load real APKs via Androguard — use with --legit / --fake flags."""
    from services.apk_analyzer import analyze_apk, build_feature_vector
    X, y, errors = [], [], 0
    for label, folder in [(0, legit_folder), (1, fake_folder)]:
        apks = list(Path(folder).rglob("*.apk"))
        print(f"  Found {len(apks)} APKs in: {folder}")
        for apk_path in apks:
            try:
                X.append(build_feature_vector(analyze_apk(str(apk_path))))
                y.append(label)
            except Exception as e:
                errors += 1
                print(f"    ⚠  {apk_path.name}: {e}")
    print(f"  Loaded {len(X)} APKs  ({errors} skipped)")
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


# ══════════════════════════════════════════════════════════════════════════════
# 5. MODEL
# ══════════════════════════════════════════════════════════════════════════════

def build_voting_ensemble() -> Pipeline:
    """Soft-Voting Ensemble: RF(500) + GB(300) + LR — weights 3:2:1."""
    rf = RandomForestClassifier(
        n_estimators=500, max_depth=None, min_samples_leaf=1,
        max_features="sqrt", class_weight="balanced",
        random_state=SEED, n_jobs=-1,
    )
    gb = GradientBoostingClassifier(
        n_estimators=300, learning_rate=0.05, max_depth=5,
        subsample=0.8, min_samples_leaf=3, random_state=SEED,
    )
    lr = LogisticRegression(
        C=1.0, class_weight="balanced", max_iter=2000,
        solver="lbfgs", random_state=SEED,
    )
    voting = VotingClassifier(
        estimators=[("rf", rf), ("gb", gb), ("lr", lr)],
        voting="soft", weights=[3, 2, 1], n_jobs=-1,
    )
    return Pipeline([("scaler", StandardScaler()), ("clf", voting)])


def build_rf_gridsearch(X_tr, y_tr) -> Pipeline:
    """Optional GridSearchCV — tuned RF only (faster than tuning ensemble)."""
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(class_weight="balanced", random_state=SEED, n_jobs=-1)),
    ])
    param_grid = {
        "clf__n_estimators":    [300, 500],
        "clf__max_depth":       [None, 20, 30],
        "clf__min_samples_leaf":[1, 2, 4],
        "clf__max_features":    ["sqrt", "log2"],
    }
    gs = GridSearchCV(pipeline, param_grid,
                      cv=StratifiedKFold(n_splits=5),
                      scoring="f1", n_jobs=-1, verbose=1, refit=True)
    print("  Running GridSearchCV (may take 10-40 min)…")
    gs.fit(X_tr, y_tr)
    print(f"  Best params : {gs.best_params_}")
    print(f"  Best CV F1  : {gs.best_score_:.4f}")
    return gs.best_estimator_


# ══════════════════════════════════════════════════════════════════════════════
# 6. TRAINING ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def train(
    legit_folder:    str | None = None,
    fake_folder:     str | None = None,
    use_smote:       bool = True,
    use_noise:       bool = True,
    use_grid_search: bool = False,
    n_samples:       int  = N_SAMPLES,
):
    print("\n" + "═" * 66)
    print("  APK Guardian  ·  ML Training Pipeline  (SMOTE + Noise Aug)")
    print("═" * 66)

    # ── Step 1: base dataset ──────────────────────────────────────────────────
    if legit_folder and fake_folder:
        print(f"\n[1/5] Loading REAL APK dataset…")
        X, y = load_real_dataset(legit_folder, fake_folder)
    else:
        print(f"\n[1/5] Generating synthetic dataset ({n_samples:,} samples, 4 sub-types)…")
        X, y = generate_synthetic_dataset(n_samples)
    print(f"      Shape  : {X.shape}")
    print(f"      Legit  : {(y==0).sum():,}   Fake : {(y==1).sum():,}")

    # ── Step 2: train/test split BEFORE augmentation ─────────────────────────
    #   Critical: augmentation must NOT touch the test set (data leakage!)
    print("\n[2/5] Train/test split (80/20, stratified) — BEFORE augmentation…")
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.20, random_state=SEED, stratify=y
    )
    print(f"      Train base: {len(X_tr):,}   Test (clean, untouched): {len(X_te):,}")

    # ── Step 3: augmentation on TRAINING SET only ────────────────────────────
    print("\n[3/5] Data augmentation (training set only)…")

    if use_smote:
        print("  ▶ SMOTE oversampling:")
        X_tr, y_tr = apply_smote(X_tr, y_tr, seed=SEED)
    else:
        print("  ▶ SMOTE: skipped (--no-smote)")

    if use_noise:
        print("  ▶ Gaussian noise + bit-flips:")
        X_tr, y_tr = apply_noise_augmentation(
            X_tr, y_tr,
            augment_fraction = 0.30,
            gaussian_std     = 0.05,
            bit_flip_prob    = 0.02,
            seed             = SEED,
        )
    else:
        print("  ▶ Noise augmentation: skipped (--no-noise)")

    print(f"      Final training set: {len(X_tr):,} samples")
    print(f"      Legit: {(y_tr==0).sum():,}   Fake: {(y_tr==1).sum():,}")

    # ── Step 4: build + cross-validate + fit ─────────────────────────────────
    print("\n[4/5] Building and training model…")

    if use_grid_search:
        print("  Mode: GridSearchCV — tuned RandomForest")
        pipeline = build_rf_gridsearch(X_tr, y_tr)
    else:
        print("  Mode: Soft-Voting Ensemble  RF×500  GB×300  LR")
        pipeline = build_voting_ensemble()

        print("\n  ▶ 5-fold stratified cross-validation on augmented training set…")
        t0 = time.time()
        cv_scores = cross_val_score(
            pipeline, X_tr, y_tr,
            cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED),
            scoring="f1", n_jobs=-1,
        )
        print(f"    CV F1  : {cv_scores.round(4)}")
        print(f"    Mean   : {cv_scores.mean():.4f}  ±  {cv_scores.std():.4f}")
        print(f"    Time   : {time.time()-t0:.1f}s")

        print("\n  ▶ Final fit on full augmented training set…")
        t1 = time.time()
        pipeline.fit(X_tr, y_tr)
        print(f"    Fit time: {time.time()-t1:.1f}s")

    # ── Step 5: evaluate on CLEAN held-out test set ──────────────────────────
    print("\n[5/5] Evaluating on clean held-out test set…")
    y_pred  = pipeline.predict(X_te)
    y_proba = pipeline.predict_proba(X_te)[:, 1]

    acc  = accuracy_score (y_te, y_pred)
    prec = precision_score(y_te, y_pred, zero_division=0)
    rec  = recall_score   (y_te, y_pred, zero_division=0)
    f1   = f1_score       (y_te, y_pred, zero_division=0)
    auc  = roc_auc_score  (y_te, y_proba)

    print(f"\n  {'Metric':<18} {'Value':>8}")
    print(f"  {'─'*28}")
    for name, val in [("Accuracy",acc),("Precision",prec),("Recall",rec),
                       ("F1 Score",f1),("ROC-AUC",auc)]:
        bar = "█" * int(val * 20)
        print(f"  {name:<18} {val:>8.4f}  {bar}")

    print("\n  Classification Report:")
    print(classification_report(y_te, y_pred, target_names=["Legitimate","Fake"]))

    cm = confusion_matrix(y_te, y_pred)
    print("  Confusion Matrix:")
    print(f"    {'':>14}  Pred-Legit   Pred-Fake")
    print(f"    {'True-Legit':>14}    TN={cm[0,0]:>5}    FP={cm[0,1]:>5}")
    print(f"    {'True-Fake':>14}    FN={cm[1,0]:>5}    TP={cm[1,1]:>5}")

    # Feature importances (RF sub-estimator)
    try:
        clf = pipeline.named_steps["clf"]
        imps = (dict(clf.named_estimators_)["rf"].feature_importances_
                if isinstance(clf, VotingClassifier)
                else clf.feature_importances_)
        top = np.argsort(imps)[::-1][:15]
        print("\n  Top-15 Features (RandomForest component):")
        print(f"  {'Rank':>4}  {'Feature':<48}  Importance")
        print(f"  {'─'*72}")
        for r, i in enumerate(top, 1):
            nm  = FEATURE_NAMES[i] if i < len(FEATURE_NAMES) else f"feature_{i}"
            bar = "█" * int(imps[i] * 300)
            print(f"  {r:>4}. {nm:<48}  {imps[i]:.4f}  {bar}")
    except Exception:
        pass

    # ── Save ─────────────────────────────────────────────────────────────────
    joblib.dump(pipeline, MODEL_PATH, compress=3)
    size_kb = os.path.getsize(MODEL_PATH) / 1024
    print(f"\n  ✅  Model saved  →  {MODEL_PATH}  ({size_kb:.0f} KB)")
    print("═" * 66 + "\n")
    return pipeline


# ══════════════════════════════════════════════════════════════════════════════
# 7. CLI
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="APK Guardian — Train ML Model")
    ap.add_argument("--legit",       type=str,  default=None)
    ap.add_argument("--fake",        type=str,  default=None)
    ap.add_argument("--samples",     type=int,  default=N_SAMPLES)
    ap.add_argument("--no-smote",    action="store_true", default=False)
    ap.add_argument("--no-noise",    action="store_true", default=False)
    ap.add_argument("--grid-search", action="store_true", default=False)
    args = ap.parse_args()

    train(
        legit_folder    = args.legit,
        fake_folder     = args.fake,
        use_smote       = not args.no_smote,
        use_noise       = not args.no_noise,
        use_grid_search = args.grid_search,
        n_samples       = args.samples,
    )
