import React, { useState } from 'react';
import { downloadReport, getJsonReportUrl, getPdfReportUrl } from '../api';

export default function ReportDownload({ analysisId, verdict, filename }) {
    const [downloading, setDownloading] = useState(null); // 'pdf' | 'json' | null

    const handleDownload = async (type) => {
        setDownloading(type);
        try {
            const url = type === 'pdf' ? getPdfReportUrl(analysisId) : getJsonReportUrl(analysisId);
            downloadReport(url);
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setTimeout(() => setDownloading(null), 1500);
        }
    };

    return (
        <div className="glass" style={{ padding: '2rem' }}>
            <p className="section-title">📥 Download Report</p>

            <div style={{
                background: 'rgba(59,130,246,0.05)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 'var(--radius)',
                padding: '14px 18px',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
            }}>
                📄 Report generated for <strong style={{ color: 'var(--text-primary)' }}>{filename}</strong>
                &nbsp;·&nbsp; ID: <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-blue)' }}>{analysisId.slice(0, 12)}…</code>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* PDF */}
                <div style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius)',
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📋</div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>PDF Report</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                        Formatted document with tables, charts, and full analysis details.
                        Ideal for sharing and archiving.
                    </div>
                    <button
                        className="btn btn-danger"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => handleDownload('pdf')}
                        disabled={downloading !== null}
                    >
                        {downloading === 'pdf' ? (
                            <><div className="spinner" />  Generating…</>
                        ) : (
                            <>Download PDF</>
                        )}
                    </button>
                </div>

                {/* JSON */}
                <div style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius)',
                    background: 'rgba(59,130,246,0.05)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{ }</div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>JSON Report</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                        Machine-readable structured data with all extracted features
                        and ML prediction details.
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => handleDownload('json')}
                        disabled={downloading !== null}
                    >
                        {downloading === 'json' ? (
                            <><div className="spinner" /> Preparing…</>
                        ) : (
                            <>Download JSON</>
                        )}
                    </button>
                </div>
            </div>

            {/* Tip */}
            <div style={{
                marginTop: '1rem',
                padding: '10px 16px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
            }}>
                💡 Reports are available as long as the server is running. The analysis ID is embedded in the filename for traceability.
            </div>
        </div>
    );
}
