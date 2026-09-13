'use client';

import { defaultPublicOffer, type PublicShopOffer } from '@/lib/galleries/public-offer';
import type { PrintFormat, ShopConfig } from '@/lib/galleries/merchandise';

type Product = { id: number; title: string; price: number; is_active: boolean };
const input = 'mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-base text-white';
const button = 'min-h-11 rounded-xl border border-white/20 px-3 py-2 text-sm disabled:opacity-30';

export default function PublicShopOfferSettings({ value, formats, products, shopEnabled, delivery, productRules, disabled, onChange }: {
    value?: PublicShopOffer; formats: PrintFormat[]; products: Product[]; shopEnabled: boolean; delivery: ShopConfig['delivery']; productRules: ShopConfig['productRules']; disabled: boolean; onChange: (value: PublicShopOffer) => void;
}) {
    const offer = value || defaultPublicOffer();
    const edit = (patch: Partial<PublicShopOffer>) => onChange({ ...offer, ...patch });
    const move = <T,>(list: T[], index: number, direction: number) => {
        const result = [...list];
        [result[index], result[index + direction]] = [result[index + direction], result[index]];
        return result;
    };
    const deliverable = (id: number) => (productRules[String(id)]?.deliveryMethods || ['locker', 'courier'] as const).some(method => delivery[method].enabled);
    const ready = products.filter(p => offer.productIds.includes(p.id) && p.is_active && p.price > 0 && deliverable(p.id)).length + formats.filter(f => offer.formatIds.includes(f.id) && f.active && f.unitAmount > 0).length;
    return <fieldset disabled={disabled} className="min-w-0 space-y-5 rounded-2xl border border-amber-200/20 bg-amber-200/[0.025] p-4 sm:p-6">
        <legend className="px-2 text-lg font-semibold text-white">Sklep publiczny i panel klienta</legend>
        <p className="text-sm leading-relaxed text-zinc-400">Ten sam katalog, te same ceny, jeden koszyk w prywatnej galerii. Wybierz produkty pokazywane obok kart podarunkowych oraz w koncie klienta. Nie trzeba przypisywać oferty osobno każdej osobie.</p>
        <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={offer.enabled} onChange={e => edit({ enabled: e.target.checked })} />Pokaż wspólną ofertę w sklepie i koncie klienta</label>
        <p role="status" className="rounded-xl border border-white/10 p-3 text-sm text-amber-100">{!shopEnabled ? 'Wspólny sklep jest wyłączony. Możesz przygotować prezentację; klient jeszcze jej nie zobaczy.' : !offer.enabled ? 'Prezentacja ukryta. Sprzedaż w aktywnych galeriach pozostaje bez zmian.' : `${ready} pozycji gotowych do prezentacji po zapisie. Nieaktywne szkice i ceny 0 zł pozostają ukryte.`}</p>
        <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">Tytuł prezentacji<input className={input} maxLength={200} value={offer.title} onChange={e => edit({ title: e.target.value })} /></label>
            <label className="text-sm">Przycisk wyboru zdjęć<input className={input} maxLength={80} value={offer.buttonLabel} onChange={e => edit({ buttonLabel: e.target.value })} /></label>
        </div>
        <label className="block text-sm">Wprowadzenie do produktów<textarea className={input} rows={3} maxLength={2000} value={offer.introduction} onChange={e => edit({ introduction: e.target.value })} /></label>
        <label className="block text-sm">Komunikat klienta bez galerii<textarea className={input} rows={2} maxLength={2000} value={offer.emptyMessage} onChange={e => edit({ emptyMessage: e.target.value })} /></label>
        <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">Zdjęcie prezentujące odbitki — adres<input type="url" className={input} value={offer.printImageUrl} onChange={e => edit({ printImageUrl: e.target.value })} /><span className="mt-2 block text-xs text-zinc-400">Użyj własnego zdjęcia lub materiału, do którego masz uprawnienia. Pusty adres usuwa zdjęcie.</span></label>
            <label className="text-sm">Opis alternatywny zdjęcia odbitek<input className={input} maxLength={200} value={offer.printImageAlt} onChange={e => edit({ printImageAlt: e.target.value })} /></label>
            <label className="text-sm">Układ prezentacji<select className={input} value={offer.layout} onChange={e => edit({ layout: e.target.value as PublicShopOffer['layout'] })}><option value="cards">Spokojna siatka kart</option><option value="editorial">Większe zdjęcia — dwie kolumny</option></select></label>
        </div>
        <p className="text-xs leading-relaxed text-zinc-400">Nazwę, opis, cenę i zdjęcia każdego produktu edytujesz na jego karcie poniżej. Podgląd pokazuje pełne zdjęcie bez przycinania na telefonie i komputerze. Przycisk prowadzi do własnej galerii klienta; nie udostępnia cudzych zdjęć.</p>
        <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3"><h4 className="font-semibold text-white">Formaty w prezentacji</h4>{formats.map(f => <label key={f.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 p-3 text-sm"><input type="checkbox" checked={offer.formatIds.includes(f.id)} onChange={e => edit({ formatIds: e.target.checked ? [...offer.formatIds, f.id] : offer.formatIds.filter(id => id !== f.id) })} /><span>{f.label} · {f.paper}<span className="block text-xs text-zinc-400">{f.active && f.unitAmount > 0 ? 'Aktywny format' : 'Szkic — uzupełnij cenę i aktywuj'}</span></span></label>)}{!formats.length && <p className="text-sm text-zinc-400">Najpierw zaimportuj propozycje startowe lub dodaj format.</p>}
                {offer.formatIds.map((id, index) => <div key={id} className="flex items-center gap-2 text-xs"><span className="min-w-0 flex-1">{index + 1}. {formats.find(f => f.id === id)?.label || 'Usunięty format'}</span><button type="button" className={button} disabled={index === 0} aria-label={`Przesuń format ${id} wyżej`} onClick={() => edit({ formatIds: move(offer.formatIds, index, -1) })}>↑</button><button type="button" className={button} disabled={index === offer.formatIds.length - 1} aria-label={`Przesuń format ${id} niżej`} onClick={() => edit({ formatIds: move(offer.formatIds, index, 1) })}>↓</button></div>)}
            </div>
            <div className="space-y-3"><h4 className="font-semibold text-white">Produkty w prezentacji</h4>{products.map(p => <label key={p.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 p-3 text-sm"><input type="checkbox" checked={offer.productIds.includes(p.id)} onChange={e => edit({ productIds: e.target.checked ? [...offer.productIds, p.id] : offer.productIds.filter(id => id !== p.id) })} /><span>{p.title}<span className="block text-xs text-zinc-400">{p.is_active && p.price > 0 ? 'Aktywny produkt' : 'Szkic — uzupełnij cenę i aktywuj'}</span></span></label>)}{!products.length && <p className="text-sm text-zinc-400">Najpierw dodaj produkty z nPhoto.</p>}
                {offer.productIds.map((id, index) => <div key={id} className="flex items-center gap-2 text-xs"><span className="min-w-0 flex-1">{index + 1}. {products.find(p => p.id === id)?.title || `Produkt #${id}`}</span><button type="button" className={button} disabled={index === 0} aria-label={`Przesuń produkt ${id} wyżej`} onClick={() => edit({ productIds: move(offer.productIds, index, -1) })}>↑</button><button type="button" className={button} disabled={index === offer.productIds.length - 1} aria-label={`Przesuń produkt ${id} niżej`} onClick={() => edit({ productIds: move(offer.productIds, index, 1) })}>↓</button></div>)}
            </div>
        </div>
        <p className="text-xs text-zinc-400">Kolejność list jest kolejnością prezentacji. Zmiany zapisuje przycisk „Zapisz ustawienia sklepu”.</p>
        <a href="/karta-podarunkowa#produkty-fotograficzne" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-amber-200 underline underline-offset-4">Zobacz zapisany sklep ↗</a>
    </fieldset>;
}
