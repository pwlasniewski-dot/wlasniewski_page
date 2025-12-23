'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import toast from 'react-hot-toast';

interface Inquiry {
    id: number;
    name: string;
    email: string;
    message: string;
    status: string;
    created_at: string;
}

export default function InquiriesPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('inquiries'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setInquiries(data.inquiries);
            }
        } catch (error) {
            console.error('Failed to fetch inquiries', error);
            toast.error('Błąd pobierania zapytań');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-display font-semibold text-white mb-8">Zapytania</h1>

            <div className="bg-zinc-900 shadow overflow-hidden sm:rounded-lg border border-zinc-800">
                <ul className="divide-y divide-zinc-800">
                    {loading ? (
                        <li className="px-6 py-4 text-zinc-400">Ładowanie...</li>
                    ) : inquiries.length === 0 ? (
                        <li className="px-6 py-4 text-zinc-400">Brak zapytań.</li>
                    ) : (
                        inquiries.map((inquiry) => (
                            <li key={inquiry.id} className="px-6 py-4 hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-lg font-medium text-gold-400">{inquiry.name}</h3>
                                            <span className="text-sm text-zinc-500">{new Date(inquiry.created_at).toLocaleDateString('pl-PL')}</span>
                                        </div>
                                        <p className="text-sm text-zinc-300 mb-1">Email: {inquiry.email}</p>
                                        <p className="text-sm text-zinc-400 mt-2 bg-zinc-950 p-3 rounded border border-zinc-800">
                                            {inquiry.message}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
