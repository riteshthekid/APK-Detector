import React, { useState, useCallback } from 'react';

const MAX_SIZE_MB = 500;

export default function UploadCard({ onUpload }) {
    const [dragging, setDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState('');

    const validate = (file) => {
        if (!file.name.toLowerCase().endsWith('.apk')) {
            setFileError('Only .apk files are accepted.');
            return false;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setFileError(`File too large. Maximum ${MAX_SIZE_MB} MB.`);
            return false;
        }
        setFileError('');
        return true;
    };

    const handleFile = (file) => {
        if (validate(file)) setSelectedFile(file);
        else setSelectedFile(null);
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, []);

    const onDragOver = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
    const onDragLeave = useCallback(() => setDragging(false), []);

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    };

    const handleAnalyse = () => {
        if (selectedFile) onUpload(selectedFile);
    };

    return (
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Drop Zone */}
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => !selectedFile && document.getElementById('apk-input').click()}
                style={{
                    border: `2px dashed ${dragging ? 'var(--accent-blue)' : selectedFile ? 'var(--accent-green)' : 'var(--border-strong)'}`,
                    borderRadius: 16,
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    cursor: selectedFile ? 'default' : 'pointer',
                    background: dragging
                        ? 'rgba(37,99,235,0.04)'
                        : selectedFile
                            ? 'rgba(22,163,74,0.04)'
                            : 'var(--bg-card)',
                    transition: 'all 0.2s ease',
                    boxShadow: dragging ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                }}
            >
                <input
                    id="apk-input" type="file" accept=".apk"
                    style={{ display: 'none' }}
                    onChange={onFileChange}
                />

                {selectedFile ? (
                    <>
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📦</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                            {selectedFile.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · APK file
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '7px 14px' }}
                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                                ✕ Clear
                            </button>
                            <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '7px 14px' }}
                                onClick={(e) => { e.stopPropagation(); document.getElementById('apk-input').click(); }}>
                                📂 Change
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>📱</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                            {dragging ? 'Drop APK file here' : 'Drop your APK here, or click to browse'}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Supports .apk files up to {MAX_SIZE_MB} MB
                        </div>
                    </>
                )}
            </div>

            {/* Error */}
            {
                fileError && (
                    <div style={{
                        padding: '10px 16px', borderRadius: 8,
                        background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.25)',
                        color: 'var(--accent-red)', fontSize: '0.85rem', fontWeight: 600,
                    }}>
                        ⚠️ {fileError}
                    </div>
                )
            }

            {/* Analyse button */}
            <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem' }}
                disabled={!selectedFile}
                onClick={handleAnalyse}
            >
                🔬 Start Analysis
            </button>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingTop: 4 }}>
                {[
                    '🤖 ML Classification',
                    '📋 Androguard Parsing',
                    '⚖️ RBI · PCI-DSS · OWASP',
                    '📄 PDF + JSON Reports',
                    '🏦 Banking Whitelist',
                ].map((f) => (
                    <span key={f} style={{
                        padding: '5px 13px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                        background: 'var(--bg-section)', border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                    }}>{f}</span>
                ))}
            </div>
        </div >
    );
}
