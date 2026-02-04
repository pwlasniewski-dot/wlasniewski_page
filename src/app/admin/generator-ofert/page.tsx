'use client';

import { useState, useEffect } from 'react';
import OfferBuilder from '@/components/admin/OfferBuilder';
import { Users, X, Plus, Search } from 'lucide-react';

interface Client {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    city: string | null;
}

export default function GeneratorOfertPage() {
    const [showClientPanel, setShowClientPanel] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [newClientData, setNewClientData] = useState({ firstName: '', lastName: '', email: '', phone: '', city: '' });

    useEffect(() => {
        if (showClientPanel) {
            fetchClients();
        }
    }, [showClientPanel, search]);

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const url = `/api/admin/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClients(data.clients || []);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleCreateClient = async () => {
        if (!newClientData.firstName || !newClientData.lastName) {
            alert('Imię i nazwisko są wymagane');
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/clients', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newClientData)
            });

            if (res.ok) {
                const data = await res.json();
                setSelectedClient(data.client);
                setShowNewClientForm(false);
                setShowClientPanel(false);
                setNewClientData({ firstName: '', lastName: '', email: '', phone: '', city: '' });
            }
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Błąd dodawania klienta');
        }
    };

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setShowClientPanel(false);
    };

    // Generate initial data from selected client
    const initialData = selectedClient ? {
        contactName: `${selectedClient.firstName} ${selectedClient.lastName}`,
        contactEmail: selectedClient.email || '',
        contactPhone: selectedClient.phone || '',
        contactLocation: selectedClient.city || '',
    } : undefined;

    return (
        <div className="relative h-screen">
            {/* Floating Client Button */}
            <button
                onClick={() => setShowClientPanel(!showClientPanel)}
                className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg shadow-lg hover:bg-purple-700 transition"
                title="Zarządzaj klientami"
            >
                <Users size={20} />
                {selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : 'Wybierz klienta'}
            </button>

            {/* Client Panel Sidebar */}
            {showClientPanel && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setShowClientPanel(false)}
                    />

                    {/* Sidebar */}
                    <div className="fixed right-0 top-0 bottom-0 w-96 bg-zinc-900 border-l border-zinc-700 z-50 overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Klienci</h2>
                            <button onClick={() => setShowClientPanel(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="mb-4 relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Szukaj klienta..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* New Client Button */}
                        <button
                            onClick={() => setShowNewClientForm(!showNewClientForm)}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded mb-4 hover:bg-green-700 transition"
                        >
                            <Plus size={18} />
                            Dodaj nowego klienta
                        </button>

                        {/* New Client Form */}
                        {showNewClientForm && (
                            <div className="bg-zinc-800 p-4 rounded mb-4 space-y-3">
                                <input
                                    placeholder="Imię *"
                                    value={newClientData.firstName}
                                    onChange={(e) => setNewClientData({ ...newClientData, firstName: e.target.value })}
                                    className="w-full bg-zinc-900 text-white px-3 py-2 rounded border border-zinc-700 text-sm"
                                />
                                <input
                                    placeholder="Nazwisko *"
                                    value={newClientData.lastName}
                                    onChange={(e) => setNewClientData({ ...newClientData, lastName: e.target.value })}
                                    className="w-full bg-zinc-900 text-white px-3 py-2 rounded border border-zinc-700 text-sm"
                                />
                                <input
                                    placeholder="Email"
                                    value={newClientData.email}
                                    onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                                    className="w-full bg-zinc-900 text-white px-3 py-2 rounded border border-zinc-700 text-sm"
                                />
                                <input
                                    placeholder="Telefon"
                                    value={newClientData.phone}
                                    onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                                    className="w-full bg-zinc-900 text-white px-3 py-2 rounded border border-zinc-700 text-sm"
                                />
                                <input
                                    placeholder="Miasto"
                                    value={newClientData.city}
                                    onChange={(e) => setNewClientData({ ...newClientData, city: e.target.value })}
                                    className="w-full bg-zinc-900 text-white px-3 py-2 rounded border border-zinc-700 text-sm"
                                />
                                <button
                                    onClick={handleCreateClient}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Dodaj
                                </button>
                            </div>
                        )}

                        {/* Clients List */}
                        <div className="space-y-2">
                            {clients.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Brak klientów</p>
                            ) : (
                                clients.map((client) => (
                                    <div
                                        key={client.id}
                                        onClick={() => handleSelectClient(client)}
                                        className={`p-3 rounded cursor-pointer transition ${selectedClient?.id === client.id
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                                            }`}
                                    >
                                        <div className="font-bold">{client.firstName} {client.lastName}</div>
                                        {client.email && <div className="text-xs opacity-75">{client.email}</div>}
                                        {client.phone && <div className="text-xs opacity-75">{client.phone}</div>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Offer Builder with Auto-fill */}
            <OfferBuilder
                key={selectedClient?.id} // Force re-render when client changes
                initialData={initialData}
            />
        </div>
    );
}
