import React from 'react';

// These must match STEP_MESSAGES keys in backend/routers/analyze.py
const STEPS = [
    { step: 0, icon: '📤', label: 'File Received', desc: 'Preparing analysis pipeline…' },
    { step: 1, icon: '🔍', label: 'Parsing APK', desc: 'Androguard is reading the APK structure…' },
    { step: 2, icon: '📋', label: 'Extracting Features', desc: 'Collecting permissions, APIs, and strings…' },
    { step: 3, icon: '🤖', label: 'ML Classification', desc: 'Running Random Forest classifier…' },
    { step: 4, icon: '⚖️', label: 'Policy Compliance', desc: 'Checking RBI / PCI-DSS / OWASP rules…' },
    { step: 5, icon: '📄', label: 'Assembling Report', desc: 'Compiling results and generating report…' },
    { step: 6, icon: '✅', label: 'Analysis Complete', desc: 'Your security report is ready!' },
];

const TOTAL_STEPS = STEPS.length - 1; // steps 0-5 are "progress", 6 is "done"

export default function ScanProgress({ currentStep = 0, statusMessage = '', uploadProgress = 0 }) {
    const isComplete = currentStep >= 6;
    const progressPct = Math.round((Math.min(currentStep, TOTAL_STEPS) / TOTAL_STEPS) * 100);

    return (
        <div className="glass" style={{ padding: '2.5rem', maxWidth: 560, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>
                    {isComplete
                        ? '✅'
                        : <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3, display: 'inline-block' }} />}
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 6 }}>
                    {isComplete ? 'Analysis Complete!' : 'Scanning APK…'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', minHeight: 20 }}>
                    {statusMessage || (isComplete ? 'Your security report is ready.' : 'Please wait…')}
                </p>
            </div>

            {/* Overall progress bar */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>
                        {currentStep === 0
                            ? `Uploading… ${uploadProgress}%`
                            : `Step ${Math.min(currentStep, TOTAL_STEPS)} of ${TOTAL_STEPS}`}
                    </span>
                    <span style={{ color: isComplete ? 'var(--accent-green)' : 'var(--accent-blue)', fontWeight: 700 }}>
                        {isComplete ? '100%' : `${progressPct}%`}
                    </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(59,130,246,0.15)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: currentStep === 0 ? `${uploadProgress}%` : `${progressPct}%`,
                        background: isComplete
                            ? 'linear-gradient(90deg, var(--accent-green), #4ade80)'
                            : 'linear-gradient(90deg, var(--accent-blue), #60a5fa)',
                        borderRadius: 4,
                        transition: 'width 0.6s ease, background 0.4s ease',
                        boxShadow: isComplete
                            ? '0 0 12px rgba(34,197,94,0.5)'
                            : '0 0 12px rgba(59,130,246,0.4)',
                    }} />
                </div>
            </div>

            {/* Step list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {STEPS.slice(0, -1).map(({ step, icon, label, desc }) => {
                    const done = currentStep > step;
                    const active = currentStep === step;
                    const pending = currentStep < step;

                    return (
                        <div
                            key={step}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '11px 16px',
                                borderRadius: 'var(--radius)',
                                border: `1px solid ${active ? 'rgba(59,130,246,0.45)' : done ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                                background: active
                                    ? 'rgba(59,130,246,0.07)'
                                    : done
                                        ? 'rgba(34,197,94,0.06)'
                                        : 'transparent',
                                opacity: pending ? 0.35 : 1,
                                transition: 'all 0.4s ease',
                            }}
                        >
                            {/* Step indicator */}
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: done ? 16 : 18,
                                background: done
                                    ? 'rgba(34,197,94,0.15)'
                                    : active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${done ? 'rgba(34,197,94,0.4)' : active ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                                color: done ? 'var(--accent-green)' : 'inherit',
                                fontWeight: done ? 800 : 400,
                            }}>
                                {done
                                    ? '✓'
                                    : active
                                        ? <div className="spinner" style={{ width: 18, height: 18 }} />
                                        : icon}
                            </div>

                            {/* Labels */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontWeight: 700, fontSize: '0.88rem',
                                    color: done ? 'var(--accent-green)' : active ? 'var(--text-primary)' : 'var(--text-muted)',
                                }}>
                                    {label}
                                </div>
                                {active && (
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>{desc}</div>
                                )}
                                {done && (
                                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-green)', marginTop: 2 }}>Completed</div>
                                )}
                            </div>

                            {done && <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>✓</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
