'use client';

import { useEffect, useState } from 'react';
import { defaultPublicOffer, type PublicShopCatalog } from '@/lib/galleries/public-offer';
import { parseShopIntent, rememberGalleryProduct } from '@/lib/galleries/shop-intent';
import type { ProductGalleryPhoto } from './ProductGalleryPicker';
import GuestProductPreview from './GuestProductPreview';

/** Digital extras remain in their existing gallery checkout; product context survives. */
export default function GalleryProductContinuation({ accessCode, photos, headers }: {
  accessCode: string; photos: ProductGalleryPhoto[]; headers: Record<string, string>;
}) {
  const [catalog, setCatalog] = useState<PublicShopCatalog | null>(null);
  const [productId, setProductId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const intent = parseShopIntent(window.location.search);
    if (intent?.kind !== 'product' || new URLSearchParams(window.location.search).get('shopGalleryOffer') !== '1') return;
    rememberGalleryProduct(accessCode, intent); setProductId(intent.productId);
    const controller = new AbortController();
    void fetch('/api/shop/catalog', { cache: 'no-store', signal: controller.signal }).then(response => response.json()).then(data => {
      if (!controller.signal.aborted && data.success) setCatalog(data.catalog);
    }).catch(() => { /* The existing digital gallery remains available. */ });
    return () => controller.abort();
  }, [accessCode]);
  const product = catalog?.offer.personalizationEnabled ? catalog.products.find(item => item.id === productId && item.personalizationEligible) : null;
  if (!product) return null;
  const copy = { ...defaultPublicOffer(), ...catalog!.offer };
  return <section aria-label="Twój wybrany produkt" className="mb-6 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-5">
    <p className="font-semibold">Wybrany produkt: {product.title}</p>
    <p className="mt-2 text-sm text-zinc-300">{copy.galleryPurchaseNotice}</p>
    <button type="button" className="mt-4 min-h-12 rounded-xl bg-gold-500 px-5 font-semibold text-black" onClick={() => setOpen(true)}>{copy.productReturnLabel}</button>
    {open && <GuestProductPreview product={product} offer={catalog!.offer} onClose={() => setOpen(false)} gallerySource={photos[0] ? { endpoint: `/api/galleries/${encodeURIComponent(accessCode)}/shop`, headers, photos, photo: photos[0] } : undefined} />}
  </section>;
}
