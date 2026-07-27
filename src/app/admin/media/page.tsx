'use client';

import MediaPicker from '@/components/admin/MediaPicker';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';

export default function MediaPage() {
    const [syncing, setSyncing] = useState(false);

    // Optional: Handler for when an item is "selected" (single click outside selection mode)
    // Could copy URL to clipboard
    const handleSelect = (url: string | string[]) => {
        if (typeof url === 'string') {
            navigator.clipboard.writeText(url);
            toast.success('Skopiowano link do schowka');
        }
    };

    const handleSync = async () => {
        if (!confirm('Czy na pewno chcesz uruchomić synchronizację plików? To może potrwać chwilę.')) return;

        setSyncing(true);
        const toastId = toast.loading('Synchronizacja w toku...');

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/media/sync', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                toast.success(data.message || 'Synchronizacja zakończona sukcesem', { id: toastId });
                // Force reload to see changes
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast.error('Błąd synchronizacji: ' + (data.error || 'Nieznany błąd'), { id: toastId });
            }
        } catch (error) {
            console.error('Sync failed', error);
            toast.error('Błąd połączenia z serwerem', { id: toastId });
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="h-[calc(100dvh-4rem)] md:h-[calc(100dvh-3rem)] -mx-4 -my-6 sm:-mx-6 md:-mx-8 flex flex-col">
            <div className="shrink-0 flex justify-end px-3 sm:px-6 py-2 border-b border-zinc-800 bg-zinc-950">
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors border border-zinc-700 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                    {syncing ? 'Skanowanie...' : 'Skanuj Pliki (Naprawa)'}
                </button>
            </div>

            <div className="flex-1 min-h-0">
                <MediaPicker
                    isOpen={true}
                    onClose={() => { }}
                    onSelect={handleSelect}
                    inline={true}
                    multiple={true}
                />
            </div>
        </div>
    );
}
