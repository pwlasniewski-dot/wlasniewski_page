'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

type DownloadDiagnostic = {
    message: string;
    missingIds: number[];
    galleryId: number | null;
    participantId: number | null;
    selectionVersion: number | null;
    selectionsCount: number | null;
    maxSelections: number | null;
    canConfirmSelection: boolean;
    confirmed: boolean;
};

export default function AdminDownloadDiagnostics() {
    const [diagnostic, setDiagnostic] = useState<DownloadDiagnostic | null>(null);
    const [confirming, setConfirming] = useState(false);

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
                        gallery_id?: unknown;
                        participant_id?: unknown;
                        selection_version?: unknown;
                        selections_count?: unknown;
                        max_selections?: unknown;
                        can_admin_confirm_selection?: unknown;
                    } | null;

                    const missingIds = Array.isArray(payload?.missing_hq_photo_ids)
                        ? payload!.missing_hq_photo_ids
                            .map((value) => Number(value))
                            .filter((value) => Number.isInteger(value) && value > 0)
                        : [];
                    const galleryId = Number(payload?.gallery_id);
                    const participantId = Number(payload?.participant_id);
                    const selectionVersion = Number(payload?.selection_version);
                    const selectionsCount = Number(payload?.selections_count);
                    const maxSelections = Number(payload?.max_selections);

                    setDiagnostic({
                        message: payload?.error || 'Eksport ZIP został zablokowany przez kontrolę danych galerii.',
                        missingIds,
                        galleryId: Number.isInteger(galleryId) && galleryId > 0 ? galleryId : null,
                        participantId: Number.isInteger(participantId) && participantId > 0 ? participantId : null,
                        selectionVersion: Number.isInteger(selectionVersion) && selectionVersion >= 0 ? selectionVersion : null,
                        selectionsCount: Number.isInteger(selectionsCount) && selectionsCount >= 0 ? selectionsCount : null,
                        maxSelections: Number.isInteger(maxSelections) && maxSelections >= 0 ? maxSelections : null,
                        canConfirmSelection: payload?.can_admin_confirm_selection === true,
                        confirmed: false,
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

    const confirmSelectionForPrint = async () => {
        if (!diagnostic?.galleryId || !diagnostic.participantId || diagnostic.selectionVersion === null) return;
        const countLabel = diagnostic.selectionsCount !== null && diagnostic.maxSelections !== null
            ? ` (${diagnostic.selectionsCount}/${diagnostic.maxSelections} zdjęć)`
            : '';
        if (!window.confirm(`Zatwierdzić standardowy wybór rodzica do druku${countLabel}? Opłacone dodatkowe odbitki pozostają osobnym zamówieniem i zostaną dołączone automatycznie.`)) return;

        setConfirming(true);
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(
                `/api/admin/galleries/${diagnostic.galleryId}/participants/${diagnostic.participantId}/review-selection`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'CONFIRM',
                        expected_selection_version: diagnostic.selectionVersion,
                    }),
                },
            );
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                setDiagnostic(current => current ? {
                    ...current,
                    message: payload?.error || 'Nie udało się zatwierdzić standardowego wyboru do druku.',
                } : current);
                return;
            }

            const baseMessage = typeof payload?.message === 'string'
                ? payload.message
                : 'Standardowy wybór został zatwierdzony do druku.';
            const warning = typeof payload?.warning === 'string' && payload.warning.trim()
                ? ` ${payload.warning.trim()}`
                : '';

            setDiagnostic(current => current ? {
                ...current,
                message: `${baseMessage}${warning} Opłacone dodatkowe odbitki zostaną dołączone automatycznie. Kliknij ponownie „Pobierz ZIP”.`,
                canConfirmSelection: false,
                confirmed: true,
                selectionVersion: Number(payload?.selection_version) || current.selectionVersion,
            } : current);
        } catch (error) {
            console.error('[AdminDownloadDiagnostics] Błąd zatwierdzania wyboru:', error);
            setDiagnostic(current => current ? {
                ...current,
                message: 'Nie udało się zatwierdzić wyboru z powodu błędu połączenia.',
            } : current);
        } finally {
            setConfirming(false);
        }
    };

    if (!diagnostic) return null;

    const selectionLabel = diagnostic.selectionsCount !== null && diagnostic.maxSelections !== null
        ? `${diagnostic.selectionsCount}/${diagnostic.maxSelections}`
        : null;

    return (
        <div className="fixed right-4 top-20 z-[1000] w-[min(92vw,520px)] rounded-xl border border-amber-500/50 bg-zinc-950 p-4 shadow-2xl shadow-black/50">
            <div className="flex items-start gap-3">
                {diagnostic.confirmed
                    ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />}
                <div className="min-w-0 flex-1">
                    <div className={`text-sm font-bold ${diagnostic.confirmed ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {diagnostic.confirmed ? 'Wybór gotowy do ponownego eksportu' : 'ZIP nie może zostać przygotowany'}
                    </div>
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
                    {diagnostic.missingIds.length === 0 && diagnostic.canConfirmSelection && (
                        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                            <p className="text-xs leading-relaxed text-zinc-300">
                                Do zatwierdzenia jest wyłącznie standardowy wybór rodzica
                                {selectionLabel ? ` (${selectionLabel} zdjęć)` : ''}. Opłacone dodatkowe odbitki są niezależne i system dołączy je do ZIP-a automatycznie.
                            </p>
                            <button
                                type="button"
                                onClick={confirmSelectionForPrint}
                                disabled={confirming}
                                className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
                            >
                                {confirming
                                    ? 'Zatwierdzam standardowy wybór...'
                                    : `Zatwierdź standardowy wybór${selectionLabel ? ` ${selectionLabel}` : ''}`}
                            </button>
                        </div>
                    )}
                    {diagnostic.missingIds.length === 0 && !diagnostic.canConfirmSelection && !diagnostic.confirmed && (
                        <p className="mt-2 text-xs text-zinc-400">
                            Otwórz galerię i sprawdź status standardowego wyboru rodzica przed ponownym eksportem.
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
