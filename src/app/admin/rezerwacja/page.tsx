'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Toaster, toast } from 'sonner';

interface ServiceType {
    id: number;
    name: string;
    icon?: string;
    description?: string;
    order: number;
    is_active: boolean;
    packages: Package[];
}

interface Package {
    id: number;
    service_id: number;
    name: string;
    icon?: string;
    description?: string;
    hours: number;
    price: number;
    subtitle?: string;
    features?: string;
    available_hours?: string; // JSON: "9,10,11,12,13,14,15,16,17" or "MON,TUE,WED,THU,FRI"
    blocks_entire_day?: boolean; // true for weddings, false for sessions
    order: number;
    is_active: boolean;
}

export default function AdminPackagesPage() {
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [editingService, setEditingService] = useState<ServiceType | null>(null);
    const [showPackageForm, setShowPackageForm] = useState(false);
    const [showServiceForm, setShowServiceForm] = useState(false);

    // Load service types and packages
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetch(getApiUrl('service-types'));
                if (res.ok) {
                    const data = await res.json();
                    setServiceTypes(data.serviceTypes || []);
                }
            } catch (error) {
                console.error('Failed to load service types:', error);
                toast.error('Błąd ładowania usług');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Save package
    const handleSavePackage = async (pkg: Package, serviceId: number) => {
        if (!pkg.name || !pkg.hours || pkg.price === undefined) {
            toast.error('Uzupełnij wymagane pola');
            return;
        }

        try {
            const res = await fetch(getApiUrl('packages'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...pkg,
                    service_id: serviceId,
                    features: typeof pkg.features === 'string' ? pkg.features : JSON.stringify(pkg.features || []),
                    price: parseInt(String(pkg.price))
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(pkg.id ? 'Pakiet zaktualizowany' : 'Pakiet dodany');
                setEditingPackage(null);
                setShowPackageForm(false);

                // Reload data
                const reloadRes = await fetch(getApiUrl('service-types'));
                if (reloadRes.ok) {
                    const reloadData = await reloadRes.json();
                    setServiceTypes(reloadData.serviceTypes || []);
                }
            } else {
                toast.error('Błąd zapisu pakietu');
            }
        } catch (error) {
            console.error('Error saving package:', error);
            toast.error('Błąd zapisu');
        }
    };

    // Delete package
    const handleDeletePackage = async (packageId: number) => {
        if (!confirm('Na pewno chcesz usunąć ten pakiet?')) return;

        try {
            const res = await fetch(`${getApiUrl('packages')}?id=${packageId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Pakiet usunięty');

                // Reload data
                const reloadRes = await fetch(getApiUrl('service-types'));
                if (reloadRes.ok) {
                    const reloadData = await reloadRes.json();
                    setServiceTypes(reloadData.serviceTypes || []);
                }
            } else {
                toast.error('Błąd usunięcia');
            }
        } catch (error) {
            console.error('Error deleting package:', error);
            toast.error('Błąd usunięcia');
        }
    };

    if (loading) return <div className="p-8 text-center">Ładowanie...</div>;

    return (
        <div className="min-h-screen bg-zinc-950 p-8">
            <Toaster position="top-right" theme="dark" />

            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8">📦 Zarządzaj Pakietami</h1>

                {/* Service Types List */}
                <div className="space-y-8">
                    {serviceTypes.map((service) => (
                        <div key={service.id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{service.icon || '📸'}</span>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{service.name}</h2>
                                        <p className="text-zinc-400 text-sm">{service.description}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingService(service);
                                        setShowServiceForm(true);
                                    }}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition"
                                >
                                    Edytuj usługę
                                </button>
                            </div>

                            {/* Packages Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {service.packages.map((pkg) => (
                                    <div key={pkg.id} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{pkg.icon || '📦'}</span>
                                                <div>
                                                    <h3 className="font-bold text-white">{pkg.name}</h3>
                                                    <p className="text-xs text-zinc-400">{pkg.hours}h • {pkg.price}zł</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${pkg.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                {pkg.is_active ? 'Aktywny' : 'Nieaktywny'}
                                            </span>
                                        </div>

                                        {pkg.subtitle && <p className="text-sm text-zinc-300 mb-2">{pkg.subtitle}</p>}

                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => {
                                                    setEditingPackage(pkg);
                                                    setShowPackageForm(true);
                                                }}
                                                className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition"
                                            >
                                                Edytuj
                                            </button>
                                            <button
                                                onClick={() => handleDeletePackage(pkg.id)}
                                                className="px-3 py-1 bg-red-900/30 text-red-400 text-sm rounded hover:bg-red-900/50 transition"
                                            >
                                                Usuń
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Package Button */}
                            <button
                                onClick={() => {
                                    setEditingPackage({
                                        id: 0,
                                        service_id: service.id,
                                        name: '',
                                        icon: '📦',
                                        description: '',
                                        hours: 1,
                                        price: 0,
                                        subtitle: '',
                                        features: '[]',
                                        order: (service.packages.length || 0) + 1,
                                        is_active: true
                                    });
                                    setShowPackageForm(true);
                                }}
                                className="w-full px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition font-medium"
                            >
                                ➕ Dodaj pakiet do {service.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Package Edit Form Modal */}
                {showPackageForm && editingPackage && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-zinc-900 rounded-xl p-6 max-w-2xl w-full border border-zinc-800 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-2xl font-bold text-white mb-4">
                                {editingPackage.id ? '✏️ Edytuj pakiet' : '➕ Nowy pakiet'}
                            </h3>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">Nazwa</label>
                                        <input
                                            type="text"
                                            value={editingPackage.name}
                                            onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                            placeholder="np. Złoty"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">Emoji</label>
                                        <input
                                            type="text"
                                            value={editingPackage.icon || ''}
                                            onChange={(e) => setEditingPackage({ ...editingPackage, icon: e.target.value })}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                            placeholder="⭐"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">Godziny</label>
                                        <input
                                            type="number"
                                            value={editingPackage.hours}
                                            onChange={(e) => setEditingPackage({ ...editingPackage, hours: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                            placeholder="2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1">Cena (PLN)</label>
                                        <input
                                            type="number"
                                            value={editingPackage.price}
                                            onChange={(e) => setEditingPackage({ ...editingPackage, price: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                            placeholder="199"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Opis krótki</label>
                                    <input
                                        type="text"
                                        value={editingPackage.subtitle || ''}
                                        onChange={(e) => setEditingPackage({ ...editingPackage, subtitle: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="Sesja 2h"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Opis pełny</label>
                                    <textarea
                                        value={editingPackage.description || ''}
                                        onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="Szczegółowy opis pakietu..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Dostępne godziny (np: 9,10,11,12,13,14,15,16,17)</label>
                                    <input
                                        type="text"
                                        value={editingPackage.available_hours || ''}
                                        onChange={(e) => setEditingPackage({ ...editingPackage, available_hours: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                                        placeholder="9,10,11,12,13,14,15,16,17"
                                    />
                                    <p className="text-xs text-zinc-400 mt-1">Wpisz numery godzin od 0-23 dla poszczególnych dni</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="blocks_entire_day"
                                        checked={editingPackage.blocks_entire_day || false}
                                        onChange={(e) => setEditingPackage({ ...editingPackage, blocks_entire_day: e.target.checked })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <label htmlFor="blocks_entire_day" className="text-sm text-zinc-300">Blokuje cały dzień (ślub/urodziny)</label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="active"
                                        checked={editingPackage.is_active}
                                        onChange={(e) => setEditingPackage({ ...editingPackage, is_active: e.target.checked })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <label htmlFor="active" className="text-sm text-zinc-300">Pakiet aktywny</label>
                                </div>

                                <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
                                    <button
                                        onClick={() => {
                                            setEditingPackage(null);
                                            setShowPackageForm(false);
                                        }}
                                        className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        onClick={() => handleSavePackage(editingPackage, editingPackage.service_id)}
                                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition font-medium"
                                    >
                                        Zapisz
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
