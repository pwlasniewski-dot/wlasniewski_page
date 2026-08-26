/** Escapes untrusted text before interpolation into an HTML email. */
export function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/** Keeps uploaded names useful for audit/email without control characters or unbounded payloads. */
export function sanitizeUploadedFilename(value: unknown, maxLength = 180): string {
    const normalized = String(value ?? '')
        .normalize('NFKC')
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/[\\/]+/g, '_')
        .trim();
    return (normalized || 'plik').slice(0, maxLength);
}
