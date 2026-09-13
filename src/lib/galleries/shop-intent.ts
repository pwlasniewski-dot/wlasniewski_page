/** Public selection contains only a catalog ID. It never contains photos, prices or a redirect. */
export type ShopIntent = { kind: 'product'; productId: number } | { kind: 'print'; formatId: string };

export function parseShopIntent(search: string | URLSearchParams): ShopIntent | null {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const products = params.getAll('shopProduct');
  const formats = params.getAll('shopFormat');
  if (products.length === 1 && !formats.length && /^[1-9]\d{0,15}$/.test(products[0])) {
    const productId = Number(products[0]);
    return Number.isSafeInteger(productId) ? { kind: 'product', productId } : null;
  }
  if (formats.length === 1 && !products.length && /^[a-zA-Z0-9_-]{1,60}$/.test(formats[0])) return { kind: 'print', formatId: formats[0] };
  return null;
}

export function shopIntentQuery(intent: ShopIntent): string {
  const params = new URLSearchParams(intent.kind === 'product' ? { shopProduct: String(intent.productId) } : { shopFormat: intent.formatId });
  if (!parseShopIntent(params)) throw new Error('Nieprawidłowy wybór produktu.');
  return params.toString();
}

export function shopAccountHref(intent: ShopIntent): string { return `/konto?${shopIntentQuery(intent)}`; }

/** Only a gallery returned by the authenticated client endpoint can be passed by the UI. */
export function shopGalleryHref(accessCode: string, intent: ShopIntent): string {
  if (typeof accessCode !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(accessCode)) throw new Error('Nieprawidłowy adres galerii.');
  return `/galeria/${encodeURIComponent(accessCode)}?${shopIntentQuery(intent)}`;
}

export function replaceShopIntent(intent: ShopIntent | null): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('shopProduct');
  url.searchParams.delete('shopFormat');
  if (intent) new URLSearchParams(shopIntentQuery(intent)).forEach((value, key) => url.searchParams.set(key, value));
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}

/** No client identity, access code or selected photos enter the analytics event. */
export function trackShopIntent(event: 'offer_selected' | 'gallery_selected' | 'selection_opened', intent: ShopIntent): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('gallery-shop-action', { detail: { event, kind: intent.kind, itemId: intent.kind === 'product' ? intent.productId : intent.formatId } }));
}
