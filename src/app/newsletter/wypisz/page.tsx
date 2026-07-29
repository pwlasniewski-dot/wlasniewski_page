'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

function NewsletterUnsubscribeContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setStatus('loading');

        const response = await fetch('/api/newsletter/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        }).catch(() => null);

        setStatus(response?.ok ? 'done' : 'error');
    };

    return (
        <main className="min-h-screen bg-zinc-950 px-4 pb-20 pt-36 text-white">
            <section className="mx-auto max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900/70 p-7 shadow-2xl sm:p-10">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-gold-400">
                    Ustawienia wiadomości
                </p>
                <h1 className="mb-4 text-3xl font-bold">Rezygnacja z newslettera</h1>

                {status === 'done' ? (
                    <>
                        <p className="mb-8 leading-relaxed text-zinc-300">
                            Zgoda marketingowa została wycofana. Nie będziesz otrzymywać newslettera
                            ani wiadomości promocyjnych.
                        </p>
                        <Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-gold-500 px-6 font-bold text-black">
                            Wróć na stronę
                        </Link>
                    </>
                ) : (
                    <form onSubmit={submit}>
                        <p className="mb-7 leading-relaxed text-zinc-300">
                            Kliknij poniżej, aby potwierdzić wycofanie dobrowolnej zgody marketingowej.
                            Nie wpływa to na wiadomości dotyczące złożonych zamówień, umów i rezerwacji.
                        </p>
                        {!token && (
                            <p className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                                Link jest niekompletny. Skorzystaj z odnośnika otrzymanego w wiadomości.
                            </p>
                        )}
                        {status === 'error' && (
                            <p className="mb-5 text-sm text-red-300">
                                Nie udało się zapisać zmiany. Spróbuj ponownie.
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={!token || status === 'loading'}
                            className="min-h-12 w-full rounded-xl bg-gold-500 px-6 font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Zapisywanie…' : 'Wypisz mnie'}
                        </button>
                    </form>
                )}
            </section>
        </main>
    );
}

export default function NewsletterUnsubscribePage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-zinc-950" />}>
            <NewsletterUnsubscribeContent />
        </Suspense>
    );
}
