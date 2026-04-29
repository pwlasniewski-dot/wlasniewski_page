'use client';

/**
 * /foto-wyzwanie/wejdz?token=...
 *
 * Strona pośrednicząca: czyta token z URL, wymienia go na sesyjny client_token
 * przez /api/photo-challenge/magic-login i przekierowuje do panelu.
 *
 * Klient klika 1 raz w mailu — jest zalogowany. Bez hasła.
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, AlertTriangle } from 'lucide-react';

export default function MagicEnterPage() {
    const params = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState<string>('');

    useEffect(() => {
        const token = params.get('token');
        if (!token) {
            setErrorMsg('Brak tokenu w linku. Skontaktuj się z fotografem, aby otrzymać nowy.');
            setStatus('error');
            return;
        }
        (async () => {
            try {
                const res = await fetch(`/api/photo-challenge/magic-login?token=${encodeURIComponent(token)}`);
                const data = await res.json();
                if (data.success && data.token) {
                    localStorage.setItem('client_token', data.token);
                    // Mirror dla zgodności z resztą strefy klienta (PDF/oferty)
                    localStorage.setItem('user_token', data.token);
                    router.replace(data.redirectTo || '/foto-wyzwanie/panel');
                } else {
                    setErrorMsg(data.error || 'Link wygasł lub jest nieprawidłowy.');
                    setStatus('error');
                }
            } catch {
                setErrorMsg('Błąd sieci. Spróbuj ponownie za chwilę.');
                setStatus('error');
            }
        })();
    }, [params, router]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white flex items-center justify-center px-4 py-20">
            <div className="max-w-md w-full text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 mb-4">
                    {status === 'loading'
                        ? <Trophy className="text-gold-500 animate-pulse" size={32} />
                        : <AlertTriangle className="text-amber-400" size={32} />}
                </div>
                {status === 'loading' ? (
                    <>
                        <h1 className="text-2xl font-display font-bold mb-2">Otwieram Twój panel…</h1>
                        <p className="text-zinc-400 text-sm">Sekunda. Logujemy Cię automatycznie.</p>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-display font-bold mb-2">Nie udało się otworzyć linku</h1>
                        <p className="text-zinc-400 text-sm mb-6">{errorMsg}</p>
                        <div className="flex flex-col gap-3">
                            <Link href="/foto-wyzwanie/login" className="px-5 py-3 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg">
                                Spróbuj zalogować się hasłem
                            </Link>
                            <Link href="/kontakt" className="text-zinc-400 hover:text-white text-sm">
                                Skontaktuj się z fotografem
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
