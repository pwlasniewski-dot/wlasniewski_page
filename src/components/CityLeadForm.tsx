'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, Phone, MessageCircle } from 'lucide-react';

interface CityLeadFormProps {
    city: string;
    citySlug: string;
}

const SERVICE_OPTIONS = [
    { value: 'wizerunek-biznes', label: 'Sesja wizerunkowa / biznesowa' },
    { value: 'slub-plener', label: 'Ślub plenerowy / reportaż' },
    { value: 'sesja-w-miescie', label: 'Sesja w mieście / na starówce' },
    { value: 'narzeczenska', label: 'Sesja narzeczeńska' },
    { value: 'rodzinna', label: 'Sesja rodzinna' },
    { value: 'inne', label: 'Inne / nie wiem jeszcze' },
];

export default function CityLeadForm({ city, citySlug }: CityLeadFormProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [data, setData] = useState({
        name: '',
        phone: '',
        email: '',
        serviceType: 'wizerunek-biznes',
        message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.name || (!data.phone && !data.email)) return;
        setStatus('loading');
        try {
            const message = data.message || `Zapytanie z landing page ${city}. Usługa: ${SERVICE_OPTIONS.find(s => s.value === data.serviceType)?.label || data.serviceType}.`;
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email || `brak@lead-${citySlug}.pl`,
                    phone: data.phone,
                    message,
                    serviceType: data.serviceType,
                    lead_source: `landing-${citySlug}`,
                    lead_campaign: 'city-page-form',
                }),
            });
            if (!res.ok) throw new Error('fail');
            setStatus('success');
            setData({ name: '', phone: '', email: '', serviceType: 'wizerunek-biznes', message: '' });
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'conversion', { send_to: 'AW-17548893646/mNauCJy3h-YbEM67-69B' });
                (window as any).gtag('event', 'generate_lead', { city: citySlug, service: data.serviceType });
            }
        } catch {
            setStatus('error');
        }
    };

    return (
        <div className="container mx-auto max-w-3xl px-6">
            <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onSubmit={handleSubmit}
                className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-2xl"
            >
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="lead-name" className="block text-sm font-medium text-zinc-300 mb-2">
                            Imię <span className="text-amber-400">*</span>
                        </label>
                        <input
                            id="lead-name"
                            type="text"
                            required
                            value={data.name}
                            onChange={e => setData({ ...data, name: e.target.value })}
                            placeholder="Jak się do Ciebie zwracać?"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="lead-service" className="block text-sm font-medium text-zinc-300 mb-2">
                            Rodzaj sesji <span className="text-amber-400">*</span>
                        </label>
                        <select
                            id="lead-service"
                            value={data.serviceType}
                            onChange={e => setData({ ...data, serviceType: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors"
                        >
                            {SERVICE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="lead-phone" className="block text-sm font-medium text-zinc-300 mb-2">
                            Telefon <span className="text-zinc-500 text-xs">(szybsza odpowiedź)</span>
                        </label>
                        <input
                            id="lead-phone"
                            type="tel"
                            value={data.phone}
                            onChange={e => setData({ ...data, phone: e.target.value })}
                            placeholder="+48 ___ ___ ___"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="lead-email" className="block text-sm font-medium text-zinc-300 mb-2">
                            Email <span className="text-zinc-500 text-xs">(opcjonalnie)</span>
                        </label>
                        <input
                            id="lead-email"
                            type="email"
                            value={data.email}
                            onChange={e => setData({ ...data, email: e.target.value })}
                            placeholder="twoj@email.pl"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label htmlFor="lead-message" className="block text-sm font-medium text-zinc-300 mb-2">
                        Krótka wiadomość <span className="text-zinc-500 text-xs">(opcjonalnie)</span>
                    </label>
                    <textarea
                        id="lead-message"
                        rows={3}
                        value={data.message}
                        onChange={e => setData({ ...data, message: e.target.value })}
                        placeholder={`Np. szukam fotografa na ślub w ${city} w sierpniu...`}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors resize-none"
                    />
                </div>

                <p className="text-xs text-zinc-500 mb-4">
                    Podaj telefon <strong>lub</strong> email — wystarczy jedno. Nie wysyłam spamu, nie udostępniam danych.
                </p>

                <button
                    type="submit"
                    disabled={status === 'loading' || status === 'success' || !data.name || (!data.phone && !data.email)}
                    className={`w-full inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                        status === 'success'
                            ? 'bg-green-500 text-white'
                            : status === 'loading'
                                ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                                : 'bg-amber-500 hover:bg-amber-400 text-black hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed'
                    }`}
                >
                    {status === 'loading' && 'Wysyłanie...'}
                    {status === 'success' && (<><CheckCircle className="w-5 h-5" /> Wysłano! Odezwę się wkrótce</>)}
                    {status === 'error' && (<><AlertCircle className="w-5 h-5" /> Błąd — spróbuj ponownie</>)}
                    {status === 'idle' && (<>Wyślij zapytanie <Send className="w-5 h-5" /></>)}
                </button>

                {status === 'success' && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-green-400">
                        Dziękuję! Odezwę się najszybciej jak to możliwe.
                    </motion.p>
                )}
            </motion.form>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-400">
                <span>Wolisz inaczej?</span>
                <a href="tel:+48530788694" className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/60 hover:bg-zinc-800 border border-white/10 rounded-full transition-colors">
                    <Phone className="w-4 h-4 text-amber-400" /> Zadzwoń: 530 788 694
                </a>
                <a href="https://wa.me/48530788694" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/60 hover:bg-zinc-800 border border-white/10 rounded-full transition-colors">
                    <MessageCircle className="w-4 h-4 text-green-400" /> Napisz na WhatsApp
                </a>
            </div>
        </div>
    );
}
