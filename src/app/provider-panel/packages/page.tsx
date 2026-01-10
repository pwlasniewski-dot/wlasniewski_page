'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Pencil, Trash2, Check, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ServiceType {
    id: number;
    name: string;
}

interface ProviderPackage {
    id: number;
    name: string;
    description: string;
    price: number;
    hours: number;
    service_id: number;
    is_active: boolean;
    service?: ServiceType;
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<ProviderPackage[]>([]);
    const [services, setServices] = useState<ServiceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [currentPackage, setCurrentPackage] = useState<Partial<ProviderPackage>>({});

    useEffect(() => {
        fetchPackages();
        fetchServices();
    }, []);

    const fetchPackages = async () => {
        try {
            const token = localStorage.getItem('provider_token');
            const res = await fetch('/api/provider/packages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPackages(data.packages);
            }
        } catch (error) {
            toast.error('Błąd pobierania pakietów');
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            // Reusing public API or creating a new provider-specific one
            // Assuming we can fetch generic service types
            const res = await fetch('/api/service-types'); // Need to ensure this endpoint exists and is public/accessible
            const data = await res.json();
            // The API structure might differ, adapting based on typical project structure
            if (data && Array.isArray(data)) {
                setServices(data);
            } else if (data.success && data.data) {
                setServices(data.data);
            }
        } catch (error) {
            // Silent fail or simple log
            console.error('Failed to load services', error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('provider_token');
            const isUpdate = !!currentPackage.id;
            const method = isUpdate ? 'PUT' : 'POST';

            const res = await fetch('/api/provider/packages', {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(currentPackage)
            });

            const data = await res.json();

            if (data.success) {
                toast.success(isUpdate ? 'Zaktualizowano pakiet' : 'Utworzono pakiet');
                setIsEditing(false);
                setCurrentPackage({});
                fetchPackages();
            } else {
                toast.error(data.error || 'Błąd zapisu');
            }
        } catch (error) {
            toast.error('Wystąpił błąd serwera');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć ten pakiet?')) return;

        try {
            const token = localStorage.getItem('provider_token');
            const res = await fetch(`/api/provider/packages?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Usunięto pakiet');
                fetchPackages();
            } else {
                toast.error('Błąd usuwania');
            }
        } catch (error) {
            toast.error('Wystąpił błąd');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-display font-bold text-white">Moje Pakiety</h1>
                    <p className="text-zinc-400">Zarządzaj swoją ofertą usługową</p>
                </div>
                <button
                    onClick={() => {
                        setCurrentPackage({ service_id: services[0]?.id || 1, is_active: true });
                        setIsEditing(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded-lg font-bold transition-colors"
                >
                    <Plus size={20} /> Dodaj Pakiet
                </button>
            </div>

            {/* Empty State */}
            {!loading && packages.length === 0 && !isEditing && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
                    <div className="inline-flex justify-center items-center w-16 h-16 bg-zinc-800 rounded-full mb-4">
                        <Package className="text-zinc-600" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Brak pakietów</h3>
                    <p className="text-zinc-500 max-w-md mx-auto mb-6">
                        Nie dodałeś jeszcze żadnych usług. Stwórz swój pierwszy pakiet, aby klienci mogli go rezerwować.
                    </p>
                    <button
                        onClick={() => {
                            setCurrentPackage({ service_id: services[0]?.id || 1, is_active: true });
                            setIsEditing(true);
                        }}
                        className="px-6 py-3 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Rozpocznij konfigurację
                    </button>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                    <div key={pkg.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition-all">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="inline-block px-2 py-1 bg-zinc-800 rounded text-xs font-mono text-zinc-400 uppercase">
                                    {pkg.service?.name || 'Usługa'}
                                </div>
                                <div className={`w-2 h-2 rounded-full ${pkg.is_active ? 'bg-green-500' : 'bg-red-500'}`} title={pkg.is_active ? 'Aktywny' : 'Ukryty'} />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                            <p className="text-zinc-500 text-sm h-10 line-clamp-2 mb-4">{pkg.description || 'Brak opisu'}</p>

                            <div className="flex items-end justify-between border-t border-zinc-800 pt-4">
                                <div>
                                    <span className="text-2xl font-bold text-gold-400">{pkg.price} zł</span>
                                    <span className="text-zinc-600 text-xs ml-2">/ {pkg.hours}h</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setCurrentPackage(pkg);
                                            setIsEditing(true);
                                        }}
                                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(pkg.id)}
                                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Editor Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-700 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">
                                {currentPackage.id ? 'Edytuj Pakiet' : 'Nowy Pakiet'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="text-zinc-500 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Typ Usługi</label>
                                <select
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-gold-500 focus:outline-none"
                                    value={currentPackage.service_id}
                                    onChange={e => setCurrentPackage({ ...currentPackage, service_id: Number(e.target.value) })}
                                >
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                    {services.length === 0 && <option value="1">Domyślna</option>}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Nazwa Pakietu</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="np. Pakiet Standard"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-gold-500 focus:outline-none"
                                    value={currentPackage.name || ''}
                                    onChange={e => setCurrentPackage({ ...currentPackage, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Cena (PLN)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-gold-500 focus:outline-none"
                                        value={currentPackage.price || ''}
                                        onChange={e => setCurrentPackage({ ...currentPackage, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Czas trwania (h)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-gold-500 focus:outline-none"
                                        value={currentPackage.hours || ''}
                                        onChange={e => setCurrentPackage({ ...currentPackage, hours: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Opis</label>
                                <textarea
                                    rows={3}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-gold-500 focus:outline-none resize-none"
                                    value={currentPackage.description || ''}
                                    onChange={e => setCurrentPackage({ ...currentPackage, description: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={currentPackage.is_active ?? true}
                                    onChange={e => setCurrentPackage({ ...currentPackage, is_active: e.target.checked })}
                                    className="w-5 h-5 rounded border-zinc-600 text-gold-500 focus:ring-gold-500 bg-zinc-800"
                                />
                                <label htmlFor="isActive" className="text-sm text-zinc-300">Aktywny (widoczny w ofercie)</label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-5 py-2.5 text-zinc-400 hover:text-white transition-colors"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-5 py-2.5 bg-gold-500 text-black font-bold rounded-lg hover:bg-gold-400 transition-colors flex items-center gap-2"
                            >
                                <Check size={18} /> Zapisz Zmiany
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
