'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import GiftCard from '@/components/GiftCard';
import { useCart } from '@/context/CartContext';
import { Check, ShoppingCart } from 'lucide-react';

interface GiftCardProduct {
    id: number;
    code: string;
    value: number;
    theme: string;
    price: number;
    description?: string;
    available: boolean;
    card_title?: string;
    card_description?: string;
    lowest_price_30d?: number;
}

const THEME_NAMES: Record<string, string> = {
    gold: 'Klasyczna',
    wedding: 'Ślub',
    birthday: 'Urodziny',
    'mothers-day': 'Dla mamy',
    valentines: 'Dla dwojga',
    'childrens-day': 'Rodzinna',
    christmas: 'Świąteczna',
    easter: 'Rodzinna',
    blue: 'Wieczorowa',
    green: 'Rodzinna',
    wosp: 'Specjalna',
    halloween: 'Wieczorowa'
};

const fallbackDescription = (theme: string) => {
    if (theme === 'wedding') return 'Dla pary, która sama wybierze termin i charakter sesji.';
    if (theme === 'birthday') return 'Na urodziny, jubileusz albo ważny moment bez kupowania kolejnego przedmiotu.';
    if (theme === 'mothers-day') return 'Dla mamy, która zwykle robi zdjęcia, ale zbyt rzadko jest razem z rodziną na fotografii.';
    return 'Wartość do wykorzystania na wybraną sesję fotograficzną.';
};

