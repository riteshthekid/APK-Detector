import React, { useState } from 'react';

const TIPS = [
    {
        category: 'Before Installing',
        icon: '🏪',
        color: '#2563eb',
        items: [
            { title: 'Only install from official stores', detail: 'Download banking apps exclusively from Google Play Store or Apple App Store. Verify the developer name exactly matches the bank (e.g., "State Bank of India" not "SBI Group Ltd").' },
            { title: 'Verify the download count', detail: 'Legitimate banking apps from major banks have 1M+ downloads. A banking app with fewer than 10,000 downloads is suspicious. Also check the rating and reviews — fake apps often have inflated 5-star reviews with no text.' },
            { title: 'Check the certificate in the APK', detail: 'Before sideloading any APK, verify its SHA-256 certificate fingerprint against the officially published fingerprint on the bank\'s website. APK Guardian does this automatically.' },
        ],
    },
    {
        category: 'Runtime Permissions',
        icon: '🔐',
        color: '#7c3aed',
        items: [
            { title: 'Deny SMS permissions for banking apps', detail: 'Legitimate banking apps should use the Android SMS Retriever API for OTP — they do not need READ_SMS or RECEIVE_SMS. If a banking app asks for these, do not grant them and report the app.' },
            { title: 'Never grant Accessibility Service to unknown apps', detail: 'This is the #1 most abused permission by banking trojans (SharkBot, Cerberus, Hook). Only grant this to screen readers or known accessibility tools, never to banking or utility apps.' },
            { title: 'Deny overlay (draw over other apps) permission', detail: 'SYSTEM_ALERT_WINDOW lets apps draw fake login screens on top of real apps. No legitimate banking app needs this. Always deny it.' },
        ],
    },
    {
        category: 'Account Safety',
        icon: '🛡️',
        color: '#16a34a',
        items: [
            { title: 'Enable hardware-based 2FA where possible', detail: 'Use a hardware security key or an authenticator app (Google Authenticator, Authy) instead of SMS-based OTP, which is vulnerable to SIM-swap attacks and SS7 exploits.' },
            { title: 'Set a transaction PIN separate from your device PIN', detail: 'Never use the same PIN for your device lock and banking transactions. Enable transaction limits and instant SMS/email alerts for every transaction.' },
            { title: 'Regularly review app permissions', detail: 'Go to Settings → Apps → [Banking App] → Permissions and revoke any permissions that look excessive. On Android 12+, use the Privacy Dashboard to see which apps accessed sensitive data.' },
        ],
    },
    {
        category: 'If You Suspect Fraud',
        icon: '🚨',
        color: '#dc2626',
        items: [
            { title: 'Immediately freeze your account', detail: 'Call your bank\'s 24/7 fraud hotline or use the official app\'s emergency freeze feature. Most Indian banks: SBI — 1800-11-2211, HDFC — 1800-120-1243, ICICI — 1800-1080.' },
            { title: 'Report to CERT-In and cybercrime portal', detail: 'File a complaint at cybercrime.gov.in or call 1930 (India Cyber Crime Helpline). Report the malicious APK to CERT-In at incident@cert-in.org.in and to Google at play.google.com/about/complaint.' },
            { title: 'Factory reset your device if compromised', detail: 'A sophisticated banking trojan may survive app uninstallation. If you suspect deep compromise, back up only essential data and perform a full factory reset, then reinstall apps only from official sources.' },
        ],
    },
];

export default function SecurityTips() {
    const [openCategory, setOpenCategory] = useState(0);
    const [openItem, setOpenItem] = useState(null);

    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    display: 'inline-block', padding: '4px 14px', borderRadius: 999,
                    background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-green)',
                    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
                }}>Security Guide</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                    Mobile Banking Security Best Practices
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>
                    Expert guidance to keep your banking accounts safe from mobile malware.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {TIPS.map((cat, ci) => (
                    <div key={cat.category} style={{
                        background: 'var(--bg-card)',
                        border: `1px solid ${openCategory === ci ? cat.color + '40' : 'var(--border)'}`,
                        borderTop: `3px solid ${cat.color}`,
                        borderRadius: 14,
                        overflow: 'hidden',
                        boxShadow: openCategory === ci ? `0 6px 24px ${cat.color}18` : '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s ease',
                    }}>
                        {/* Category header */}
                        <div
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '1rem 1.2rem', cursor: 'pointer',
                                borderBottom: `1px solid ${openCategory === ci ? cat.color + '20' : 'transparent'}`,
                            }}
                            onClick={() => setOpenCategory(openCategory === ci ? null : ci)}
                        >
                            <div style={{
                                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                background: `${cat.color}12`, border: `1px solid ${cat.color}25`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.1rem',
                            }}>
                                {cat.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{cat.category}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cat.items.length} tips</div>
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{openCategory === ci ? '▲' : '▼'}</span>
                        </div>

                        {/* Tips list */}
                        {openCategory === ci && (
                            <div style={{ padding: '0.5rem 0' }}>
                                {cat.items.map((item, ii) => {
                                    const key = `${ci}-${ii}`;
                                    const isOpen = openItem === key;
                                    return (
                                        <div key={ii}>
                                            <div
                                                style={{
                                                    padding: '10px 1.2rem', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                                    background: isOpen ? `${cat.color}06` : 'transparent',
                                                    transition: 'background 0.15s',
                                                }}
                                                onClick={() => setOpenItem(isOpen ? null : key)}
                                            >
                                                <div style={{
                                                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                                                    background: cat.color, color: 'white',
                                                    fontSize: '0.6rem', fontWeight: 900,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {ii + 1}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                                        {item.title}
                                                    </div>
                                                    {isOpen && (
                                                        <div style={{
                                                            fontSize: '0.77rem', color: 'var(--text-secondary)',
                                                            lineHeight: 1.6, marginTop: 6,
                                                            paddingBottom: 4,
                                                        }}>
                                                            {item.detail}
                                                        </div>
                                                    )}
                                                </div>
                                                <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>
                                                    {isOpen ? '▲' : '▼'}
                                                </span>
                                            </div>
                                            {ii < cat.items.length - 1 && (
                                                <div style={{ height: 1, background: 'var(--border)', margin: '0 1.2rem' }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
