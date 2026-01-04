'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    ChevronLeft,
    User,
    Mail,
    Phone,
    Lock,
    Save,
    ShieldCheck,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
    const router = useRouter();
    const { user, token, refreshUser, isLoading: authLoading } = useAuth();

    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/logowanie');
            return;
        }

        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
        }
    }, [user, token, authLoading, router]);

    const validatePassword = (pass: string) => {
        if (!pass) return "";
        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
        const isLongEnough = pass.length >= 8;

        if (!isLongEnough) return "Min. 8 znaków.";
        if (!hasUpper || !hasLower) return "Małe i wielkie litery.";
        if (!hasSpecial) return "Znak specjalny.";
        return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword) {
            const passErr = validatePassword(formData.newPassword);
            if (passErr) {
                toast.error(`Nowe hasło: ${passErr}`);
                return;
            }
            if (formData.newPassword !== formData.confirmPassword) {
                toast.error("Hasła nie pasują do siebie.");
                return;
            }
            if (!formData.currentPassword) {
                toast.error("Podaj aktualne hasło, aby je zmienić.");
                return;
            }
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/user/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Profil zaktualizowany pomyślnie.");
                if (refreshUser) refreshUser();
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
            } else {
                toast.error(data.error || "Wystąpił błąd podczas aktualizacji.");
            }
        } catch (error) {
            toast.error("Błąd połączenia z serwerem.");
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-black text-white pt-32 pb-20 px-4">
            <div className="max-w-2xl mx-auto">
                <Link
                    href="/konto"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Wróć do konta
                </Link>

                <header className="mb-12">
                    <h1 className="text-4xl font-display font-bold mb-2 tracking-tight">Ustawienia profilu</h1>
                    <p className="text-zinc-500">Zarządzaj swoimi danymi i bezpieczeństwem konta.</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <User className="w-5 h-5 text-gold-500" />
                            Dane podstawowe
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 ml-1">Imię i Nazwisko</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
                                        placeholder="Jan Kowalski"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 ml-1">Numer telefonu</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
                                        placeholder="+48 000 000 000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400 ml-1">Adres Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
                                placeholder="jan@kowalski.pl"
                            />
                        </div>
                    </section>

                    {/* Password Change */}
                    <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Lock className="w-5 h-5 text-gold-500" />
                                Zmiana hasła
                            </h2>
                            {formData.newPassword && !validatePassword(formData.newPassword) && (
                                <span className="bg-green-500/10 text-green-500 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    Mocne
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400 ml-1">Aktualne hasło</label>
                            <input
                                type="password"
                                value={formData.currentPassword}
                                onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-gold-500 focus:outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 ml-1">Nowe hasło</label>
                                <input
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                    className={`w-full bg-black border rounded-xl px-4 py-3 focus:outline-none transition-colors ${formData.newPassword ? (validatePassword(formData.newPassword) ? 'border-red-500/50' : 'border-green-500/50') : 'border-zinc-700'}`}
                                    placeholder="Min. 8 znaków"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 ml-1">Powtórz nowe hasło</label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className={`w-full bg-black border rounded-xl px-4 py-3 focus:outline-none transition-colors ${formData.confirmPassword ? (formData.newPassword === formData.confirmPassword ? 'border-green-500/50' : 'border-red-500/50') : 'border-zinc-700'}`}
                                    placeholder="Powtórz hasło"
                                />
                            </div>
                        </div>

                        {/* Password Requirements hint */}
                        {formData.newPassword && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-black/50 p-4 rounded-xl border border-zinc-800 text-[10px] text-zinc-500 gap-y-1 grid grid-cols-2"
                            >
                                <p className={`flex items-center gap-1.5 ${formData.newPassword.length >= 8 ? 'text-green-500' : ''}`}>
                                    {formData.newPassword.length >= 8 ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1 h-1 bg-zinc-600 rounded-full" />}
                                    Min. 8 znaków
                                </p>
                                <p className={`flex items-center gap-1.5 ${/[A-Z]/.test(formData.newPassword) ? 'text-green-500' : ''}`}>
                                    {/[A-Z]/.test(formData.newPassword) ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1 h-1 bg-zinc-600 rounded-full" />}
                                    Wielka litera
                                </p>
                                <p className={`flex items-center gap-1.5 ${/[a-z]/.test(formData.newPassword) ? 'text-green-500' : ''}`}>
                                    {/[a-z]/.test(formData.newPassword) ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1 h-1 bg-zinc-600 rounded-full" />}
                                    Mała litera
                                </p>
                                <p className={`flex items-center gap-1.5 ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) ? 'text-green-500' : ''}`}>
                                    {/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1 h-1 bg-zinc-600 rounded-full" />}
                                    Znak specjalny
                                </p>
                            </motion.div>
                        )}
                    </section>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/konto')}
                            className="px-8 py-4 text-zinc-500 hover:text-white font-bold transition-colors"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-gold-500 text-black px-12 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-gold-500/10"
                        >
                            {submitting ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                                />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Zapisz zmiany
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
