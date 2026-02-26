import React, { useEffect, useRef, useState } from 'react';

const STATS = [
    { icon: '🚨', value: 5800000, label: 'Fake banking APKs detected in 2024', suffix: '+', prefix: '' },
    { icon: '📱', value: 34, label: 'of mobile malware targets banking apps', suffix: '%', prefix: '' },
    { icon: '💸', value: 1750, label: 'Crore lost to mobile banking fraud (India, 2023)', suffix: 'Cr', prefix: '₹' },
    { icon: '🦠', value: 47, label: 'Active banking trojan families tracked globally', suffix: '+', prefix: '' },
    { icon: '⚡', value: 98, label: 'of cyberattacks start with a fake or phishing app', suffix: '%', prefix: '' },
];

function useCountUp(target, duration = 1800, start = false) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
            setValue(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, start]);
    return value;
}

function StatCard({ icon, value, label, suffix, prefix, animate }) {
    const count = useCountUp(value, 1600, animate);
    const display = animate ? count : 0;

    const formatted =
        display >= 1000000
            ? `${(display / 1000000).toFixed(1)}M`
            : display >= 1000
                ? `${(display / 1000).toFixed(0)}K`
                : display;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '1.5rem 1rem', textAlign: 'center', flex: 1, minWidth: 160,
        }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
            <div style={{
                fontSize: '1.9rem', fontWeight: 900, color: 'white',
                letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6,
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 2px 12px rgba(0,0,0,0.25)',
            }}>
                {prefix}{formatted}{suffix}
            </div>
            <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, maxWidth: 130 }}>
                {label}
            </div>
        </div>
    );
}

export default function StatsBar() {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.2 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(37,99,235,0.25)',
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* background grid lines */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
            }} />

            <div style={{
                padding: '0.5rem 1.5rem',
                display: 'flex', flexWrap: 'wrap',
                justifyContent: 'space-around',
                position: 'relative', zIndex: 1,
            }}>
                {STATS.map((s, i) => (
                    <React.Fragment key={i}>
                        <StatCard {...s} animate={visible} />
                        {i < STATS.length - 1 && (
                            <div style={{
                                width: 1, background: 'rgba(255,255,255,0.12)',
                                alignSelf: 'center', height: 60,
                                display: window.innerWidth < 640 ? 'none' : 'block',
                            }} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
