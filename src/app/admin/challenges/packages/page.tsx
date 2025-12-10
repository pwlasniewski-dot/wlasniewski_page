'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChallengePackage {
    id: number;
    name: string;
    description: string;
    base_price: number;
    challenge_price: number;
    discount_percentage: number;
    included_items: string; // JSON string
    is_active: boolean;
    display_order: number;
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<ChallengePackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPackage, setCurrentPackage] = useState<Partial<ChallengePackage>>({});
    const [includedItemsList, setIncludedItemsList] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const res = await fetch('/api/photo-challenge/packages');
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

    const handleSave = async () => {
        if (!currentPackage.name || !currentPackage.base_price || !currentPackage.challenge_price) {
            toast.error('Wypełnij wymagane pola');
            return;
        }

        try {
            const method = currentPackage.id ? 'PUT' : 'POST';
            const body = {
                ...currentPackage,
                included_items: JSON.stringify(includedItemsList)
            };

            const token = localStorage.getItem('admin_token');
            if (!token) {
                toast.error('Brak autoryzacji. Zaloguj się ponownie.');
                // router.push('/admin/login'); // allow user to save work? No, cannot save without token.
                return;
            }

            const res = await fetch('/api/photo-challenge/packages', {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Zapisano pakiet');
                setIsEditing(false);
                setCurrentPackage({});
                setIncludedItemsList([]);
                fetchPackages();
            } else {
                toast.error(data.error || 'Błąd zapisu');
            }
        } catch (error) {
            toast.error('Wystąpił błąd');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć ten pakiet?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/photo-challenge/packages?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Usunięto pakiet');
                fetchPackages();
            } else {
                toast.error('Błąd usuwania');
            }
        } catch (error) {
            toast.error('Wystąpił błąd');
        }
    };

    const openEdit = (pkg: ChallengePackage) => {
        setCurrentPackage(pkg);
        try {
            setIncludedItemsList(JSON.parse(pkg.included_items || '[]'));
        } catch (e) {
            setIncludedItemsList([]);
        }
        setIsEditing(true);
    };

    const openNew = () => {
        setCurrentPackage({
            name: '',
            description: '',
            base_price: 0,
            challenge_price: 0,
            is_active: true
        });
        setIncludedItemsList([]);
        setIsEditing(true);
    };

    const addIncludedItem = () => {
        if (newItem.trim()) {
            setIncludedItemsList([...includedItemsList, newItem.trim()]);
            setNewItem('');
        }
    };

    const removeIncludedItem = (index: number) => {
        setIncludedItemsList(includedItemsList.filter((_, i) => i !== index));
    };

    return (
        <div className="text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-display text-gold-400">Pakiety Wyzwań</h1>
                <button
                    onClick={openNew}
                    className="bg-gold-500 hover:bg-gold-600 text-black px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                    <Plus size={20} /> Dodaj Pakiet
                </button>
            </div>

            {loading ? (
                <div>Ładowanie...</div>
            ) : (
                <div className="grid gap-4">
                    {packages.map(pkg => (
                        <div key={pkg.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                                <div className="text-zinc-400 text-sm mb-2">{pkg.description}</div>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-zinc-500 line-through">{pkg.base_price} PLN</span>
                                    <span className="text-gold-400 font-bold">{pkg.challenge_price} PLN</span>
                                    <span className="text-green-400">-{pkg.discount_percentage}%</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEdit(pkg)}
                                    className="p-2 hover:bg-zinc-800 rounded-lg text-blue-400"
                                >
                                    <Edit size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(pkg.id)}
                                    className="p-2 hover:bg-zinc-800 rounded-lg text-red-400"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isEditing && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-white">
                            {currentPackage.id ? 'Edytuj Pakiet' : 'Nowy Pakiet'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Nazwa</label>
                                <input
                                    type="text"
                                    value={currentPackage.name || ''}
                                    onChange={e => setCurrentPackage({ ...currentPackage, name: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Cena bazowa (PLN)</label>
                                    <input
                                        type="number"
                                        value={currentPackage.base_price || 0}
                                        onChange={e => setCurrentPackage({ ...currentPackage, base_price: Number(e.target.value) })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Cena w wyzwaniu (PLN)</label>
                                    <input
                                        type="number"
                                        value={currentPackage.challenge_price || 0}
                                        onChange={e => setCurrentPackage({ ...currentPackage, challenge_price: Number(e.target.value) })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Opis</label>
                                <textarea
                                    value={currentPackage.description || ''}
                                    onChange={e => setCurrentPackage({ ...currentPackage, description: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white h-24"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Co zawiera pakiet?</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={newItem}
                                        onChange={e => setNewItem(e.target.value)}
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
                                        placeholder="np. 20 zdjęć"
                                        onKeyDown={e => e.key === 'Enter' && addIncludedItem()}
                                    />
                                    <button
                                        onClick={addIncludedItem}
                                        className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <ul className="space-y-2">
                                    {includedItemsList.map((item, i) => (
                                        <li key={i} className="flex justify-between items-center bg-zinc-800/50 p-2 rounded">
                                            <span>{item}</span>
                                            <button
                                                onClick={() => removeIncludedItem(i)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <X size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={currentPackage.is_active ?? true}
                                    onChange={e => setCurrentPackage({ ...currentPackage, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-gold-500 focus:ring-gold-500"
                                />
                                <label htmlFor="isActive" className="text-zinc-300">Aktywny</label>
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
