import React, { useState } from 'react';

const SEV_CONFIG = {
    critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', icon: '🔴', badge: 'badge-red' },
    high: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: '🟠', badge: 'badge-amber' },
    medium: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', icon: '🔵', badge: 'badge-blue' },
    low: { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', icon: '⚪', badge: 'badge-blue' },
};

const AUTHORITY_ICONS = {
    'RBI': '🏦',
    'PCI': '💳',
    'OWASP': '🛡️',
    'MASVS': '🛡️',
    'Google': '🔍',
    'CERT': '🚨',
    'IMPERSONATE': '🎭',
};

function getAuthorityIcon(authority = '') {
    const upper = authority.toUpperCase();
    for (const [key, icon] of Object.entries(AUTHORITY_ICONS)) {
        if (upper.includes(key)) return icon;
    }
    return '📋';
}

function ScoreMeter({ score }) {
    const color = score >= 75 ? 'var(--accent-green)' : score >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';
    const label = score >= 75 ? 'COMPLIANT' : score >= 50 ? 'PARTIAL' : 'NON-COMPLIANT';
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 12px' }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                    <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={color}
                        strokeWidth="10"
                        strokeDasharray={`${(score / 100) * 314.16} 314.16`}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>{score.toFixed(0)}%</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Score</div>
                </div>
            </div>
            <span className={`badge ${score >= 75 ? 'badge-green' : score >= 50 ? 'badge-amber' : 'badge-red'}`}>
                {label}
            </span>
        </div>
    );
}

export default function PolicyCompliance({ policyViolations = [], complianceSummary = null, isKnownApp = false, knownAppName = null }) {
    const [expandedId, setExpandedId] = useState(null);
    const [filter, setFilter] = useState('all');

    const severities = ['critical', 'high', 'medium', 'low'];
    const filteredViolations = filter === 'all'
        ? policyViolations
        : policyViolations.filter((v) => v.severity === filter);

    const totalPolicies = complianceSummary?.total_policies_checked ?? 0;
    const passed = complianceSummary?.passed ?? 0;
    const score = complianceSummary?.compliance_score ?? 100;
    const sevCounts = complianceSummary?.severity_counts ?? {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ── Known app whitelist banner ─────────────────── */}
            <div style={{
                padding: '14px 20px',
                borderRadius: 'var(--radius)',
                background: isKnownApp ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${isKnownApp ? 'rgba(34,197,94,0.35)' : 'rgba(245,158,11,0.35)'}`,
                display: 'flex', alignItems: 'center', gap: 14,
            }}>
                <span style={{ fontSize: 28 }}>{isKnownApp ? '🏦' : '⚠️'}</span>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isKnownApp ? 'var(--accent-green)' : 'var(--accent-amber)', marginBottom: 3 }}>
                        {isKnownApp ? `✅ Verified Official Banking App` : '⚠️ Not in Official Banking App Whitelist'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {isKnownApp
                            ? `Officially recognised as: ${knownAppName}`
                            : 'Package name does not match any known banking app. This may be a fake or untested app.'}
                    </div>
                </div>
            </div>

            {/* ── Compliance Scorecard ───────────────────────── */}
            {complianceSummary && (
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <p className="section-title">📊 Compliance Scorecard</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'center' }}>
                        <ScoreMeter score={score} />

                        <div>
                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                                {[
                                    { label: 'Total Policies', value: totalPolicies, color: 'var(--accent-blue)' },
                                    { label: 'Passed', value: passed, color: 'var(--accent-green)' },
                                    { label: 'Violations', value: policyViolations.length, color: policyViolations.length > 0 ? 'var(--accent-red)' : 'var(--accent-green)' },
                                ].map((s) => (
                                    <div key={s.label} style={{
                                        padding: '10px 14px', borderRadius: 8,
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Severity breakdown */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                                {severities.map((sev) => {
                                    const cfg = SEV_CONFIG[sev];
                                    const cnt = sevCounts[sev] ?? 0;
                                    return (
                                        <div key={sev} style={{
                                            textAlign: 'center', padding: '6px 4px',
                                            borderRadius: 8, border: `1px solid ${cfg.border}`,
                                            background: cnt > 0 ? cfg.bg : 'transparent',
                                        }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: cfg.color }}>{cnt}</div>
                                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sev}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Policy violations list ─────────────────────── */}
            <div className="glass" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <p className="section-title" style={{ marginBottom: 0 }}>
                        ⚖️ Policy Violations ({policyViolations.length})
                    </p>
                    {/* Filter */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['all', ...severities].map((f) => (
                            <button
                                key={f}
                                className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                                onClick={() => setFilter(f)}
                            >
                                {f === 'all' ? `All (${policyViolations.length})` : `${f} (${sevCounts[f] ?? 0})`}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredViolations.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '2rem',
                        color: policyViolations.length === 0 ? 'var(--accent-green)' : 'var(--text-muted)',
                        fontSize: '0.9rem',
                    }}>
                        {policyViolations.length === 0
                            ? '✅ No policy violations detected! App meets all banking compliance requirements.'
                            : 'No violations in this severity category.'}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filteredViolations.map((v) => {
                            const cfg = SEV_CONFIG[v.severity] || SEV_CONFIG.low;
                            const isOpen = expandedId === v.policy_id;
                            return (
                                <div key={v.policy_id} style={{
                                    borderRadius: 'var(--radius)',
                                    border: `1px solid ${cfg.border}`,
                                    background: cfg.bg,
                                    overflow: 'hidden',
                                }}>
                                    {/* Header row */}
                                    <div
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => setExpandedId(isOpen ? null : v.policy_id)}
                                    >
                                        <span style={{ fontSize: 18 }}>{cfg.icon}</span>

                                        {/* Policy ID badge */}
                                        <code style={{
                                            fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                                            padding: '2px 8px', borderRadius: 6,
                                            background: 'rgba(0,0,0,0.25)', color: cfg.color,
                                            fontWeight: 700, flexShrink: 0,
                                        }}>
                                            {v.policy_id}
                                        </code>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 2 }}>{v.name}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {getAuthorityIcon(v.authority)} {v.authority}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                            <span className={`badge ${cfg.badge}`} style={{ fontSize: '0.62rem' }}>
                                                {v.severity.toUpperCase()}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{isOpen ? '▲' : '▼'}</span>
                                        </div>
                                    </div>

                                    {/* Expandable rule detail */}
                                    {isOpen && (
                                        <div style={{
                                            padding: '0 16px 14px 16px',
                                            borderTop: `1px solid ${cfg.border}`,
                                            paddingTop: 12,
                                        }}>
                                            <div style={{
                                                fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7,
                                                background: 'rgba(0,0,0,0.2)', padding: '10px 14px',
                                                borderRadius: 8, borderLeft: `3px solid ${cfg.color}`,
                                            }}>
                                                {v.rule}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Policy reference ─────────────────────────────── */}
            <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6,
            }}>
                📚 <strong>Policy Framework:</strong> RBI Master Direction on IT Framework (2021) · RBI Cyber Security Framework (2016/2021) ·
                RBI Digital Payment Security Controls (2021) · PCI-DSS v4.0 · OWASP MASVS (Mobile Application Security Verification Standard) ·
                CERT-In Advisories · Google Play Banking App Policy
            </div>
        </div>
    );
}
