'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Mail, Printer, Copy, Trash2, Plus, Share2, Facebook, Send } from 'lucide-react';
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
    card_title?: string;
    card_description?: string;
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
        recipientEmail: '',
        recipientName: '',
        senderName: '',
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
        if (!formData.code || !formData.value || !formData.recipientEmail) {
            toast.error('Wypełnij wszystkie wymagane pola (kod, wartość, email)');
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
                    recipientEmail: '',
                    recipientName: '',
                    senderName: '',
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
        const printWindow = window.open('', '', 'width=1000,height=700');
        if (printWindow) {
            const themes: any = {
                christmas: { bg: 'linear-gradient(135deg, #c41e3a 0%, #165b33 100%)', emoji: '🎄' },
                wosp: { bg: 'linear-gradient(135deg, #e63946 0%, #a4161a 100%)', emoji: '❤️' },
                valentines: { bg: 'linear-gradient(135deg, #e01e5a 0%, #c5192d 100%)', emoji: '💝' },
                easter: { bg: 'linear-gradient(135deg, #ffd60a 0%, #ffc300 100%)', emoji: '🐰' },
                halloween: { bg: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)', emoji: '👻' },
                'mothers-day': { bg: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)', emoji: '💐' },
                'childrens-day': { bg: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)', emoji: '🎈' },
                wedding: { bg: 'linear-gradient(135deg, #fff5ee 0%, #ffe4e1 100%)', emoji: '💒' },
                birthday: { bg: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)', emoji: '🎂' }
            };
            
            const theme = themes[card.theme] || themes.christmas;
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Karta Podarunkowa - ${card.code}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                            font-family: 'Arial', sans-serif; 
                            background: #f5f5f5; 
                            padding: 20px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                        }
                        @media print {
                            body { padding: 0; background: white; }
                            .print-container { page-break-inside: avoid; }
                        }
                        .print-container {
                            width: 540px;
                            height: 340px;
                            background: ${theme.bg};
                            border-radius: 20px;
                            padding: 30px;
                            color: white;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                            position: relative;
                            overflow: hidden;
                        }
                        .emoji { font-size: 60px; position: absolute; opacity: 0.2; }
                        .emoji-top { top: 10px; right: 20px; }
                        .emoji-bottom { bottom: 10px; left: 20px; }
                        .header {
                            text-align: center;
                            z-index: 2;
                        }
                        .title {
                            font-size: 32px;
                            font-weight: bold;
                            margin-bottom: 10px;
                            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                        }
                        .subtitle {
                            font-size: 14px;
                            opacity: 0.9;
                            margin-bottom: 20px;
                        }
                        .middle {
                            text-align: center;
                            z-index: 2;
                        }
                        .recipient {
                            font-size: 12px;
                            opacity: 0.85;
                            margin-bottom: 15px;
                        }
                        .amount {
                            font-size: 48px;
                            font-weight: bold;
                            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                        }
                        .footer {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-end;
                            z-index: 2;
                        }
                        .code-box {
                            background: rgba(255,255,255,0.2);
                            border: 2px solid rgba(255,255,255,0.5);
                            border-radius: 8px;
                            padding: 10px 15px;
                            text-align: center;
                        }
                        .code {
                            font-size: 18px;
                            font-weight: bold;
                            letter-spacing: 2px;
                        }
                        .sender {
                            font-size: 12px;
                            opacity: 0.8;
                        }
                        .print-button {
                            margin-top: 30px;
                            text-align: center;
                        }
                        button {
                            padding: 10px 30px;
                            font-size: 16px;
                            background: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        }
                        button:hover {
                            background: #45a049;
                        }
                        @media print {
                            button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                        <div class="print-container">
                            <div class="emoji emoji-top">${theme.emoji}</div>
                            <div class="emoji emoji-bottom">${theme.emoji}</div>
                            
                            <div class="header">
                                <div class="title">${card.card_title || 'KARTA PODARUNKOWA'}</div>
                                <div class="subtitle">${card.card_description || 'Życzenia pełnego sza!'}</div>
                            </div>
                            
                            <div class="middle">
                                <div class="recipient">${card.recipientName || 'Drogi odbiorco'}</div>
                                <div class="amount">${card.value} zł</div>
                            </div>
                            
                            <div class="footer">
                                <div class="code-box">
                                    <div style="font-size: 10px; opacity: 0.8; margin-bottom: 5px;">KOD PROMOCYJNY</div>
                                    <div class="code">${card.code}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div class="sender">${card.senderName || 'Od Fotografa'}</div>
                                    <div style="font-size: 11px; opacity: 0.7; margin-top: 3px;">wlasniewski.pl</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="print-button">
                            <button onclick="window.print()">Drukuj</button>
                            <button onclick="window.close()" style="margin-left: 10px; background: #999;">Zamknij</button>
                        </div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const generateShareText = (card: GiftCard) => {
        return `🎁 KARTA PODARUNKOWA - ${card.value}zł

Otrzymałeś kartę podarunkową na sesję fotograficzną!

💝 Kod promocyjny: ${card.code}
📸 Wartość: ${card.value}zł

✨ Specjalna oferta - sesja fotograficzna na wiele okazji:
- Sesje ślubne
- Fotografia rodzinna
- Portrety biznesowe
- i wiele więcej!

📲 Sprawdź dostępne pakiety na: www.wlasniewski.pl
✉️ Zarezerwuj swoją sesję: www.wlasniewski.pl/rezerwacja

#fotograf #kartapodarunkowa #sesjasfotograficzna`;
    };

    const shareOnFacebook = (card: GiftCard) => {
        const text = generateShareText(card);
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.wlasniewski.pl')}&quote=${encodeURIComponent(text)}`;
        window.open(url, 'facebook-share', 'width=600,height=400');
        toast.success('Otwórz Facebooka aby udostępnić');
    };

    const shareOnInstagram = (card: GiftCard) => {
        const text = generateShareText(card);
        navigator.clipboard.writeText(text);
        toast.success('Tekst skopiowany! Otwórz Instagrama i wklej w Stories lub Feed');
        window.open('https://instagram.com', '_blank');
    };

    const shareOnWhatsApp = (card: GiftCard) => {
        const text = generateShareText(card);
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const shareOnTelegram = (card: GiftCard) => {
        const text = generateShareText(card);
        const url = `https://t.me/share/url?url=${encodeURIComponent('https://www.wlasniewski.pl')}&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const copyShareText = (card: GiftCard) => {
        const text = generateShareText(card);
        navigator.clipboard.writeText(text);
        toast.success('Tekst skopiowany do schowka!');
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
                    email: card.recipient_email,
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

                                {/* Recipient Email */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Dla kogo (email) *</label>
                                    <input
                                        type="email"
                                        value={formData.recipientEmail}
                                        onChange={e => setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                                        placeholder="recipient@example.com"
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                                        required
                                    />
                                </div>

                                {/* Recipient Name */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Imię odbiorcy</label>
                                    <input
                                        type="text"
                                        value={formData.recipientName}
                                        onChange={e => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                                        placeholder="Imię odbiorcy"
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                                    />
                                </div>

                                {/* Sender */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Od kogo (nadawca)</label>
                                    <input
                                        type="text"
                                        value={formData.senderName}
                                        onChange={e => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                                        placeholder="Twoje imię lub nazwa firmy"
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
                                        recipientName={formData.recipientName}
                                        senderName={formData.senderName}
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

                                {/* Share Actions */}
                                <div className="mt-4 pt-4 border-t border-zinc-700">
                                    <p className="text-xs font-semibold text-zinc-400 mb-3">📢 UDOSTĘPNIJ NA MEDIACH SPOŁECZNYCH</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => shareOnFacebook(card)}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-all"
                                        >
                                            <Facebook className="w-4 h-4" />
                                            Facebook
                                        </button>
                                        <button
                                            onClick={() => shareOnInstagram(card)}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded text-sm transition-all"
                                        >
                                            <span>📷</span>
                                            Instagram
                                        </button>
                                        <button
                                            onClick={() => shareOnWhatsApp(card)}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-all"
                                        >
                                            <span>💬</span>
                                            WhatsApp
                                        </button>
                                        <button
                                            onClick={() => shareOnTelegram(card)}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm transition-all"
                                        >
                                            <Send className="w-4 h-4" />
                                            Telegram
                                        </button>
                                        <button
                                            onClick={() => copyShareText(card)}
                                            className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm transition-all"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Kopiuj tekst promki
                                        </button>
                                    </div>
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
