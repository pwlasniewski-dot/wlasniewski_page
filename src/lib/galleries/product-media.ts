/** Media are displayed by the browser, never fetched by the shop server. */
export function isProductImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2000 || value !== value.trim()) return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

/** Tolerate old or malformed JSON without breaking the customer's catalog. */
export function readProductImages(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter(isProductImageUrl))].slice(0, 12) : [];
}

export function isProductVideoUrl(value: unknown): value is string {
  return isProductImageUrl(value) && value.startsWith('https://') && /\.mp4(?:[?#]|$)/i.test(value);
}
