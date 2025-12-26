'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Copy, Share2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

import { useState, useEffect } from 'react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [inviteLink, setInviteLink] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setInviteLink(`${window.location.origin}/foto-wyzwanie/invite/${id}`);
        }
    }, [id]);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        toast.success('Link skopiowany do schowka!');
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-20">
            <div className="max-w-xl w-full text-center">
                <div className="mb-8 flex justify-center">
                    <div className="bg-green-500/20 p-6 rounded-full border-2 border-green-500/50">
                        <CheckCircle size={64} className="text-green-500" />
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-gold-400 to-green-400 bg-clip-text text-transparent">
                    Wyzwanie Wysłane! 🎉
                </h1>
                <p className="text-xl text-zinc-400 mb-10 font-light">
                    Płatność została potwierdzona. Twoja propozycja sesji jest już gotowa do zaakceptowania.
                </p>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-10 text-left">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Twój unikalny link do wyzwania:</h3>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-3 font-mono text-gold-400 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                            {inviteLink}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors"
                            title="Kopiuj link"
                        >
                            <Copy size={20} />
                        </button>
                    </div>
                    <p className="mt-4 text-xs text-zinc-500 italic">
                        💡 Możesz przesłać ten link bezpośrednio przez Messengera, WhatsAppa lub SMS. Link został również wysłany e-mailem do osoby zapraszanej.
                    </p>
                </div>

                {/* New Section: Tracking & Rewards */}
                <div className="bg-gradient-to-br from-gold-500/10 to-pink-500/10 border border-gold-500/20 rounded-2xl p-8 mb-10 text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-gold-500/10 transition-colors" />
                    <h2 className="text-2xl font-bold text-white mb-4">Chcesz wiedzieć, kiedy zaakceptuje? 🧐</h2>
                    <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
                        Załóż konto, aby śledzić status wyzwania w czasie rzeczywistym! Otrzymasz powiadomienia o akceptacji terminu oraz bezpośredni dostęp do gotowej galerii zdjęć, gdy tylko będzie gotowa.
                    </p>
                    <div className="flex flex-col gap-4 items-center">
                        <Link
                            href="/foto-wyzwanie/login"
                            className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors text-sm"
                        >
                            Zaloguj się / Załóż konto
                        </Link>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                            🎁 TWOJA NAGRODA: PEŁNA KOLEKCJA CYFROWA W CENIE!
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                    <Link
                        href="/foto-wyzwanie"
                        className="flex-1 py-4 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        Wróć do wyzwań
                    </Link>
                    <Link
                        href="/"
                        className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-2"
                    >
                        Strona główna <ArrowRight size={18} />
                    </Link>
                </div>

                {/* Legal Links */}
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs text-zinc-600 border-t border-zinc-800 pt-8">
                    <Link href="/regulamin" className="hover:text-gold-400 transition-colors">Regulamin wyzwań</Link>
                    <Link href="/polityka-prywatnosci" className="hover:text-gold-400 transition-colors">Polityka prywatności</Link>
                    <Link href="/polityka-prywatnosci#rodo" className="hover:text-gold-400 transition-colors">Informacja RODO</Link>
                </div>
            </div>
        </div>
    );
}

export default function PhotoChallengeSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-gold-400">Ładowanie...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
