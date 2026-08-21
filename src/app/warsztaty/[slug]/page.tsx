'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight, Camera, GraduationCap, CheckCircle2 } from 'lucide-react';

type Workshop = {
    id: number;
    slug: string;
    title: string;
    location: string | null;
    description: string | null;
    schedule: any;
    starts_at: string | null;
    ends_at: string | null;
    public_signup_enabled: boolean;
    _count: { participants: number };
};

export default function WorkshopLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [w, setW] = useState<Workshop | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [form, setForm] = useState({ recipient_email: '', recipient_name: '', participant_name: '', recipient_phone: '', custom_message: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/workshops/${slug}`)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(d => setW(d.workshop))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [slug]);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.recipient_email) return;
        setSending(true); setError(null);
        try {
            const r = await fetch(`/api/workshops/${slug}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (r.ok) setSent(true);
            else { const j = await r.json().catch(() => ({})); setError(j.error || 'Błąd'); }
        } catch (e: any) { setError(e?.message || 'Błąd'); }
        finally { setSending(false); }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-amber-50 text-zinc-500">Ładowanie...</div>;
    if (notFound || !w) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 text-center p-8">
                <h1 className="text-2xl font-bold text-zinc-800">Warsztat niedostępny</h1>
                <p className="text-zinc-600 mt-2">Sprawdź adres lub wróć na <Link href="/" className="text-rose-600 underline">stronę główną</Link>.</p>
            </div>
        );
    }

    const schedule: any[] = Array.isArray(w.schedule) ? w.schedule : [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50 to-white">
            {/* HERO */}
            <header className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 text-white">
                <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                        <GraduationCap size={14} /> Warsztaty fotograficzne
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold leading-tight">{w.title}</h1>
                    {w.location && (
                        <div className="flex items-center gap-2 mt-4 text-white/90">
                            <MapPin size={18} /> {w.location}
                        </div>
                    )}
                    {(w.starts_at || w.ends_at) && (
                        <div className="flex items-center gap-2 mt-2 text-white/90">
                            <Calendar size={18} />
                            {w.starts_at && new Date(w.starts_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {w.ends_at && ` – ${new Date(w.ends_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                        </div>
                    )}
                    <a href="#zapis" className="inline-flex items-center gap-2 bg-white text-rose-600 hover:bg-amber-50 px-6 py-3 rounded-lg font-bold shadow-lg mt-8">
                        Zapisz się <ArrowRight size={18} />
                    </a>
                </div>
            </header>

            {/* OPIS */}
            {w.description && (
                <section className="max-w-3xl mx-auto px-6 py-12">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-4 flex items-center gap-2"><Camera className="text-rose-500" /> O warsztatach</h2>
                    <div className="text-zinc-700 leading-relaxed whitespace-pre-wrap">{w.description}</div>
                </section>
            )}

            {/* PROGRAM */}
            {schedule.length > 0 && (
                <section className="max-w-3xl mx-auto px-6 py-12">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2"><Calendar className="text-rose-500" /> Program</h2>
                    <ol className="space-y-4">
                        {schedule.map((s, i) => (
                            <li key={i} className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="bg-gradient-to-br from-rose-500 to-amber-500 text-white font-bold rounded-lg w-12 h-12 flex items-center justify-center shrink-0">{i + 1}</div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-baseline gap-3 text-sm">
                                            {s.date && <span className="font-bold text-zinc-900">{s.date}</span>}
                                            {(s.start || s.end) && <span className="text-zinc-500">{s.start || ''}{s.start && s.end ? ' – ' : ''}{s.end || ''}</span>}
                                        </div>
                                        {s.topic && <h3 className="font-bold text-zinc-900 mt-1">{s.topic}</h3>}
                                        {s.plan && <p className="text-zinc-600 text-sm mt-1 whitespace-pre-wrap">{s.plan}</p>}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {/* CO ZYSKASZ */}
            <section className="max-w-3xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold text-zinc-900 mb-6">Co zyskasz</h2>
                <ul className="space-y-3">
                    {[
                        'Indywidualną pracę nad zdjęciami i feedback od fotografa',
                        'Dostęp do panelu uczestnika z materiałami i przesyłaniem prac',
                        'Pełen program zajęć w jednym miejscu',
                        'Pamiątkę na całe życie + portfolio własnych prac',
                    ].map((t, i) => (
                        <li key={i} className="flex gap-3 items-start text-zinc-700">
                            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} /> {t}
                        </li>
                    ))}
                </ul>
            </section>

            {/* FORMULARZ ZAPISU */}
            {w.public_signup_enabled ? (
                <section id="zapis" className="max-w-2xl mx-auto px-6 py-12">
                    <div className="bg-white rounded-2xl border border-amber-200 shadow-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white p-6">
                            <h2 className="text-2xl font-bold">Zapisz się na warsztaty</h2>
                            <p className="text-sm opacity-90 mt-1">Wyślę Ci szczegóły, cenę i dane do zaliczki w ciągu 24h.</p>
                        </div>
                        <div className="p-6">
                            {sent ? (
                                <div className="text-center py-8">
                                    <div className="text-5xl mb-3">🎉</div>
                                    <p className="text-emerald-600 font-bold text-lg">Dzięki za zgłoszenie!</p>
                                    <p className="text-zinc-500 text-sm mt-1">Odezwę się w ciągu 24h z propozycją terminu i kwotą zaliczki.</p>
                                </div>
                            ) : (
                                <form onSubmit={submit} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-zinc-600 uppercase">Twój e-mail *</label>
                                            <input required type="email" value={form.recipient_email}
                                                onChange={e => setForm({ ...form, recipient_email: e.target.value })}
                                                placeholder="rodzic@example.pl"
                                                className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1 focus:border-rose-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-zinc-600 uppercase">Imię (Twoje)</label>
                                            <input value={form.recipient_name}
                                                onChange={e => setForm({ ...form, recipient_name: e.target.value })}
                                                placeholder="Anna"
                                                className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1 focus:border-rose-500 focus:outline-none" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-zinc-600 uppercase">Imię uczestnika</label>
                                            <input value={form.participant_name}
                                                onChange={e => setForm({ ...form, participant_name: e.target.value })}
                                                placeholder="Kuba"
                                                className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1 focus:border-rose-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-zinc-600 uppercase">Telefon</label>
                                            <input value={form.recipient_phone}
                                                onChange={e => setForm({ ...form, recipient_phone: e.target.value })}
                                                placeholder="+48..."
                                                className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1 focus:border-rose-500 focus:outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-600 uppercase">Wiadomość (opcjonalnie)</label>
                                        <textarea value={form.custom_message}
                                            onChange={e => setForm({ ...form, custom_message: e.target.value })}
                                            rows={3} placeholder="Doświadczenie, oczekiwania, pytania..."
                                            className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1 focus:border-rose-500 focus:outline-none" />
                                    </div>
                                    {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 text-sm">{error}</div>}
                                    <button disabled={sending} type="submit"
                                        className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white py-3 rounded-lg font-bold disabled:opacity-50">
                                        {sending ? 'Wysyłam...' : 'Wyślij zgłoszenie'}
                                    </button>
                                    <p className="text-[11px] text-zinc-400 text-center">Bez zobowiązań. Wysłanie formularza nie jest rezerwacją — odezwę się indywidualnie.</p>
                                </form>
                            )}
                        </div>
                    </div>
                </section>
            ) : (
                <section id="zapis" className="max-w-2xl mx-auto px-6 py-12">
                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden text-center p-8">
                        <div className="text-5xl mb-3">📧</div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Zapisy zamknięte</h2>
                        <p className="text-zinc-600 max-w-md mx-auto">
                            Zapisów na ten warsztat można dokonać tylko poprzez bezpośredni kontakt.
                            Skontaktuj się ze mną, jeśli jesteś zainteresowany.
                        </p>
                        <a
                            href="mailto:pwlasniewski@gmail.com"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg mt-6"
                        >
                            Napisz do mnie <ArrowRight size={18} />
                        </a>
                    </div>
                </section>
            )}

            <footer className="text-center text-xs text-zinc-400 py-6">
                © {new Date().getFullYear()} Studio Właśniewski · <Link href="/" className="hover:text-rose-500">wlasniewski.pl</Link> · Już zapisany? <Link href={`/warsztaty/${slug}/login`} className="text-rose-500 hover:underline">Zaloguj się do panelu</Link>
            </footer>
        </div>
    );
}
