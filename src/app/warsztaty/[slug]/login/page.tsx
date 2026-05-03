'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';

export default function WorkshopLoginPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();
    const [login, setLogin] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const r = await fetch(`/api/workshops/${slug}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: login.trim(), pin: pin.trim() }),
        });
        const j = await r.json();
        setLoading(false);
        if (!r.ok) {
            setError(j.error || 'Coś nie zadziałało.');
            return;
        }
        localStorage.setItem('workshop_token', j.token);
        localStorage.setItem('workshop_participant', JSON.stringify(j.participant));
        localStorage.setItem('workshop_meta', JSON.stringify(j.workshop));
        router.push(`/warsztaty/${slug}/panel`);
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50 flex items-center justify-center p-6">
            <form onSubmit={submit} className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl p-6 shadow-lg">
                <div className="text-center mb-4">
                    <div className="text-5xl mb-2">📸</div>
                    <h1 className="text-xl font-bold text-zinc-900">Warsztaty fotograficzne</h1>
                    <p className="text-sm text-zinc-500">Wpisz swój login i PIN z karty.</p>
                </div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Login</label>
                <input value={login} onChange={e => setLogin(e.target.value)} required autoFocus className="w-full border rounded-lg p-3 mb-3 text-zinc-900 font-mono" placeholder={`${slug}-01`} />
                <label className="block text-xs font-bold text-zinc-600 mb-1">PIN (6 cyfr)</label>
                <input value={pin} onChange={e => setPin(e.target.value)} required inputMode="numeric" maxLength={8} className="w-full border rounded-lg p-3 mb-3 text-zinc-900 font-mono text-2xl text-center tracking-[0.5em]" placeholder="••••••" />
                {error && <div className="text-rose-600 text-sm mb-3">{error}</div>}
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                    <LogIn size={18} /> {loading ? 'Loguję…' : 'Wejdź na warsztaty'}
                </button>
                <p className="text-xs text-zinc-400 text-center mt-4">Nie zbieramy maila ani danych osobowych. Jeśli zgubiłeś/zgubiłaś kartę — zgłoś prowadzącemu.</p>
            </form>
        </div>
    );
}
