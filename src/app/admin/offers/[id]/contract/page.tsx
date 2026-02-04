'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContractEditorPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [offer, setOffer] = useState<any>(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [params.id]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                router.push('/admin/login');
                return;
            }

            const res = await fetch(`/api/admin/offers/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setOffer(data.offer);

                // Set initial content if contract exists or template
                if (data.offer.contract?.content) {
                    setContent(data.offer.contract.content);
                } else {
                    // Default Template based on type
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
            return `UMOWA WSPÓŁPRACY BIZNESOWEJ\n\nZawarta w dniu ${today} w Toruniu, pomiędzy:\n\n${offerData.client_email || '...'}\na\nPrzemysław Właśniewski Fotografia\n\n§1 PRZEDMIOT UMOWY\n1. Wykonawca zobowiązuje się do wykonania dzieła: ${offerData.title}.\n2. Zakres prac obejmuje:\n${offerData.sections.map((s: any) => `- ${s.title}`).join('\n')}\n\n§2 WYNAGRODZENIE\n1. Wynagrodzenie wynosi: ${offerData.total_price} PLN netto/brutto.\n\n§3 ODPOWIEDZIALNOŚĆ\n...`;
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
                    offer_id: params.id,
                    content,
                    status: 'pending' // Ready for signing
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

    if (loading) return <div>Ładowanie...</div>;

    return (
        <div className="max-w-5xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6 text-black">Edytor Umowy</h1>
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="mb-4">
                    <label className="block font-bold mb-2 text-black">Treść Umowy (Edytowalna)</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-[600px] p-4 border rounded-lg font-mono text-sm bg-gray-50 text-black leading-relaxed"
                    />
                </div>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2 bg-gray-300 rounded text-black hover:bg-gray-400"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {saving ? 'Zapisywanie...' : 'Zapisz i Wygeneruj PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
}
