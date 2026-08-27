const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CAMPAIGN_PATTERN = /^[a-zA-Z0-9._-]+$/;
const SLUG_PATTERN = /^[a-zA-Z0-9._-]+$/;
const SENSITIVE_PATH_PREFIXES = [
  '/admin', '/api', '/galeria', '/konto', '/strefa-klienta', '/logowanie',
  '/rejestracja', '/invite', '/foto-wyzwanie/invite',
  '/karta-podarunkowa/dostep', '/z/',
];

function text(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

export function safeSalesSessionId(value: unknown) {
  const normalized = text(value, 120);
  return normalized && UUID_PATTERN.test(normalized) ? normalized : null;
}

export function safeSalesCampaign(value: unknown) {
  const normalized = text(value, 80);
  return normalized && CAMPAIGN_PATTERN.test(normalized) ? normalized : null;
}

export function safeSalesSlug(value: unknown) {
  const normalized = text(value, 120);
  return normalized && SLUG_PATTERN.test(normalized) ? normalized : null;
}

export function safeSalesLandingPage(value: unknown) {
  const normalized = text(value, 500);
  if (!normalized) return null;
  let path = normalized;
  try {
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      const url = new URL(normalized);
      if (!/(^|\.)wlasniewski\.pl$/i.test(url.hostname)) return null;
      path = url.pathname;
    }
  } catch {
    return null;
  }
  path = path.split('?')[0]?.split('#')[0] || '/';
  if (
    !path.startsWith('/')
    || path.startsWith('//')
    || SENSITIVE_PATH_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix))
  ) return null;
  return path.slice(0, 500);
}

export function salesAttributionFromPayload(payload: Record<string, unknown>) {
  return {
    analytics_session_id: safeSalesSessionId(payload.analytics_session_id),
    landing_page: safeSalesLandingPage(payload.landing_page),
    utm_source: safeSalesCampaign(payload.utm_source),
    utm_medium: safeSalesCampaign(payload.utm_medium),
    utm_campaign: safeSalesCampaign(payload.utm_campaign),
  };
}

export function isPhotoInquirySource(source: string | null | undefined) {
  if (!source) return false;
  const normalized = source.toLowerCase();
  return normalized === 'website-contact'
    || normalized === 'website'
    || normalized.startsWith('landing-')
    || normalized.startsWith('promo_')
    || normalized.startsWith('photo:')
    || normalized.startsWith('fotografia:');
}
