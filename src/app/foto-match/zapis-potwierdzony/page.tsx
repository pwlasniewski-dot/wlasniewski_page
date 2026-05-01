// SERVER COMPONENT — strona potwierdzenia maila (double opt-in landing).
// Wywołuje confirmWaitlistToken() bezpośrednio z bazy — bez self-fetch
// (poprzednia wersja robiła HTTP do /api/... co na Netlify funkcji potrafi
// crashować przez DNS/timeout w sandboxie).

import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, Mail } from 'lucide-react';
import { confirmWaitlistToken } from '@/lib/foto-match/confirm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Potwierdzenie zapisu — Foto-Match',
    robots: { index: false, follow: false },
};

interface SearchParams { t?: string }

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const sp = await searchParams;
    const token = (sp?.t || '').trim();

    if (!token) {
        return (
            <Shell>
                <Card icon="warn" title="Brak tokenu" text="Otwórz link bezpośrednio z maila potwierdzającego." />
            </Shell>
        );
    }

    const result = await confirmWaitlistToken(token);

    if (result.ok) {
        const isAlready = result.status === 'already';
        return (
            <Shell>
                <Card
                    icon="ok"
                    title={isAlready ? 'Zapis już potwierdzony' : 'Zapis potwierdzony 🎉'}
                    text={
                        isAlready
                            ? 'Nie musisz nic robić — jesteś na liście. Damy znać o starcie.'
                            : 'Świetnie. Jesteś na liście pierwszych użytkowników Foto-Match. Damy znać o starcie.'
                    }
                />
            </Shell>
        );
    }

    return (
        <Shell>
            <Card icon="warn" title="Nie udało się potwierdzić" text={result.message} />
        </Shell>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 grid place-items-center px-4 py-16">
            <div className="max-w-md w-full">
                {children}
                <div className="mt-6 text-center">
                    <Link href="/foto-match" className="text-sm text-purple-700 underline">
                        ← Wróć do Foto-Match
                    </Link>
                </div>
            </div>
        </main>
    );
}

function Card({ icon, title, text }: { icon: 'ok' | 'warn'; title: string; text: string }) {
    const Icon = icon === 'ok' ? CheckCircle2 : AlertTriangle;
    const color = icon === 'ok' ? 'text-emerald-600' : 'text-amber-600';
    const ring = icon === 'ok' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50';
    return (
        <div className={`rounded-3xl border-2 ${ring} p-8 shadow-xl bg-white`}>
            <div className="flex justify-center mb-4">
                <Icon className={`w-14 h-14 ${color}`} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{title}</h1>
            <p className="text-gray-700 text-center">{text}</p>
            <div className="mt-6 text-xs text-gray-500 flex items-center justify-center gap-1">
                <Mail className="w-3.5 h-3.5" /> wlasniewski.pl · Foto-Match
            </div>
        </div>
    );
}