export default function GiftCardShop() {
    const [cards, setCards] = useState<GiftCardProduct[]>([]);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
    const { addItem } = useCart();

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const res = await fetch('/api/gift-cards/shop');
                const data = await res.json();
                const cardsData = Array.isArray(data) ? data : data.cards;
                const settingsData = Array.isArray(data) ? null : data.settings;

                setCards((cardsData || []).filter((card: GiftCardProduct) => card.available !== false));
                if (settingsData?.logoUrl) setLogoUrl(settingsData.logoUrl);
            } catch (error) {
                console.error('Failed to fetch gift cards', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCards();
    }, []);

    const themes = useMemo(
        () => Array.from(new Set(cards.map(card => card.theme))),
        [cards]
    );

    const filteredCards = selectedTheme
        ? cards.filter(card => card.theme === selectedTheme)
        : cards;

    return (
        <main className="min-h-screen bg-[#0b0908] text-stone-100">
            <section className="relative flex min-h-[620px] items-center overflow-hidden px-6 pb-20 pt-36">
                <Image
                    src="/gift-cards/velvet-premium.webp"
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                    aria-hidden="true"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-black/55" />
                <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="max-w-2xl">
                        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-stone-300">Karta podarunkowa na sesję fotograficzną</p>
                        <h1 className="font-display text-5xl font-medium leading-[0.98] tracking-tight text-stone-50 md:text-7xl">
                            Podaruj czas, z którego zostaną zdjęcia
                        </h1>
                        <p className="mt-7 max-w-xl text-lg leading-relaxed text-stone-200 md:text-xl">
                            Wybierasz wartość karty. Obdarowana osoba wybiera rodzaj sesji i dogodny termin. Po płatności PayU otrzymasz elegancką kartę gotową do wysłania lub wydrukowania.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-200">
                            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" /> termin wybierany później</span>
                            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" /> karta dostarczana e-mailem</span>
                            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" /> płatność online przez PayU</span>
                        </div>
                        <a href="#wybierz-karte" className="mt-9 inline-flex rounded-full bg-stone-100 px-7 py-3.5 font-semibold text-stone-950 transition hover:bg-white">
                            Wybierz kartę
                        </a>
                    </div>
                    <div className="mx-auto w-full max-w-xl">
                        <GiftCard
                            code="PREZENT"
                            value={750}
                            theme="gold"
                            logoUrl={logoUrl}
                            cardTitle="Sesja fotograficzna"
                            cardDescription="Czas, zdjęcia i wspomnienia"
                            hideCode
                        />
                    </div>
                </div>
            </section>

            <section className="border-y border-white/10 bg-[#100d0b] px-6 py-16">
                <div className="mx-auto max-w-6xl">
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">Dlaczego ten prezent ma sens</p>
                        <h2 className="mt-3 font-display text-3xl font-medium text-stone-50 md:text-5xl">Nie musisz znać terminu ani wybierać zdjęć za kogoś</h2>
                    </div>
                    <div className="mt-10 grid gap-5 md:grid-cols-3">
                        {[
                            ['Swoboda wyboru', 'Osoba, która dostaje kartę, sama wybiera rodzaj sesji, miejsce i dogodną datę.'],
                            ['Jasna wartość', 'Karta działa jak budżet na sesję. Jej wartość jest czytelna i można ją wykorzystać przy rezerwacji.'],
                            ['Gotowy prezent', 'Po opłaceniu dostajesz kartę e-mailem. Możesz ją przesłać od razu albo wydrukować.']
                        ].map(([title, description], index) => (
                            <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                                <div className="text-sm text-stone-500">0{index + 1}</div>
                                <h3 className="mt-5 text-xl font-semibold text-stone-50">{title}</h3>
                                <p className="mt-3 leading-relaxed text-stone-300">{description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="wybierz-karte" className="scroll-mt-24 px-6 py-20">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">Wybierz wariant</p>
                            <h2 className="mt-3 font-display text-4xl font-medium text-stone-50">Karty podarunkowe</h2>
                            <p className="mt-3 max-w-2xl text-stone-300">Wybierz oprawę i wartość. Szczegóły dla obdarowanej osoby uzupełnisz przed płatnością.</p>
                        </div>
                        {themes.length > 1 && (
                            <div className="flex flex-wrap gap-2" aria-label="Filtr wariantów kart">
                                <button
                                    onClick={() => setSelectedTheme(null)}
                                    className={`rounded-full border px-4 py-2 text-sm transition ${selectedTheme === null ? 'border-stone-100 bg-stone-100 text-stone-950' : 'border-white/15 text-stone-300 hover:border-white/35'}`}
                                >
                                    Wszystkie
                                </button>
                                {themes.map(theme => (
                                    <button
                                        key={theme}
                                        onClick={() => setSelectedTheme(theme)}
                                        className={`rounded-full border px-4 py-2 text-sm transition ${selectedTheme === theme ? 'border-stone-100 bg-stone-100 text-stone-950' : 'border-white/15 text-stone-300 hover:border-white/35'}`}
                                    >
                                        {THEME_NAMES[theme] || 'Klasyczna'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3" aria-label="Ładowanie kart">
                            {[0, 1, 2].map(item => <div key={item} className="aspect-[1.1/1] animate-pulse rounded-3xl bg-white/5" />)}
                        </div>
                    ) : filteredCards.length === 0 ? (
                        <div className="mt-12 rounded-2xl border border-white/10 p-8 text-center text-stone-300">
                            Karty są chwilowo niedostępne. Napisz do mnie, a przygotuję wariant ręcznie.
                        </div>
                    ) : (
                        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {filteredCards.map(card => {
                                const displayPrice = Math.round(card.price || card.value);
                                const displayValue = Math.round(card.value);
                                const cardName = card.card_title || THEME_NAMES[card.theme] || 'Karta podarunkowa';

                                return (
                                    <article key={card.id} className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-white/25">
                                        <GiftCard
                                            code={card.code}
                                            value={displayValue}
                                            theme={card.theme as GiftCardProduct['theme'] as any}
                                            logoUrl={logoUrl}
                                            cardTitle={cardName}
                                            cardDescription={card.card_description}
                                            hideCode
                                        />
                                        <div className="flex flex-1 flex-col px-1 pb-1 pt-6">
                                            <h3 className="text-xl font-semibold text-stone-50">{cardName}</h3>
                                            <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-300">
                                                {card.description || fallbackDescription(card.theme)}
                                            </p>
                                            <div className="mt-5 flex items-end justify-between gap-4">
                                                <div>
                                                    <div className="text-xs uppercase tracking-wider text-stone-500">Cena</div>
                                                    <div className="text-2xl font-semibold text-stone-50">{displayPrice} zł</div>
                                                </div>
                                                {displayPrice < displayValue && <div className="text-sm text-stone-500 line-through">{displayValue} zł</div>}
                                            </div>
                                            <Link
                                                href={`/karta-podarunkowa/${card.id}/kup`}
                                                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-stone-100 px-6 py-3.5 font-semibold text-stone-950 transition hover:bg-white"
                                            >
                                                Kup tę kartę
                                            </Link>
                                            <button
                                                onClick={() => addItem({
                                                    type: 'gift_card',
                                                    productId: card.id.toString(),
                                                    title: cardName,
                                                    subtitle: `Karta o wartości ${displayValue} zł`,
                                                    price: displayPrice * 100,
                                                    quantity: 1,
                                                    metadata: { cardId: card.id, theme: card.theme, value: card.value }
                                                })}
                                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm text-stone-300 transition hover:border-white/35 hover:text-white"
                                            >
                                                <ShoppingCart className="h-4 w-4" /> Dodaj do koszyka
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <section className="border-t border-white/10 bg-[#100d0b] px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <h2 className="font-display text-4xl font-medium text-stone-50">Jak kupić kartę</h2>
                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        {[
                            ['1', 'Wybierz wartość', 'Wybierz kartę pasującą do okazji i kwoty, którą chcesz podarować.'],
                            ['2', 'Dodaj dedykację', 'Wpisz dane kupującego, odbiorcy i krótką wiadomość do umieszczenia przy prezencie.'],
                            ['3', 'Opłać przez PayU', 'Po potwierdzeniu płatności karta i kod trafią na podany adres e-mail.']
                        ].map(([number, title, description]) => (
                            <article key={number} className="border-l border-stone-700 pl-6">
                                <div className="text-sm text-stone-500">{number}</div>
                                <h3 className="mt-3 text-xl font-semibold text-stone-50">{title}</h3>
                                <p className="mt-3 leading-relaxed text-stone-300">{description}</p>
                            </article>
                        ))}
                    </div>

                    <div className="mt-16 grid gap-8 border-t border-white/10 pt-12 md:grid-cols-2">
                        <div>
                            <h2 className="font-display text-3xl font-medium text-stone-50">Najczęstsze pytania</h2>
                            <p className="mt-3 text-stone-300">Jeśli potrzebujesz innej wartości lub indywidualnej wersji, napisz przed zakupem.</p>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-stone-50">Czy muszę od razu wybierać termin?</h3>
                                <p className="mt-2 text-stone-300">Nie. Termin ustala później osoba, która otrzyma kartę.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-stone-50">Czy kartę można wydrukować?</h3>
                                <p className="mt-2 text-stone-300">Tak. Otrzymasz ją w formie, którą można wysłać cyfrowo albo przygotować jako drukowany prezent.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-stone-50">Co jeśli sesja kosztuje więcej?</h3>
                                <p className="mt-2 text-stone-300">Wartość karty zostanie odjęta od ceny wybranego pakietu, a różnicę można dopłacić przy rezerwacji.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
