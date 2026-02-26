import React, { useState } from 'react';

const SEV_CONFIG = {
    high: { color: 'var(--accent-red)', icon: '🔴', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
    medium: { color: 'var(--accent-amber)', icon: '🟡', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
    low: { color: 'var(--accent-blue)', icon: '🔵', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
};

export default function PermissionsList({ permissions = [], riskFactors = [] }) {
    const [filter, setFilter] = useState('all'); // 'all' | 'dangerous' | 'normal'
    const [showFactors, setShowFactors] = useState(true);

    const filtered = permissions.filter((p) => {
        if (filter === 'dangerous') return p.is_dangerous;
        if (filter === 'normal') return !p.is_dangerous;
        return true;
    });

    const dangerCount = permissions.filter((p) => p.is_dangerous).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ── Risk Factors ─────────────────────────────────── */}
            {riskFactors.length > 0 && (
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <p className="section-title" style={{ marginBottom: 0 }}>⚠️ Risk Factors</p>
                        <button
                            className="btn btn-ghost"
                            style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                            onClick={() => setShowFactors((v) => !v)}
                        >
                            {showFactors ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    {showFactors && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {riskFactors.map((rf, i) => {
                                const cfg = SEV_CONFIG[rf.severity] || SEV_CONFIG.low;
                                return (
                                    <div key={i} style={{
                                        padding: '14px 18px',
                                        borderRadius: 'var(--radius)',
                                        background: cfg.bg,
                                        border: `1px solid ${cfg.border}`,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                            <span>{cfg.icon}</span>
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: cfg.color }}>{rf.factor}</span>
                                            <span className={`badge badge-${rf.severity === 'high' ? 'red' : rf.severity === 'medium' ? 'amber' : 'blue'}`}
                                                style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                                                {rf.severity.toUpperCase()}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                            {rf.details}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Permissions List ─────────────────────────────── */}
            <div className="glass" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                    <p className="section-title" style={{ marginBottom: 0 }}>🔐 Permissions ({permissions.length})</p>
                    {/* Filter buttons */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[
                            { id: 'all', label: `All (${permissions.length})` },
                            { id: 'dangerous', label: `⚠️ Dangerous (${dangerCount})` },
                            { id: 'normal', label: `Normal (${permissions.length - dangerCount})` },
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                className={`btn ${filter === btn.id ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ fontSize: '0.72rem', padding: '5px 12px' }}
                                onClick={() => setFilter(btn.id)}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
                        No permissions in this category.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
                        {filtered.map((perm, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12,
                                padding: '10px 14px',
                                borderRadius: 8,
                                background: perm.is_dangerous ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${perm.is_dangerous ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                            }}>
                                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                                    {perm.is_dangerous ? '🚨' : '🔒'}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.75rem',
                                        color: perm.is_dangerous ? 'var(--accent-red)' : 'var(--text-primary)',
                                        fontWeight: 600,
                                        wordBreak: 'break-all',
                                        marginBottom: perm.description ? 3 : 0,
                                    }}>
                                        {perm.name}
                                    </div>
                                    {perm.description && (
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                            {perm.description}
                                        </div>
                                    )}
                                </div>
                                {perm.is_dangerous && (
                                    <span className="badge badge-red" style={{ fontSize: '0.6rem', flexShrink: 0 }}>DANGEROUS</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
