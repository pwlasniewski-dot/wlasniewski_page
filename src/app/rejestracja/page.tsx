'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const validatePassword = (pass: string) => {
        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
        const isLongEnough = pass.length >= 8;

        if (!isLongEnough) return "Hasło musi mieć minimum 8 znaków.";
        if (!hasUpper || !hasLower) return "Hasło musi zawierać małe i wielkie litery.";
        if (!hasSpecial) return "Hasło musi zawierać znak specjalny.";
        return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError('');
        if (!acceptTerms || !acceptPrivacy) {
            setError('Zaakceptuj regulamin i potwierdź zapoznanie się z polityką prywatności.');
            return;
        }

        const passErr = validatePassword(password);
        if (passErr) {
            setError(passErr);
            return;
        }

        if (password !== confirmPassword) {
            setError('Hasła nie są identyczne.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, accept_terms: acceptTerms, accept_gdpr: acceptPrivacy, accept_marketing: false })
            });
            const data = await res.json();

            if (res.ok) {
                // Auto login or redirect to login
                router.push('/logowanie?registered=true');
            } else {
                setError(data.error || 'Błąd rejestracji');
            }
        } catch (err) {
            setError('Wystąpił błąd');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-gold-600 to-gold-300"></div>
                <h1 className="text-3xl font-bold text-gold-400 mb-6 text-center">Rejestracja</h1>

                {error && <div role="alert" className="bg-red-900/20 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="register-name" className="block text-sm text-zinc-400 mb-1">Imię i Nazwisko</label>
                        <input id="register-name"
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded p-3 focus:border-gold-500 focus:outline-none transition-colors"
                            placeholder="Jan Kowalski"
                        />
                    </div>
                    <div>
                        <label htmlFor="register-email" className="block text-sm text-zinc-400 mb-1">Email</label>
                        <input id="register-email"
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded p-3 focus:border-gold-500 focus:outline-none transition-colors"
                            placeholder="jan@kowalski.pl"
                        />
                    </div>
                    <div>
                        <label htmlFor="register-password" className="block text-sm text-zinc-400 mb-1">Hasło</label>
                        <input id="register-password"
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className={`w-full bg-black border rounded p-3 focus:outline-none transition-colors ${password ? (validatePassword(password) ? 'border-red-500/50' : 'border-green-500/50') : 'border-zinc-700'}`}
                            placeholder="Min. 8 znaków, A-z, !@#"
                        />
                    </div>
                    <div>
                        <label htmlFor="register-confirm-password" className="block text-sm text-zinc-400 mb-1">Powtórz hasło</label>
                        <input id="register-confirm-password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className={`w-full bg-black border rounded p-3 focus:outline-none transition-colors ${confirmPassword ? (password === confirmPassword ? 'border-green-500/50' : 'border-red-500/50') : 'border-zinc-700'}`}
                            placeholder="Wpisz ponownie"
                        />
                    </div>

                    <div className="bg-black/50 p-4 rounded-xl border border-zinc-800 text-[10px] text-zinc-500 gap-y-1 grid grid-cols-2">
                        <p className={password.length >= 8 ? 'text-green-500' : ''}>• Min. 8 znaków</p>
                        <p className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>• Wielka litera</p>
                        <p className={/[a-z]/.test(password) ? 'text-green-500' : ''}>• Mała litera</p>
                        <p className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-500' : ''}>• Znak specjalny</p>
                    </div>

                    <div className="space-y-3 text-sm text-zinc-300">
                        <label className="flex min-h-11 items-start gap-3">
                            <input type="checkbox" required checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-yellow-500" />
                            <span>Akceptuję <Link href="/regulamin" target="_blank" rel="noopener noreferrer" className="text-gold-400 underline">regulamin</Link> (wymagane).</span>
                        </label>
                        <label className="flex min-h-11 items-start gap-3">
                            <input type="checkbox" required checked={acceptPrivacy} onChange={e => setAcceptPrivacy(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-yellow-500" />
                            <span>Zapoznałem/am się z <Link href="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer" className="text-gold-400 underline">polityką prywatności</Link> (wymagane).</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gold-500 text-black font-bold py-3 rounded hover:bg-gold-400 transition-colors mt-4"
                    >
                        {submitting ? 'Tworzenie konta…' : 'Załóż konto'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-zinc-500">
                    Masz już konto? <Link href="/logowanie" className="text-gold-400 hover:text-gold-300">Zaloguj się</Link>
                </div>
            </div>
        </main>
    );
}
