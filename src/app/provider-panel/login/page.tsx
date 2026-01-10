'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, Briefcase } from 'lucide-react';
import Image from 'next/image';

export default function ProviderLoginPage() {
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
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.success) {
                // Check Role
                if (data.user.role !== 'PHOTOGRAPHER') {
                    setError('To konto nie ma uprawnień dostawcy (Rola: ' + data.user.role + ')');
                    setLoading(false);
                    return;
                }

                localStorage.setItem('provider_token', data.token);
                localStorage.setItem('provider_user', JSON.stringify(data.user));
                router.push('/provider-panel');
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
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-800/40 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-gold-500/20 mb-6 shadow-xl shadow-gold-900/10">
                        <Briefcase className="text-gold-500" size={32} />
                    </div>
                    <h1 className="text-3xl font-display font-bold mb-2 tracking-tight">Panel Dostawcy</h1>
                    <p className="text-zinc-500">Event Marketplace Partner Login</p>
                </div>

                {/* Login Form */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold ml-1">Email Firmowy</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-zinc-600" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-black/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all placeholder:text-zinc-700"
                                    placeholder="partner@wlasniewski.pl"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Hasło</label>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-zinc-600" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-black/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all placeholder:text-zinc-700"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? 'Weryfikacja...' : (
                                <>
                                    Zaloguj do Panelu <ArrowRight size={18} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-zinc-600 text-sm">
                        Chcesz dołączyć jako partner? <a href="/kontakt" className="text-zinc-400 hover:text-white transition-colors underline decoration-zinc-800 underline-offset-4">Aplikuj tutaj</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
