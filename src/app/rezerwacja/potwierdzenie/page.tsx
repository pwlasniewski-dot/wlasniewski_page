'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PotwierdzeniePage() {
    const [verification, setVerification] = useState<'checking' | 'confirmed' | 'failed'>('checking');
    const [orderKind, setOrderKind] = useState<'booking' | 'gift_card' | null>(null);
    const [bookingSettlement, setBookingSettlement] = useState<'paid' | 'deposit' | 'covered'>('paid');

    useEffect(() => {
        let active = true;
        let timer: number | undefined;
        const params = new URLSearchParams(window.location.search);
        const order = params.get('order') || '';
        if (params.get('status') !== 'success' || !/^CART_[0-9]{10,20}_[A-Z0-9]{5}$/.test(order)) {
            setVerification('failed');
            return;
        }

        const verify = async (attempt: number) => {
            try {
                const response = await fetch(`/api/bookings/payment-status?order=${encodeURIComponent(order)}`, { cache: 'no-store' });
                const result = await response.json().catch(() => null);
                if (!active) return;
                if (response.ok && result?.state === 'confirmed') {
                    setOrderKind(result.kind === 'gift_card' ? 'gift_card' : 'booking');
                    if (result.kind === 'booking') {
                        setBookingSettlement(result.settlement === 'deposit' ? 'deposit' : result.settlement === 'covered' ? 'covered' : 'paid');
                    }
                    setVerification('confirmed');
                    if (result.kind === 'booking' && (window as any).gtag) {
                        const marker = `ads-booking-conversion:${order}`;
                        if (sessionStorage.getItem(marker) !== 'sent') {
                            (window as any).gtag('event', 'conversion', {
                                send_to: 'AW-17548893646/MKMoCJm3h-YbEM67-69B',
                                transaction_id: order,
                            });
                            sessionStorage.setItem(marker, 'sent');
                        }
                    }
                    return;
                }
                if (result?.state === 'failed' || result?.state === 'invalid') {
                    setVerification('failed');
                    return;
                }
            } catch {
                // Webhook and navigation can cross; retry a short while.
            }
            if (active && attempt < 12) timer = window.setTimeout(() => void verify(attempt + 1), 1500);
            else if (active) setVerification('failed');
        };

        void verify(0);
        return () => {
            active = false;
            if (timer) window.clearTimeout(timer);
        };
    }, []);

    if (verification !== 'confirmed' || orderKind === 'gift_card') {
        const isGiftCard = verification === 'confirmed' && orderKind === 'gift_card';
        return (
            <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 py-24 px-4 text-white">
                <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/70 p-10 text-center">
                    <div className="mb-5 text-5xl">{isGiftCard ? '🎁' : verification === 'checking' ? '⏳' : '⚠️'}</div>
                    <h1 className="text-3xl font-bold">
                        {isGiftCard ? 'Karta podarunkowa została opłacona' : verification === 'checking' ? 'Sprawdzamy płatność' : 'Nie potwierdziliśmy płatności'}
                    </h1>
                    <p className="mt-4 leading-relaxed text-zinc-300">
                        {isGiftCard
                            ? 'Szczegóły i dostęp do karty otrzymasz na podany adres e-mail.'
                            : verification === 'checking'
                                ? 'Potwierdzenie z PayU może potrwać kilka sekund. Nie zamykaj tej strony.'
                                : 'Jeśli środki zostały pobrane, skontaktuj się z nami — sprawdzimy zamówienie ręcznie.'}
                    </p>
                    <Link href="/" className="mt-8 inline-flex rounded-lg bg-amber-600 px-7 py-3 font-semibold hover:bg-amber-500">Strona główna</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 py-20 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Success Card */}
                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-12 border border-green-800/50 text-center">
                    <div className="mb-6">
                        <div className="text-6xl mb-4">✅</div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Rezerwacja Potwierdzona!
                        </h1>
                        <p className="text-zinc-300 text-lg">
                            Twoja rezerwacja została przyjęta
                        </p>
                    </div>

                    {/* Details */}
                    <div className="bg-zinc-800/50 rounded-xl p-8 mb-8 text-left">
                        <h2 className="text-xl font-bold text-white mb-4">Co dalej?</h2>
                        <ul className="space-y-3 text-zinc-300">
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">✓</span>
                                <span>
                                    <strong>Email potwierdzenia</strong> - Wysłaliśmy szczegóły rezerwacji na Twój adres email
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">✓</span>
                                <span>
                                    <strong>{bookingSettlement === 'deposit' ? 'Zaliczka' : bookingSettlement === 'covered' ? 'Rozliczenie' : 'Płatność'}</strong> - {bookingSettlement === 'deposit'
                                        ? 'Zaliczka została potwierdzona. Informację o pozostałej kwocie otrzymasz e-mailem'
                                        : bookingSettlement === 'covered'
                                            ? 'Rezerwacja została rozliczona bez dopłaty dzięki wykorzystanemu benefitowi'
                                            : 'Płatność została potwierdzona przez operatora'}
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">✓</span>
                                <span>
                                    <strong>Termin</strong> - Termin został zapisany w kalendarzu rezerwacji
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">✓</span>
                                <span>
                                    <strong>Wiadomości</strong> - Będziesz otrzymywać aktualizacje na podany adres email
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-amber-900/20 rounded-xl p-8 mb-8 border border-amber-800/30">
                        <h3 className="text-lg font-bold text-amber-200 mb-4">⚠️ Ważne Informacje</h3>
                        <ul className="space-y-2 text-amber-100 text-sm text-left">
                            <li>• {bookingSettlement === 'deposit'
                                ? 'Termin jest zarezerwowany po wpłacie zaliczki; szczegóły dopłaty znajdziesz w wiadomości e-mail'
                                : bookingSettlement === 'covered'
                                    ? 'Rezerwacja jest potwierdzona i nie wymagała płatności u operatora'
                                    : 'Rezerwacja i płatność są potwierdzone'}</li>
                            <li>• Warunki zmiany lub anulowania określa regulamin zaakceptowany przy zamówieniu</li>
                            <li>• W przypadku pytań kontaktuj się mailowo lub telefonicznie</li>
                            <li>• Sprawdź folder SPAM w emailu jeśli nie widzisz potwierdzenia</li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="mb-8">
                        <p className="text-zinc-300 mb-2">
                            Masz pytania?
                        </p>
                        <a
                            href="mailto:pwlasniewski@gmail.com"
                            className="text-amber-400 hover:text-amber-300 font-medium underline"
                        >
                            pwlasniewski@gmail.com
                        </a>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/rezerwacja"
                            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Nowa Rezerwacja
                        </Link>
                        <Link
                            href="/"
                            className="px-8 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Strona Główna
                        </Link>
                    </div>
                </div>

                {/* Additional Info Section */}
                <div className="mt-12 bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800">
                    <h2 className="text-2xl font-bold text-white mb-6">Przygotowanie do Sesji</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-bold text-amber-400 mb-3">📸 Przed Sesją</h3>
                            <ul className="space-y-2 text-zinc-300 text-sm">
                                <li>• Przygotuj odpowiednią odzież</li>
                                <li>• Zadbaj o makijaż i stylizację</li>
                                <li>• Połóż się wcześniej aby wyglądać świeżo</li>
                                <li>• Przyjdź 10 minut wcześniej</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-amber-400 mb-3">🎯 Podczas Sesji</h3>
                            <ul className="space-y-2 text-zinc-300 text-sm">
                                <li>• Bądź naturalny i uśmiechnięty</li>
                                <li>• Słuchaj wskazówek fotografa</li>
                                <li>• Propozycje pozycji zawsze mile widziane</li>
                                <li>• Relaksuj się i baw się dobrze!</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
