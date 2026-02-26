import React from 'react';

export default function Header() {
    return (
        <header style={{
            position: 'sticky', top: 0, zIndex: 100,
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
            boxShadow: '0 1px 8px rgba(15,23,42,0.07)',
        }}>
            <div style={{
                maxWidth: 1100, margin: '0 auto',
                padding: '0 1.5rem',
                height: 60,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                {/* Logo + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Shield icon */}
                    <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(37,99,235,0.3)',
                        flexShrink: 0,
                    }}>
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <path
                                d="M11 2L20 5.5V12C20 16.4 16 19.8 11 21C6 19.8 2 16.4 2 12V5.5L11 2Z"
                                fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.7)" strokeWidth="1"
                            />
                            <path
                                d="M7.5 11L10 13.5L14.5 9"
                                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                            APK <span style={{ color: 'var(--accent-blue)' }}>Guardian</span>
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Fake Banking App Detector
                        </div>
                    </div>
                </div>

                {/* Status badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)' }}>
                        <div className="pulse-dot green" />
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-green)' }}>ML Model Active</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-blue)' }}>RBI · PCI-DSS · OWASP</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
