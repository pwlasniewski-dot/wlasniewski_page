'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChallengeLocation {
    id: number;
    name: string;
    description: string;
    address: string;
    google_maps_url: string;
    image_url: string;
    is_active: boolean;
    display_order: number;
}

export default function LocationsPage() {
    const [locations, setLocations] = useState<ChallengeLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<Partial<ChallengeLocation>>({});

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const res = await fetch('/api/photo-challenge/locations');
            const data = await res.json();
            if (data.success) {
                setLocations(data.locations);
            }
        } catch (error) {
            toast.error('Błąd pobierania lokalizacji');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentLocation.name || !currentLocation.address) {
            toast.error('Nazwa i adres są wymagane');
            return;
        }

        try {
            const method = currentLocation.id ? 'PUT' : 'POST';
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/photo-challenge/locations', {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(currentLocation)
            });



            const data = await res.json();
            if (data.success) {
                toast.success('Zapisano lokalizację');
                setIsEditing(false);
                setCurrentLocation({});
                fetchLocations();
            } else {
                toast.error(data.error || 'Błąd zapisu');
            }
        } catch (error) {
            toast.error('Wystąpił błąd');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć tę lokalizację?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/photo-challenge/locations?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Usunięto lokalizację');
                fetchLocations();
            } else {
                toast.error('Błąd usuwania');
            }
        } catch (error) {
            toast.error('Wystąpił błąd');
        }
    };

    const openEdit = (loc: ChallengeLocation) => {
        setCurrentLocation(loc);
        setIsEditing(true);
    };

    const openNew = () => {
        setCurrentLocation({
            name: '',
            description: '',
            address: '',
            google_maps_url: '',
            image_url: '',
            is_active: true
        });
        setIsEditing(true);
    };

    return (
        <div className="text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-display text-gold-400">Lokalizacje Wyzwań</h1>
                <button
                    onClick={openNew}
                    className="bg-gold-500 hover:bg-gold-600 text-black px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                    <Plus size={20} /> Dodaj Lokalizację
                </button>
            </div>

            {loading ? (
                <div>Ładowanie...</div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {locations.map(loc => (
                        <div key={loc.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{loc.name}</h3>
                                    <div className="flex items-center text-zinc-400 text-sm gap-1">
                                        <MapPin size={14} /> {loc.address}
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(loc)}
                                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-blue-400"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(loc.id)}
                                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-red-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {loc.description && (
                                <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{loc.description}</p>
                            )}

                            {loc.image_url ? (
                                <div className="h-40 bg-zinc-950 rounded-lg overflow-hidden">
                                    <img src={loc.image_url} alt={loc.name} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="h-40 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-700 border border-zinc-800 border-dashed">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isEditing && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-white">
                            {currentLocation.id ? 'Edytuj Lokalizację' : 'Nowa Lokalizację'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Nazwa</label>
                                <input
                                    type="text"
                                    value={currentLocation.name || ''}
                                    onChange={e => setCurrentLocation({ ...currentLocation, name: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Adres</label>
                                <input
                                    type="text"
                                    value={currentLocation.address || ''}
                                    onChange={e => setCurrentLocation({ ...currentLocation, address: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Google Maps URL</label>
                                <input
                                    type="text"
                                    value={currentLocation.google_maps_url || ''}
                                    onChange={e => setCurrentLocation({ ...currentLocation, google_maps_url: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Zdjęcie URL</label>
                                <input
                                    type="text"
                                    value={currentLocation.image_url || ''}
                                    onChange={e => setCurrentLocation({ ...currentLocation, image_url: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-zinc-500 mt-1">Tu przydałby się MediaPicker, w przyszłości do dodania.</p>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Opis</label>
                                <textarea
                                    value={currentLocation.description || ''}
                                    onChange={e => setCurrentLocation({ ...currentLocation, description: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white h-24"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={currentLocation.is_active ?? true}
                                    onChange={e => setCurrentLocation({ ...currentLocation, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-gold-500 focus:ring-gold-500"
                                />
                                <label htmlFor="isActive" className="text-zinc-300">Aktywna</label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-2 rounded-lg font-medium"
                            >
                                Zapisz
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
