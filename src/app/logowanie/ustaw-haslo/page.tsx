'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function SetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Brak tokenu. Skontaktuj się z fotografem.');
        }
    }, [token]);

    const requirements = [
        { label: 'Min. 8 znaków', ok: password.length >= 8 },
        { label: 'Wielka litera', ok: /[A-Z]/.test(password) },
        { label: 'Mała litera', ok: /[a-z]/.test(password) },
        { label: 'Znak specjalny', ok: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    const isValid = requirements.every(r => r.ok) && password === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push('/logowanie'), 3000);
            } else {
                setError(data.error || 'Wystąpił błąd. Spróbuj ponownie.');
            }
        } catch {
            setError('Błąd połączenia z serwerem.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Hasło ustawione!</h2>
                <p className="text-zinc-400 mb-6">Za chwilę zostaniesz przekierowany do strony logowania...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/40 rounded-xl p-4">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm text-zinc-400">Nowe hasło</label>
                <div className="relative">
                    <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className={`w-full bg-black border rounded-xl px-4 py-3 pr-12 focus:outline-none transition-colors text-white ${password ? (requirements.every(r => r.ok) ? 'border-green-500/50 focus:border-green-500' : 'border-red-500/40 focus:border-red-500') : 'border-zinc-700 focus:border-gold-500'
                            }`}
                        placeholder="Minimum 8 znaków"
                        required
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {password && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 grid grid-cols-2 gap-2"
                >
                    {requirements.map(r => (
                        <span key={r.label} className={`flex items-center gap-1.5 text-[11px] ${r.ok ? 'text-green-500' : 'text-zinc-500'}`}>
                            {r.ok ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-1 h-1 bg-zinc-600 rounded-full inline-block" />}
                            {r.label}
                        </span>
                    ))}
                </motion.div>
            )}

            <div className="space-y-2">
                <label className="text-sm text-zinc-400">Powtórz hasło</label>
                <div className="relative">
                    <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className={`w-full bg-black border rounded-xl px-4 py-3 pr-12 focus:outline-none transition-colors text-white ${confirmPassword ? (password === confirmPassword ? 'border-green-500/50 focus:border-green-500' : 'border-red-500/40 focus:border-red-500') : 'border-zinc-700 focus:border-gold-500'
                            }`}
                        placeholder="Powtórz hasło"
                        required
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-400">Hasła nie pasują do siebie.</p>
                )}
            </div>

            <button
                type="submit"
                disabled={!isValid || loading || !token}
                className="w-full bg-gold-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 hover:bg-gold-400 shadow-xl shadow-gold-500/10 disabled:shadow-none"
            >
                {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                ) : (
                    <><ShieldCheck className="w-5 h-5" /> Ustaw hasło i zaloguj się</>
                )}
            </button>
        </form>
    );
}

export default function SetPasswordPage() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-20">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gold-500/10 border border-gold-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-7 h-7 text-gold-400" />
                    </div>
                    <h1 className="text-3xl font-display font-bold mb-2 tracking-tight">Ustaw nowe hasło</h1>
                    <p className="text-zinc-500 text-sm">Twoje konto zostało właśnie utworzone przez fotografa.<br />Ustaw swoje hasło, aby się zalogować.</p>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8">
                    <Suspense fallback={<div className="text-zinc-400 text-center py-8">Ładowanie...</div>}>
                        <SetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
