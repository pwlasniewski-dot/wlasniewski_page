'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContractEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [offer, setOffer] = useState<any>(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const resParams = React.use(params);
    const id = resParams.id;

    useEffect(() => {
        if (id) {
            fetchData(id);
        }
    }, [id]);

    const fetchData = async (offerId: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                router.push('/admin/login');
                return;
            }

            const res = await fetch(`/api/admin/offers/${offerId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setOffer(data.offer);

                if (data.offer.contract?.content) {
                    setContent(data.offer.contract.content);
                } else {
                    const isB2B = data.offer.type === 'b2b';
                    setContent(getDefaultTemplate(isB2B, data.offer));
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getDefaultTemplate = (isB2B: boolean, offerData: any) => {
        const today = new Date().toLocaleDateString('pl-PL');
        if (isB2B) {
            return `UMOWA WSPÓŁPRACY BIZNESOWEJ\n\nZawarta w dniu ${today} w Toruniu, pomiędzy:\n\n${offerData.client_email || '...'}\na\nPrzemysław Właśniewski Fotografia\n\n§1 PRZEDMIOT UMOWY\n1. Wykonawca zobowiązuje się do wykonania dzieła: ${offerData.title}.\n2. Zakres prac obejmuje:\n${offerData.sections?.map((s: any) => `- ${s.title}`).join('\n') || ''}\n\n§2 WYNAGRODZENIE\n1. Wynagrodzenie wynosi: ${offerData.total_price} PLN netto/brutto.\n\n§3 ODPOWIEDZIALNOŚĆ\n...`;
        } else {
            return `UMOWA O DZIEŁO FOTOGRAFICZNE\n\nZawarta w dniu ${today}, pomiędzy:\n\nKlientem: ${offerData.client_email || '...'}\na\nFotografem: Przemysław Właśniewski\n\n§1 ZAKRES USŁUGI\n1. Fotograf wykona zdjęcia w ramach pakietu: ${offerData.title}.\n\n§2 TERMIN I MIEJSCE\n1. Data sesji: ${offerData.valid_until ? new Date(offerData.valid_until).toLocaleDateString('pl-PL') : 'Do ustalenia'}.\n\n§3 PŁATNOŚĆ\n1. Łączna kwota: ${offerData.total_price} PLN.\n\n§4 RODO I WIZERUNEK\n...`;
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem('admin_token');
        setSaving(true);
        try {
            const res = await fetch('/api/admin/contracts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    offer_id: id,
                    content,
                    status: 'pending'
                })
            });

            if (res.ok) {
                alert('Umowa zapisana!');
                router.push('/admin/offers');
            } else {
                alert('Błąd zapisu');
            }
        } catch (error) {
            console.error(error);
            alert('Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Ładowanie...</div>;

    return (
        <div className="max-w-5xl mx-auto p-8 text-white">
            <h1 className="text-3xl font-bold mb-6">Edytor Umowy</h1>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-xl">
                <div className="mb-4">
                    <label className="block font-bold mb-2 text-zinc-400 text-sm uppercase tracking-wider">Treść Umowy (Edytowalna)</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-[600px] p-6 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-sm text-zinc-300 leading-relaxed focus:border-blue-500 outline-none transition-colors"
                    />
                </div>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2 bg-zinc-800 rounded-lg text-white hover:bg-zinc-700 transition"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition shadow-lg shadow-blue-900/20"
                    >
                        {saving ? 'Zapisywanie...' : 'Zapisz i Wygeneruj PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
}
