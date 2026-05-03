'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Printer, Trash2, KeyRound, Edit2, Save, X, Send, Calendar as CalendarIcon, Bell, Upload, Image as ImageIcon, BookOpen, Star, Download, ExternalLink } from 'lucide-react';
import { buildICS, downloadICS } from '@/utils/ics';

interface Participant {
    id: number;
    login: string;
    display_name: string | null;
    avatar: string | null;
    pin_plain_temp: string | null;
    active: boolean;
    last_login: string | null;
    created_at: string;
}
interface Workshop {
    id: number;
    slug: string;
    title: string;
    location: string | null;
    description: string | null;
    schedule: any[];
    materials: any[];
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    public_signup_enabled: boolean;
    participants: Participant[];
}

export default function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [w, setW] = useState<Workshop | null>(null);
    const [count, setCount] = useState(15);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [recentlyCreated, setRecentlyCreated] = useState<Participant[] | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'schedule' | 'materials' | 'gallery' | 'participants' | 'offers'>('info');
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ 
        title: '', 
        location: '', 
        description: '', 
        status: '', 
        starts_at: '', 
        starts_time: '',
        ends_at: '', 
        ends_time: '',
        public_signup_enabled: true 
    });
    const [showOfferModal, setShowOfferModal] = useState(false);

    function token() { return localStorage.getItem('admin_token') || ''; }

    async function load() {
        setLoading(true);
        const r = await fetch(`/api/admin/workshops/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
        const j = await r.json();
        setW(j.workshop);
        if (j.workshop) {
            // Rozdziel DateTime na datę i czas
            let startsDate = '';
            let startsTime = '';
            let endsDate = '';
            let endsTime = '';
            
            if (j.workshop.starts_at) {
                const dt = new Date(j.workshop.starts_at);
                startsDate = dt.toISOString().slice(0, 10);
                startsTime = dt.toISOString().slice(11, 16);
            }
            if (j.workshop.ends_at) {
                const dt = new Date(j.workshop.ends_at);
                endsDate = dt.toISOString().slice(0, 10);
                endsTime = dt.toISOString().slice(11, 16);
            }
            
            setForm({
                title: j.workshop.title || '',
                location: j.workshop.location || '',
                description: j.workshop.description || '',
                status: j.workshop.status || 'draft',
                starts_at: startsDate,
                starts_time: startsTime,
                ends_at: endsDate,
                ends_time: endsTime,
                public_signup_enabled: j.workshop.public_signup_enabled ?? true,
            });
        }
        setLoading(false);
    }
    useEffect(() => { load(); }, [id]);

    async function saveEdit() {
        // Połącz datę + czas przed wysłaniem
        let startsAtISO = form.starts_at || null;
        let endsAtISO = form.ends_at || null;
        
        if (form.starts_at && form.starts_time) {
            startsAtISO = `${form.starts_at}T${form.starts_time}:00`;
        }
        if (form.ends_at && form.ends_time) {
            endsAtISO = `${form.ends_at}T${form.ends_time}:00`;
        }
        
        await fetch(`/api/admin/workshops/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
            body: JSON.stringify({
                title: form.title,
                location: form.location,
                description: form.description,
                status: form.status,
                starts_at: startsAtISO,
                ends_at: endsAtISO,
                public_signup_enabled: form.public_signup_enabled,
            }),
        });
        setEditing(false);
        load();
    }

    async function generate() {
        setGenerating(true);
        const r = await fetch(`/api/admin/workshops/${id}/participants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
            body: JSON.stringify({ count }),
        });
        const j = await r.json();
        setRecentlyCreated(j.created || []);
        setGenerating(false);
        load();
    }

    async function removeParticipant(pid: number) {
        if (!confirm('Usunąć uczestnika? Tej operacji nie da się cofnąć.')) return;
        await fetch(`/api/admin/workshops/${id}/participants?ids=${pid}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token()}` },
        });
        load();
    }

    function printCards() {
        const win = window.open('', '_blank');
        if (!win || !w) return;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const loginUrl = `${origin}/warsztaty/${w.slug}/login`;
        // Paleta gradientów — każda karta dostaje inny kolor, żeby uczestnik szybko znalazł "swoją"
        const palettes = [
            ['#fde68a', '#fb7185'], // amber → rose
            ['#bae6fd', '#6366f1'], // sky → indigo
            ['#bbf7d0', '#10b981'], // green → emerald
            ['#fbcfe8', '#a855f7'], // pink → purple
            ['#fed7aa', '#ef4444'], // orange → red
            ['#a7f3d0', '#14b8a6'], // mint → teal
            ['#fef08a', '#f59e0b'], // yellow → amber
            ['#ddd6fe', '#7c3aed'], // violet
        ];
        const cards = w.participants.map((p, idx) => {
            const [c1, c2] = palettes[idx % palettes.length];
            // Magic-link z loginem prefillowanym — dziecko skanuje QR i ma od razu swój login wpisany
            const qrTarget = `${loginUrl}?u=${encodeURIComponent(p.login)}`;
            const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(qrTarget)}`;
            const pin = p.pin_plain_temp || '------';
            return `
            <div class="card" style="background:linear-gradient(135deg, ${c1} 0%, ${c2} 100%);">
                <div class="inner">
                    <div class="avatar">${p.avatar || '📸'}</div>
                    <div class="title">${w.title}</div>
                    <div class="loc">${w.location || ''}</div>
                    <div class="creds">
                        <div class="row"><span>Login</span><strong>${p.login}</strong></div>
                        <div class="row"><span>PIN</span><strong class="pin">${pin}</strong></div>
                    </div>
                    <img class="qr" src="${qrSrc}" alt="QR" />
                    <div class="hint">Zeskanuj kod → wpisz PIN</div>
                    <div class="url">${loginUrl}</div>
                </div>
            </div>`;
        }).join('');
        win.document.write(`<!doctype html><html><head><title>Karty uczestników</title><style>
            @page { size: A4; margin: 6mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; background: #fff; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5mm; }
            .card { border-radius: 16px; padding: 4mm; page-break-inside: avoid; box-shadow: 0 0 0 1px rgba(0,0,0,0.08); }
            .inner { background: #ffffff; border-radius: 12px; padding: 6mm 5mm; text-align: center; }
            .avatar { font-size: 40pt; line-height: 1; }
            .title { font-weight: 800; margin-top: 3mm; font-size: 12pt; color: #0f172a; }
            .loc { color: #475569; font-size: 9pt; margin-top: 1mm; }
            .creds { margin-top: 4mm; }
            .row { display:flex; align-items:center; justify-content:space-between; padding: 2mm 4mm; margin: 1.5mm 0; border-radius: 8px; background: #f8fafc; }
            .row span { color:#64748b; font-size: 10pt; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
            .row strong { color:#0f172a; font-size: 14pt; font-weight: 800; letter-spacing: 1px; }
            .row .pin { font-size: 20pt; font-family: 'Courier New', monospace; color: #be123c; letter-spacing: 4px; }
            .qr { display:block; margin: 4mm auto 2mm; width: 35mm; height: 35mm; }
            .hint { color:#475569; font-size: 9pt; font-weight: 600; }
            .url { margin-top: 2mm; color:#94a3b8; font-size: 7pt; word-break:break-all; }
        </style></head><body><div class="grid">${cards}</div>
        <script>window.onload=()=>setTimeout(()=>window.print(), 600);</script></body></html>`);
        win.document.close();
    }

    if (loading) return <div className="p-6 text-zinc-500">Ładowanie…</div>;
    if (!w) return <div className="p-6 text-rose-500">Nie znaleziono warsztatu.</div>;

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                    <Link href="/admin/warsztaty" className="text-zinc-600 hover:text-zinc-900"><ArrowLeft size={20} /></Link>
                    {!editing ? (
                        <>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-zinc-900">{w.title}</h1>
                                <div className="text-sm text-zinc-500">/warsztaty/{w.slug}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${w.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'}`}>{w.status}</span>
                            <button onClick={() => setEditing(true)} className="text-zinc-700 hover:text-zinc-900 flex items-center gap-2 font-bold">
                                <Edit2 size={16} /> Edytuj
                            </button>
                            <button onClick={() => setShowOfferModal(true)} className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                <Send size={16} /> Wyślij ofertę
                            </button>
                        </>
                    ) : (
                        <>
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                className="flex-1 border border-zinc-300 rounded px-3 py-2 text-zinc-900" />
                            <button onClick={saveEdit} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded flex items-center gap-2">
                                <Save size={16} /> Zapisz
                            </button>
                            <button onClick={() => { setEditing(false); load(); }} className="text-zinc-600 hover:text-zinc-900">
                                <X size={20} />
                            </button>
                        </>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-zinc-200 overflow-x-auto">
                    {(['info', 'schedule', 'materials', 'offers', 'participants', 'gallery'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 font-bold text-sm transition whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-rose-500 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                            {tab === 'info' && '📋 Informacje'}
                            {tab === 'schedule' && '📅 Program'}
                            {tab === 'materials' && '📚 Materiały / Powtórki'}
                            {tab === 'offers' && '✉️ Oferty / Zapisy'}
                            {tab === 'participants' && `👥 Uczestnicy (${w.participants.length})`}
                            {tab === 'gallery' && '🖼️ Galeria zdjęć'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'info' && <InfoTab workshop={w} editing={editing} form={form} setForm={setForm} />}
                {activeTab === 'schedule' && <ScheduleTab workshop={w} reload={load} />}
                {activeTab === 'materials' && <MaterialsTab workshop={w} reload={load} />}
                {activeTab === 'gallery' && <GalleryTab workshopId={w.id} />}
                {activeTab === 'offers' && <OffersTab workshopId={w.id} onSendOffer={() => setShowOfferModal(true)} reloadParent={load} />}
                {activeTab === 'participants' && (
                    <ParticipantsTab
                        workshop={w}
                        count={count}
                        setCount={setCount}
                        generating={generating}
                        generate={generate}
                        printCards={printCards}
                        recentlyCreated={recentlyCreated}
                        removeParticipant={removeParticipant}
                    />
                )}
            </div>

            {showOfferModal && (
                <SendOfferModal workshopId={w.id} workshop={w} onClose={() => setShowOfferModal(false)} />
            )}
        </div>
    );
}

// === TABS ===

function InfoTab({ workshop, editing, form, setForm }: any) {
    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-zinc-600 uppercase">Lokalizacja</label>
                    {!editing ? (
                        <div className="text-zinc-900 mt-1">{workshop.location || '—'}</div>
                    ) : (
                        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                            placeholder="Miejscowość, ulica" className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1" />
                    )}
                </div>
                <div>
                    <label className="text-xs font-bold text-zinc-600 uppercase">Status</label>
                    {!editing ? (
                        <div className="text-zinc-900 mt-1">{workshop.status}</div>
                    ) : (
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                            className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1">
                            <option value="draft">draft</option>
                            <option value="active">active</option>
                            <option value="finished">finished</option>
                            <option value="archived">archived</option>
                        </select>
                    )}
                </div>
                <div>
                    <label className="text-xs font-bold text-zinc-600 uppercase">Data i godzina rozpoczęcia</label>
                    {!editing ? (
                        <div className="text-zinc-900 mt-1">
                            {workshop.starts_at ? new Date(workshop.starts_at).toLocaleString('pl-PL', { 
                                dateStyle: 'medium', 
                                timeStyle: 'short' 
                            }) : '—'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <input 
                                type="date" 
                                value={form.starts_at} 
                                onChange={e => setForm({ ...form, starts_at: e.target.value })}
                                className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900" 
                            />
                            <input 
                                type="time" 
                                value={form.starts_time} 
                                onChange={e => setForm({ ...form, starts_time: e.target.value })}
                                placeholder="--:--"
                                className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900" 
                            />
                        </div>
                    )}
                </div>
                <div>
                    <label className="text-xs font-bold text-zinc-600 uppercase">Data i godzina zakończenia</label>
                    {!editing ? (
                        <div className="text-zinc-900 mt-1">
                            {workshop.ends_at ? new Date(workshop.ends_at).toLocaleString('pl-PL', { 
                                dateStyle: 'medium', 
                                timeStyle: 'short' 
                            }) : '—'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <input 
                                type="date" 
                                value={form.ends_at} 
                                onChange={e => setForm({ ...form, ends_at: e.target.value })}
                                className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900" 
                            />
                            <input 
                                type="time" 
                                value={form.ends_time} 
                                onChange={e => setForm({ ...form, ends_time: e.target.value })}
                                placeholder="--:--"
                                className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900" 
                            />
                        </div>
                    )}
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-zinc-600 uppercase">Opis</label>
                {!editing ? (
                    <div className="text-zinc-700 whitespace-pre-wrap mt-1">{workshop.description || '—'}</div>
                ) : (
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Krótki opis warsztatów"
                        rows={4} className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1" />
                )}
            </div>
            <div className="border-t border-zinc-200 pt-4">
                <label className="text-xs font-bold text-zinc-600 uppercase block mb-2">Publiczny formularz zapisu</label>
                {!editing ? (
                    <div className="text-zinc-700">
                        {workshop.public_signup_enabled ? (
                            <span className="text-emerald-600 font-semibold">✓ Włączony — formularz widoczny na /warsztaty/{workshop.slug}</span>
                        ) : (
                            <span className="text-amber-600 font-semibold">✗ Wyłączony — zapisy tylko przez admina</span>
                        )}
                    </div>
                ) : (
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div
                            onClick={() => setForm({ ...form, public_signup_enabled: !form.public_signup_enabled })}
                            className={`w-12 h-6 rounded-full transition-colors relative ${
                                form.public_signup_enabled ? 'bg-emerald-500' : 'bg-zinc-400'
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                    form.public_signup_enabled ? 'translate-x-6' : 'translate-x-0.5'
                                }`}
                            />
                        </div>
                        <span className="text-sm text-zinc-700">
                            {form.public_signup_enabled
                                ? 'Formularz zapisu widoczny publicznie'
                                : 'Formularz ukryty — tylko zapisy przez admina'}
                        </span>
                    </label>
                )}
                <p className="text-xs text-zinc-500 mt-2">
                    Wyłącz jeśli chcesz przyjmować zapisy tylko bezpośrednio (np. gdy to Ty tworzysz konta uczestników).
                </p>
            </div>
            <WorkshopDaysSummary workshop={workshop} />
        </div>
    );
}

// Sekcja z dniami warsztatu + integracja z kalendarzem
function WorkshopDaysSummary({ workshop }: { workshop: Workshop }) {
    const days = Array.isArray(workshop.schedule)
        ? workshop.schedule
            .filter((d: any) => d && d.date)
            .map((d: any) => ({
                date: String(d.date),
                start: d.start || '',
                end: d.end || '',
                topic: d.topic || '',
                plan: d.plan || '',
            }))
            .sort((a: any, b: any) => a.date.localeCompare(b.date))
        : [];

    if (days.length === 0) {
        return (
            <div className="border-t border-zinc-200 pt-4">
                <label className="text-xs font-bold text-zinc-600 uppercase block mb-2">Dni warsztatu</label>
                <p className="text-sm text-zinc-500">
                    Brak harmonogramu. Dodaj dni warsztatu w zakładce <strong>📅 Program</strong> — pojawi się tu lista konkretnych dat z możliwością eksportu do kalendarza.
                </p>
            </div>
        );
    }

    function googleCalUrl(d: { date: string; start?: string; end?: string; topic: string; plan?: string }) {
        const dateNoDash = d.date.replaceAll('-', '');
        let dates: string;
        if (d.start && d.end) {
            const s = d.start.replace(':', '') + '00';
            const e = d.end.replace(':', '') + '00';
            dates = `${dateNoDash}T${s}/${dateNoDash}T${e}`;
        } else {
            const next = new Date(d.date + 'T00:00:00');
            next.setDate(next.getDate() + 1);
            const yyyy = next.getFullYear();
            const mm = String(next.getMonth() + 1).padStart(2, '0');
            const dd = String(next.getDate()).padStart(2, '0');
            dates = `${dateNoDash}/${yyyy}${mm}${dd}`;
        }
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: `${workshop.title}${d.topic ? ' — ' + d.topic : ''}`,
            dates,
            details: d.plan || workshop.description || '',
            location: workshop.location || '',
        });
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    function downloadDayIcs(d: { date: string; start?: string; end?: string; topic: string; plan?: string }) {
        const ics = buildICS({
            uid: `workshop-${workshop.id}-${d.date}@wlasniewski.pl`,
            title: `${workshop.title}${d.topic ? ' — ' + d.topic : ''}`,
            description: d.plan || workshop.description || '',
            date: d.date,
            start: d.start || undefined,
            end: d.end || undefined,
            location: workshop.location || '',
        });
        downloadICS(`warsztat-${workshop.slug}-${d.date}.ics`, ics);
    }

    function downloadAllIcs() {
        // Składamy multi-event ICS
        const CRLF = '\r\n';
        const events = days.map((d) => {
            const single = buildICS({
                uid: `workshop-${workshop.id}-${d.date}@wlasniewski.pl`,
                title: `${workshop.title}${d.topic ? ' — ' + d.topic : ''}`,
                description: d.plan || workshop.description || '',
                date: d.date,
                start: d.start || undefined,
                end: d.end || undefined,
                location: workshop.location || '',
            });
            // Wyciągamy tylko VEVENT
            const m = single.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/);
            return m ? m[0] : '';
        }).filter(Boolean);

        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Wlasniewski//Booking//PL',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            ...events,
            'END:VCALENDAR',
            '',
        ].join(CRLF);

        downloadICS(`warsztat-${workshop.slug}-wszystkie-dni.ics`, ics);
    }

    return (
        <div className="border-t border-zinc-200 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <label className="text-xs font-bold text-zinc-600 uppercase">
                    Dni warsztatu ({days.length})
                </label>
                {days.length > 1 && (
                    <button
                        onClick={downloadAllIcs}
                        className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold px-3 py-1.5 rounded flex items-center gap-1"
                        title="Pobierz wszystkie dni jako jeden plik .ics"
                    >
                        <Download size={12} /> Pobierz cały plan (.ics)
                    </button>
                )}
            </div>
            <div className="space-y-2">
                {days.map((d, i) => {
                    const dt = new Date(d.date + 'T00:00:00');
                    const label = dt.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                    return (
                        <div key={i} className="flex items-center gap-3 flex-wrap bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-zinc-900 text-sm capitalize">{label}</div>
                                <div className="text-xs text-zinc-600">
                                    {d.start && d.end ? `${d.start} – ${d.end}` : 'cały dzień'}
                                    {d.topic && <> · <span className="text-zinc-700">{d.topic}</span></>}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => downloadDayIcs(d)}
                                    className="text-xs bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 px-2 py-1 rounded flex items-center gap-1"
                                    title="Pobierz .ics (Apple Calendar, Outlook)"
                                >
                                    <Download size={11} /> .ics
                                </button>
                                <a
                                    href={googleCalUrl(d)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 px-2 py-1 rounded flex items-center gap-1"
                                    title="Dodaj do Google Calendar"
                                >
                                    <ExternalLink size={11} /> Google
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
                💡 Edytuj konkretne dni i godziny w zakładce <strong>📅 Program</strong>.
            </p>
        </div>
    );
}

function ScheduleTab({ workshop, reload }: { workshop: Workshop; reload: () => void }) {
    const [items, setItems] = useState<any[]>(workshop.schedule || []);
    const [adding, setAdding] = useState(false);
    const [newItem, setNewItem] = useState<{ date: string; start: string; end: string; topic: string; plan: string; image_url: string }>({ date: '', start: '', end: '', topic: '', plan: '', image_url: '' });
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [uploading, setUploading] = useState<number | null>(null); // -1 = newItem, n>=0 = item index

    useEffect(() => { setItems(workshop.schedule || []); }, [workshop.schedule]);

    async function save() {
        const token = localStorage.getItem('admin_token') || '';
        await fetch(`/api/admin/workshops/${workshop.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ schedule: items }),
        });
        setEditIdx(null);
        reload();
    }

    function add() {
        if (!newItem.topic) return;
        setItems([...items, { ...newItem }]);
        setNewItem({ date: '', start: '', end: '', topic: '', plan: '', image_url: '' });
        setAdding(false);
    }

    async function uploadImage(file: File, target: 'new' | number) {
        const token = localStorage.getItem('admin_token') || '';
        const fd = new FormData();
        fd.append('file', file);
        fd.append('kind', 'schedule');
        setUploading(target === 'new' ? -1 : target);
        try {
            const r = await fetch('/api/admin/workshops/upload-asset', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const j = await r.json();
            if (!r.ok) { alert(j.error || 'Błąd uploadu'); return; }
            if (target === 'new') {
                setNewItem({ ...newItem, image_url: j.url });
            } else {
                const next = [...items];
                next[target] = { ...next[target], image_url: j.url };
                setItems(next);
            }
        } finally { setUploading(null); }
    }

    function updateField(idx: number, key: string, value: string) {
        const next = [...items];
        next[idx] = { ...next[idx], [key]: value };
        setItems(next);
    }

    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-zinc-900">Harmonogram zajęć</h3>
                <button onClick={() => setAdding(!adding)} className="text-rose-600 hover:text-rose-700 flex items-center gap-2 font-bold">
                    <Plus size={16} /> Dodaj zajęcia
                </button>
            </div>

            {adding && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                    <input type="date" value={newItem.date} onChange={e => setNewItem({ ...newItem, date: e.target.value })}
                        className="border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-900 text-sm placeholder:text-zinc-400" />
                    <input type="time" value={newItem.start} onChange={e => setNewItem({ ...newItem, start: e.target.value })}
                        placeholder="Start" className="border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-900 text-sm placeholder:text-zinc-400" />
                    <input type="time" value={newItem.end} onChange={e => setNewItem({ ...newItem, end: e.target.value })}
                        placeholder="Koniec" className="border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-900 text-sm placeholder:text-zinc-400" />
                    <input value={newItem.topic} onChange={e => setNewItem({ ...newItem, topic: e.target.value })}
                        placeholder="Temat (np. Ekspozycja)" className="border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 md:col-span-2" />
                    <textarea value={newItem.plan} onChange={e => setNewItem({ ...newItem, plan: e.target.value })}
                        placeholder="Plan szczegółowy (opcjonalnie)" rows={2}
                        className="border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 md:col-span-4" />
                    <div className="md:col-span-5 flex items-center gap-3 flex-wrap">
                        <label className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded font-bold cursor-pointer flex items-center gap-1">
                            <Upload size={12} /> {newItem.image_url ? 'Zmień grafikę' : 'Dodaj grafikę z internetu / dysku'}
                            <input type="file" accept="image/*,application/pdf" hidden
                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'new'); e.target.value = ''; }} />
                        </label>
                        {uploading === -1 && <span className="text-xs text-zinc-500">wgrywam…</span>}
                        {newItem.image_url && (
                            <a href={newItem.image_url} target="_blank" rel="noreferrer" className="text-xs text-rose-600 underline">
                                <ImageIcon size={12} className="inline" /> podgląd grafiki
                            </a>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <button onClick={add} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-sm font-bold">Dodaj</button>
                            <button onClick={() => setAdding(false)} className="text-zinc-600 px-2">Anuluj</button>
                        </div>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <div className="text-zinc-500 text-center py-8">Brak harmonogramu. Dodaj pierwsze zajęcia powyżej.</div>
            ) : (
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div key={idx} className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                            {editIdx === idx ? (
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                    <input type="date" value={item.date || ''} onChange={e => updateField(idx, 'date', e.target.value)} className="border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-900 text-sm placeholder:text-zinc-400" />
                                    <input type="time" value={item.start || ''} onChange={e => updateField(idx, 'start', e.target.value)} className="border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-900 text-sm placeholder:text-zinc-400" />
                                    <input type="time" value={item.end || ''} onChange={e => updateField(idx, 'end', e.target.value)} className="border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-900 text-sm placeholder:text-zinc-400" />
                                    <input value={item.topic || ''} onChange={e => updateField(idx, 'topic', e.target.value)} className="border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 md:col-span-2" />
                                    <textarea value={item.plan || ''} onChange={e => updateField(idx, 'plan', e.target.value)} rows={3} className="border border-zinc-300 rounded px-2 py-1.5 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 md:col-span-5" />
                                    <div className="md:col-span-5 flex items-center gap-3 flex-wrap">
                                        <label className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded font-bold cursor-pointer flex items-center gap-1">
                                            <Upload size={12} /> {item.image_url ? 'Zmień grafikę' : 'Dodaj grafikę'}
                                            <input type="file" accept="image/*,application/pdf" hidden
                                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, idx); e.target.value = ''; }} />
                                        </label>
                                        {uploading === idx && <span className="text-xs text-zinc-500">wgrywam…</span>}
                                        {item.image_url && (
                                            <>
                                                <a href={item.image_url} target="_blank" rel="noreferrer" className="text-xs text-rose-600 underline"><ImageIcon size={12} className="inline" /> podgląd</a>
                                                <button onClick={() => updateField(idx, 'image_url', '')} className="text-xs text-zinc-500 hover:text-rose-600">usuń grafikę</button>
                                            </>
                                        )}
                                        <button onClick={save} className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-sm font-bold">Zapisz</button>
                                        <button onClick={() => { setEditIdx(null); setItems(workshop.schedule || []); }} className="text-zinc-600 px-2 text-sm">Anuluj</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    {item.image_url && (
                                        <a href={item.image_url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                                            <img src={item.image_url} alt="" className="w-20 h-20 object-cover rounded border border-zinc-300" />
                                        </a>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xs text-zinc-600 font-mono">{item.date || '—'}</span>
                                            <span className="text-xs text-zinc-500 font-mono">{item.start} – {item.end}</span>
                                        </div>
                                        <div className="font-bold text-zinc-900">{item.topic}</div>
                                        {item.plan && <div className="text-sm text-zinc-600 mt-1 whitespace-pre-wrap">{item.plan}</div>}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => setEditIdx(idx)} className="text-zinc-500 hover:text-zinc-900 p-1" title="Edytuj"><Edit2 size={14} /></button>
                                        <button onClick={() => { if (confirm('Usunąć ten dzień?')) setItems(items.filter((_, i) => i !== idx)); }} className="text-rose-500 hover:text-rose-700 p-1" title="Usuń"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {items.length > 0 && editIdx === null && (
                <button onClick={save} className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2">
                    <Save size={16} /> Zapisz harmonogram
                </button>
            )}
        </div>
    );
}

// === MATERIA\u0141Y / POWT\u00d3RKI ===

function MaterialsTab({ workshop, reload }: { workshop: Workshop; reload: () => void }) {
    const [items, setItems] = useState<any[]>(workshop.materials || []);
    const [adding, setAdding] = useState(false);
    const [newItem, setNewItem] = useState<{ title: string; body_md: string; image_url: string }>({ title: '', body_md: '', image_url: '' });
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [uploading, setUploading] = useState<number | null>(null);

    useEffect(() => { setItems(workshop.materials || []); }, [workshop.materials]);

    async function save() {
        const token = localStorage.getItem('admin_token') || '';
        await fetch(`/api/admin/workshops/${workshop.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ materials: items }),
        });
        setEditIdx(null);
        reload();
    }

    function add() {
        if (!newItem.title) return;
        setItems([...items, { ...newItem }]);
        setNewItem({ title: '', body_md: '', image_url: '' });
        setAdding(false);
    }

    async function uploadImage(file: File, target: 'new' | number) {
        const token = localStorage.getItem('admin_token') || '';
        const fd = new FormData();
        fd.append('file', file);
        fd.append('kind', 'materials');
        setUploading(target === 'new' ? -1 : target);
        try {
            const r = await fetch('/api/admin/workshops/upload-asset', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }, body: fd,
            });
            const j = await r.json();
            if (!r.ok) { alert(j.error || 'Błąd uploadu'); return; }
            if (target === 'new') setNewItem({ ...newItem, image_url: j.url });
            else { const next = [...items]; next[target] = { ...next[target], image_url: j.url }; setItems(next); }
        } finally { setUploading(null); }
    }

    function updateField(idx: number, key: string, value: string) {
        const next = [...items];
        next[idx] = { ...next[idx], [key]: value };
        setItems(next);
    }

    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2"><BookOpen size={18} /> Materiały edukacyjne / powtórki</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Te materiały zobaczą dzieciaki w panelu w zakładce „Powtórki” — możesz wgrać grafikę (skan z książki, infografikę, schemat).</p>
                </div>
                <button onClick={() => setAdding(!adding)} className="text-rose-600 hover:text-rose-700 flex items-center gap-2 font-bold">
                    <Plus size={16} /> Dodaj materiał
                </button>
            </div>

            {adding && (
                <div className="space-y-2 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                    <input value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                        placeholder="Tytuł (np. Trójkąt ekspozycji)" className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 font-bold" />
                    <textarea value={newItem.body_md} onChange={e => setNewItem({ ...newItem, body_md: e.target.value })}
                        placeholder="Treść (Markdown). Używaj **pogrubienia**, list 1./2./3., cytatów >."
                        rows={6} className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 text-sm font-mono" />
                    <div className="flex items-center gap-3 flex-wrap">
                        <label className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded font-bold cursor-pointer flex items-center gap-1">
                            <Upload size={12} /> {newItem.image_url ? 'Zmień grafikę' : 'Wgraj grafikę (np. skan z książki)'}
                            <input type="file" accept="image/*,application/pdf" hidden
                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'new'); e.target.value = ''; }} />
                        </label>
                        {uploading === -1 && <span className="text-xs text-zinc-500">wgrywam…</span>}
                        {newItem.image_url && <a href={newItem.image_url} target="_blank" rel="noreferrer" className="text-xs text-rose-600 underline"><ImageIcon size={12} className="inline" /> podgląd</a>}
                        <div className="ml-auto flex gap-2">
                            <button onClick={add} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-sm font-bold">Dodaj</button>
                            <button onClick={() => setAdding(false)} className="text-zinc-600 px-2">Anuluj</button>
                        </div>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <div className="text-zinc-500 text-center py-8">Brak materiałów. Dodaj pierwszy powyżej.</div>
            ) : (
                <div className="space-y-3">
                    {items.map((m, idx) => (
                        <div key={idx} className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                            {editIdx === idx ? (
                                <div className="space-y-2">
                                    <input value={m.title || ''} onChange={e => updateField(idx, 'title', e.target.value)} className="w-full border border-zinc-300 rounded px-2 py-1.5 font-bold text-zinc-900" />
                                    <textarea value={m.body_md || ''} onChange={e => updateField(idx, 'body_md', e.target.value)} rows={8} className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm font-mono text-zinc-900" />
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <label className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded font-bold cursor-pointer flex items-center gap-1">
                                            <Upload size={12} /> {m.image_url ? 'Zmień grafikę' : 'Wgraj grafikę'}
                                            <input type="file" accept="image/*,application/pdf" hidden
                                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, idx); e.target.value = ''; }} />
                                        </label>
                                        {uploading === idx && <span className="text-xs text-zinc-500">wgrywam…</span>}
                                        {m.image_url && (
                                            <>
                                                <a href={m.image_url} target="_blank" rel="noreferrer" className="text-xs text-rose-600 underline"><ImageIcon size={12} className="inline" /> podgląd</a>
                                                <button onClick={() => updateField(idx, 'image_url', '')} className="text-xs text-zinc-500 hover:text-rose-600">usuń grafikę</button>
                                            </>
                                        )}
                                        <button onClick={save} className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-sm font-bold">Zapisz</button>
                                        <button onClick={() => { setEditIdx(null); setItems(workshop.materials || []); }} className="text-zinc-600 px-2 text-sm">Anuluj</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    {m.image_url && (
                                        <a href={m.image_url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                                            <img src={m.image_url} alt="" className="w-24 h-24 object-cover rounded border border-zinc-300" />
                                        </a>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-zinc-900">{m.title}</div>
                                        <div className="text-sm text-zinc-600 mt-1 whitespace-pre-wrap line-clamp-3">{m.body_md}</div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => setEditIdx(idx)} className="text-zinc-500 hover:text-zinc-900 p-1" title="Edytuj"><Edit2 size={14} /></button>
                                        <button onClick={() => { if (confirm('Usunąć materiał?')) setItems(items.filter((_, i) => i !== idx)); }} className="text-rose-500 hover:text-rose-700 p-1" title="Usuń"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {items.length > 0 && editIdx === null && (
                <button onClick={save} className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2">
                    <Save size={16} /> Zapisz materiały
                </button>
            )}
        </div>
    );
}

// === GALERIA ZDJĘĆ (UCZESTNIKÓW) ===

type GalleryUpload = {
    id: number; file_url: string; caption: string | null; feedback: string | null; rating: number | null; created_at: string;
    participant: { id: number; login: string; display_name: string | null; avatar: string | null };
};

function GalleryTab({ workshopId }: { workshopId: number }) {
    const [items, setItems] = useState<GalleryUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | 'all'>('all');
    const [editing, setEditing] = useState<number | null>(null);
    const [draftFeedback, setDraftFeedback] = useState('');
    const [draftRating, setDraftRating] = useState<number | null>(null);

    async function load() {
        setLoading(true);
        const token = localStorage.getItem('admin_token') || '';
        const r = await fetch(`/api/admin/workshops/${workshopId}/uploads`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) { const d = await r.json(); setItems(d.uploads || []); }
        setLoading(false);
    }
    useEffect(() => { load(); }, [workshopId]);

    function startEdit(u: GalleryUpload) {
        setEditing(u.id);
        setDraftFeedback(u.feedback || '');
        setDraftRating(u.rating);
    }

    async function saveFeedback(id: number) {
        const token = localStorage.getItem('admin_token') || '';
        await fetch(`/api/admin/workshops/${workshopId}/uploads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ feedback: draftFeedback, rating: draftRating }),
        });
        setEditing(null);
        load();
    }

    async function removeUpload(id: number) {
        if (!confirm('Usunąć zdjęcie uczestnika?')) return;
        const token = localStorage.getItem('admin_token') || '';
        await fetch(`/api/admin/workshops/${workshopId}/uploads/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
        load();
    }

    const participants = Array.from(new Map(items.map(u => [u.participant.id, u.participant])).values());
    const filtered = filter === 'all' ? items : items.filter(u => u.participant.id === filter);

    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2"><ImageIcon size={18} /> Galeria zdjęć uczestników ({items.length})</h3>
                <select value={filter} onChange={e => setFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                    className="border border-zinc-300 rounded px-3 py-2 text-sm">
                    <option value="all">Wszyscy uczestnicy</option>
                    {participants.map(p => <option key={p.id} value={p.id}>{p.avatar} {p.display_name || p.login}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="text-center text-zinc-500 py-8">Ładowanie…</div>
            ) : filtered.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">
                    {items.length === 0 ? 'Uczestnicy jeszcze nie wgrali żadnych zdjęć.' : 'Brak zdjęć dla wybranego uczestnika.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(u => (
                        <div key={u.id} className="bg-zinc-50 border border-zinc-200 rounded-lg overflow-hidden">
                            <a href={u.file_url} target="_blank" rel="noreferrer" className="block aspect-square bg-zinc-200">
                                <img src={u.file_url} alt={u.caption || ''} className="w-full h-full object-cover" />
                            </a>
                            <div className="p-3 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-600">{u.participant.avatar} {u.participant.display_name || u.participant.login}</span>
                                    <span className="text-zinc-400">{new Date(u.created_at).toLocaleDateString('pl-PL')}</span>
                                </div>
                                {u.caption && <div className="text-sm text-zinc-700 italic">„{u.caption}”</div>}
                                {editing === u.id ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button key={n} onClick={() => setDraftRating(n)} type="button"
                                                    className={`text-lg ${(draftRating || 0) >= n ? 'text-amber-500' : 'text-zinc-300'}`}>★</button>
                                            ))}
                                            {draftRating !== null && <button onClick={() => setDraftRating(null)} className="text-xs text-zinc-500 ml-1">wyczyść</button>}
                                        </div>
                                        <textarea value={draftFeedback} onChange={e => setDraftFeedback(e.target.value)}
                                            placeholder="Konkretna wskazówka dla dzieciaka…" rows={3}
                                            className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm text-zinc-900" />
                                        <div className="flex gap-2">
                                            <button onClick={() => saveFeedback(u.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold">Zapisz</button>
                                            <button onClick={() => setEditing(null)} className="text-zinc-500 text-xs">Anuluj</button>
                                            <button onClick={() => removeUpload(u.id)} className="ml-auto text-rose-500 hover:text-rose-700 p-1"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {u.rating ? <div className="text-amber-500">{'\u2605'.repeat(u.rating)}<span className="text-zinc-300">{'\u2605'.repeat(5 - u.rating)}</span></div> : null}
                                        {u.feedback && <div className="text-xs text-zinc-700 bg-amber-50 border-l-2 border-amber-400 p-2 rounded">\ud83d\udcac {u.feedback}</div>}
                                        <button onClick={() => startEdit(u)} className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1">
                                            <Star size={12} /> {u.feedback || u.rating ? 'Edytuj ocen\u0119' : 'Dodaj ocen\u0119 i komentarz'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ParticipantsTab({ workshop, count, setCount, generating, generate, printCards, recentlyCreated, removeParticipant }: any) {
    return (
        <>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-4 shadow-sm">
                <h2 className="font-bold mb-3 text-zinc-900 flex items-center gap-2"><KeyRound size={16} /> Generator kont uczestników</h2>
                <div className="flex items-end gap-3 flex-wrap">
                    <div>
                        <label className="text-xs font-bold text-zinc-600">Liczba kont (1-50)</label>
                        <input type="number" min={1} max={50} value={count} onChange={e => setCount(parseInt(e.target.value, 10) || 1)} className="border border-zinc-300 rounded p-2 w-32 text-zinc-900" />
                    </div>
                    <button onClick={generate} disabled={generating} className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
                        <Plus size={16} /> {generating ? 'Generuję…' : 'Wygeneruj konta'}
                    </button>
                    <button onClick={printCards} disabled={!workshop.participants.length} className="ml-auto bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-30">
                        <Printer size={16} /> Drukuj karty ({workshop.participants.length})
                    </button>
                </div>
                <p className="text-xs text-zinc-500 mt-2">RODO: nie zbieramy maili dzieci. Login + PIN-y wydrukuj raz, rozdaj uczestnikom; PIN-y w bazie są hashowane (bcrypt).</p>
            </div>

            {recentlyCreated && recentlyCreated.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                    <h3 className="font-bold text-emerald-800 mb-2">✓ Wygenerowano {recentlyCreated.length} nowych kont:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm font-mono">
                        {recentlyCreated.map((p: Participant) => (
                            <div key={p.id} className="bg-white rounded p-2 border border-emerald-100">
                                <span className="text-2xl mr-2">{p.avatar}</span>
                                {p.login} / <strong>{p.pin_plain_temp}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                <h2 className="font-bold mb-3 text-zinc-900">Lista uczestników ({workshop.participants.length})</h2>
                {workshop.participants.length === 0 ? (
                    <div className="text-zinc-500 text-sm text-center py-8">Brak uczestników. Wygeneruj konta powyżej.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-zinc-500 border-b">
                                <tr><th className="text-left p-2">Avatar</th><th className="text-left p-2">Login</th><th className="text-left p-2">PIN</th><th className="text-left p-2">Pseudonim</th><th className="text-left p-2">Ostatnie logowanie</th><th></th></tr>
                            </thead>
                            <tbody>
                                {workshop.participants.map((p: Participant) => (
                                    <tr key={p.id} className="border-b last:border-0">
                                        <td className="p-2 text-2xl">{p.avatar}</td>
                                        <td className="p-2 font-mono text-zinc-900">{p.login}</td>
                                        <td className="p-2 font-mono text-zinc-700">{p.pin_plain_temp || '••••••'}</td>
                                        <td className="p-2 text-zinc-600">{p.display_name || <span className="text-zinc-400">brak</span>}</td>
                                        <td className="p-2 text-zinc-500 text-xs">{p.last_login ? new Date(p.last_login).toLocaleString('pl-PL') : '—'}</td>
                                        <td className="p-2 text-right">
                                            <button onClick={() => removeParticipant(p.id)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

function SendOfferModal({ workshopId, workshop, onClose }: { workshopId: number; workshop: Workshop; onClose: () => void }) {
    const [email, setEmail] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [participantName, setParticipantName] = useState('');
    const [price, setPrice] = useState<string>('');
    const [depositAmount, setDepositAmount] = useState<string>('');
    const [depositDueAt, setDepositDueAt] = useState<string>('');
    const [customMessage, setCustomMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function send() {
        if (!email) { setError('Podaj e-mail rodzica/uczestnika'); return; }
        setSending(true);
        setError(null);
        try {
            const token = localStorage.getItem('admin_token') || '';
            const r = await fetch(`/api/admin/workshops/${workshopId}/send-offer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    recipient_email: email,
                    recipient_name: recipientName || undefined,
                    participant_name: participantName || undefined,
                    price: price ? parseInt(price, 10) : undefined,
                    deposit_amount: depositAmount ? parseInt(depositAmount, 10) : undefined,
                    deposit_due_at: depositDueAt || undefined,
                    custom_message: customMessage || undefined,
                }),
            });
            if (r.ok) {
                setDone(true);
                setTimeout(onClose, 2000);
            } else {
                const j = await r.json().catch(() => ({}));
                setError(j.error || 'Błąd wysyłki');
            }
        } catch (e: any) {
            setError(e?.message || 'Błąd połączenia');
        } finally {
            setSending(false);
        }
    }

    function autoDeposit() {
        const p = parseInt(price, 10) || 0;
        if (p > 0) setDepositAmount(Math.round(p * 0.3).toString());
    }

    const scheduleCount = Array.isArray(workshop.schedule) ? workshop.schedule.length : 0;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
                <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white p-5 rounded-t-2xl flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Wyślij ofertę warsztatów</h2>
                        <p className="text-sm opacity-90 mt-0.5">{workshop.title}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {done ? (
                    <div className="p-8 text-center">
                        <div className="text-6xl mb-3">✓</div>
                        <p className="text-emerald-600 font-bold text-lg">Oferta wysłana!</p>
                        <p className="text-zinc-500 text-sm mt-1">Wiadomość trafiła na {email}</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-zinc-600 uppercase">E-mail odbiorcy *</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="rodzic@example.pl"
                                    className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-600 uppercase">Imię odbiorcy</label>
                                <input value={recipientName} onChange={e => setRecipientName(e.target.value)}
                                    placeholder="Anna"
                                    className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-600 uppercase">Imię uczestnika (dziecka)</label>
                            <input value={participantName} onChange={e => setParticipantName(e.target.value)}
                                placeholder="Kuba"
                                className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs font-bold text-zinc-600 uppercase">Cena (PLN)</label>
                                <input type="number" value={price} onChange={e => setPrice(e.target.value)} onBlur={autoDeposit}
                                    placeholder="450"
                                    className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-600 uppercase">Zaliczka (PLN)</label>
                                <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                                    placeholder="135"
                                    className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1" />
                                <p className="text-[10px] text-zinc-500 mt-0.5">Auto: 30% ceny</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-600 uppercase">Termin wpłaty</label>
                                <input type="date" value={depositDueAt} onChange={e => setDepositDueAt(e.target.value)}
                                    className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-600 uppercase">Dodatkowa wiadomość (opcjonalnie)</label>
                            <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)}
                                rows={3} placeholder="Cześć Aniu, w nawiązaniu do naszej rozmowy..."
                                className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1" />
                        </div>

                        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-600">
                            ✉️ E-mail będzie zawierał: <strong>tytuł, lokalizację, daty, opis, pełny program ({scheduleCount} pozycji), cenę, zaliczkę i dane bankowe</strong>.
                        </div>

                        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 text-sm">{error}</div>}

                        <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
                            <button onClick={onClose} disabled={sending}
                                className="px-4 py-2 text-zinc-600 hover:text-zinc-900 font-bold">
                                Anuluj
                            </button>
                            <button onClick={send} disabled={sending || !email}
                                className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
                                <Send size={16} /> {sending ? 'Wysyłam...' : 'Wyślij e-mail'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// === OFERTY ===

type OfferRow = {
    id: number;
    recipient_email: string;
    recipient_name: string | null;
    recipient_phone: string | null;
    participant_name: string | null;
    price: number | null;
    deposit_amount: number | null;
    deposit_due_at: string | null;
    deposit_paid_at: string | null;
    custom_message: string | null;
    status: string;
    source: string;
    notes: string | null;
    participant_id: number | null;
    sent_at: string;
};

const STATUS_BADGE: Record<string, string> = {
    sent: 'bg-amber-100 text-amber-800 border-amber-300',
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    confirmed: 'bg-rose-100 text-rose-800 border-rose-300',
    cancelled: 'bg-zinc-100 text-zinc-500 border-zinc-300',
};
const STATUS_LABEL: Record<string, string> = {
    sent: 'Wysłano',
    paid: 'Zaliczka opłacona',
    confirmed: 'Potwierdzono (uczestnik)',
    cancelled: 'Anulowano',
};

function OffersTab({ workshopId, onSendOffer, reloadParent }: { workshopId: number; onSendOffer: () => void; reloadParent: () => void }) {
    const [items, setItems] = useState<OfferRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token') || '';
            const r = await fetch(`/api/admin/workshops/${workshopId}/offers`, { headers: { Authorization: `Bearer ${token}` } });
            if (r.ok) { const d = await r.json(); setItems(d.offers || []); }
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [workshopId]);

    async function patch(id: number, data: any) {
        setBusy(id);
        try {
            const token = localStorage.getItem('admin_token') || '';
            await fetch(`/api/admin/workshops/${workshopId}/offers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            await load();
        } finally { setBusy(null); }
    }

    async function markPaid(id: number) {
        await patch(id, { deposit_paid_at: new Date().toISOString() });
    }

    async function convert(id: number) {
        if (!confirm('Utworzyć konto uczestnika i wysłać dane logowania mailem?')) return;
        setBusy(id);
        try {
            const token = localStorage.getItem('admin_token') || '';
            const r = await fetch(`/api/admin/workshops/${workshopId}/offers/${id}/convert`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (r.ok) {
                const d = await r.json();
                alert(`Konto utworzone:\nLogin: ${d.participant.login}\nPIN: ${d.participant.pin}\n\nDane wysłano e-mailem.`);
                await load();
                reloadParent();
            } else {
                const j = await r.json().catch(() => ({}));
                alert(j.error || 'Błąd konwersji');
            }
        } finally { setBusy(null); }
    }

    async function cancel(id: number) {
        if (!confirm('Anulować ofertę?')) return;
        await patch(id, { status: 'cancelled' });
    }

    async function remove(id: number) {
        if (!confirm('Usunąć ofertę całkowicie?')) return;
        setBusy(id);
        try {
            const token = localStorage.getItem('admin_token') || '';
            await fetch(`/api/admin/workshops/${workshopId}/offers/${id}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            await load();
        } finally { setBusy(null); }
    }

    async function remind(id: number, type: 'auto' | 'upcoming' | 'overdue' = 'auto') {
        const label = type === 'overdue' ? 'PILNE — termin zaliczki minął' : type === 'upcoming' ? 'standardowe przypomnienie' : 'auto-dobrane przypomnienie';
        if (!confirm(`Wysłać ${label} mailem?`)) return;
        setBusy(id);
        try {
            const token = localStorage.getItem('admin_token') || '';
            const qs = type === 'auto' ? '' : `?type=${type}`;
            const r = await fetch(`/api/admin/workshops/${workshopId}/offers/${id}/remind${qs}`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` },
            });
            const j = await r.json().catch(() => ({}));
            if (r.ok) alert(`Wysłano (${j.type}) do: ${j.sent_to}`);
            else alert(j.error || 'Błąd wysyłki przypomnienia');
            await load();
        } finally { setBusy(null); }
    }

    return (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                <div>
                    <h3 className="font-bold text-zinc-900">Oferty wysłane / zapisy publiczne</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Lead → Wysłano → Zaliczka opłacona → Konto uczestnika</p>
                </div>
                <button onClick={onSendOffer} className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm">
                    <Send size={14} /> Wyślij nową ofertę
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-zinc-400">Ładowanie...</div>
            ) : items.length === 0 ? (
                <div className="p-8 text-center text-zinc-400">
                    Brak ofert. Wyślij pierwszą lub udostępnij publiczny link <code className="text-rose-600">/warsztaty/[slug]</code>.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-zinc-50 text-zinc-600 text-xs uppercase">
                                <th className="text-left p-3">Status</th>
                                <th className="text-left p-3">Odbiorca / Uczestnik</th>
                                <th className="text-left p-3">Cena / Zaliczka</th>
                                <th className="text-left p-3">Data wysłania</th>
                                <th className="text-right p-3">Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(o => (
                                <tr key={o.id} className="border-t border-zinc-100 hover:bg-amber-50/30">
                                    <td className="p-3">
                                        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${STATUS_BADGE[o.status] || 'bg-zinc-100 text-zinc-700'}`}>
                                            {STATUS_LABEL[o.status] || o.status}
                                        </span>
                                        {o.source === 'public' && <span className="ml-1 text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-bold">PUBLIC</span>}
                                    </td>
                                    <td className="p-3">
                                        <div className="font-bold text-zinc-900">{o.recipient_name || o.recipient_email}</div>
                                        <div className="text-xs text-zinc-500">{o.recipient_email}{o.recipient_phone ? ` · ${o.recipient_phone}` : ''}</div>
                                        {o.participant_name && <div className="text-xs text-rose-600 mt-0.5">👤 {o.participant_name}</div>}
                                        {o.custom_message && <div className="text-xs text-zinc-400 italic mt-0.5 max-w-xs truncate" title={o.custom_message}>„{o.custom_message}"</div>}
                                    </td>
                                    <td className="p-3 text-zinc-700">
                                        {o.price ? <div>{o.price.toLocaleString('pl-PL')} PLN</div> : <span className="text-zinc-400">—</span>}
                                        {o.deposit_amount ? (
                                            <div className={`text-xs mt-0.5 ${o.deposit_paid_at ? 'text-emerald-600 font-bold' : 'text-amber-700'}`}>
                                                Zaliczka: {o.deposit_amount.toLocaleString('pl-PL')} PLN
                                                {o.deposit_paid_at && ' ✓'}
                                            </div>
                                        ) : null}
                                        {o.deposit_due_at && !o.deposit_paid_at && (
                                            <div className="text-[10px] text-zinc-500">do {new Date(o.deposit_due_at).toLocaleDateString('pl-PL')}</div>
                                        )}
                                    </td>
                                    <td className="p-3 text-zinc-500 text-xs">
                                        {new Date(o.sent_at).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-1.5 flex-wrap">
                                            {o.status !== 'confirmed' && o.status !== 'cancelled' && !o.deposit_paid_at && (
                                                <button disabled={busy === o.id} onClick={() => markPaid(o.id)}
                                                    className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded font-bold disabled:opacity-50">
                                                    ✓ Zaliczka opłacona
                                                </button>
                                            )}
                                            {o.status !== 'confirmed' && o.status !== 'cancelled' && o.deposit_paid_at && !o.participant_id && (
                                                <button disabled={busy === o.id} onClick={() => convert(o.id)}
                                                    className="text-[11px] bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded font-bold disabled:opacity-50">
                                                    Utwórz konto
                                                </button>
                                            )}
                                            {o.status !== 'confirmed' && o.status !== 'cancelled' && !o.deposit_paid_at && (
                                                <button disabled={busy === o.id} onClick={() => remind(o.id, 'auto')}
                                                    className="text-[11px] bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded font-bold flex items-center gap-1 disabled:opacity-50"
                                                    title={o.deposit_due_at && new Date(o.deposit_due_at) < new Date() ? 'Termin minął — wyślij PILNE przypomnienie' : 'Wyślij przypomnienie o zaliczce'}>
                                                    <Bell size={11} /> Przypomnij
                                                </button>
                                            )}
                                            {o.status !== 'cancelled' && (
                                                <button disabled={busy === o.id} onClick={() => cancel(o.id)}
                                                    className="text-[11px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2 py-1 rounded">
                                                    Anuluj
                                                </button>
                                            )}
                                            <button disabled={busy === o.id} onClick={() => remove(o.id)}
                                                className="text-rose-500 hover:text-rose-700 p-1">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
