'use client';

import { useEffect, useState } from 'react';
import { parseShopIntent, replaceShopIntent } from '@/lib/galleries/shop-intent';
import type { PublicShopCatalog } from '@/lib/galleries/public-offer';
import GuestProductPreview from './GuestProductPreview';
import PhotoProductStorefront from './PhotoProductStorefront';

/** Deep links and payment returns use exactly the product view from the storefront. */
export default function ProductPersonalizationPage() {
  const [catalog, setCatalog] = useState<PublicShopCatalog | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [productId, setProductId] = useState<number | null>(null);
  useEffect(() => {
    const intent = parseShopIntent(window.location.search);
    setProductId(intent?.kind === 'product' ? intent.productId : null);
    let active = true;
    const controller = new AbortController();
    setLoaded(false); setError('');
    const timeout = setTimeout(() => {
      if (!active) return;
      active = false; controller.abort(); setLoaded(true);
      setError('Wczytywanie produktu trwało zbyt długo. Spróbuj ponownie.');
    }, 15000);
    void fetch('/api/shop/catalog', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || !data.success || (data.catalog !== null && (!data.catalog?.offer || !Array.isArray(data.catalog.products)))) throw new Error();
      if (active) setCatalog(data.catalog || null);
    }).catch(() => { if (active) setError('Nie udało się wczytać produktu. Sprawdź połączenie i spróbuj ponownie.'); })
      .finally(() => { clearTimeout(timeout); if (active) setLoaded(true); });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);
  const product = catalog?.offer.personalizationEnabled ? catalog.products.find(item => item.id === productId && item.personalizationEligible) : null;
  return <main className="min-h-screen bg-stone-950 px-4 pb-16 pt-28 text-stone-100 sm:px-8">
    <div className="mx-auto max-w-7xl"><a href="/karta-podarunkowa#produkty-fotograficzne" className="inline-flex min-h-11 items-center underline">Wróć do oferty produktów</a>
      {!loaded && <p role="status">Wczytywanie produktu…</p>}
      {error && <div role="alert" className="my-6 space-y-4"><p>{error}</p><button type="button" className="min-h-12 rounded-xl border border-stone-500 px-5" onClick={() => setAttempt(value => value + 1)}>Wczytaj produkt ponownie</button></div>}
      {loaded && !error && product && <GuestProductPreview key={product.id} product={product} offer={catalog!.offer} onClose={() => { setProductId(null); replaceShopIntent(null); }} />}
      {loaded && !error && !product && <>{!catalog?.offer.enabled ? <p role="status" className="my-6">Oferta produktów jest obecnie niedostępna.</p> : <>{productId && <p role="status" className="my-6">Ten produkt nie jest obecnie dostępny. Wybierz inny produkt z oferty.</p>}<PhotoProductStorefront /></>}</>}
    </div>
  </main>;
}
