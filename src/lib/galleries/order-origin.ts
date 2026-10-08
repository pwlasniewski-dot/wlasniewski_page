import { getSiteUrl } from '@/lib/site-url';

/** Production payments must never return to an internal Netlify deploy alias.
 * Explicit previews keep their own session and must not jump into production. */
export function orderOrigin(requestUrl?: string) {
  // Netlify Functions use the explicit runtime marker when build-only CONTEXT is absent.
  // An explicit production CONTEXT remains authoritative over a stale QA marker.
  const context = process.env.CONTEXT?.trim() || process.env.GALLERY_QA_CONTEXT?.trim();
  if (context === 'deploy-preview') {
    try {
      const preview = new URL(process.env.DEPLOY_PRIME_URL || '');
      if (preview.protocol === 'https:' && /^deploy-preview-[1-9]\d*--[a-z0-9]+(?:-[a-z0-9]+)*\.netlify\.app$/.test(preview.hostname) && !preview.username && !preview.password && !preview.port && preview.pathname === '/' && !preview.search && !preview.hash) return preview.origin;
    } catch { /* Missing or invalid trusted deploy metadata: use the request origin. */ }
  }
  if (requestUrl && context !== 'production' && (context === 'deploy-preview' || context === 'branch-deploy' || process.env.NODE_ENV !== 'production')) return new URL(requestUrl).origin;
  try {
    const url = new URL(getSiteUrl());
    if (url.protocol === 'https:' && !url.hostname.endsWith('.netlify.app') && !url.username && !url.password) return url.origin;
  } catch { /* use the public production domain */ }
  return 'https://wlasniewski.pl';
}
