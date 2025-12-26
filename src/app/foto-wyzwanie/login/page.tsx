'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Lock, Mail, ArrowRight } from 'lucide-react';

export default function ChallengeLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/challenge-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.success) {
                // Store client token separately from admin token
                localStorage.setItem('client_token', data.token);
                router.push('/foto-wyzwanie/panel');
            } else {
                setError(data.error || 'Nieprawidłowe dane logowania');
            }
        } catch (err) {
            setError('Błąd serwera. Spróbuj ponownie później.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white flex items-center justify-center px-4 py-20">
            <div className="max-w-md w-full">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 mb-4">
                        <Trophy className="text-gold-500" size={32} />
                    </div>
                    <h1 className="text-3xl font-display font-bold mb-2">Panel Wyzwania</h1>
                    <p className="text-zinc-400">Zaloguj się, aby zobaczyć swoje zdjęcia</p>
                </div>

                {/* Login Form */}
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                                <Mail size={16} /> Adres E-mail
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
                                placeholder="twój@email.pl"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <Lock size={16} /> Hasło
                                </label>
                                <Link href="/foto-wyzwanie/reset-hasla" className="text-xs text-gold-500 hover:text-gold-400">
                                    Nie pamiętasz?
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {loading ? 'Logowanie...' : (
                                <>
                                    Zaloguj się <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Help / Footer */}
                <div className="mt-8 text-center text-sm text-zinc-500">
                    <p>Brałeś udział w wyzwaniu, ale nie masz dostępu?</p>
                    <Link href="/kontakt" className="text-gold-500 hover:text-gold-400 transition-colors font-medium">
                        Skontaktuj się z fotografem
                    </Link>
                </div>

                <div className="mt-12 text-center">
                    <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-sm">
                        ← Wróć do strony głównej
                    </Link>
                </div>
            </div>
        </div>
    );
}
