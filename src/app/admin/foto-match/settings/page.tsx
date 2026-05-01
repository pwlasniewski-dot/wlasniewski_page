import { Metadata } from 'next';
import Link from 'next/link';
import FotoMatchSettingsClient from './FotoMatchSettingsClient';

export const metadata: Metadata = {
    title: 'Foto-Match · Ustawienia',
};

export default function FotoMatchSettingsPage() {
    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <Link href="/admin/foto-match" className="text-sm text-amber-400 hover:underline">← Foto-Match</Link>
                <h1 className="text-3xl font-bold text-white mt-2">Ustawienia Foto-Match</h1>
                <p className="text-zinc-400 mt-1">Master switch + skróty do konfiguracji moderacji, matchingu i integracji.</p>
            </div>
            <FotoMatchSettingsClient />
        </div>
    );
}
