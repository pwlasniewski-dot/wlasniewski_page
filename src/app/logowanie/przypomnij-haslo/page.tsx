'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message || 'Wysłaliśmy instrukcje na Twój e-mail.');
            } else {
                setStatus('error');
                setMessage(data.error || 'Wystąpił błąd. Spróbuj ponownie.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Błąd połączenia z serwerem.');
        }
    };

    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-gold-600 to-gold-300"></div>

                <Link href="/logowanie" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-8 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Powrót do logowania
                </Link>

                <h1 className="text-3xl font-bold text-white mb-2">Zapomniałeś hasła?</h1>
                <p className="text-zinc-400 text-sm mb-8">
                    Wpisz swój adres e-mail, a wyślemy Ci instrukcje resetowania hasła.
                </p>

                {status === 'success' ? (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-6 rounded-xl flex flex-col items-center text-center">
                        <CheckCircle2 className="w-12 h-12 mb-4" />
                        <p className="font-medium mb-1">Sprawdź skrzynkę!</p>
                        <p className="text-sm opacity-80">{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase font-bold text-zinc-500 mb-2">Adres E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="twoj@email.pl"
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 pl-10 focus:border-gold-500 focus:outline-none transition-all placeholder:text-zinc-800"
                                />
                            </div>
                        </div>

                        {status === 'error' && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/5 p-3 rounded-lg border border-red-400/10">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-gold-500 text-black font-bold py-4 rounded-lg hover:bg-gold-400 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            {status === 'loading' ? 'Wysyłanie...' : 'Wyślij instrukcje'}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
