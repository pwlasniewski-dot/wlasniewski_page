'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

type DownloadDiagnostic = {
    message: string;
    missingIds: number[];
};

export default function AdminDownloadDiagnostics() {
    const [diagnostic, setDiagnostic] = useState<DownloadDiagnostic | null>(null);

    useEffect(() => {
        const originalFetch = window.fetch.bind(window);

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const response = await originalFetch(input, init);

            try {
                const url = typeof input === 'string'
                    ? input
                    : input instanceof URL
                        ? input.toString()
                        : input.url;

                const isGalleryDownload = url.includes('/api/admin/galleries/') && url.includes('/download-all');
                if (isGalleryDownload && response.status === 409) {
                    const payload = await response.clone().json().catch(() => null) as {
                        error?: string;
                        missing_hq_photo_ids?: unknown;
                    } | null;

                    const missingIds = Array.isArray(payload?.missing_hq_photo_ids)
                        ? payload!.missing_hq_photo_ids
                            .map((value) => Number(value))
                            .filter((value) => Number.isInteger(value) && value > 0)
                        : [];

                    setDiagnostic({
                        message: payload?.error || 'Eksport ZIP został zablokowany przez kontrolę danych galerii.',
                        missingIds,
                    });
                }
            } catch (error) {
                console.warn('[AdminDownloadDiagnostics] Nie udało się odczytać szczegółów błędu eksportu.', error);
            }

            return response;
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    if (!diagnostic) return null;

    return (
        <div className="fixed right-4 top-20 z-[1000] w-[min(92vw,520px)] rounded-xl border border-amber-500/50 bg-zinc-950 p-4 shadow-2xl shadow-black/50">
            <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-amber-300">ZIP nie może zostać przygotowany</div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-200">{diagnostic.message}</p>
                    {diagnostic.missingIds.length > 0 && (
                        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                Zdjęcia bez zweryfikowanego JPG HQ
                            </div>
                            <div className="mt-2 break-words font-mono text-xs text-amber-200">
                                {diagnostic.missingIds.map((id) => `#${id}`).join(', ')}
                            </div>
                            <p className="mt-2 text-xs text-zinc-400">
                                Uzupełnij źródła JPG HQ dla wskazanych zdjęć i ponów eksport. Zabezpieczenie nie pozwala wysłać do druku plików o niezweryfikowanej jakości.
                            </p>
                        </div>
                    )}
                    {diagnostic.missingIds.length === 0 && (
                        <p className="mt-2 text-xs text-zinc-400">
                            Jeżeli wybór rodzica nie ma statusu SUBMITTED, zatwierdź manifest wyboru przed ponownym eksportem.
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setDiagnostic(null)}
                    className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                    aria-label="Zamknij diagnostykę eksportu"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
