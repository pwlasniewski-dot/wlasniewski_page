'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Mail, Printer, Copy, Trash2, Plus, Share2, Facebook, Send, ShoppingBag, Edit } from 'lucide-react';
import GiftCard from '@/components/GiftCard';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/lib/api-config';
import { buildVoucherPrintDocument } from '@/lib/gift-cards/voucherPrintDocument';

const THEMES = [
    { id: 'christmas', label: 'Boże Narodzenie', icon: '🎄' },
    { id: 'wosp', label: 'Wielka Orkiestra', icon: '❤️' },
    { id: 'valentines', label: 'Walentynki', icon: '💝' },
    { id: 'easter', label: 'Wielkanoc', icon: '🐰' },
    { id: 'halloween', label: 'Halloween', icon: '👻' },
    { id: 'mothers-day', label: 'Dzień Matki', icon: '💐' },
    { id: 'childrens-day', label: 'Dzień Dziecka', icon: '🎈' },
    { id: 'wedding', label: 'Ślub', icon: '💒' },
    { id: 'birthday', label: 'Urodziny', icon: '🎂' },
    { id: 'gold', label: 'Nocturne Gold — premium', icon: '✨' },
    { id: 'blue', label: 'Celebration — uroczysta', icon: '🌟' },
    { id: 'green', label: 'Rodzinna — jasna', icon: '🌿' }
] as const;

interface GiftCard {
    id?: string;
    code: string;
    value: number;
    theme: string;
    recipient_name?: string;
    recipient_email?: string;
    sender_name?: string;
    message?: string;
    card_title?: string;
    card_description?: string;
    notes?: string;
    lowest_price_30d?: number;
    show_price?: boolean;
    valid_until?: string;
    status?: string;
    created_at?: string;
}

