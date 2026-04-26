'use client';

/**
 * Landing client UI: countdown + form.
 * Source 'promo_maj2026' tagged on Inquiry submission.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Gift, Clock, Check, Sparkles, Phone, Mail, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';

const DEADLINE = new Date('2026-05-31T23:59:59+02:00').getTime();

function useCountdown() {
    const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
    useEffect(() => {
        const tick = () => {
            const diff = DEADLINE - Date.now();
            if (diff <= 0) return setTime({ days: 0, hours: 0, mins: 0, secs: 0 });
            setTime({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff / 3600000) % 24),
                mins: Math.floor((diff / 60000) % 60),
                secs: Math.floor((diff / 1000) % 60),
            });
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, []);
    return time;
}

export default function PromoMajClient() {
    const c = useCountdown();
    const [form, setForm] = useState({ name: '', email: '', phone: '', session_type: 'rodzinna', preferred_date: '', message: '' });
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('sending');

        // Read UTM persisted by <UtmTracker />
        const utm_source = (typeof window !== 'undefined' && localStorage.getItem('pw_utm_source')) || '';
        const utm_campaign = (typeof window !== 'undefined' && localStorage.getItem('pw_utm_campaign')) || '';

        try {
            const res = await fetch('/api/inquiries/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    source: 'promo_maj2026',
                    promo_code: 'MAJ-ALBUM-GRATIS',
                    utm_source,
                    utm_campaign,
                }),
            });
            if (!res.ok) throw new Error();
            setStatus('success');
        } catch {
            setStatus('error');
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
            {/* HERO */}
            <section className="relative overflow-hidden pt-24 pb-16 px-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(218,165,32,0.15),transparent_50%)]" />
                <div className="relative max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm font-medium"
                    >
                        <Sparkles className="w-4 h-4" />
                        Promocja tylko do 31 maja 2026
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-7xl font-bold mb-4 leading-tight"
                    >
                        Sesja fotograficzna<br />
                        <span className="bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 bg-clip-text text-transparent">
                            + album w prezencie
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-2xl text-zinc-300 mb-8 max-w-3xl mx-auto"
                    >
                        Każda rezerwacja w maju = album fotograficzny <strong className="text-white">nPhoto GRATIS</strong> (wartość do 690 zł).
                        Zostały <strong className="text-gold-400">4 wolne soboty</strong>.
                    </motion.p>

                    {/* COUNTDOWN */}
                    <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-2xl mx-auto mb-10">
                        {[
                            { v: c.days, l: 'dni' },
                            { v: c.hours, l: 'godz' },
                            { v: c.mins, l: 'min' },
                            { v: c.secs, l: 'sek' },
                        ].map((x) => (
                            <div key={x.l} className="bg-zinc-800/60 backdrop-blur border border-gold-500/20 rounded-2xl p-4 md:p-6">
                                <div className="text-3xl md:text-5xl font-bold text-gold-400">{String(x.v).padStart(2, '0')}</div>
                                <div className="text-xs md:text-sm text-zinc-400 uppercase tracking-wide">{x.l}</div>
                            </div>
                        ))}
                    </div>

                    <a
                        href="#rezerwacja"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-black font-bold rounded-full text-lg shadow-2xl shadow-gold-500/30 transition-all hover:scale-105"
                    >
                        <Calendar className="w-5 h-5" /> Zarezerwuj teraz
                    </a>
                </div>
            </section>

            {/* CO ZAWIERA */}
            <section className="py-16 px-4 bg-zinc-950/50">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Co dostajesz w pakiecie?</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { i: Camera, t: 'Sesja 90 minut', d: 'Plener w Toruniu (Bulwary, Park Tysiąclecia, Las) lub miejsce wskazane przez Ciebie.' },
                            { i: Sparkles, t: '25 obrobionych zdjęć', d: 'Profesjonalna obróbka kolorystyczna. Wszystkie zdjęcia w wysokiej rozdzielczości do druku.' },
                            { i: Gift, t: 'Album nPhoto w prezencie', d: 'Format 25×20 cm, twarda oprawa, 24 strony. Wartość 290-690 zł — w cenie sesji.' },
                            { i: Clock, t: 'Realizacja w 14 dni', d: 'Zdjęcia gotowe maksymalnie 14 dni od sesji. Album dostarczamy w 21 dni.' },
                        ].map(({ i: Icon, t, d }) => (
                            <div key={t} className="flex gap-4 p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl hover:border-gold-500/40 transition-colors">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                                    <Icon className="w-6 h-6 text-gold-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">{t}</h3>
                                    <p className="text-zinc-400">{d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CENNIK */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Cennik (z promocją)</h2>
                    <p className="text-zinc-400">Wybierz typ sesji — album w cenie każdego pakietu.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {[
                        { name: 'Sesja Rodzinna', regular: 890, promo: 690, popular: false, items: ['90 min sesji w plenerze', '25 zdjęć obrobionych', 'Album rodzinny 25×20', 'Dowóz do 30 km'] },
                        { name: 'Sesja Komunijna', regular: 1490, promo: 1190, popular: true, items: ['Reportaż z kościoła (2h)', 'Sesja portretowa (45 min)', 'Album komunijny 25×25', 'Min. 80 zdjęć obrobionych'] },
                        { name: 'Sesja Urodzinowa', regular: 1290, promo: 990, popular: false, items: ['Reportaż z imprezy (2h)', '60+ zdjęć obrobionych', 'Album urodzinowy 30×30', 'Sesja tematyczna 30 min'] },
                    ].map((p) => (
                        <div
                            key={p.name}
                            className={`relative p-8 rounded-3xl border-2 ${
                                p.popular ? 'border-gold-500 bg-gradient-to-b from-gold-500/10 to-transparent shadow-2xl shadow-gold-500/20 scale-105' : 'border-zinc-800 bg-zinc-900/60'
                            }`}
                        >
                            {p.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold-500 text-black px-4 py-1 rounded-full text-xs font-bold uppercase">
                                    Najczęściej wybierane
                                </div>
                            )}
                            <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                            <div className="mb-4">
                                <span className="text-5xl font-bold text-gold-400">{p.promo}</span>
                                <span className="text-zinc-400 text-xl ml-1">zł</span>
                                <div className="text-sm text-zinc-500 line-through mt-1">{p.regular} zł regularnie</div>
                            </div>
                            <ul className="space-y-2 mb-6">
                                {p.items.map((it) => (
                                    <li key={it} className="flex gap-2 text-sm text-zinc-300">
                                        <Check className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                                        {it}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* FORMULARZ */}
            <section id="rezerwacja" className="py-16 px-4 bg-gradient-to-br from-zinc-950 to-black">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold mb-3">Zarezerwuj termin</h2>
                        <p className="text-zinc-400">Odpowiem osobiście w ciągu 2 godzin (poniedziałek-niedziela 9:00-21:00).</p>
                    </div>

                    {status === 'success' ? (
                        <div className="p-8 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
                            <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold mb-2">Dziękuję {form.name}!</h3>
                            <p className="text-zinc-300 mb-4">Twoje zapytanie dotarło. Oddzwonię w ciągu 2 godzin pod {form.phone || 'wskazany numer'}.</p>
                            <p className="text-sm text-zinc-500">Kod promocyjny: <code className="text-gold-400">MAJ-ALBUM-GRATIS</code></p>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-4 p-8 bg-zinc-900/60 border border-zinc-800 rounded-3xl">
                            <div className="grid md:grid-cols-2 gap-4">
                                <input required placeholder="Imię i nazwisko" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:border-gold-500 focus:outline-none" />
                                <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:border-gold-500 focus:outline-none" />
                            </div>
                            <input type="tel" placeholder="Telefon (zalecany — oddzwonię)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:border-gold-500 focus:outline-none" />
                            <div className="grid md:grid-cols-2 gap-4">
                                <select value={form.session_type} onChange={(e) => setForm({ ...form, session_type: e.target.value })} className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:border-gold-500 focus:outline-none">
                                    <option value="rodzinna">Sesja Rodzinna</option>
                                    <option value="komunijna">Sesja Komunijna</option>
                                    <option value="urodzinowa">Sesja Urodzinowa</option>
                                    <option value="slubna">Sesja Ślubna</option>
                                    <option value="inna">Inna / nie wiem</option>
                                </select>
                                <input type="date" placeholder="Preferowana data" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:border-gold-500 focus:outline-none" />
                            </div>
                            <textarea placeholder="Dodatkowe informacje (opcjonalnie)" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:border-gold-500 focus:outline-none" />

                            <button
                                type="submit"
                                disabled={status === 'sending'}
                                className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-black font-bold rounded-full text-lg disabled:opacity-50 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                {status === 'sending' ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Wysyłanie…</>
                                ) : (
                                    <>🎁 Zarezerwuj sesję + album gratis</>
                                )}
                            </button>

                            {status === 'error' && (
                                <div className="text-red-400 text-sm text-center">Coś poszło nie tak. Zadzwoń: <a href="tel:+48512999666" className="underline">512 999 666</a></div>
                            )}

                            <div className="text-xs text-zinc-500 text-center pt-2">
                                Wysyłając formularz akceptujesz <Link href="/polityka-prywatnosci" className="underline hover:text-gold-400">politykę prywatności</Link>.
                                Nie udostępniamy danych podmiotom trzecim.
                            </div>
                        </form>
                    )}

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <a href="tel:+48512999666" className="flex items-center justify-center gap-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-gold-500/50 transition-colors">
                            <Phone className="w-5 h-5 text-gold-400" /> 512 999 666
                        </a>
                        <a href="mailto:pwlasniewski@gmail.com" className="flex items-center justify-center gap-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-gold-500/50 transition-colors">
                            <Mail className="w-5 h-5 text-gold-400" /> Email
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}
