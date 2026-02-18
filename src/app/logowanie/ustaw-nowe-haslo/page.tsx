'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Hasła nie są identyczne.');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage('Hasło musi mieć co najmniej 6 znaków.');
            return;
        }

        setStatus('loading');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setTimeout(() => router.push('/logowanie'), 3000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Wystąpił błąd.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Błąd połączenia z serwerem.');
        }
    };

    if (!token) {
        return (
            <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Brak tokenu</h2>
                <p className="text-zinc-400 mb-6">Link do resetowania hasła jest nieprawidłowy.</p>
                <Link href="/logowanie/przypomnij-haslo" className="text-gold-400 hover:underline">Zawnioskuj ponownie</Link>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-8 rounded-xl flex flex-col items-center text-center">
                <CheckCircle2 className="w-12 h-12 mb-4" />
                <h2 className="text-xl font-bold mb-2">Hasło zmienione!</h2>
                <p className="text-sm opacity-80 mb-6">Twoje nowe hasło zostało zapisane. Za chwilę zostaniesz przekierowany do logowania.</p>
                <Link href="/logowanie" className="text-white font-bold underline">Przejdź do logowania</Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-xs uppercase font-bold text-zinc-500 mb-2">Nowe Hasło</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 pl-10 pr-10 focus:border-gold-500 focus:outline-none transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-xs uppercase font-bold text-zinc-500 mb-2">Potwierdź Hasło</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 pl-10 focus:border-gold-500 focus:outline-none transition-all"
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
                {status === 'loading' ? 'Zmienianie...' : 'Ustaw Nowe Hasło'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-gold-600 to-gold-300"></div>

                <h1 className="text-3xl font-bold text-white mb-2">Nowe hasło</h1>
                <p className="text-zinc-400 text-sm mb-8">
                    Ustaw silne, bezpieczne hasło dla swojego konta.
                </p>

                <Suspense fallback={<div className="text-center py-12 text-zinc-500">Wczytywanie...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </main>
    );
}
