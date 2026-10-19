'use client';

import { useEffect, useState } from 'react';
import GalleryShoppingPanel from '@/components/galleries/GalleryShoppingPanel';
import type { CartItem, CartPhoto } from '@/context/CartContext';

/** Read current credentials from their existing session store, never from basket metadata. */
export function currentPhotoCheckoutHeaders(endpoint: string): Record<string, string> {
    try {
        const participantId = /^\/api\/galleries\/group\/participant\/([1-9]\d*)\/shop$/.exec(endpoint)?.[1];
        const token = participantId
            ? JSON.parse(localStorage.getItem(`group_participant_${participantId}`) || 'null')?.token
            : localStorage.getItem('client_token') || localStorage.getItem('user_token');
        return typeof token === 'string' && token ? { Authorization: `Bearer ${token}` } : {};
    } catch { return {}; }
}
export default function PhotoCartCheckout({ items, compact, endpoint }: { items: CartItem[]; compact: boolean; endpoint: string }) {
    const [headers, setHeaders] = useState<Record<string, string>>({});
    const [ready, setReady] = useState(false);
    const [password, setPassword] = useState('');
    const [appliedPassword, setAppliedPassword] = useState('');
    useEffect(() => {
        const refresh = () => { setHeaders(currentPhotoCheckoutHeaders(endpoint)); setReady(true); };
        refresh(); window.addEventListener('focus', refresh);
        return () => window.removeEventListener('focus', refresh);
    }, [endpoint]);
    const photos = [...new Map(items.flatMap(item => item.metadata.photos as CartPhoto[]).map(photo => [photo.id, photo])).values()];
    const personalization = photos.some(photo => photo.file_url.startsWith('/api/shop/personalization/photos/'));
    const galleryLink = endpoint.includes('/group/participant/') ? `/galeria/grupowa?participant=${endpoint.split('/')[5]}` : `/galeria/${endpoint.split('/')[3]}`;
    return <main className={`min-h-screen bg-stone-50 px-4 pb-20 text-stone-900 ${compact ? 'pt-10' : 'pt-36'}`}>
        <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-semibold">Produkty ze zdjęciami — kasa</h1>
            <p className="mt-2 mb-5 text-sm text-stone-600">Sprawdź produkty, ilość i dostawę. Cena zamówienia jest wyliczana z aktualnej oferty.</p>
            <a className="underline" href={personalization ? '/sklep/personalizacja' : galleryLink}>Dodaj lub zmień zdjęcia</a>
            {!personalization && !endpoint.includes('/group/participant/') && <details className="my-4"><summary className="cursor-pointer">Galeria chroniona hasłem</summary><form onSubmit={event => { event.preventDefault(); setAppliedPassword(password); }} className="mt-3 flex gap-3"><label>Hasło galerii<input type="password" value={password} onChange={event => setPassword(event.target.value)} className="ml-3 rounded border p-2" /></label><button type="submit" className="rounded border px-3">Odblokuj galerię</button></form></details>}
            {ready && <GalleryShoppingPanel endpoint={endpoint} headers={{ ...headers, ...(appliedPassword ? { 'x-gallery-password': appliedPassword } : {}) }} photos={photos} inline checkoutOnly />}
        </div>
    </main>;
}
