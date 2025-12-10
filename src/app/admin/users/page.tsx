'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Plus, Trash2, Edit2, Shield, User, Key } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminUser {
    id: number;
    email: string;
    name: string | null;
    role: string;
    created_at: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<AdminUser> & { password?: string } | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('users'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            toast.error('Błąd pobierania użytkowników');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingUser?.email) {
            toast.error('Email jest wymagany');
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            const isEdit = !!editingUser.id;
            const url = isEdit ? `${getApiUrl('users/manage')}?id=${editingUser.id}` : getApiUrl('users');
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editingUser),
            });

            const data = await res.json();

            if (data.success) {
                toast.success(isEdit ? 'Zaktualizowano użytkownika' : 'Utworzono użytkownika');
                setShowModal(false);
                setEditingUser(null);
                fetchUsers();
            } else {
                toast.error(data.error || 'Błąd zapisu');
            }
        } catch (error) {
            toast.error('Wystąpił błąd');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${getApiUrl('users/manage')}?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Usunięto użytkownika');
                fetchUsers();
            } else {
                toast.error('Błąd usuwania');
            }
        } catch (error) {
            toast.error('Wystąpił błąd');
        }
    };

    const openNewUser = () => {
        setEditingUser({
            email: '',
            name: '',
            role: 'USER',
            password: ''
        });
        setShowModal(true);
    };

    const openEditUser = (user: AdminUser) => {
        setEditingUser({
            ...user,
            password: '' // Empty password means no change
        });
        setShowModal(true);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-display font-semibold text-white">Użytkownicy</h1>
                <button
                    onClick={openNewUser}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Dodaj użytkownika
                </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Użytkownik</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Rola</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Data utworzenia</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-zinc-800 rounded-full flex items-center justify-center">
                                            <User className="h-5 w-5 text-zinc-400" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-white">{user.name || 'Bez nazwy'}</div>
                                            <div className="text-sm text-zinc-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-900 text-purple-200' : 'bg-zinc-700 text-zinc-200'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => openEditUser(user)}
                                        className="text-gold-400 hover:text-gold-300 mr-4"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-zinc-800 space-y-4">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            {editingUser.id ? 'Edytuj użytkownika' : 'Nowy użytkownik'}
                        </h2>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Email</label>
                            <input
                                type="email"
                                value={editingUser.email || ''}
                                onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                className="w-full bg-zinc-800 border-zinc-700 rounded-md text-white"
                                disabled={!!editingUser.id} // Disable email edit for existing users
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Nazwa</label>
                            <input
                                type="text"
                                value={editingUser.name || ''}
                                onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                className="w-full bg-zinc-800 border-zinc-700 rounded-md text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Rola</label>
                            <select
                                value={editingUser.role || 'USER'}
                                onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                className="w-full bg-zinc-800 border-zinc-700 rounded-md text-white"
                            >
                                <option value="USER">Użytkownik</option>
                                <option value="ADMIN">Administrator</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">
                                {editingUser.id ? 'Nowe hasło (pozostaw puste aby nie zmieniać)' : 'Hasło'}
                            </label>
                            <input
                                type="password"
                                value={editingUser.password || ''}
                                onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                className="w-full bg-zinc-800 border-zinc-700 rounded-md text-white"
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-zinc-400 hover:text-white"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-gold-500 text-black rounded hover:bg-gold-400"
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
