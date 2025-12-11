'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');
    const sessionId = searchParams.get('session_id');

    return (
        <main className="min-h-screen bg-black text-white pt-40 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl mx-auto px-6 text-center"
            >
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-8"
                >
                    <CheckCircle className="w-24 h-24 text-green-400 mx-auto" />
                </motion.div>

                <h1 className="text-5xl font-display font-bold mb-4">
                    Płatność Zakończona! 🎉
                </h1>

                <p className="text-xl text-zinc-300 mb-8">
                    Dziękujemy za zakup! Twoja karta podarunkowa jest teraz dostępna.
                </p>

                <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 mb-8">
                    <p className="text-zinc-400 mb-2">Email potwierdzający został wysłany na adres email podany przy zakupie.</p>
                    <p className="text-zinc-400 mb-6">Możesz teraz wydrukować, wysłać lub udostępnić kartę.</p>

                    <div className="space-y-3 text-left">
                        <p className="flex items-start gap-3">
                            <span className="text-green-400 font-bold">✓</span>
                            <span>Karta jest dostępna przez 30 dni</span>
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="text-green-400 font-bold">✓</span>
                            <span>Możesz wydrukować kartę w najlepszej jakości</span>
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="text-green-400 font-bold">✓</span>
                            <span>Możesz wysłać kartę mailem komuś bliskim</span>
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="text-green-400 font-bold">✓</span>
                            <span>Kod promocyjny jest ważny przez 12 miesięcy</span>
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Link
                        href={orderId ? `/karta-podarunkowa/dostep/${orderId}` : '/karta-podarunkowa'}
                        className="block px-8 py-4 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl transition-all transform hover:scale-105"
                    >
                        Przejdź do Mojej Karty →
                    </Link>

                    <Link
                        href="/karta-podarunkowa"
                        className="block px-8 py-4 border border-gold-500 text-gold-500 hover:bg-gold-500/10 font-bold rounded-xl transition-all"
                    >
                        Powróć do Sklepu
                    </Link>
                </div>

                <p className="text-zinc-500 text-sm mt-8">
                    Jeśli masz pytania, skontaktuj się z nami na: kontakt@wlasniewski.pl
                </p>
            </motion.div>
        </main>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Ładowanie...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
