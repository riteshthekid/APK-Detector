/**
 * API layer — polling-based architecture.
 *
 * Flow:
 *   1. POST /analyze  → instantly returns { task_id }
 *   2. Poll GET /analyze/status/{task_id} every 1.5s
 *   3. When status === "complete", resolve with result
 *   4. When status === "error", reject
 */

const BASE = '';  // Vite proxy forwards to http://localhost:8000

/**
 * Upload APK and get a task_id immediately.
 * @param {File} file
 * @param {(pct: number) => void} onUploadProgress  — called during file upload
 * @returns {Promise<string>} task_id
 */
export function uploadApk(file, onUploadProgress) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BASE}/analyze`);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onUploadProgress) {
                onUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    resolve(data.task_id);
                } catch {
                    reject(new Error('Invalid response from server'));
                }
            } else {
                let msg = `Upload failed (${xhr.status})`;
                try { msg = JSON.parse(xhr.responseText).detail || msg; } catch { }
                reject(new Error(msg));
            }
        };

        xhr.onerror = () => reject(new Error('Network error — is the backend running on port 8000?'));
        xhr.send(formData);
    });
}

/**
 * Poll /analyze/status/{taskId} until complete or error.
 * @param {string} taskId
 * @param {(step: number, message: string) => void} onProgress
 * @param {number} intervalMs  — polling interval (default 1500ms)
 * @returns {Promise<Object>}  — full AnalysisResult when done
 */
export function pollAnalysisStatus(taskId, onProgress, intervalMs = 1500) {
    return new Promise((resolve, reject) => {
        let timer = null;

        const check = async () => {
            try {
                const res = await fetch(`${BASE}/analyze/status/${taskId}`);
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    reject(new Error(err.detail || `Status check failed (${res.status})`));
                    return;
                }

                const data = await res.json();
                const { status, step, message, result } = data;

                // Push progress update to UI
                if (onProgress) onProgress(step ?? 0, message ?? '');

                if (status === 'complete') {
                    clearInterval(timer);
                    resolve(result);
                } else if (status === 'error') {
                    clearInterval(timer);
                    reject(new Error(message || 'Analysis failed on server'));
                }
                // else still processing — keep polling
            } catch (err) {
                clearInterval(timer);
                reject(err);
            }
        };

        // Start polling immediately then repeat
        check();
        timer = setInterval(check, intervalMs);
    });
}

/**
 * Get the URL for downloading a JSON report.
 */
export function getJsonReportUrl(analysisId) {
    return `${BASE}/report/${analysisId}/json`;
}

/**
 * Get the URL for downloading a PDF report.
 */
export function getPdfReportUrl(analysisId) {
    return `${BASE}/report/${analysisId}/pdf`;
}

/**
 * Trigger a file download.
 */
export function downloadReport(url) {
    const a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
