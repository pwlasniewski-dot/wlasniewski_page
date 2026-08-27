export type GalleryDiscountType = 'percentage' | 'fixed';

export interface GalleryLoyaltyOffer {
  code: string;
  discountValue: number;
  discountType: GalleryDiscountType;
  validUntil: string | null;
}

interface PublicGalleryOffer {
  code?: string | null;
  discountValue?: number | string | null;
  discountType?: string | null;
  validUntil?: string | null;
}

const REVIEW_LINK_HOSTS = new Set(['g.page', 'search.google.com']);
const PROFILE_LINK_HOSTS = new Set(['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl', 'g.page']);
const PROMO_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;

/**
 * Galeria może kierować do opinii wyłącznie przez link skopiowany z GBP.
 * Celowo nie odtwarzamy linku z Place ID i nie używamy wartości środowiskowej.
 */
export function normalizeGoogleReviewUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();

    if (
      url.protocol !== 'https:'
      || !REVIEW_LINK_HOSTS.has(hostname)
      || url.username
      || url.password
      || url.port
    ) {
      return null;
    }

    if (hostname === 'g.page') {
      return /^\/r\/[^/]+\/review\/?$/.test(url.pathname) ? url.toString() : null;
    }

    if (url.pathname !== '/local/writereview' || !url.searchParams.get('placeid')) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

/** Link do publicznego profilu/listy opinii, nigdy do formularza wystawiania recenzji. */
export function normalizeGoogleBusinessProfileUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== 'https:'
      || !PROFILE_LINK_HOSTS.has(hostname)
      || url.username
      || url.password
      || url.port
      || url.pathname.toLowerCase().includes('/review')
      || url.pathname === '/local/writereview'
    ) {
      return null;
    }

    if (hostname === 'maps.app.goo.gl') return /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) ? url.toString() : null;
    if (hostname === 'g.page') return /^\/r\/[^/]+\/?$/.test(url.pathname) ? url.toString() : null;
    return url.pathname === '/maps' || url.pathname.startsWith('/maps/') ? url.toString() : null;
  } catch {
    return null;
  }
}

export function resolveGalleryLoyaltyOffer(
  offer: PublicGalleryOffer | null | undefined,
  today = new Date(),
): GalleryLoyaltyOffer | null {
  if (!offer) return null;

  const code = String(offer.code || '').trim().toUpperCase();
  const discountValue = Number(offer.discountValue);
  const discountType = offer.discountType;
  const validUntil = offer.validUntil || null;

  if (!PROMO_CODE_PATTERN.test(code)) return null;
  if (!Number.isFinite(discountValue) || discountValue <= 0) return null;
  if (discountType !== 'percentage' && discountType !== 'fixed') return null;
  if (discountType === 'percentage' && discountValue > 100) return null;

  if (validUntil) {
    const normalizedExpiry = normalizeDateOnly(validUntil);
    if (!normalizedExpiry || normalizedExpiry < toDateOnly(today)) return null;
  }

  return {
    code,
    discountValue,
    discountType,
    validUntil,
  };
}

export function formatGalleryDiscount(offer: GalleryLoyaltyOffer): string {
  return offer.discountType === 'percentage'
    ? `${offer.discountValue}%`
    : `${offer.discountValue} zł`;
}

export function formatGalleryOfferExpiry(validUntil: string | null): string | null {
  const normalized = validUntil ? normalizeDateOnly(validUntil) : null;
  if (!normalized) return null;

  const [year, month, day] = normalized.split('-').map(Number);
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Warsaw',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function normalizeDateOnly(value: string): string | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const normalized = `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(`${normalized}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized
    ? null
    : normalized;
}

function toDateOnly(value: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Europe/Warsaw',
  }).format(value);
}
