
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

export default function ContactForm() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorEmail, setErrorEmail] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('Contact form error:', data);
                // Wyodrębnij email z komunikatu błędu - jeśli zawiera "Kontakt:"
                if (data.error && data.error.includes('Kontakt:')) {
                    const emailMatch = data.error.match(/Kontakt:\s*(.+?)$/);
                    if (emailMatch) {
                        setErrorEmail(emailMatch[1].trim());
                    }
                }
                setStatus('error');
                return;
            }

            setStatus('success');
            setFormData({ name: '', email: '', message: '' });

            // Event snippet for Przesłanie formularza kontaktowego conversion page
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'conversion', { 'send_to': 'AW-17548893646/mNauCJy3h-YbEM67-69B' });
            }
        } catch (error: any) {
            console.error('Contact form error:', error);
            setStatus('error');
        }
    };

    return (
        <section className="py-20 px-6 max-w-4xl mx-auto" id="contact-form">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display text-white">
                    Napisz do mnie
                </h2>
                <p className="text-zinc-400 text-lg">
                    Masz pytania? Chcesz zarezerwować termin?
                </p>
            </div>

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onSubmit={handleSubmit}
                className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 md:p-10 backdrop-blur-sm"
            >
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-2">
                            Imię i nazwisko
                        </label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-400 transition-colors"
                            placeholder="Twoje imię"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
                            Adres email
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-400 transition-colors"
                            placeholder="twoj@email.com"
                        />
                    </div>
                </div>

                <div className="mb-8">
                    <label htmlFor="message" className="block text-sm font-medium text-zinc-400 mb-2">
                        Wiadomość
                    </label>
                    <textarea
                        id="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-400 transition-colors resize-none"
                        placeholder="O co chcesz zapytać?"
                    />
                </div>

                <div className="text-center">
                    <button
                        type="submit"
                        disabled={status === 'loading' || status === 'success'}
                        className={`
                            inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all
                            ${status === 'success'
                                ? 'bg-green-500 text-white cursor-default'
                                : status === 'loading'
                                    ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                                    : 'bg-gold-400 hover:bg-gold-500 text-black hover:scale-105'
                            }
                        `}
                    >
                        {status === 'loading' && 'Wysyłanie...'}
                        {status === 'success' && (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Wysłano pomyślnie
                            </>
                        )}
                        {status === 'error' && (
                            <>
                                <AlertCircle className="w-5 h-5" />
                                Błąd, spróbuj ponownie
                            </>
                        )}
                        {status === 'idle' && (
                            <>
                                Wyślij wiadomość
                                <Send className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    {status === 'success' && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 text-green-400"
                        >
                            Dziękuję za wiadomość! Odpiszę najszybciej jak to możliwe.
                        </motion.p>
                    )}

                    {status === 'error' && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 text-red-400 text-sm"
                        >
                            Nie udało się wysłać wiadomości. Spróbuj ponownie lub skontaktuj się pod: <br />
                            {errorEmail ? <a href={`mailto:${errorEmail}`} className="hover:underline">{errorEmail}</a> : null}
                        </motion.p>
                    )}
                </div>
            </motion.form>
        </section>
    );
}
