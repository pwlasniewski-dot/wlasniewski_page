'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('pwlasniewski@gmail.com');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (data.success) {
                setSent(true);
                toast.success('Link resetujący wysłany na email!');
            } else {
                toast.error(data.error || 'Błąd wysyłki');
            }
        } catch (error) {
            toast.error('Błąd połączenia z serwerem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    WŁAŚNIEWSKI.PL
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-400">
                    Reset Hasła Admina
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800">
                    {sent ? (
                        <div className="text-center space-y-4">
                            <div className="text-green-400 text-5xl mb-4">✉️</div>
                            <h3 className="text-lg font-medium text-white">Email wysłany!</h3>
                            <p className="text-sm text-zinc-400">
                                Sprawdź skrzynkę: <strong className="text-gold-400">{email}</strong>
                            </p>
                            <p className="text-xs text-zinc-500">
                                Link ważny przez 1 godzinę
                            </p>
                            <a
                                href="/admin/login"
                                className="inline-block mt-4 text-sm text-gold-400 hover:text-gold-300"
                            >
                                ← Powrót do logowania
                            </a>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                                    Adres Email Admina
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                                >
                                    {loading ? 'Wysyłanie...' : 'Wyślij Link Resetujący'}
                                </button>
                            </div>

                            <div className="text-center">
                                <a
                                    href="/admin/login"
                                    className="text-sm text-zinc-400 hover:text-zinc-300"
                                >
                                    ← Powrót do logowania
                                </a>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
