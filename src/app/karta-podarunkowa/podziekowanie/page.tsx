'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

function ThankYouContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const token = searchParams.get('token');


    return (
        <div className="min-h-screen bg-black text-white pt-32 px-4 flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full text-center"
            >
                <div className="w-20 h-20 bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-4xl font-display font-bold text-gold-400 mb-4">Dziękujemy za zamówienie!</h1>
                <p className="text-xl text-zinc-300 mb-8">
                    Twoje zamówienie {orderId ? `#${orderId}` : ''} zostało przyjęte.
                </p>

                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl mb-8 text-left">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gold-400"></span>
                        Co teraz?
                    </h3>
                    <ul className="space-y-4 text-zinc-400">
                        <li className="flex gap-3">
                            <span className="text-gold-500 font-bold">1.</span>
                            <span>Na Twój adres email wysłaliśmy potwierdzenie zamówienia.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-gold-500 font-bold">2.</span>
                            <span>Gdy płatność zostanie zaksięgowana, otrzymasz drugi email z linkiem do Twojej karty.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-gold-500 font-bold">3.</span>
                            <span>Możesz też pobrać kartę bezpośrednio tutaj (jeśli płatność przeszła).</span>
                        </li>
                    </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-8 py-3 bg-zinc-800 text-white rounded-full font-semibold hover:bg-zinc-700 transition-colors"
                    >
                        Wróć na stronę główną
                    </Link>

                    {token && (
                        <Link
                            href={`/karta-podarunkowa/dostep/${token}`}
                            className="px-8 py-3 bg-gold-500 text-black rounded-full font-semibold hover:bg-gold-400 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>Przejdź do Mojej Karty</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    )}
                </div>

                <div className="mt-12 pt-8 border-t border-zinc-800">
                    <h3 className="text-xl font-bold text-white mb-4">Chcesz mieć dostęp do swoich kart w jednym miejscu?</h3>
                    <p className="text-zinc-400 mb-6">Załóż darmowe konto klienta, aby przeglądać historię zamówień i pobierać karty w dowolnym momencie.</p>
                    <div className="flex justify-center gap-4">
                        <Link href="/rejestracja" className="text-gold-400 hover:text-gold-300 font-semibold underline underline-offset-4">Załóż konto</Link>
                        <span className="text-zinc-600">lub</span>
                        <Link href="/logowanie" className="text-white hover:text-zinc-300 font-semibold">Zaloguj się</Link>
                    </div>
                </div>

            </motion.div>
        </div>
    );
}

export default function ThankYouPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Ładowanie...</div>}>
            <ThankYouContent />
        </Suspense>
    );
}
