"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle, Building2, Phone, User, Mail, Briefcase, FileText } from "lucide-react";

export default function B2BContactForm() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        serviceType: 'Inne',
        message: ''
    });

    const services = [
        "Termowizja i Diagnostyka",
        "Monitoring Budów (Dron)",
        "Wirtualne Spacery 360",
        "Inspekcje Techniczne",
        "Fotografia i Wideo Promocyjne",
        "Inne / Konsultacja"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                setStatus('error');
                return;
            }

            setStatus('success');
            setFormData({ name: '', email: '', phone: '', company: '', serviceType: 'Inne', message: '' });
        } catch (error) {
            console.error('Contact form error:', error);
            setStatus('error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto bg-zinc-900 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden"
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Formularz RFQ</h3>
                <p className="text-zinc-500 text-sm">Wypełnij dane, aby otrzymać darmową wycenę.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <User size={14} className="text-yellow-500" /> Imię i Nazwisko
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                            placeholder="Jan Kowalski"
                        />
                    </div>

                    {/* Company */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Building2 size={14} className="text-yellow-500" /> Nazwa Firmy
                        </label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                            placeholder="Twoja Firma Sp. z o.o."
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Mail size={14} className="text-yellow-500" /> Adres E-mail
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                            placeholder="kontakt@firma.pl"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Phone size={14} className="text-yellow-500" /> Telefon
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                            placeholder="+48 000 000 000"
                        />
                    </div>
                </div>

                {/* Service Type */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <Briefcase size={14} className="text-yellow-500" /> Temat Zapytania
                    </label>
                    <select
                        value={formData.serviceType}
                        onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors appearance-none cursor-pointer"
                    >
                        {services.map(service => (
                            <option key={service} value={service} className="bg-zinc-900 text-white">{service}</option>
                        ))}
                    </select>
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14} className="text-yellow-500" /> Szczegóły Zlecenia
                    </label>
                    <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors resize-none"
                        placeholder="Opisz krótko, czego potrzebujesz (lokalizacja, termin, zakres prac)..."
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={status === 'loading' || status === 'success'}
                        className={`
                            w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all
                            ${status === 'success'
                                ? 'bg-green-500 text-black cursor-default'
                                : status === 'loading'
                                    ? 'bg-zinc-800 text-zinc-500 cursor-wait'
                                    : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20'
                            }
                        `}
                    >
                        {status === 'loading' && 'Przetwarzanie...'}
                        {status === 'success' && (
                            <>
                                <CheckCircle size={18} />
                                Wysłano Pomyślnie
                            </>
                        )}
                        {status === 'error' && (
                            <>
                                <AlertCircle size={18} />
                                Błąd Wysłania
                            </>
                        )}
                        {status === 'idle' && (
                            <>
                                Wyślij Zapytanie
                                <Send size={18} />
                            </>
                        )}
                    </button>
                    {status === 'success' && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 text-xs text-center mt-4">
                            Otrzymaliśmy Twoje zapytanie. Skontaktujemy się w ciągu 4h roboczych.
                        </motion.p>
                    )}
                </div>
            </form>
        </motion.div>
    );
}
