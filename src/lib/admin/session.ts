export const publicAdminPaths = new Set(['/admin/login', '/admin/forgot-password', '/admin/reset-password']);

export type AdminSessionState = 'authorized' | 'invalid' | 'unavailable';

export async function checkAdminSession(signal?: AbortSignal): Promise<AdminSessionState> {
    const token = localStorage.getItem('admin_token');
    const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
        signal,
    });
    if (response.status === 401 || response.status === 403) return 'invalid';
    if (!response.ok) return 'unavailable';
    const data = await response.json();
    return data.success === true && data.user ? 'authorized' : 'unavailable';
}

export function clearAdminIdentity() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
}

export async function logoutAdmin() {
    // Keep the identity until the server confirms deletion of the HttpOnly cookie.
    // Client and admin can be signed in simultaneously; leave the client session alone.
    const response = await fetch('/api/auth/logout?scope=admin', { method: 'POST', credentials: 'include' });
    if (!response.ok) throw new Error('Nie udało się zakończyć sesji.');
    clearAdminIdentity();
}
