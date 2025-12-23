'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
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
        }
    };

    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-gold-600 to-gold-300"></div>
                <h1 className="text-3xl font-bold text-gold-400 mb-6 text-center">Rejestracja</h1>

                {error && <div className="bg-red-900/20 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Imię i Nazwisko</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded p-3 focus:border-gold-500 focus:outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded p-3 focus:border-gold-500 focus:outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Hasło</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded p-3 focus:border-gold-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gold-500 text-black font-bold py-3 rounded hover:bg-gold-400 transition-colors mt-4"
                    >
                        Załóż konto
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-zinc-500">
                    Masz już konto? <Link href="/logowanie" className="text-gold-400 hover:text-gold-300">Zaloguj się</Link>
                </div>
            </div>
        </main>
    );
}
