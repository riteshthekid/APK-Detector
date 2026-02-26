import React, { useState } from 'react';

const TROJANS = [
    {
        name: 'SharkBot',
        family: 'Banking Trojan',
        year: '2021–Present',
        icon: '🦈',
        severity: 'critical',
        color: '#dc2626',
        victims: '60+ Banks',
        method: 'Accessibility Service Abuse',
        description:
            'Poses as legitimate utilities or antivirus apps. Abuses Android Accessibility Services to perform automatic money transfers without user interaction. Uses overlay attacks to harvest credentials.',
        indicators: ['BIND_ACCESSIBILITY_SERVICE', 'SYSTEM_ALERT_WINDOW', 'Auto-transfer via accessibility'],
    },
    {
        name: 'Cerberus / Alien',
        family: 'RAT + Banking Trojan',
        year: '2019–Present',
        icon: '👾',
        severity: 'critical',
        color: '#7c3aed',
        victims: '30+ Banking Apps',
        method: 'Keylogging + SMS Interception',
        description:
            'Advanced Remote Access Trojan with overlay attack capabilities. Steals 2FA codes via SMS interception and Google Authenticator access. Alien variant adds remote desktop control.',
        indicators: ['READ_SMS', 'RECEIVE_SMS', 'BIND_ACCESSIBILITY_SERVICE', 'Screen overlay'],
    },
    {
        name: 'BankBot',
        family: 'Banking Trojan',
        year: '2017–Present',
        icon: '🤖',
        severity: 'high',
        color: '#d97706',
        victims: '160+ Banks Worldwide',
        method: 'Overlay Phishing',
        description:
            'One of the oldest and most widespread banking trojans. Displays fake login screens (overlays) on top of legitimate banking apps to harvest credentials. Primarily spreads via fake utility apps on Play Store.',
        indicators: ['SYSTEM_ALERT_WINDOW', 'PhishingOverlay', 'DEVICE_ADMIN'],
    },
    {
        name: 'TeaBot / Anatsa',
        family: 'Banking Trojan',
        year: '2021–Present',
        icon: '🍵',
        severity: 'critical',
        color: '#0891b2',
        victims: '400+ Banks',
        method: 'Overlay + VNC Remote Access',
        description:
            'Extremely advanced trojan targeting over 400 banking apps. Supports live screen streaming (VNC), keylogging, SMS/2FA theft, and clipboard hijacking for crypto. Downloaded 30,000+ times before removal.',
        indicators: ['VNC stream', 'keylogging', 'READ_SMS', 'RECORD_AUDIO'],
    },
    {
        name: 'Hook',
        family: 'BNPL / Banking RAT',
        year: '2023–Present',
        icon: '🪝',
        severity: 'critical',
        color: '#059669',
        victims: '700+ Finance Apps',
        method: 'Real-time Overlay + File Access',
        description:
            'Next-gen banking malware capable of real-time ATS (Automatic Transaction System), screen control, full file system access, and real-time keylogging. Targets BNPL, crypto, and banking apps simultaneously.',
        indicators: ['requestFileAccess', 'DexClassLoader', 'VNC', 'ATS engine'],
    },
    {
        name: 'SpyNote / CypherRAT',
        family: 'Spyware + RAT',
        year: '2022–Present',
        icon: '🕵️',
        severity: 'high',
        color: '#be185d',
        victims: 'Banking + Government Apps',
        method: 'Fake App Distribution',
        description:
            'Distributed via fake phishing SMS campaigns (smishing) posing as income tax refunds or bank alerts. Records calls, captures screenshots, reads contacts, and exfiltrates documents. Actively targets Indian users.',
        indicators: ['RECORD_AUDIO', 'READ_CALL_LOG', 'READ_CONTACTS', 'READ_SMS'],
    },
];

const SEV_STYLE = {
    critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', label: '🔴 CRITICAL' },
    high: { color: '#d97706', bg: 'rgba(217,119,6,0.08)', label: '🟠 HIGH' },
    medium: { color: '#2563eb', bg: 'rgba(37,99,235,0.08)', label: '🔵 MEDIUM' },
};

export default function ThreatCards() {
    const [expanded, setExpanded] = useState(null);

    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    display: 'inline-block', padding: '4px 14px', borderRadius: 999,
                    background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-red)',
                    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
                }}>Threat Intelligence</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                    Active Banking Malware Families
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>
                    Real-world threats this tool is designed to detect. Click any card to learn more.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {TROJANS.map((t) => {
                    const sev = SEV_STYLE[t.severity];
                    const isOpen = expanded === t.name;
                    return (
                        <div
                            key={t.name}
                            onClick={() => setExpanded(isOpen ? null : t.name)}
                            style={{
                                background: 'var(--bg-card)',
                                border: `1px solid ${isOpen ? t.color + '50' : 'var(--border)'}`,
                                borderLeft: `4px solid ${t.color}`,
                                borderRadius: 14,
                                padding: '1.2rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: isOpen ? `0 6px 24px ${t.color}20` : '0 2px 8px rgba(0,0,0,0.05)',
                                transform: isOpen ? 'translateY(-2px)' : undefined,
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                        background: `${t.color}12`, border: `1px solid ${t.color}25`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.4rem',
                                    }}>
                                        {t.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{t.name}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.family} · {t.year}</div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: sev.color, background: sev.bg, padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                                        {sev.label}
                                    </div>
                                </div>
                            </div>

                            {/* Quick stats */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                <div style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: 'var(--bg-section)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Victims</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{t.victims}</div>
                                </div>
                                <div style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: 'var(--bg-section)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Method</div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: t.color, marginTop: 2 }}>{t.method}</div>
                                </div>
                            </div>

                            {/* Expandable detail */}
                            {isOpen && (
                                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.color}20` }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                                        {t.description}
                                    </p>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Key Indicators
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {t.indicators.map((ind) => (
                                            <code key={ind} style={{
                                                fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                                                padding: '3px 8px', borderRadius: 6,
                                                background: `${t.color}10`, border: `1px solid ${t.color}30`,
                                                color: t.color,
                                            }}>
                                                {ind}
                                            </code>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: 10, fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                {isOpen ? '▲ Show less' : '▼ Learn more'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
