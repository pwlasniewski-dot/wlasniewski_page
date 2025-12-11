'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Mail, Printer, Copy, Trash2, Plus } from 'lucide-react';
import GiftCard from '@/components/GiftCard';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/lib/api-config';

const THEMES = [
    { id: 'christmas', label: 'Boże Narodzenie', icon: '🎄' },
    { id: 'wosp', label: 'Wielka Orkiestra', icon: '❤️' },
    { id: 'valentines', label: 'Walentynki', icon: '💝' },
    { id: 'easter', label: 'Wielkanoc', icon: '🐰' },
    { id: 'halloween', label: 'Halloween', icon: '👻' },
    { id: 'mothers-day', label: 'Dzień Matki', icon: '💐' },
    { id: 'childrens-day', label: 'Dzień Dziecka', icon: '🎈' },
    { id: 'wedding', label: 'Ślub', icon: '💒' },
    { id: 'birthday', label: 'Urodziny', icon: '🎂' }
] as const;

interface GiftCard {
    id?: string;
    code: string;
    value: number;
    theme: string;
    recipient_name?: string;
    sender_name?: string;
    message?: string;
    status?: string;
    created_at?: string;
}

export default function GiftCardsAdmin() {
    const router = useRouter();
    const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [logoUrl, setLogoUrl] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    
    const [formData, setFormData] = useState({
        code: '',
        value: 100,
        theme: 'christmas' as string,
        recipient_name: '',
        sender_name: '',
        message: '',
        card_title: '',
        card_description: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            toast.error('Musisz być zalogowany');
            router.push('/admin/login');
            return;
        }
        setIsAuthorized(true);
        fetchCards();
        fetchLogo();
    }, [router]);

    const fetchCards = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                toast.error('Brak tokenu - zaloguj się ponownie');
                router.push('/admin/login');
                return;
            }
            const res = await fetch(getApiUrl('gift-cards'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.status === 401) {
                toast.error('Sesja wygasła - zaloguj się ponownie');
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
                return;
            }
            
            const data = await res.json();
            if (data.success) {
                setGiftCards(data.cards || []);
            } else {
                toast.error(data.error || 'Błąd ładowania kart');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Błąd połączenia');
        }
    };

    const fetchLogo = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) return;
            
            const res = await fetch(getApiUrl('settings'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.status === 401) {
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
                return;
            }
            
            const data = await res.json();
            if (data.success) {
                setLogoUrl(data.settings?.logo_url || '');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, code }));
    };

    const createCard = async () => {
        if (!formData.code || !formData.value) {
            toast.error('Wypełnij wymagane pola');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                toast.error('Brak tokenu - zaloguj się ponownie');
                router.push('/admin/login');
                return;
            }
            
            const res = await fetch(getApiUrl('gift-cards'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.status === 401) {
                toast.error('Sesja wygasła - zaloguj się ponownie');
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
                return;
            }

            const data = await res.json();
            if (data.success) {
                toast.success('Karta podarunkowa utworzona');
                setFormData({
                    code: '',
                    value: 100,
                    theme: 'christmas',
                    recipient_name: '',
                    sender_name: '',
                    message: '',
                    card_title: '',
                    card_description: ''
                });
                setShowCreateModal(false);
                fetchCards();
            } else {
                toast.error(data.error || 'Błąd');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Błąd serwera');
        } finally {
            setLoading(false);
        }
    };

    const deleteCard = async (id: string) => {
        if (!confirm('Usunąć kartę?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                toast.error('Brak tokenu - zaloguj się ponownie');
                router.push('/admin/login');
                return;
            }
            
            const res = await fetch(getApiUrl(`gift-cards/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                toast.error('Sesja wygasła');
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
                return;
            }

            if (res.ok) {
                toast.success('Karta usunięta');
                fetchCards();
            } else {
                toast.error('Błąd usuwania');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Błąd');
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Kod skopiowany');
    };

    const printCard = (card: GiftCard) => {
        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <style>
                        body { margin: 0; padding: 20px; background: white; }
                        @page { size: landscape; margin: 0; }
                        @media print { body { margin: 0; padding: 0; } }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh;">
                        <div style="width: 540px; height: 340px; border: 2px dashed #ccc; padding: 20px;">
                            <!-- Karta będzie tutaj -->
                        </div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const sendEmail = async (card: GiftCard) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`gift-cards/${card.id}/send-email`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    email: card.recipient_name,
                    logoUrl 
                })
            });

            if (res.ok) {
                toast.success('Email wysłany');
            } else {
                toast.error('Błąd wysyłania');
            }
        } catch (error) {
            toast.error('Błąd');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 p-6">
            {!isAuthorized && (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-zinc-400">Ładowanie...</p>
                    </div>
                </div>
            )}

            {isAuthorized && (
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white">🎁 Karty Podarunkowe</h1>
                        <p className="text-zinc-400 mt-2">Twórz i zarządzaj kartami podarunkowymi z sezonowymi wzorami</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(!showCreateModal)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Nowa Karta
                    </button>
                </div>

                {/* Create Form */}
                {showCreateModal && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-white mb-6">Stwórz Nową Kartę</h2>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Form */}
                            <div className="space-y-4">
                                {/* Code */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Kod promocyjny *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                            placeholder="np. WINTER2024"
                                            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                                        />
                                        <button
                                            onClick={generateCode}
                                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"
                                        >
                                            Generuj
                                        </button>
                                    </div>
                                </div>

                                {/* Value */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Wartość (zł) *</label>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={e => setFormData(prev => ({ ...prev, value: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                                    />
                                </div>

                                {/* Theme */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Motyw *</label>
                                    <select
                                        value={formData.theme}
                                        onChange={e => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                                    >
                                        {THEMES.map(t => (
                                            <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Recipient */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Dla kogo (email)</label>
                                    <input
                                        type="email"
                                        value={formData.recipient_name}
                                        onChange={e => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                                        placeholder="klient@example.com"
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                                    />
                                </div>

                                {/* Sender */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Od kogo</label>
                                    <input
                                        type="text"
                                        value={formData.sender_name}
                                        onChange={e => setFormData(prev => ({ ...prev, sender_name: e.target.value }))}
                                        placeholder="Nazwa firmy"
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Wiadomość</label>
                                    <textarea
                                        value={formData.message}
                                        onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                        placeholder="Osobista wiadomość..."
                                        rows={3}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none resize-none"
                                    />
                                </div>

                                {/* Card Title - Custom */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Tytuł karty (customowy)</label>
                                    <input
                                        type="text"
                                        value={formData.card_title}
                                        onChange={e => setFormData(prev => ({ ...prev, card_title: e.target.value }))}
                                        placeholder="np. KARTA PODARUNKOWA, BON PREZENTOWY, etc."
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                                    />
                                </div>

                                {/* Card Description - Custom */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Opis karty (customowy)</label>
                                    <input
                                        type="text"
                                        value={formData.card_description}
                                        onChange={e => setFormData(prev => ({ ...prev, card_description: e.target.value }))}
                                        placeholder="np. Specjalny rabat, Świąteczny bonus, etc."
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4">
                                    <button
                                        onClick={createCard}
                                        disabled={loading}
                                        className="flex-1 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Tworzenie...' : 'Stwórz Kartę'}
                                    </button>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"
                                    >
                                        Anuluj
                                    </button>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="flex items-center justify-center bg-zinc-800/50 rounded-lg p-6">
                                <div className="w-full max-w-sm">
                                    <p className="text-sm text-zinc-400 text-center mb-4 font-medium">Podgląd karty:</p>
                                    <GiftCard
                                        code={formData.code || 'EXAMPLE'}
                                        value={formData.value}
                                        theme={formData.theme as any}
                                        logoUrl={logoUrl}
                                        recipientName={formData.recipient_name}
                                        senderName={formData.sender_name}
                                        message={formData.message}
                                        cardTitle={formData.card_title}
                                        cardDescription={formData.card_description}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {giftCards.map(card => (
                        <div key={card.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                            {/* Card Preview */}
                            <div className="p-4 bg-zinc-800/50">
                                <div className="scale-75 origin-top-left">
                                    <GiftCard
                                        code={card.code}
                                        value={card.value}
                                        theme={card.theme as any}
                                        logoUrl={logoUrl}
                                        recipientName={card.recipient_name}
                                        senderName={card.sender_name}
                                        message={card.message}
                                        cardTitle={card.card_title}
                                        cardDescription={card.card_description}
                                    />
                                </div>
                            </div>

                            {/* Card Info */}
                            <div className="p-4 space-y-3">
                                <div>
                                    <p className="text-xs text-zinc-500">Kod</p>
                                    <p className="text-white font-mono font-bold text-sm">{card.code}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500">Wartość</p>
                                    <p className="text-white font-bold">{card.value} zł</p>
                                </div>
                                {card.recipient_name && (
                                    <div>
                                        <p className="text-xs text-zinc-500">Dla</p>
                                        <p className="text-white text-sm">{card.recipient_name}</p>
                                    </div>
                                )}
                                {card.created_at && (
                                    <p className="text-xs text-zinc-500">
                                        Utworzona: {new Date(card.created_at).toLocaleDateString('pl-PL')}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-3 border-t border-zinc-700">
                                    <button
                                        onClick={() => copyCode(card.code)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm transition-all"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Kopiuj
                                    </button>
                                    <button
                                        onClick={() => printCard(card)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-all"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Drukuj
                                    </button>
                                    <button
                                        onClick={() => sendEmail(card)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-all"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </button>
                                    <button
                                        onClick={() => deleteCard(card.id!)}
                                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {giftCards.length === 0 && !showCreateModal && (
                    <div className="text-center py-12">
                        <p className="text-zinc-400 text-lg">Brak kart. Stwórz pierwszą kartę podarunkową</p>
                    </div>
                )}
            </div>
            )}
        </div>
    );
}
