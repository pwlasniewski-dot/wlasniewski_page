'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function EmergencyResetPage() {
    const [email, setEmail] = useState('pwlasniewski@gmail.com');
    const [newPassword, setNewPassword] = useState('');
    const [masterKey, setMasterKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 8) {
            toast.error('Hasło musi mieć minimum 8 znaków');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/admin/emergency-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword, masterKey })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                toast.success('Hasło zmienione! Możesz się teraz zalogować.');
            } else {
                toast.error(data.error || 'Błąd resetu hasła');
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
                    🔐 Emergency Reset
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-400">
                    Reset hasła admina (wymaga klucza)
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="text-green-400 text-5xl mb-4">✅</div>
                            <h3 className="text-lg font-medium text-white">Hasło zmienione!</h3>
                            <a
                                href="/admin/login"
                                className="inline-block mt-4 px-6 py-2 bg-gold-500 text-black rounded font-medium hover:bg-gold-400"
                            >
                                Zaloguj się
                            </a>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                                    Email Admina
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>

                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-zinc-300">
                                    Nowe Hasło
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    required
                                    minLength={8}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimum 8 znaków"
                                    className="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>

                            <div>
                                <label htmlFor="masterKey" className="block text-sm font-medium text-zinc-300">
                                    Klucz Master
                                </label>
                                <input
                                    id="masterKey"
                                    type="password"
                                    required
                                    value={masterKey}
                                    onChange={(e) => setMasterKey(e.target.value)}
                                    placeholder="Klucz do resetu"
                                    className="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                                <p className="mt-1 text-xs text-zinc-500">
                                    Domyślny klucz: WLASNIEWSKI2024RESET
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                            >
                                {loading ? 'Resetowanie...' : 'Resetuj Hasło'}
                            </button>

                            <div className="text-center">
                                <a href="/admin/login" className="text-sm text-zinc-400 hover:text-zinc-300">
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
