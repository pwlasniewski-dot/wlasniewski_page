'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContractSigningPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);

    const [contractId, setContractId] = useState<string | null>(null);

    useEffect(() => {
        const unwrap = async () => {
            const p = await params;
            setContractId(p.id);
        };
        unwrap();
    }, [params]);

    useEffect(() => {
        if (contractId) {
            fetchContract();
        }
    }, [contractId]);

    const fetchContract = async () => {
        try {
            const token = localStorage.getItem('client_token');
            if (!token) {
                router.push('/strefa-klienta/login');
                return;
            }

            // Using the portal offers endpoint which includes contract, 
            // but we might need a specific endpoint if we don't have the offer ID handy.
            // Assuming params.id is CONTRACT ID for now based on URL structure /umowy/[id]
            const res = await fetch(`/api/client/portal/contracts/${contractId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setContract(data.contract);
            } else {
                // handle error
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSign = async () => {
        const token = localStorage.getItem('client_token');
        setSigning(true);
        try {
            const res = await fetch(`/api/client/portal/contracts/${contractId}/sign`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                alert('Umowa podpisana pomyślnie!'); // Replace with nice modal
                fetchContract(); // Reload status
            }
        } catch (error) {
            console.error(error);
            alert('Błąd podczas podpisywania');
        } finally {
            setSigning(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Ładowanie...</div>;
    if (!contract) return <div className="min-h-screen flex items-center justify-center">Nie znaleziono umowy.</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Umowa</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${contract.status === 'signed' ? 'bg-green-500' : 'bg-yellow-500 text-black'
                        }`}>
                        {contract.status === 'signed' ? 'PODPISANA' : 'OCZEKUJE NA PODPIS'}
                    </span>
                </div>

                <div className="p-8">
                    <div className="prose max-w-none mb-8 font-serif whitespace-pre-wrap text-black">
                        {contract.content}
                    </div>

                    {contract.status !== 'signed' && (
                        <div className="border-t pt-8">
                            <h3 className="text-lg font-bold mb-4 text-black">Podpis</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Klikając "Podpisz umowę", potwierdzasz przeczytanie i akceptację powyższych warunków.
                            </p>
                            <button
                                onClick={handleSign}
                                disabled={signing}
                                className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                            >
                                {signing ? 'Przetwarzanie...' : '✍️ PODPISZ UMOWĘ'}
                            </button>
                        </div>
                    )}

                    {contract.status === 'signed' && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-3">
                            <span className="text-green-600 text-xl">✓</span>
                            <div>
                                <p className="font-bold text-green-800">Umowa została podpisana.</p>
                                <p className="text-sm text-green-700">Dziękujemy za zaufanie!</p>
                            </div>
                            {contract.pdf_url && (
                                <a
                                    href={contract.pdf_url}
                                    target="_blank"
                                    className="ml-auto text-green-700 underline hover:text-green-900"
                                >
                                    Pobierz PDF
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
