'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Gift, Mail, Printer, Copy, Trash2, Plus, Download } from 'lucide-react';
import GiftCardCanvas, { GiftCardData } from '@/components/GiftCardCanvas';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type GiftCard = {
    id: number;
    code: string;
    recipient_name: string;
    recipient_email: string;
    amount: number;
    discount_type: string;
    card_template: string;
    valid_until?: string;
    is_used: boolean;
    created_at: string;
    used_at?: string;
    notes?: string;
};

export default function GiftCardsAdmin() {
    const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'used', 'expired'
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [previewCard, setPreviewCard] = useState<GiftCardData | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        recipient_name: '',
        recipient_email: '',
        amount: 10,
        discount_type: 'percentage' as 'percentage' | 'fixed',
        card_template: 'gold' as 'gold' | 'dark' | 'classic',
        valid_until: '',
        message: '',
        notes: ''
    });

    useEffect(() => {
        fetchGiftCards();
    }, [filter]);

    const fetchGiftCards = async () => {
        try {
            const res = await fetch(`/api/gift-cards?status=${filter}`);
            const data = await res.json();
            if (data.success) {
                setGiftCards(data.giftCards);
            }
        } catch (error) {
            console.error('Error fetching gift cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const createGiftCard = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/gift-cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                alert('Karta rabatowa utworzona!');
                fetchGiftCards();
                setShowCreateModal(false);
                resetForm();
            }
        } catch (error) {
            console.error('Error creating gift card:', error);
            alert('Błąd podczas tworzenia karty');
        }
    };

    const deleteGiftCard = async (id: number) => {
        if (!confirm('Czy na pewno usunąć tę kartę?')) return;
        try {
            await fetch(`/api/gift-cards?id=${id}`, { method: 'DELETE' });
            fetchGiftCards();
        } catch (error) {
            console.error('Error deleting gift card:', error);
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        alert(`Kod ${code} skopiowany!`);
    };

    const downloadPDF = async (card: GiftCard) => {
        const cardData: GiftCardData = {
            recipientName: card.recipient_name,
            code: card.code,
            amount: card.amount,
            discountType: card.discount_type as 'percentage' | 'fixed',
            validUntil: card.valid_until ? new Date(card.valid_until) : undefined,
            template: card.card_template as 'gold' | 'dark' | 'classic'
        };

        setPreviewCard(cardData);

        // Wait for render
        setTimeout(async () => {
            if (cardRef.current) {
                const canvas = await html2canvas(cardRef.current, {
                    scale: 3,
                    backgroundColor: null
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: [85.6, 53.98] // Credit card size
                });

                pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98);
                pdf.save(`giftcard-${card.code}.pdf`);

                setPreviewCard(null);
            }
        }, 500);
    };

    const sendEmail = async (card: GiftCard) => {
        if (!confirm(`Wysłać kartę na adres ${card.recipient_email}?`)) return;

        try {
            const res = await fetch('/api/gift-cards/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: card.id })
            });
            const data = await res.json();
            if (data.success) {
                alert('Email wysłany!');
            } else {
                alert('Błąd wysyłki: ' + data.error);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Błąd podczas wysyłki emaila');
        }
    };

    const resetForm = () => {
        setFormData({
            recipient_name: '',
            recipient_email: '',
            amount: 10,
            discount_type: 'percentage',
            card_template: 'gold',
            valid_until: '',
            message: '',
            notes: ''
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Gift className="w-8 h-8" />
                        Karty Rabatowe
                    </h1>
                    <p className="text-zinc-400 mt-1">Zarządzaj voucherami dla klientów</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
                >
                    <Plus className="w-5 h-5" />
                    Nowa Karta
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['all', 'active', 'used', 'expired'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === f
                            ? 'bg-gold-500 text-black'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                    >
                        {f === 'all' ? 'Wszystkie' :
                            f === 'active' ? 'Aktywne' :
                                f === 'used' ? 'Użyte' : 'Wygasłe'}
                    </button>
                ))}
            </div>

            {/* Cards List */}
            {loading ? (
                <div className="text-center text-zinc-400 py-12">Ładowanie...</div>
            ) : giftCards.length === 0 ? (
                <div className="text-center text-zinc-400 py-12">Brak kart rabatowych</div>
            ) : (
                <div className="grid gap-4">
                    {giftCards.map(card => (
                        <div key={card.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xl font-bold text-white">{card.recipient_name}</span>
                                        <span className={`px-3 py-1 rounded text-xs font-medium ${card.is_used ? 'bg-zinc-700 text-zinc-400' :
                                            card.valid_until && new Date(card.valid_until) < new Date() ? 'bg-red-900/30 text-red-400' :
                                                'bg-green-900/30 text-green-400'
                                            }`}>
                                            {card.is_used ? 'Użyta' :
                                                card.valid_until && new Date(card.valid_until) < new Date() ? 'Wygasła' :
                                                    'Aktywna'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-zinc-400 space-y-1">
                                        <p><Mail className="w-4 h-4 inline mr-2" />{card.recipient_email}</p>
                                        <p className="font-mono text-gold-400">KOD: {card.code}</p>
                                        <p>Rabat: <span className="font-semibold text-white">
                                            {card.discount_type === 'percentage' ? `${card.amount}%` : `${card.amount} PLN`}
                                        </span></p>
                                        {card.valid_until && (
                                            <p>Ważny do: {new Date(card.valid_until).toLocaleDateString('pl-PL')}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyCode(card.code)}
                                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                                        title="Kopiuj kod"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => downloadPDF(card)}
                                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                                        title="Pobierz PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => sendEmail(card)}
                                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                                        title="Wyślij email"
                                    >
                                        <Mail className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteGiftCard(card.id)}
                                        className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded text-red-400"
                                        title="Usuń"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">Nowa Karta Rabatowa</h2>

                        <form onSubmit={createGiftCard} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Imię i nazwisko
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.recipient_name}
                                        onChange={e => setFormData({ ...formData, recipient_name: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.recipient_email}
                                        onChange={e => setFormData({ ...formData, recipient_email: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Wartość
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Typ rabatu
                                    </label>
                                    <select
                                        value={formData.discount_type}
                                        onChange={e => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white"
                                    >
                                        <option value="percentage">Procent (%)</option>
                                        <option value="fixed">Kwota (PLN)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Szablon
                                    </label>
                                    <select
                                        value={formData.card_template}
                                        onChange={e => setFormData({ ...formData, card_template: e.target.value as 'gold' | 'dark' | 'classic' })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white"
                                    >
                                        <option value="gold">Gold Luxury</option>
                                        <option value="dark">Dark Minimal</option>
                                        <option value="classic">Classic Elegant</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Data ważności (opcjonalnie)
                                </label>
                                <input
                                    type="date"
                                    value={formData.valid_until}
                                    onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gold-500 hover:bg-gold-600 text-black py-3 rounded-lg font-semibold transition"
                                >
                                    Utwórz Kartę
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg font-semibold transition"
                                >
                                    Anuluj
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hidden Preview for PDF generation */}
            {previewCard && (
                <div className="fixed -left-[9999px]" ref={cardRef}>
                    <GiftCardCanvas data={previewCard} />
                </div>
            )}
        </div>
    );
}
