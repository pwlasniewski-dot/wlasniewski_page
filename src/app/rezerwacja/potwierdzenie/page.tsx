'use client';

import React from 'react';
import Link from 'next/link';

export default function PotwierdzeniePage() {
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
                                    <strong>Płatność</strong> - Możesz dokonać płatności w panelu rezerwacji lub poprzez link wysłany w emailu
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">✓</span>
                                <span>
                                    <strong>Potwierdzenie fotografki</strong> - Fotografka potwierdzi rezerwację najszybciej jak to będzie możliwe
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
                            <li>• Rezerwacja zostanie potwierdzona po dokonaniu płatności</li>
                            <li>• Możliwość anulowania rezerwacji do 14 dni przed terminem</li>
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
                            href="mailto:rezerwacje@wlasniewski.pl" 
                            className="text-amber-400 hover:text-amber-300 font-medium underline"
                        >
                            rezerwacje@wlasniewski.pl
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
                                <li>• Słuchaj wskazówek fotografki</li>
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
