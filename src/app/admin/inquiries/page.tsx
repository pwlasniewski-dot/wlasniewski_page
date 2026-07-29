'use client';

import { useEffect, useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

import { getApiUrl } from '@/lib/api-config';

interface Inquiry {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    session_type: string | null;
    source: string | null;
    status: string;
    created_at: string;
}

const STATUS_OPTIONS = [
    { value: 'new', label: 'Nowe' },
    { value: 'contacted', label: 'Skontaktowano' },
    { value: 'qualified', label: 'Zakwalifikowane' },
    { value: 'won', label: 'Pozyskane' },
    { value: 'lost', label: 'Utracone' },
];

export default function InquiriesPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                const res = await fetch(getApiUrl('inquiries'), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error('fetch failed');
                setInquiries(data.inquiries);
            } catch {
                toast.error('Błąd pobierania zapytań');
            } finally {
                setLoading(false);
            }
        };

        void fetchInquiries();
    }, []);

    const updateStatus = async (id: number, status: string) => {
        const previous = inquiries.find(inquiry => inquiry.id === id)?.status || 'new';
        setInquiries(current => current.map(inquiry => inquiry.id === id ? { ...inquiry, status } : inquiry));

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('inquiries'), {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, status }),
            });
            if (!res.ok) throw new Error('status update failed');
            toast.success('Status zapisany');
        } catch {
            setInquiries(current => current.map(inquiry => inquiry.id === id ? { ...inquiry, status: previous } : inquiry));
            toast.error('Nie udało się zmienić statusu');
        }
    };

    return (
        <div className="px-3 py-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-display font-semibold text-white">Zapytania sprzedażowe</h1>
                <p className="mt-1 text-sm text-zinc-400">
                    Każdy formularz ze strony trafia tutaj, również gdy wysyłka e-maila chwilowo nie działa.
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow">
                <ul className="divide-y divide-zinc-800">
                    {loading ? (
                        <li className="px-6 py-5 text-zinc-400">Ładowanie…</li>
                    ) : inquiries.length === 0 ? (
                        <li className="px-6 py-5 text-zinc-400">Brak zapytań.</li>
                    ) : (
                        inquiries.map(inquiry => (
                            <li key={inquiry.id} className="p-4 transition-colors hover:bg-zinc-800/40 sm:p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <h2 className="text-lg font-semibold text-gold-400">{inquiry.name}</h2>
                                                <span className="text-xs text-zinc-500">
                                                    {new Date(inquiry.created_at).toLocaleString('pl-PL')}
                                                </span>
                                            </div>
                                            {inquiry.source && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {inquiry.source}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mb-3 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap">
                                            {inquiry.phone && (
                                                <a
                                                    href={`tel:${inquiry.phone}`}
                                                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-200 hover:border-gold-500"
                                                >
                                                    <Phone className="h-4 w-4 text-gold-400" />
                                                    {inquiry.phone}
                                                </a>
                                            )}
                                            {inquiry.email && (
                                                <a
                                                    href={`mailto:${inquiry.email}`}
                                                    className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-200 hover:border-gold-500"
                                                >
                                                    <Mail className="h-4 w-4 shrink-0 text-gold-400" />
                                                    <span className="truncate">{inquiry.email}</span>
                                                </a>
                                            )}
                                        </div>

                                        {inquiry.session_type && (
                                            <p className="mb-2 text-sm text-zinc-300">
                                                <span className="text-zinc-500">Usługa:</span> {inquiry.session_type}
                                            </p>
                                        )}
                                        <p className="break-words whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm leading-relaxed text-zinc-300">
                                            {inquiry.message}
                                        </p>
                                    </div>

                                    <label className="flex shrink-0 flex-col gap-1 text-xs text-zinc-500 lg:w-44">
                                        Status
                                        <select
                                            value={inquiry.status}
                                            onChange={event => void updateStatus(inquiry.id, event.target.value)}
                                            className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-gold-500"
                                        >
                                            {STATUS_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
