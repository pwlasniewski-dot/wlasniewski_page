type OriginRequest = { headers: Pick<Headers, 'get'>; nextUrl: { origin: string } };
type OriginEnvironment = { nodeEnv?: string; context?: string; deployPrimeUrl?: string };
const canonicalOrigins = new Set(['https://wlasniewski.pl', 'https://www.wlasniewski.pl']);
const previewOrigin = /^https:\/\/deploy-preview-[1-9][0-9]*--helpful-axolotl-cc1cbb\.netlify\.app$/;
const mainBranchOrigin = 'https://main--helpful-axolotl-cc1cbb.netlify.app';

/** Browser Origin is checked against trusted deployment policy, not proxy/Host headers.
 * Netlify may expose an internal Next URL. Runtime preview context must be set
 * explicitly (GALLERY_QA_CONTEXT is the existing branch-scoped runtime marker).
 * No preview origins are trusted by a production deployment.
 */
export function isTrustedAdminOrigin(request: OriginRequest, environment: OriginEnvironment = {
  nodeEnv: process.env.NODE_ENV,
  context: process.env.CONTEXT?.trim() || process.env.GALLERY_QA_CONTEXT?.trim(),
  deployPrimeUrl: process.env.DEPLOY_PRIME_URL?.trim(),
}): boolean {
  const raw = request.headers.get('origin');
  if (!raw) return false;
  let origin: URL;
  try { origin = new URL(raw); } catch { return false; }
  // Reject null, multiple origins, paths, userinfo, non-default ports and aliases
  // that browsers do not send as a serialized Origin.
  if (raw !== origin.origin) return false;
  if (environment.nodeEnv === 'development' || environment.nodeEnv === 'test') {
    return ['http:', 'https:'].includes(origin.protocol)
      && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
      && raw === request.nextUrl.origin;
  }
  if (environment.context === 'deploy-preview') {
    return previewOrigin.test(raw)
      && (!environment.deployPrimeUrl || raw === environment.deployPrimeUrl);
  }
  if (environment.context === 'branch-deploy') {
    return raw === mainBranchOrigin
      && (!environment.deployPrimeUrl || raw === environment.deployPrimeUrl);
  }
  return canonicalOrigins.has(raw);
}