export default function GiftCardsAdmin() {
    const router = useRouter();
    const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [promoBarEnabled, setPromoBarEnabled] = useState(false);

    // Global Discount Settings
    const [globalDiscount, setGlobalDiscount] = useState({
        enabled: false,
        value: 10,
        type: 'percentage' as 'percentage' | 'fixed'
    });

    const [formData, setFormData] = useState({
        code: '',
        value: 100,
        theme: 'green' as string,
        recipientEmail: '',
        recipientName: '',
        senderName: '',
        message: '',
        card_title: '',
        card_description: '',
        notes: '',
        lowest_price_30d: 0,
        showPrice: false,
        validUntil: ''
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
        fetchPromoBarStatus();
        fetchGlobalDiscount();
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

    const fetchPromoBarStatus = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('settings'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPromoBarEnabled(data.settings?.gift_card_promo_enabled === 'true' || data.settings?.gift_card_promo_enabled === true);
            }
        } catch (error) {
            console.error('Error fetching promo bar status:', error);
        }
    };

    const fetchGlobalDiscount = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('settings'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.settings) {
                setGlobalDiscount({
                    enabled: data.settings.gift_card_global_discount_enabled === 'true',
                    value: parseInt(data.settings.gift_card_global_discount_value || '10'),
                    type: (data.settings.gift_card_global_discount_type as 'percentage' | 'fixed') || 'percentage'
                });
            }
        } catch (error) {
            console.error('Error fetching global discount:', error);
        }
    };

    const saveGlobalDiscount = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            await fetch(getApiUrl('settings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    gift_card_global_discount_enabled: globalDiscount.enabled ? 'true' : 'false',
                    gift_card_global_discount_value: globalDiscount.value.toString(),
                    gift_card_global_discount_type: globalDiscount.type
                })
            });
            toast.success('Ustawienia promocji zapisane');
        } catch (e) {
            toast.error('Błąd zapisu promocji');
        }
    };

    const togglePromoBar = async () => {
        const newValue = !promoBarEnabled;
        setPromoBarEnabled(newValue);
        try {
            const token = localStorage.getItem('admin_token');
            await fetch(getApiUrl('settings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    gift_card_promo_enabled: newValue ? 'true' : 'false'
                })
            });
            toast.success(newValue ? 'Bajerek włączony!' : 'Bajerek wyłączony');
        } catch (e) {
            toast.error('Błąd ustawienia');
            setPromoBarEnabled(!newValue);
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

    const applyPreset = (preset: 'family' | 'couple' | 'birthday' | 'wedding') => {
        const presets = {
            family: { theme: 'green', card_title: 'Voucher podarunkowy', card_description: 'Sesja rodzinna', message: 'Wspólny czas, naturalne emocje i fotografie na lata.' },
            couple: { theme: 'valentines', card_title: 'Voucher podarunkowy', card_description: 'Sesja dla dwojga', message: 'Chwila tylko dla Was i fotografie pełne bliskości.' },
            birthday: { theme: 'birthday', card_title: 'Prezent urodzinowy', card_description: 'Sesja fotograficzna', message: 'Niech ten prezent zostanie z Tobą na lata.' },
            wedding: { theme: 'wedding', card_title: 'Prezent dla Was', card_description: 'Sesja poślubna', message: 'Na nowy wspólny rozdział i piękne wspomnienia.' },
        } as const;
        setFormData(previous => ({ ...previous, ...presets[preset] }));
    };

    const handleEdit = (card: GiftCard) => {
        setEditingId(card.id || null);
        setFormData({
            code: card.code,
            value: card.value,
            theme: card.theme,
            recipientEmail: card.recipient_email || '',
            recipientName: card.recipient_name || '',
            senderName: card.sender_name || '',
            message: card.message || '',
            card_title: card.card_title || '',
            card_description: card.card_description || '',
            notes: card.notes || '',
            lowest_price_30d: card.lowest_price_30d || 0,
            showPrice: card.show_price !== false,
            validUntil: card.valid_until ? new Date(card.valid_until).toISOString().slice(0, 10) : ''
        });
        setShowCreateModal(true);
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setEditingId(null);
        setFormData({
            code: '',
            value: 100,
            theme: 'green',
            recipientEmail: '',
            recipientName: '',
            senderName: '',
            message: '',
            card_title: '',
            card_description: '',
            notes: '',
            lowest_price_30d: 0,
            showPrice: false,
            validUntil: ''
        });
    };

    const createCard = async (action: 'save' | 'print' = 'save') => {
        if (!formData.value || formData.value < 1) {
            toast.error('Podaj wartość rozliczeniową vouchera');
            return;
        }

        const code = formData.code || Array.from({ length: 8 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
        const printWindow = action === 'print' ? window.open('', 'voucher-print', 'width=1200,height=850') : null;

        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                toast.error('Brak tokenu - zaloguj się ponownie');
                router.push('/admin/login');
                return;
            }

            const isEdit = !!editingId;
            const url = isEdit ? getApiUrl('gift-cards') : getApiUrl('gift-cards'); // Same endpoint, different method usually? No, PATCH is usually on same or ID.
            // Wait, my PATCH in route.ts is on the base route but requires ID in body. Correct.

            const method = isEdit ? 'PATCH' : 'POST';
            const payload = {
                ...formData,
                code,
                valid_until: formData.validUntil || null,
            };
            const body = isEdit ? { ...payload, id: editingId } : payload;

            const res = await fetch(getApiUrl('gift-cards'), {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.status === 401) {
                toast.error('Sesja wygasła - zaloguj się ponownie');
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
                return;
            }

            const data = await res.json();
            if (data.success) {
                const savedCard = data.giftCard as GiftCard;
                toast.success(isEdit ? 'Voucher zaktualizowany' : 'Voucher zapisany');
                if (action === 'print') {
                    openVoucherPrint(savedCard, printWindow);
                }
                handleCloseModal();
                fetchCards();
            } else {
                printWindow?.close();
                toast.error(data.error || 'Błąd');
            }
        } catch (error) {
            printWindow?.close();
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

    const openVoucherPrint = (card: GiftCard, targetWindow?: Window | null) => {
        const printWindow = targetWindow || window.open('', 'voucher-print', 'width=1200,height=850');
        if (!printWindow) {
            toast.error('Przeglądarka zablokowała okno wydruku');
            return;
        }
        printWindow.document.open();
        printWindow.document.write(buildVoucherPrintDocument({
            code: card.code,
            value: card.value,
            theme: card.theme,
            recipientName: card.recipient_name,
            senderName: card.sender_name,
            message: card.message,
            cardTitle: card.card_title,
            cardDescription: card.card_description,
            showPrice: card.show_price !== false,
            validUntil: card.valid_until,
        }, window.location.origin));
        printWindow.document.close();
    };

    const generateShareText = (card: GiftCard) => {
        const valueLine = card.show_price === false ? '📸 Prezent: sesja fotograficzna' : `📸 Wartość: ${card.value} zł`;
        return `🎁 KARTA PODARUNKOWA

Otrzymałeś kartę podarunkową na sesję fotograficzną!

💝 Kod promocyjny: ${card.code}
${valueLine}

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
            // Validate email first
            if (!card.recipient_email) {
                toast.error('❌ Brak adresu email odbiorcy - uzupełnij dane karty');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(card.recipient_email)) {
                toast.error(`❌ Błędny adres email: "${card.recipient_email}"`);
                return;
            }

            toast.loading('Wysyłanie emaila...');
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

            const data = await res.json();

            if (res.ok) {
                toast.dismiss();
                toast.success('✅ Email wysłany! Admin dostał potwierdzenie');
            } else {
                toast.dismiss();
                console.error('Email send error:', data);
                toast.error(`❌ ${data.details || data.error || 'Błąd wysyłania'}`);

                // Show suggestions if available
                if (data.suggestions) {
                    setTimeout(() => {
                        toast('💡 ' + data.suggestions[0], {
                            icon: 'ℹ️',
                            duration: 5000
                        });
                    }, 500);
                }
            }
        } catch (error) {
            toast.dismiss();
            console.error('Network error:', error);
            toast.error('❌ Błąd połączenia - spróbuj ponownie');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 p-3 sm:p-6">
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
                    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-gold-400">Karty podarunkowe</p>
                            <h1 className="text-4xl font-bold text-white">Studio voucherów</h1>
                            <p className="text-zinc-400 mt-2">Personalizacja, wydruk lub PDF oraz wysyłka e-mail w jednym miejscu.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                onClick={() => router.push('/admin/bookings/orders')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-all"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Historia Zamówień
                            </button>
                            <button
                                onClick={() => setShowCreateModal(!showCreateModal)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Nowy voucher
                            </button>
                        </div>
                    </div>

                    {/* Global Discount Settings */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">💰 Globalna Promocja na Karty</h2>
                                <p className="text-zinc-400 mt-1">Ustaw automatyczną zniżkę na wszystkie kupowane karty podarunkowe.</p>
                            </div>
                            <button
                                onClick={() => {
                                    const newEnabled = !globalDiscount.enabled;
                                    setGlobalDiscount(prev => ({ ...prev, enabled: newEnabled }));
                                    // Auto-save on toggle? Check below. Saving explicitly via button is safer.
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${globalDiscount.enabled
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                    }`}
                            >
                                {globalDiscount.enabled ? 'PROMOCJA AKTYWNA' : 'PROMOCJA WYŁĄCZONA'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Wartość zniżki</label>
                                <input
                                    type="number"
                                    value={globalDiscount.value}
                                    onChange={e => setGlobalDiscount(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Rodzaj zniżki</label>
                                <select
                                    value={globalDiscount.type}
                                    onChange={e => setGlobalDiscount(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                                >
                                    <option value="percentage">Procent (%)</option>
                                    <option value="fixed">Kwota (PLN)</option>
                                </select>
                            </div>
                            <div>
                                <button
                                    onClick={saveGlobalDiscount}
                                    className="w-full px-6 py-2 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-all"
                                >
                                    Zapisz Ustawienia Promocji
                                </button>
                            </div>
                        </div>
                        {globalDiscount.enabled && (
                            <div className="mt-4 p-4 bg-green-900/20 border border-green-900/50 rounded-lg text-green-400 text-sm">
                                <span className="font-bold">Przykład:</span> Karta o wartości 300 zł będzie kosztować{' '}
                                <span className="font-bold text-white">
                                    {globalDiscount.type === 'percentage'
                                        ? `${300 * (1 - globalDiscount.value / 100)} zł`
                                        : `${Math.max(0, 300 - globalDiscount.value)} zł`}
                                </span>.
                            </div>
                        )}
                    </div>

                    {/* Create Form */}
                    {showCreateModal && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 mb-8">
                            <div className="mb-6 flex flex-col gap-4 border-b border-zinc-800 pb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{editingId ? 'Edytuj voucher' : 'Nowy voucher'}</h2>
                                    <p className="mt-1 text-sm text-zinc-400">Zacznij od wzoru, potem zmień każde pole. E-mail jest opcjonalny przy odbiorze osobistym.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    <button type="button" onClick={() => applyPreset('family')} className="rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-sm font-semibold text-gold-200 hover:bg-gold-500/20">Sesja rodzinna</button>
                                    <button type="button" onClick={() => applyPreset('couple')} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-700">Dla dwojga</button>
                                    <button type="button" onClick={() => applyPreset('birthday')} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-700">Urodziny</button>
                                    <button type="button" onClick={() => applyPreset('wedding')} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-700">Ślub</button>
                                </div>
                            </div>

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
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">E-mail odbiorcy <span className="text-zinc-600">(opcjonalny)</span></label>
                                        <input
                                            type="email"
                                            value={formData.recipientEmail}
                                            onChange={e => setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                                            placeholder="Wpisz tylko, jeśli voucher ma zostać wysłany"
                                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
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

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3">
                                            <span>
                                                <span className="block text-sm font-medium text-white">Pokaż cenę</span>
                                                <span className="mt-0.5 block text-xs text-zinc-500">Wyłącz dla prezentu bez kwoty</span>
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={formData.showPrice}
                                                onChange={event => setFormData(previous => ({ ...previous, showPrice: event.target.checked }))}
                                                className="h-5 w-5 accent-gold-500"
                                            />
                                        </label>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Ważny do <span className="text-zinc-600">(opcjonalnie)</span></label>
                                            <input
                                                type="date"
                                                value={formData.validUntil}
                                                onChange={event => setFormData(previous => ({ ...previous, validUntil: event.target.value }))}
                                                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white focus:border-gold-500 focus:outline-none"
                                            />
                                        </div>
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

                                    {/* Description - Card Text */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Tekst na grafice karty</label>
                                        <textarea
                                            value={formData.card_description}
                                            onChange={e => setFormData(prev => ({ ...prev, card_description: e.target.value }))}
                                            placeholder="np. Życzenia pełnego sza! (widoczne na obrazku)"
                                            rows={2}
                                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none resize-none"
                                        />
                                    </div>

                                    {/* Description - Shop Listing */}
                                    <div>
                                        <label className="block text-sm font-medium text-gold-400 mb-2">Opis oferty w sklepie (NIE widoczny na karcie)</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="np. Najczęściej wybierany pakiet. Pełna sesja zdjęciowa..."
                                            rows={2}
                                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none resize-none"
                                        />
                                    </div>

                                    {/* Lowest Price 30d */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Najniższa cena z 30 dni (Omnibus)</label>
                                        <input
                                            type="number"
                                            value={formData.lowest_price_30d}
                                            onChange={e => setFormData(prev => ({ ...prev, lowest_price_30d: parseInt(e.target.value) }))}
                                            placeholder="Wymagane tylko przy promocjach"
                                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                                        />
                                        <p className="text-[10px] text-zinc-500 mt-1">Pozostaw 0, jeśli nie stosujesz obniżki od ceny wyższej niż wartość karty.</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-2">
                                        <button
                                            onClick={() => createCard('save')}
                                            disabled={loading}
                                            className="flex-1 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Zapisywanie...' : (editingId ? 'Zapisz zmiany' : 'Zapisz voucher')}
                                        </button>
                                        <button
                                            onClick={() => createCard('print')}
                                            disabled={loading}
                                            className="flex-1 px-6 py-3 bg-white hover:bg-zinc-100 text-black font-bold rounded-lg transition-all disabled:opacity-50"
                                        >
                                            <span className="inline-flex items-center gap-2"><Printer className="h-4 w-4" /> Zapisz i drukuj / PDF</span>
                                        </button>
                                        <button
                                            onClick={handleCloseModal}
                                            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all sm:col-span-2"
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
                                            showPrice={formData.showPrice}
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
                                            showPrice={card.show_price !== false}
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
                                    {card.recipient_email && (
                                        <div>
                                            <p className="text-xs text-zinc-500">Email odbiorcy</p>
                                            <p className="text-white text-sm break-all">{card.recipient_email}</p>
                                        </div>
                                    )}
                                    {card.recipient_name && (
                                        <div>
                                            <p className="text-xs text-zinc-500">Imię odbiorcy</p>
                                            <p className="text-white text-sm">{card.recipient_name}</p>
                                        </div>
                                    )}
                                    {card.created_at && (
                                        <p className="text-xs text-zinc-500">
                                            Utworzona: {new Date(card.created_at).toLocaleDateString('pl-PL')}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-700">
                                        <button
                                            onClick={() => copyCode(card.code)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm transition-all"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Kopiuj
                                        </button>
                                        <button
                                            onClick={() => openVoucherPrint(card)}
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
                                            className="flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(card)}
                                            className="flex items-center justify-center px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-all"
                                        >
                                            <Edit className="w-4 h-4" />
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
