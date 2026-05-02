import type { Metadata } from 'next';
import Link from 'next/link';
import { WifiOff, RefreshCw, Calendar } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Offline — Właśniewski Foto',
    robots: { index: false, follow: false },
};

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-lg p-8 max-w-md text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <WifiOff className="w-8 h-8 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 mb-2">Brak połączenia</h1>
                <p className="text-zinc-600 mb-6">
                    Nie udało się połączyć z internetem. Sprawdź dane mobilne / Wi-Fi i spróbuj ponownie.
                </p>
                <div className="space-y-2">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold shadow"
                    >
                        <RefreshCw className="w-4 h-4" /> Spróbuj ponownie
                    </a>
                    <Link
                        href="/panel-fotografa"
                        className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 font-semibold"
                    >
                        <Calendar className="w-4 h-4" /> Mój kalendarz (z cache)
                    </Link>
                </div>
            </div>
        </div>
    );
}
