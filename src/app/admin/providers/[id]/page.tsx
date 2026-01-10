'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Briefcase, Mail, Phone, Calendar, DollarSign, Package, Shield, ArrowLeft, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ProviderDetail {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    is_active: boolean;
    photographer_profile: {
        bio: string;
        base_commission: number;
        rating: number;
    } | null;
    owned_packages: any[];
    payouts: any[];
    assigned_bookings: any[];
}

export default function ProviderDetailsPage() {
    const params = useParams();
    const [provider, setProvider] = useState<ProviderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params?.id) {
            fetchProviderDetail(String(params.id));
        }
    }, [params?.id]);

    const fetchProviderDetail = async (id: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/providers/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProvider(data.provider);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Błąd pobierania danych dostawcy');
        } finally {
            setLoading(false);
        }
    };

    const updateCommission = async (value: number) => {
        if (isNaN(value) || value < 0 || value > 100) {
            toast.error('Nieprawidłowa wartość (0-100)');
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/providers/${params.id}/manage`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'UPDATE_COMMISSION', value })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Prowizja zaktualizowana');
                setProvider(prev => prev ? {
                    ...prev,
                    photographer_profile: {
                        ...prev.photographer_profile!,
                        base_commission: data.commission
                    }
                } : null);
            } else {
                toast.error(data.error || 'Błąd aktualizacji');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        }
    };

    const resetPassword = async () => {
        if (!confirm('Czy na pewno chcesz zresetować hasło dostawcy? Nowe hasło zostanie wygenerowane.')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/providers/${params.id}/manage`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'RESET_PASSWORD' })
            });
            const data = await res.json();

            if (data.success) {
                // Show new password in a persistent toast or alert
                alert(`NOWE HASŁO DLA DOSTAWCY:\n\n${data.new_password}\n\nZapisz je, ponieważ nie będzie widoczne ponownie.`);
                toast.success('Hasło zresetowane pomyślnie');
            } else {
                toast.error(data.error || 'Błąd resetu hasła');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-500">Ładowanie...</div>;
    if (!provider) return <div className="p-8 text-center text-red-500">Nie znaleziono dostawcy.</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <Link href="/admin/providers" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-4 transition-colors">
                    <ArrowLeft size={16} /> Powrót do listy
                </Link>
                <div className="flex justify-between items-start">
                    <div className="flex gap-6 items-center">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-700">
                            <Briefcase className="text-zinc-500" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                                {provider.name}
                                {provider.is_active ?
                                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">Aktywny</span> :
                                    <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">Zablokowany</span>
                                }
                            </h1>
                            <div className="flex gap-4 text-zinc-400 mt-2 text-sm">
                                <span className="flex items-center gap-1"><Mail size={14} /> {provider.email}</span>
                                <span className="flex items-center gap-1"><Calendar size={14} /> Dołączył: {new Date(provider.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Header Actions */}
                    <button
                        onClick={resetPassword}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 transition-colors text-sm flex items-center gap-2"
                    >
                        <Shield size={16} className="text-gold-500" /> Resetuj Hasło
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Prowizja Systemu</p>
                        <button
                            onClick={() => {
                                const newComm = prompt('Podaj nową wartość prowizji (%):', String(provider.photographer_profile?.base_commission || 15));
                                if (newComm !== null) {
                                    updateCommission(parseInt(newComm));
                                }
                            }}
                            className="text-zinc-500 hover:text-gold-500 transition-colors"
                            title="Edytuj"
                        >
                            <DollarSign size={16} />
                        </button>
                    </div>
                    <div className="text-3xl font-bold text-gold-400">{provider.photographer_profile?.base_commission || 15}%</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Aktywne Pakiety</p>
                    <div className="text-3xl font-bold text-white">{provider.owned_packages.length}</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Zlecenia (Total)</p>
                    <div className="text-3xl font-bold text-white">{provider.assigned_bookings.length}</div>
                </div>
            </div>

            {/* Packages Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Package className="text-gold-500" size={20} /> Pakiety Usługowe
                    </h3>
                </div>
                <div className="p-6">
                    {provider.owned_packages.length === 0 ? (
                        <p className="text-zinc-500 text-center py-4">Ten dostawca nie dodał jeszcze żadnych pakietów.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {provider.owned_packages.map(pkg => (
                                <div key={pkg.id} className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-white">{pkg.name}</div>
                                        <div className="text-sm text-zinc-500">{pkg.price} zł / {pkg.hours}h</div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${pkg.is_active ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
                                        {pkg.is_active ? 'Live' : 'Hidden'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Bookings & Reviews */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Briefcase className="text-gold-500" size={20} /> Historia Zleceń i Opinie
                    </h3>
                </div>
                <div className="p-6">
                    {provider.assigned_bookings.length === 0 ? (
                        <p className="text-zinc-500 text-center py-4">Brak historii zleceń.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-zinc-500 text-left">
                                        <th className="font-normal pb-4 pl-2">Klient</th>
                                        <th className="font-normal pb-4">Data</th>
                                        <th className="font-normal pb-4">Pakiet</th>
                                        <th className="font-normal pb-4 text-center">Ocena</th>
                                        <th className="font-normal pb-4 text-right pr-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-zinc-300 divide-y divide-zinc-800">
                                    {provider.assigned_bookings.map(booking => (
                                        <tr key={booking.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="py-3 pl-2 font-medium">{booking.client_name}</td>
                                            <td className="py-3 text-zinc-400">{new Date(booking.date).toLocaleDateString()}</td>
                                            <td className="py-3 text-zinc-400">{booking.package}</td>
                                            <td className="py-3 text-center">
                                                {booking.client_rating ? (
                                                    <div className="inline-flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                                                        <span className="text-amber-500 font-bold">{booking.client_rating}</span>
                                                        <Star size={12} className="fill-amber-500 text-amber-500" />
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-600">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 text-right pr-2">
                                                <span className={`px-2 py-1 rounded-full text-xs ${booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    booking.status === 'confirmed' ? 'bg-blue-500/10 text-blue-400' :
                                                        booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                                            'bg-zinc-800 text-zinc-400'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Client Reviews List */}
            {provider.assigned_bookings.filter(b => b.client_review).length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-800">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Star className="text-gold-500" size={20} /> Opinie Klientów
                        </h3>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {provider.assigned_bookings.filter(b => b.client_review).map(booking => (
                            <div key={`review-${booking.id}`} className="p-6 hover:bg-zinc-800/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold text-white">{booking.client_name}</div>
                                        <div className="flex items-center gap-0.5 text-amber-500">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={12} className={i < (booking.client_rating || 0) ? "fill-amber-500" : "text-zinc-700 fill-zinc-700"} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-xs text-zinc-500">{new Date(booking.date).toLocaleDateString()}</div>
                                </div>
                                <p className="text-zinc-300 italic">"{booking.client_review}"</p>
                                <div className="mt-2 text-xs text-zinc-500">Usługa: {booking.package}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
