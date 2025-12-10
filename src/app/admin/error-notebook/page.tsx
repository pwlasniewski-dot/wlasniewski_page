'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle, XCircle, Database, Code, Globe, Trash2, Plus, Filter } from 'lucide-react';

interface ErrorNote {
    id: number;
    title: string;
    category: string;
    severity: string;
    description: string;
    sql_query?: string;
    status: string;
    created_at: string;
    resolved_at?: string;
    notes?: string;
}

export default function ErrorNotebookPage() {
    const [notes, setNotes] = useState<ErrorNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newNote, setNewNote] = useState({
        title: '',
        category: 'DATABASE',
        severity: 'MEDIUM',
        description: '',
        sql_query: '',
        notes: ''
    });

    useEffect(() => {
        fetchNotes();
    }, [filterStatus, filterCategory]);

    const fetchNotes = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const params = new URLSearchParams();
            if (filterStatus !== 'ALL') params.append('status', filterStatus);
            if (filterCategory !== 'ALL') params.append('category', filterCategory);

            const res = await fetch(`${getApiUrl('error-notes')}?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setNotes(data.notes);
            }
        } catch (error) {
            toast.error('Błąd pobierania notatek');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.title || !newNote.description) {
            toast.error('Tytuł i opis są wymagane');
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('error-notes'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newNote)
            });

            if (res.ok) {
                toast.success('Notatka dodana');
                setShowAddModal(false);
                setNewNote({
                    title: '',
                    category: 'DATABASE',
                    severity: 'MEDIUM',
                    description: '',
                    sql_query: '',
                    notes: ''
                });
                fetchNotes();
            }
        } catch (error) {
            toast.error('Błąd dodawania notatki');
        }
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('error-notes'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (res.ok) {
                toast.success('Status zaktualizowany');
                fetchNotes();
            }
        } catch (error) {
            toast.error('Błąd aktualizacji');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Usunąć notatkę?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${getApiUrl('error-notes')}?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Notatka usunięta');
                fetchNotes();
            }
        } catch (error) {
            toast.error('Błąd usuwania');
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-500/10 text-red-400 border-red-500/30';
            case 'HIGH': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
            case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            case 'LOW': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'DATABASE': return <Database className="w-4 h-4" />;
            case 'API': return <Code className="w-4 h-4" />;
            case 'FRONTEND': return <Globe className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    if (loading) return <div className="text-zinc-400">Ładowanie...</div>;

    return (
        <div className="max-w-7xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">📓 Notatnik błędów</h1>
                    <p className="text-zinc-400">Śledzenie problemów z bazą danych i zapytania SQL do naprawy</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded-md font-medium flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Dodaj błąd
                </button>
            </div>

            {/* Filtry */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm text-zinc-400 mb-2">Status</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                    >
                        <option value="ALL">Wszystkie</option>
                        <option value="OPEN">Otwarte</option>
                        <option value="RESOLVED">Rozwiązane</option>
                        <option value="IGNORED">Zignorowane</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-zinc-400 mb-2">Kategoria</label>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                    >
                        <option value="ALL">Wszystkie</option>
                        <option value="DATABASE">Baza danych</option>
                        <option value="API">API</option>
                        <option value="FRONTEND">Frontend</option>
                        <option value="OTHER">Inne</option>
                    </select>
                </div>
            </div>

            {/* Lista notatek */}
            <div className="space-y-4">
                {notes.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
                        <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">Brak notatek błędów</p>
                    </div>
                ) : (
                    notes.map(note => (
                        <div key={note.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="text-gold-400 mt-1">
                                        {getCategoryIcon(note.category)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">{note.title}</h3>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className={`px-2 py-1 rounded text-xs border ${getSeverityColor(note.severity)}`}>
                                                {note.severity}
                                            </span>
                                            <span className="px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-300">
                                                {note.category}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs ${note.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400' :
                                                    note.status === 'RESOLVED' ? 'bg-green-500/10 text-green-400' :
                                                        'bg-zinc-500/10 text-zinc-400'
                                                }`}>
                                                {note.status}
                                            </span>
                                        </div>
                                        <p className="text-zinc-300 whitespace-pre-wrap mb-4">{note.description}</p>

                                        {note.sql_query && (
                                            <div className="bg-zinc-950 border border-zinc-700 rounded p-4 mb-4">
                                                <div className="text-xs text-gold-400 mb-2 font-mono">SQL QUERY:</div>
                                                <pre className="text-sm text-green-400 font-mono overflow-x-auto">
                                                    {note.sql_query}
                                                </pre>
                                            </div>
                                        )}

                                        {note.notes && (
                                            <div className="bg-zinc-800/50 border border-zinc-700 rounded p-3">
                                                <div className="text-xs text-zinc-500 mb-1">Dodatkowe notatki:</div>
                                                <p className="text-sm text-zinc-300">{note.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {note.status === 'OPEN' && (
                                        <button
                                            onClick={() => handleUpdateStatus(note.id, 'RESOLVED')}
                                            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded"
                                            title="Oznacz jako rozwiązane"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                    {note.status !== 'IGNORED' && (
                                        <button
                                            onClick={() => handleUpdateStatus(note.id, 'IGNORED')}
                                            className="p-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-400 rounded"
                                            title="Ignoruj"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded"
                                        title="Usuń"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="text-xs text-zinc-500">
                                Utworzono: {new Date(note.created_at).toLocaleString('pl-PL')}
                                {note.resolved_at && ` • Rozwiązano: ${new Date(note.resolved_at).toLocaleString('pl-PL')}`}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal dodawania */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-lg border border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-zinc-800">
                            <h2 className="text-xl font-bold text-white">Dodaj błąd do notatnika</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Tytuł *</label>
                                <input
                                    type="text"
                                    value={newNote.title}
                                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                    placeholder="np. Duplikat strony głównej"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Kategoria</label>
                                    <select
                                        value={newNote.category}
                                        onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                    >
                                        <option value="DATABASE">Baza danych</option>
                                        <option value="API">API</option>
                                        <option value="FRONTEND">Frontend</option>
                                        <option value="OTHER">Inne</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Priorytet</label>
                                    <select
                                        value={newNote.severity}
                                        onChange={(e) => setNewNote({ ...newNote, severity: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                    >
                                        <option value="LOW">Niski</option>
                                        <option value="MEDIUM">Średni</option>
                                        <option value="HIGH">Wysoki</option>
                                        <option value="CRITICAL">Krytyczny</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Opis problemu *</label>
                                <textarea
                                    rows={4}
                                    value={newNote.description}
                                    onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                    placeholder="Szczegółowy opis problemu..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Zapytanie SQL (opcjonalne)</label>
                                <textarea
                                    rows={4}
                                    value={newNote.sql_query}
                                    onChange={(e) => setNewNote({ ...newNote, sql_query: e.target.value })}
                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-green-400 font-mono text-sm"
                                    placeholder="DELETE FROM table WHERE..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Dodatkowe notatki</label>
                                <textarea
                                    rows={2}
                                    value={newNote.notes}
                                    onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-zinc-800 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleAddNote}
                                className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded font-medium"
                            >
                                Dodaj
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
