'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                login(data.token, data.user);
                router.push('/konto');
            } else {
                setError(data.error || 'Błąd logowania');
            }
        } catch (err) {
            setError('Wystąpił błąd');
        }
    };

    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-gold-600 to-gold-300"></div>
                <h1 className="text-3xl font-bold text-gold-400 mb-6 text-center">Logowanie</h1>

                {error && <div className="bg-red-900/20 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm text-zinc-400">Hasło</label>
                            <Link href="/logowanie/przypomnij-haslo" className="text-xs text-gold-500 hover:text-gold-400">Nie pamiętasz hasła?</Link>
                        </div>
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
                        Zaloguj się
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-zinc-500">
                    Nie masz konta? <Link href="/rejestracja" className="text-gold-400 hover:text-gold-300">Zarejestruj się</Link>
                </div>
            </div>
        </main>
    );
}
