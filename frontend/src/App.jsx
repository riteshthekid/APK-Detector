import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import UploadCard from './components/UploadCard';
import ScanProgress from './components/ScanProgress';
import ResultsDashboard from './components/ResultsDashboard';
import PermissionsList from './components/PermissionsList';
import ReportDownload from './components/ReportDownload';
import PolicyCompliance from './components/PolicyCompliance';
import StatsBar from './components/StatsBar';
import HowItWorks from './components/HowItWorks';
import ThreatCards from './components/ThreatCards';
import SecurityTips from './components/SecurityTips';
import { uploadApk, pollAnalysisStatus } from './api';

const VIEW = { UPLOAD: 'upload', SCANNING: 'scanning', RESULTS: 'results' };

const TAB_CONFIG = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'permissions', label: '🔐 Permissions & Risks' },
  { id: 'policy', label: '⚖️ Policy Compliance' },
  { id: 'download', label: '📥 Download Report' },
];

// ── Section divider ───────────────────────────────────────────
function SectionDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '0.5rem 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{
        fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState(VIEW.UPLOAD);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepMessage, setStepMessage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const resultRef = useRef(null);

  const handleUpload = async (file) => {
    setError('');
    setView(VIEW.SCANNING);
    setUploadProgress(0);
    setCurrentStep(0);
    setStepMessage('Uploading file…');

    try {
      const taskId = await uploadApk(file, (pct) => {
        setUploadProgress(pct);
        setStepMessage(`Uploading… ${pct}%`);
      });

      setCurrentStep(0);
      setStepMessage('File received — starting analysis pipeline…');

      const analysisResult = await pollAnalysisStatus(
        taskId,
        (step, message) => {
          setCurrentStep(step);
          setStepMessage(message);
        },
        1200
      );

      setResult(analysisResult);

      setTimeout(() => {
        setView(VIEW.RESULTS);
        setActiveTab('overview');
      }, 1000);

    } catch (err) {
      setError(err.message || 'Analysis failed. Is the backend running?');
      setView(VIEW.UPLOAD);
    }
  };

  const handleReset = () => {
    setView(VIEW.UPLOAD);
    setResult(null);
    setError('');
    setUploadProgress(0);
    setCurrentStep(0);
    setStepMessage('');
  };

  useEffect(() => {
    if (view === VIEW.RESULTS && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [view]);

  return (
    <div className="app">
      <Header />

      <main className="main-content">

        {/* ── UPLOAD VIEW ── */}
        {view === VIEW.UPLOAD && (
          <>
            {/* Hero */}
            <div style={{ textAlign: 'center', padding: '2.5rem 0 2.5rem' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 16px', borderRadius: 999,
                background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
                fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-blue)',
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)', display: 'inline-block' }} />
                ML · Androguard · FastAPI · React
              </div>

              <h1 style={{
                fontSize: 'clamp(2rem, 6vw, 3.4rem)', fontWeight: 900,
                letterSpacing: '-0.045em', lineHeight: 1.08, marginBottom: 18,
                color: 'var(--text-primary)',
              }}>
                APK{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Guardian</span>
              </h1>

              <p style={{
                color: 'var(--text-secondary)', fontSize: '1rem',
                maxWidth: 540, margin: '0 auto 2rem', lineHeight: 1.75,
              }}>
                Detect fake banking &amp; payment APKs instantly.
                ML-powered static analysis with{' '}
                <strong style={{ color: 'var(--text-primary)' }}>RBI, PCI-DSS &amp; OWASP</strong> policy compliance.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                maxWidth: 640, margin: '0 auto 1.5rem',
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.3)',
                color: 'var(--accent-red)', fontWeight: 600, fontSize: '0.88rem',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                ⚠️ {error}
                <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '3px 9px' }}
                  onClick={() => setError('')}>✕</button>
              </div>
            )}

            {/* Upload card */}
            <UploadCard onUpload={handleUpload} />

            {/* ── Stats banner ── */}
            <div style={{ marginTop: '3.5rem' }}>
              <SectionDivider label="Mobile Banking Threat Landscape 2024" />
              <div style={{ marginTop: '1.25rem' }}>
                <StatsBar />
              </div>
            </div>

            {/* ── How It Works ── */}
            <div style={{ marginTop: '4rem' }}>
              <SectionDivider label="Analysis Pipeline" />
              <div style={{ marginTop: '1.5rem' }}>
                <HowItWorks />
              </div>
            </div>

            {/* ── Threat Intelligence ── */}
            <div style={{ marginTop: '4rem' }}>
              <SectionDivider label="Known Threats We Detect" />
              <div style={{ marginTop: '1.5rem' }}>
                <ThreatCards />
              </div>
            </div>

            {/* ── Security Tips ── */}
            <div style={{ marginTop: '4rem' }}>
              <SectionDivider label="Security Best Practices" />
              <div style={{ marginTop: '1.5rem' }}>
                <SecurityTips />
              </div>
            </div>

            {/* ── Coverage banner ── */}
            <div style={{ marginTop: '4rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '2rem',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 20, textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}>
                {[
                  { icon: '🏦', count: '80+', label: 'Banking Apps in Whitelist' },
                  { icon: '🔎', count: '59', label: 'ML Features Extracted' },
                  { icon: '⚖️', count: '16', label: 'Compliance Policy Rules' },
                  { icon: '🌍', count: '30+', label: 'Countries Covered' },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-blue)', letterSpacing: '-0.03em' }}>{s.count}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── SCANNING VIEW ── */}
        {view === VIEW.SCANNING && (
          <ScanProgress
            currentStep={currentStep}
            statusMessage={stepMessage}
            uploadProgress={uploadProgress}
          />
        )}

        {/* ── RESULTS VIEW ── */}
        {view === VIEW.RESULTS && result && (
          <div ref={resultRef}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 2 }}>Security Analysis Report</h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {result.filename} · {result.timestamp}
                </div>
              </div>
              <button className="btn btn-ghost" onClick={handleReset}>← Scan Another APK</button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex', gap: 6, marginBottom: '1.5rem',
              background: 'var(--bg-section)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: 5,
            }}>
              {TAB_CONFIG.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex: 1, padding: '8px 12px', borderRadius: 9,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font)', fontSize: '0.8rem', fontWeight: 600,
                  transition: 'var(--transition)',
                  background: activeTab === tab.id ? 'white' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && <ResultsDashboard result={result} />}
            {activeTab === 'permissions' && (
              <PermissionsList permissions={result.permissions} riskFactors={result.risk_factors} />
            )}
            {activeTab === 'policy' && (
              <PolicyCompliance
                policyViolations={result.policy_violations || []}
                complianceSummary={result.compliance_summary}
                isKnownApp={result.is_known_banking_app || false}
                knownAppName={result.known_app_name}
              />
            )}
            {activeTab === 'download' && (
              <ReportDownload
                analysisId={result.analysis_id}
                verdict={result.verdict}
                filename={result.filename}
              />
            )}
          </div>
        )}
      </main>

      {/* ══ FOOTER ══════════════════════════════════════════ */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        background: '#0f172a',                // deep navy — strong footer contrast
        color: 'rgba(255,255,255,0.6)',
        padding: '3rem 1.5rem 1.5rem',
        marginTop: '2rem',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* 3-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>

            {/* Brand column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', boxShadow: '0 2px 10px rgba(37,99,235,0.4)',
                }}>🛡️</div>
                <div>
                  <div style={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>APK Guardian</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>FAKE APP DETECTOR</div>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', maxWidth: 260 }}>
                ML-powered static analysis for detecting fake and malicious banking APKs. Built for security researchers and bank fraud teams.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {['scikit-learn', 'Androguard', 'FastAPI'].map((t) => (
                  <span key={t} style={{
                    fontSize: '0.65rem', fontWeight: 600, padding: '3px 9px', borderRadius: 999,
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.6)',
                  }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Policy References column */}
            <div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
                Compliance Frameworks
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  { label: 'RBI IT Framework 2021', sub: 'Master Direction on IT' },
                  { label: 'RBI Cyber Security Framework', sub: '2016 & 2021 Amendments' },
                  { label: 'RBI Digital Payment Security', sub: 'Controls 2021' },
                  { label: 'PCI-DSS v4.0', sub: 'Requirement 6.3 / 10.3' },
                  { label: 'OWASP MASVS', sub: 'Mobile App Security Verification' },
                  { label: 'CERT-In Advisories', sub: 'India Cyber Crime' },
                ].map((item) => (
                  <li key={item.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#3b82f6', fontSize: '0.6rem', marginTop: 4 }}>▶</span>
                    <div>
                      <div style={{ fontSize: '0.77rem', color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.38)' }}>{item.sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coverage column */}
            <div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
                Detection Coverage
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { n: '80+', label: 'Whitelisted Banking Apps' },
                  { n: '59', label: 'ML Features Extracted' },
                  { n: '16', label: 'Compliance Rules' },
                  { n: '6', label: 'Trojan Families Profiled' },
                  { n: '30+', label: 'Countries Covered' },
                  { n: '200', label: 'RF Estimators' },
                ].map((s) => (
                  <div key={s.label} style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#60a5fa', letterSpacing: '-0.03em' }}>{s.n}</div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '1.25rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 10,
          }}>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
              © 2024 APK Guardian · For security research and educational purposes only.
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['React', 'Vite', 'ReportLab'].map((t) => (
                <span key={t} style={{
                  fontSize: '0.62rem', padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.45)',
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
