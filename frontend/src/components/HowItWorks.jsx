import React from 'react';

const STEPS = [
    {
        step: '01',
        icon: '📤',
        title: 'Upload APK',
        desc: 'Drag & drop or select any Android APK file. We accept files up to 500 MB and never store your uploads permanently.',
        color: 'var(--accent-blue)',
        bg: 'rgba(37,99,235,0.06)',
        border: 'rgba(37,99,235,0.2)',
    },
    {
        step: '02',
        icon: '🔬',
        title: 'Deep Static Analysis',
        desc: 'Androguard parses the APK to extract 59 features — permissions, API calls, SDK levels, URLs, and native libraries. No app execution needed.',
        color: '#7c3aed',
        bg: 'rgba(124,58,237,0.06)',
        border: 'rgba(124,58,237,0.2)',
    },
    {
        step: '03',
        icon: '🤖',
        title: 'ML Classification',
        desc: 'A Random Forest model (200 estimators) classifies the APK as FAKE, SUSPICIOUS, or LEGITIMATE with a confidence score and 0–100 risk rating.',
        color: '#0891b2',
        bg: 'rgba(8,145,178,0.06)',
        border: 'rgba(8,145,178,0.2)',
    },
    {
        step: '04',
        icon: '⚖️',
        title: 'Policy Compliance',
        desc: '16 banking compliance rules are checked against RBI, PCI-DSS v4.0, OWASP MASVS, and CERT-In guidelines, with a compliance score and violation detail.',
        color: '#d97706',
        bg: 'rgba(217,119,6,0.06)',
        border: 'rgba(217,119,6,0.2)',
    },
    {
        step: '05',
        icon: '📄',
        title: 'Download Report',
        desc: 'Download a professional PDF report (styled tables, compliance scorecard, risk gauge) or structured JSON for integration into your security pipeline.',
        color: 'var(--accent-green)',
        bg: 'rgba(22,163,74,0.06)',
        border: 'rgba(22,163,74,0.2)',
    },
];

export default function HowItWorks() {
    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    display: 'inline-block', padding: '4px 14px', borderRadius: 999,
                    background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-blue)',
                    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
                }}>How It Works</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                    5-Step Security Analysis Pipeline
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8, maxWidth: 500, margin: '10px auto 0' }}>
                    From upload to report — everything runs server-side in seconds. No account needed.
                </p>
            </div>

            {/* Steps — horizontal on desktop, vertical on mobile */}
            <div style={{ position: 'relative' }}>
                {/* Connector line */}
                <div style={{
                    position: 'absolute', top: '2.6rem', left: '6%', right: '6%', height: 2,
                    background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
                    display: window.innerWidth < 768 ? 'none' : 'block',
                }} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
                    {STEPS.map((s) => (
                        <div key={s.step} style={{
                            background: 'var(--bg-card)',
                            border: `1px solid ${s.border}`,
                            borderRadius: 14,
                            padding: '1.4rem 1.2rem',
                            textAlign: 'center',
                            position: 'relative',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; }}
                        >
                            {/* Step number */}
                            <div style={{
                                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                                width: 28, height: 28, borderRadius: '50%',
                                background: s.color, color: 'white',
                                fontSize: '0.65rem', fontWeight: 900,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 2px 8px ${s.color}50`,
                            }}>
                                {s.step}
                            </div>

                            <div style={{ fontSize: '2rem', margin: '12px 0 10px' }}>{s.icon}</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                                {s.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                                {s.desc}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
