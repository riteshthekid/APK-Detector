import React from 'react';

/* ── SVG Semicircle Gauge ──────────────────────────────────── */
function RiskGauge({ score, verdict }) {
    // Semicircle: from LEFT (180°) clockwise to RIGHT (0°) via TOP (270°)
    // In SVG Y-axis-down coords, clockwise = sweep-flag 1
    const R = 65;
    const CX = 80;
    const CY = 82;   // centre placed low so text fits underneath

    const toRad = (deg) => (deg * Math.PI) / 180;

    /**
     * Arc path starting from angle START_DEG going clockwise by SWEEP_DEG.
     * sweep-flag=1 → clockwise in SVG (Y-down) = goes via screen-top ✓
     */
    function arcPath(sweepDeg) {
        if (sweepDeg <= 0) return '';
        const startRad = toRad(180);
        const endRad = toRad(180 + sweepDeg);          // +sweep = clockwise
        const x1 = CX + R * Math.cos(startRad);          // left endpoint
        const y1 = CY + R * Math.sin(startRad);
        const x2 = CX + R * Math.cos(endRad);
        const y2 = CY + R * Math.sin(endRad);
        const largeArc = sweepDeg >= 180 ? 1 : 0;
        return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`;
    }

    const fillSweep = (score / 100) * 180;   // 0 → 0° … 100 → 180°

    const vColors = {
        FAKE: { fill: '#dc2626', bg: '#fef2f2', border: '#fecaca', text: '#dc2626', label: '🚫 FAKE' },
        SUSPICIOUS: { fill: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#b45309', label: '⚠️ SUSPICIOUS' },
        LEGITIMATE: { fill: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', label: '✅ LEGITIMATE' },
    };
    const vc = vColors[verdict] || vColors.SUSPICIOUS;

    // Risk level text
    const riskLabel = score >= 70 ? 'HIGH RISK' : score >= 40 ? 'MEDIUM RISK' : 'LOW RISK';

    return (
        <div style={{
            background: vc.bg,
            border: `1.5px solid ${vc.border}`,
            borderRadius: 16,
            padding: '1.25rem 1.25rem 1rem',
            textAlign: 'center',
            minWidth: 200,
            boxShadow: `0 4px 20px ${vc.fill}18`,
        }}>
            {/* Gauge SVG — ViewBox fits arc only; arc goes from (15,82) up to (80,17) down to (145,82) */}
            <svg
                width="160" height="100"
                viewBox="0 0 160 100"
                style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
            >
                {/* Track */}
                <path
                    d={arcPath(180)}
                    fill="none"
                    stroke="rgba(0,0,0,0.08)"
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                {/* Coloured fill */}
                {fillSweep > 0 && (
                    <path
                        d={arcPath(fillSweep)}
                        fill="none"
                        stroke={vc.fill}
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                )}
                {/* Min / Max endpoint dots */}
                <circle cx={CX - R} cy={CY} r="5" fill={vc.fill} opacity="0.3" />
                <circle cx={CX + R} cy={CY} r="5" fill={vc.fill} opacity="0.3" />
                {/* 0 / 100 labels */}
                <text x={CX - R - 2} y={CY + 18} textAnchor="middle" fill="#94a3b8" fontFamily="Inter,sans-serif" fontSize="10">0</text>
                <text x={CX + R + 2} y={CY + 18} textAnchor="middle" fill="#94a3b8" fontFamily="Inter,sans-serif" fontSize="10">100</text>
            </svg>

            {/* Score number — below the SVG, inside card */}
            <div style={{
                fontSize: '2.8rem', fontWeight: 900, lineHeight: 1,
                color: vc.text, letterSpacing: '-0.04em',
                marginTop: '-8px', marginBottom: '4px',
            }}>
                {Math.round(score)}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                Risk Score · {riskLabel}
            </div>

            {/* Verdict badge */}
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 18px', borderRadius: 999,
                background: `${vc.fill}12`, border: `1.5px solid ${vc.fill}40`,
                color: vc.text, fontWeight: 800, fontSize: '0.82rem',
            }}>
                {vc.label}
            </div>
        </div>
    );
}

export default function ResultsDashboard({ result }) {
    if (!result) return null;

    const {
        verdict, risk_score, confidence, metadata,
        dangerous_permissions = [], suspicious_apis = [], suspicious_urls = [],
        permissions = [],
    } = result;

    const totalPerms = permissions.length;
    const dangerousCount = dangerous_permissions.length;
    const safeCount = totalPerms - dangerousCount;

    const statCards = [
        { label: 'Confidence', value: `${confidence?.toFixed(0) ?? 0}%`, color: 'var(--accent-blue)', icon: '🎯' },
        { label: 'Permissions', value: totalPerms, color: 'var(--text-primary)', icon: '🔑' },
        { label: 'Dangerous Perms', value: dangerousCount, color: 'var(--accent-red)', icon: '⚠️' },
        { label: 'Suspicious APIs', value: suspicious_apis.length, color: 'var(--accent-amber)', icon: '🔍' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ── Top row: gauge + stats ───────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'start' }}>
                <RiskGauge score={risk_score} verdict={verdict} />

                {/* Stat cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    {statCards.map((s) => (
                        <div key={s.label} className="glass" style={{ padding: '16px 18px' }}>
                            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{s.icon}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── App Metadata ──────────────────────────────────────── */}
            <div className="glass" style={{ padding: '1.25rem 1.5rem' }}>
                <p className="section-title">📱 App Metadata</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    {[
                        { k: 'Package Name', v: metadata?.package_name },
                        { k: 'App Name', v: metadata?.app_name },
                        { k: 'Version', v: `${metadata?.version_name} (${metadata?.version_code})` },
                        { k: 'Min / Target SDK', v: `${metadata?.min_sdk} / ${metadata?.target_sdk}` },
                        { k: 'File Size', v: `${(metadata?.file_size_kb / 1024)?.toFixed(2)} MB` },
                        { k: 'SHA-256', v: metadata?.sha256?.slice(0, 20) + '…' },
                    ].map(({ k, v }) => (
                        <div key={k} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{k}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{v ?? '—'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Permission summary ────────────────────────────────── */}
            <div className="glass" style={{ padding: '1.25rem 1.5rem' }}>
                <p className="section-title">🔐 Permission Summary</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                        { label: 'Total Permissions', value: totalPerms, color: 'var(--accent-blue)', bg: 'rgba(37,99,235,0.06)' },
                        { label: 'Dangerous', value: dangerousCount, color: 'var(--accent-red)', bg: 'rgba(220,38,38,0.06)' },
                        { label: 'Safe', value: safeCount, color: 'var(--accent-green)', bg: 'rgba(22,163,74,0.06)' },
                    ].map((c) => (
                        <div key={c.label} style={{ textAlign: 'center', padding: '14px 10px', borderRadius: 10, background: c.bg, border: `1px solid ${c.color}25` }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{c.label}</div>
                        </div>
                    ))}
                </div>

                {/* Simple bar */}
                {totalPerms > 0 && (
                    <div style={{ height: 10, borderRadius: 5, background: 'rgba(22,163,74,0.15)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', width: `${(dangerousCount / totalPerms) * 100}%`,
                            background: 'linear-gradient(90deg, var(--accent-red), #f87171)',
                            borderRadius: 5, transition: 'width 1s ease',
                        }} />
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    <span>⬛ {dangerousCount} dangerous ({totalPerms > 0 ? ((dangerousCount / totalPerms) * 100).toFixed(0) : 0}%)</span>
                    <span>🟩 {safeCount} safe</span>
                </div>
            </div>

            {/* ── Suspicious APIs ───────────────────────────────────── */}
            {suspicious_apis.length > 0 && (
                <div className="glass" style={{ padding: '1.25rem 1.5rem' }}>
                    <p className="section-title">🚨 Suspicious API Calls ({suspicious_apis.length})</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {suspicious_apis.map((api, i) => (
                            <code key={i} style={{
                                fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                                padding: '4px 10px', borderRadius: 6,
                                background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)',
                                color: 'var(--accent-red)', wordBreak: 'break-all',
                            }}>
                                {api}
                            </code>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Suspicious URLs ───────────────────────────────────── */}
            {suspicious_urls.length > 0 && (
                <div className="glass" style={{ padding: '1.25rem 1.5rem' }}>
                    <p className="section-title">🌐 Suspicious Network Endpoints ({suspicious_urls.length})</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {suspicious_urls.map((url, i) => (
                            <div key={i} style={{
                                fontSize: '0.78rem', fontFamily: 'var(--font-mono)',
                                padding: '8px 12px', borderRadius: 8,
                                background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)',
                                color: 'var(--accent-amber)', wordBreak: 'break-all',
                            }}>
                                🔗 {url}
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
