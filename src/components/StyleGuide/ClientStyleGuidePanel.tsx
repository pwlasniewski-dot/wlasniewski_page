'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PreparationGuide from './PreparationGuide';
import type { ClientPreparationGuideData } from '@/types/preparation-guide';

interface ClientStyleGuidePanelProps {
    offerId?: number;
    serviceType?: string;
    groupSize?: number;
    location?: string;
}

export default function ClientStyleGuidePanel({
    offerId,
    serviceType,
    groupSize,
    location,
}: ClientStyleGuidePanelProps) {
    const { token } = useAuth();
    const [data, setData] = useState<ClientPreparationGuideData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retry, setRetry] = useState(0);

    const load = useCallback(async (signal: AbortSignal) => {
        if (!token) {
            setLoading(false);
            setError('Zaloguj się ponownie, aby otworzyć poradnik.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const query = offerId ? `?offerId=${encodeURIComponent(offerId)}` : '';
            const response = await fetch(`/api/style-guide/client${query}`, {
                headers: { Authorization: `Bearer ${token}` },
                signal,
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.success) {
                throw new Error(response.status === 403
                    ? 'Ta oferta nie jest przypisana do Twojego konta.'
                    : 'Nie udało się teraz pobrać poradnika.');
            }
            setData(payload.data);
        } catch (fetchError) {
            if ((fetchError as Error).name !== 'AbortError') {
                setError((fetchError as Error).message);
            }
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    }, [offerId, token]);

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);
        return () => controller.abort();
    }, [load, retry]);

    if (loading) {
        return (
            <div className="flex min-h-64 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/50 text-zinc-300" role="status">
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-gold-500" aria-hidden />
                Ładuję poradnik…
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-50" role="alert">
                <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
                    <div>
                        <p>{error}</p>
                        <button
                            onClick={() => setRetry((value) => value + 1)}
                            className="mt-4 min-h-11 rounded-xl bg-amber-400 px-5 py-2 font-bold text-black outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            Spróbuj ponownie
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return <p className="rounded-2xl border border-zinc-800 p-6 text-zinc-300">Poradnik nie ma jeszcze treści.</p>;
    }

    return (
        <PreparationGuide
            data={data}
            fallbackContext={{ serviceType, groupSize, location }}
        />
    );
}
