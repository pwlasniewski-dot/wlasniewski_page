'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Lock, ShieldCheck, CreditCard, Gift, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function CheckoutPage() {
    const { trackEvent } = useAnalytics();
    const { items, totalAmount, clearCart } = useCart();
    const [submitting, setSubmitting] = useState(false);

    // Foto-Match referral voucher
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherInfo, setVoucherInfo] = useState<{ valid: boolean; discount_grosze: number; label: string } | null>(null);
    const [checkingVoucher, setCheckingVoucher] = useState(false);

    // Split payment
    const [splitPaymentAvailable, setSplitPaymentAvailable] = useState(false);
    const [depositPercent, setDepositPercent] = useState(50);
    const [paymentPlan, setPaymentPlan] = useState<'FULL' | 'SPLIT'>('FULL');

    const hasOnlyOneBooking = items.length === 1 && items[0]?.type === 'booking';

    useEffect(() => {
        if (items.length > 0) void trackEvent('checkout_view', { item_count: items.length });
    }, [items.length, trackEvent]);

    useEffect(() => {
        fetch('/api/settings/public')
            .then(r => r.json())
            .then(d => {
                const s = d?.settings || d || {};
                if (s.split_payment_enabled === true || s.split_payment_enabled === 'true') {
                    setSplitPaymentAvailable(true);
                    setPaymentPlan('SPLIT');
                    if (s.split_payment_deposit_percent) setDepositPercent(Number(s.split_payment_deposit_percent));
                }
            })
            .catch(() => { });
    }, []);

    async function checkVoucher() {
        const code = voucherCode.trim().toUpperCase();
        if (!code) return;
        setCheckingVoucher(true);
        setVoucherInfo(null);
        try {
            const r = await fetch(`/api/foto-match/voucher/check?code=${encodeURIComponent(code)}`);
            const d = await r.json();
            if (!r.ok || !d.valid) {
                const reasonMap: Record<string, string> = {
                    NOT_FOUND: 'Voucher nie istnieje',
                    ALREADY_USED: 'Voucher już wykorzystany',
                    EXPIRED: 'Voucher wygasł',
                    NO_CODE: 'Wpisz kod',
                };
                setVoucherInfo({ valid: false, discount_grosze: 0, label: reasonMap[d.reason] || 'Voucher nieprawidłowy' });
                return;
            }
            const amount = Number(d.amount_grosze ?? 0);
            const percent = Number(d.percent ?? 0);
            const type = String(d.type || 'AMOUNT');
            let discount = 0;
            const parts: string[] = [];
            if (type === 'AMOUNT' || type === 'BOTH') {
                discount += amount;
                if (amount > 0) parts.push(`−${(amount / 100).toFixed(2)} zł`);
            }
            if (type === 'PERCENT' || type === 'BOTH') {
                const fromPercent = Math.round(totalAmount * percent / 100);
                discount += fromPercent;
                if (percent > 0) parts.push(`−${percent}%`);
            }
            // Cap to total
            discount = Math.min(discount, totalAmount);
            setVoucherInfo({ valid: true, discount_grosze: discount, label: parts.join(' + ') || 'Voucher zaakceptowany' });
        } catch (e: any) {
            setVoucherInfo({ valid: false, discount_grosze: 0, label: e?.message || 'Błąd weryfikacji' });
        } finally {
            setCheckingVoucher(false);
        }
    }

    const voucherDiscount = voucherInfo?.valid ? voucherInfo.discount_grosze : 0;
    const totalAfterVoucher = Math.max(0, totalAmount - voucherDiscount);
    const depositAmount = Math.round(totalAfterVoucher * depositPercent / 100);
    const remainingAmount = totalAfterVoucher - depositAmount;
    const amountNow = paymentPlan === 'SPLIT' && hasOnlyOneBooking && splitPaymentAvailable ? depositAmount : totalAfterVoucher;

    const [createAccount, setCreateAccount] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validatePassword = (pass: string) => {
        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
        const isLongEnough = pass.length >= 8;

        if (!isLongEnough) return "Hasło musi mieć minimum 8 znaków.";
        if (!hasUpper || !hasLower) return "Hasło musi zawierać małe i wielkie litery.";
        if (!hasSpecial) return "Hasło musi zawierać znak specjalny.";
        return "";
    };

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        agreements: {
            terms: false,
            marketing: false
        }
    });

    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white pt-40 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8">
                        <ShoppingBag className="w-10 h-10 text-zinc-700" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Twój koszyk jest pusty</h1>
                    <p className="text-zinc-400 mb-8 text-lg">Dodaj produkty, aby przejść do kasy.</p>
                    <a href="/rezerwacja" className="inline-block px-8 py-4 bg-amber-600 rounded-xl font-bold hover:bg-amber-500 transition-colors">
                        Wróć do rezerwacji
                    </a>
                </div>
            </main>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.agreements.terms) {
            toast.error('Proszę zaakceptować regulamin serwisu.');
            return;
        }

        if (createAccount) {
            const err = validatePassword(password);
            if (err) {
                toast.error(err);
                return;
            }
            if (password !== confirmPassword) {
                toast.error('Hasła nie są identyczne.');
                return;
            }
        }

        setSubmitting(true);
        try {
            void trackEvent('checkout_submit', { item_count: items.length, amount_bucket: amountNow < 50000 ? 'under_500' : amountNow < 100000 ? '500_999' : '1000_plus' });
            void trackEvent('payment_started', {
                amount_grosze: amountNow,
                item_count: items.length,
                payment_plan: paymentPlan,
            });
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'begin_checkout', {
                    currency: 'PLN',
                    value: amountNow / 100,
                    payment_plan: paymentPlan,
                    items: items.map(item => ({ item_id: item.productId, item_name: item.title, price: item.price / 100, quantity: item.quantity })),
                });
            }

            const response = await fetch('/api/basket/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    customer: {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone
                    },
                    totalAmount: amountNow,
                    createAccount,
                    password: createAccount ? password : null,
                    fm_voucher_code: voucherInfo?.valid ? voucherCode.trim().toUpperCase() : null,
                    payment_plan: (paymentPlan === 'SPLIT' && hasOnlyOneBooking && splitPaymentAvailable) ? 'SPLIT' : 'FULL',
                })
            });

            if (!response.ok) {
                const data = await response.json();
                void trackEvent('checkout_result', { status: 'error', area: 'checkout', endpoint: 'basket_checkout', http_status: response.status, reason_code: 'http_error' });
                throw new Error(data.message || 'Checkout failed');
            }

            const data = await response.json();
            void trackEvent('booking_created', {
                amount_grosze: amountNow,
                item_count: items.length,
                has_payment_redirect: !!data.redirectUrl,
            });
            void trackEvent('checkout_result', { status: 'ok', area: 'checkout', endpoint: 'basket_checkout', http_status: response.status, has_payment_redirect: !!data.redirectUrl });

            toast.success('Zamówienie przyjęte! Przekierowanie do płatności...');

            // Redirect to PayU payment page if URL provided
            if (data.redirectUrl) {
                void trackEvent('payu_redirect', { status: 'ok', area: 'payu' }, true);
                clearCart();
                window.location.href = data.redirectUrl;
            } else {
                // Fallback for zero-amount or errors (though API should handle this)
                clearCart();
                window.location.href = '/rezerwacja/potwierdzenie';
            }
            // Fallback timeout removed as explicit redirect is better

        } catch (error: any) {
            console.error('Checkout error:', error);
            void trackEvent('checkout_result', { status: 'error', area: 'checkout', endpoint: 'basket_checkout', reason_code: 'request_failed' });
            toast.error(error.message || 'Wystąpił błąd podczas finalizacji zamówienia.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-zinc-950 text-white pt-40 pb-20 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Form Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <h1 className="text-4xl font-black tracking-tight mb-2">Potwierdź <span className="text-amber-500">termin</span></h1>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <ShoppingBag className="w-5 h-5 text-amber-500" />
                            </div>
                            <p className="text-sm text-amber-200/80 leading-relaxed">
                                💡 **Ważna informacja:** Zakup i dostawa (bilety, karty, potwierdzenia) odbywają się **wyłącznie drogą elektroniczną** na podany adres e-mail.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <ShieldCheck className="w-6 h-6 text-amber-500" />
                                    Dane zamawiającego
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Imię i Nazwisko</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                            placeholder="Jan Kowalski"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Email</label>
                                            <input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                                placeholder="jan@kowalski.pl"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Telefon</label>
                                            <input
                                                required
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                                placeholder="+48 000 000 000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Creation Section */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={createAccount}
                                        onChange={(e) => setCreateAccount(e.target.checked)}
                                        className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-lg font-bold text-white group-hover:text-amber-500 transition-colors">Utwórz konto użytkownika</span>
                                </label>
                                <p className="text-sm text-zinc-500 ml-8">Załóż konto, aby mieć dostęp do historii rezerwacji i swoich galerii zdjęć.</p>

                                {createAccount && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="ml-8 pt-4 space-y-4"
                                    >
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Hasło</label>
                                            <input
                                                required={createAccount}
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className={`w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 outline-none transition-all ${password ? (validatePassword(password) ? 'focus:ring-red-500' : 'focus:ring-green-500') : 'focus:ring-amber-500'}`}
                                                placeholder="Hasło (min. 8 znaków, A-z, !@#)"
                                            />
                                            {password && (
                                                <p className={`text-xs mt-2 ml-1 ${validatePassword(password) ? 'text-red-400' : 'text-green-500 flex items-center gap-1'}`}>
                                                    {!validatePassword(password) && <ShieldCheck className="w-3 h-3" />}
                                                    {validatePassword(password) || 'Hasło jest silne i bezpieczne.'}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Powtórz hasło</label>
                                            <input
                                                required={createAccount}
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className={`w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 outline-none transition-all ${confirmPassword ? (password === confirmPassword ? 'focus:ring-green-500' : 'focus:ring-red-500') : 'focus:ring-amber-500'}`}
                                                placeholder="Wpisz hasło ponownie"
                                            />
                                            {confirmPassword && password !== confirmPassword && (
                                                <p className="text-xs text-red-400 mt-2 ml-1">Hasła nie są identyczne.</p>
                                            )}
                                        </div>

                                        <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 text-[11px] text-zinc-500 space-y-1">
                                            <p className="text-zinc-400 font-bold mb-1">Wymogi bezpieczeństwa:</p>
                                            <p className={password.length >= 8 ? 'text-green-500' : ''}>• Minimum 8 znaków</p>
                                            <p className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-500' : ''}>• Wielkie i małe litery</p>
                                            <p className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-500' : ''}>• Przynajmniej jeden znak specjalny</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8 space-y-4">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={formData.agreements.terms}
                                        onChange={(e) => setFormData({ ...formData, agreements: { ...formData.agreements, terms: e.target.checked } })}
                                        className="mt-1 w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-zinc-400 leading-tight group-hover:text-zinc-300 transition-colors">
                                        Akceptuję <a href="/regulamin" className="text-amber-500 hover:underline">Regulamin Serwisu</a> oraz <a href="/polityka-prywatnosci" className="text-amber-500 hover:underline">Politykę Prywatności</a>. (Wymagane)
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.agreements.marketing}
                                        onChange={(e) => setFormData({ ...formData, agreements: { ...formData.agreements, marketing: e.target.checked } })}
                                        className="mt-1 w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-zinc-400 leading-tight group-hover:text-zinc-300 transition-colors">
                                        Chcę otrzymywać informacje o nowościach i promocjach (Newsletter). Możesz wypisać się w każdej chwili.
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-amber-600 hover:bg-amber-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-amber-900/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CreditCard className="w-6 h-6" />
                                        <span>Zapłać {(amountNow / 100).toFixed(2)} zł</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>

                    {/* Summary Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 h-fit sticky top-32"
                    >
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <ShoppingBag className="w-6 h-6 text-amber-500" />
                            Podsumowanie
                        </h2>

                        <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between items-start border-b border-zinc-800 pb-4 last:border-0">
                                    <div className="flex-1 pr-4">
                                        <h4 className="font-bold text-white mb-0.5">{item.title}</h4>
                                        <p className="text-xs text-zinc-500">{item.subtitle}</p>
                                    </div>
                                    <span className="font-bold text-amber-500 whitespace-nowrap">{(item.price / 100).toFixed(2)} zł</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-zinc-800 space-y-4">
                            <div className="flex justify-between text-zinc-400">
                                <span>Wartość zamówienia:</span>
                                <span>{(totalAmount / 100).toFixed(2)} zł</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                                <span>Dostawa e-mail:</span>
                                <span className="text-green-500 font-bold">BEZPŁATNIE</span>
                            </div>

                            {/* Voucher Foto-Match */}
                            <div className="pt-4 border-t border-zinc-800">
                                <label className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1.5">
                                    <Gift className="w-3.5 h-3.5 text-amber-500" />
                                    Kod polecający (Foto-Match)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={voucherCode}
                                        onChange={e => { setVoucherCode(e.target.value); setVoucherInfo(null); }}
                                        placeholder="np. FM-A1B2C3"
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white uppercase tracking-wider"
                                    />
                                    <button
                                        type="button"
                                        onClick={checkVoucher}
                                        disabled={checkingVoucher || !voucherCode.trim()}
                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-lg text-sm font-bold disabled:opacity-50"
                                    >
                                        {checkingVoucher ? '…' : 'Sprawdź'}
                                    </button>
                                </div>
                                {voucherInfo && (
                                    <p className={`text-xs mt-1.5 ${voucherInfo.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {voucherInfo.valid ? `✓ ${voucherInfo.label}` : voucherInfo.label}
                                    </p>
                                )}
                            </div>

                            {voucherInfo?.valid && voucherDiscount > 0 && (
                                <div className="flex justify-between text-emerald-400">
                                    <span>Rabat z polecenia:</span>
                                    <span>−{(voucherDiscount / 100).toFixed(2)} zł</span>
                                </div>
                            )}

                            {/* Payment plan */}
                            {hasOnlyOneBooking && splitPaymentAvailable && (
                                <div className="pt-4 border-t border-zinc-800 space-y-2">
                                    <label className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1">
                                        <Wallet className="w-3.5 h-3.5 text-amber-500" />
                                        Plan płatności
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${paymentPlan === 'FULL' ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 bg-zinc-800/50'}`}>
                                        <input type="radio" name="plan" checked={paymentPlan === 'FULL'} onChange={() => setPaymentPlan('FULL')} className="accent-amber-500" />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">Pełna kwota</div>
                                            <div className="text-xs text-zinc-400">{(totalAfterVoucher / 100).toFixed(2)} zł teraz</div>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${paymentPlan === 'SPLIT' ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 bg-zinc-800/50'}`}>
                                        <input type="radio" name="plan" checked={paymentPlan === 'SPLIT'} onChange={() => setPaymentPlan('SPLIT')} className="accent-amber-500" />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">Zaliczka {depositPercent}% — rekomendowana</div>
                                            <div className="text-xs text-zinc-400">
                                                {(depositAmount / 100).toFixed(2)} zł teraz, dopłata {(remainingAmount / 100).toFixed(2)} zł przed sesją
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <div className="pt-4 border-t border-zinc-800 flex justify-between items-end">
                                <span className="text-lg font-bold">Do zapłaty teraz:</span>
                                <span className="text-3xl font-black text-amber-500">{(amountNow / 100).toFixed(2)} zł</span>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 flex items-center gap-4">
                            <div className="p-3 bg-zinc-900 rounded-lg">
                                <Lock className="w-6 h-6 text-green-500" />
                            </div>
                            <div className="text-xs text-zinc-500">
                                Twoje połączenie jest zaszyfrowane SSL. Dane są bezpieczne i przetwarzane zgodnie z RODO.
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
