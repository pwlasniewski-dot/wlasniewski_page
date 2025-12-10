'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail } from 'lucide-react';

export default function GalleryLoginPage() {
    const router = useRouter();
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`/api/galleries/${accessCode}`);
            const data = await res.json();

            if (data.success) {
                // Store access code in localStorage for later use
                localStorage.setItem('gallery_access_code', accessCode);
                router.push(`/galeria/${accessCode}`);
            } else {
                setError(data.error || 'Nieprawidłowy kod dostępu');
            }
        } catch (err) {
            setError('Wystąpił błąd podczas logowania');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-gold-400 mb-4">
                        📸 Twoja Galeria
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Wprowadź kod dostępu aby zobaczyć swoje zdjęcia
                    </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Kod Dostępu
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <input
                                    type="text"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    placeholder="np. a1b2c3d4e5f6..."
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-gold-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !accessCode}
                            className="w-full bg-gold-400 hover:bg-gold-500 text-black font-bold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sprawdzam...' : 'Wejdź do Galerii'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-zinc-800">
                        <p className="text-sm text-zinc-500 text-center">
                            Nie masz kodu dostępu? Sprawdź swoją skrzynkę email lub skontaktuj się z fotografem.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center text-sm text-zinc-600">
                    <p>Bezpieczny dostęp do Twoich zdjęć</p>
                </div>
            </div>
        </div>
    );
}
