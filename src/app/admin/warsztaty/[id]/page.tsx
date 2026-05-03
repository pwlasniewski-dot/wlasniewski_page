'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Printer, Trash2, KeyRound, Edit2, Save, X, Send, Calendar as CalendarIcon } from 'lucide-react';

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
    participants: Participant[];
}

export default function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [w, setW] = useState<Workshop | null>(null);
    const [count, setCount] = useState(15);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [recentlyCreated, setRecentlyCreated] = useState<Participant[] | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'schedule' | 'participants'>('info');
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ title: '', location: '', description: '', status: '', starts_at: '', ends_at: '' });
    const [showOfferModal, setShowOfferModal] = useState(false);

    function token() { return localStorage.getItem('admin_token') || ''; }

    async function load() {
        setLoading(true);
        const r = await fetch(`/api/admin/workshops/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
        const j = await r.json();
        setW(j.workshop);
        if (j.workshop) {
            setForm({
                title: j.workshop.title || '',
                location: j.workshop.location || '',
                description: j.workshop.description || '',
                status: j.workshop.status || 'draft',
                starts_at: j.workshop.starts_at ? j.workshop.starts_at.slice(0, 10) : '',
                ends_at: j.workshop.ends_at ? j.workshop.ends_at.slice(0, 10) : '',
            });
        }
        setLoading(false);
    }
    useEffect(() => { load(); }, [id]);

    async function saveEdit() {
        await fetch(`/api/admin/workshops/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
            body: JSON.stringify(form),
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
        const cards = w.participants.map(p => `
            <div class="card">
                <div class="avatar">${p.avatar || '🦊'}</div>
                <div class="title">${w.title}</div>
                <div class="loc">${w.location || ''}</div>
                <div class="creds">
                    <div><span>Login:</span><strong>${p.login}</strong></div>
                    <div><span>PIN:</span><strong>${p.pin_plain_temp || '••••••'}</strong></div>
                </div>
                <div class="url">${typeof window !== 'undefined' ? window.location.origin : ''}/warsztaty/${w.slug}/login</div>
            </div>`).join('');
        win.document.write(`<!doctype html><html><head><title>Karty uczestników</title><style>
            @page { size: A4; margin: 8mm; }
            body { font-family: -apple-system, Segoe UI, sans-serif; margin: 0; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; }
            .card { border: 2px dashed #c4b5a3; border-radius: 12px; padding: 10mm 6mm; text-align: center; page-break-inside: avoid; }
            .avatar { font-size: 36pt; line-height: 1; }
            .title { font-weight: bold; margin-top: 4mm; font-size: 11pt; color: #1f2937; }
            .loc { color: #6b7280; font-size: 9pt; margin-top: 1mm; }
            .creds { margin-top: 5mm; font-size: 13pt; }
            .creds div { margin: 1mm 0; }
            .creds span { color:#9ca3af; font-size: 10pt; margin-right: 3mm; }
            .creds strong { color:#0f172a; letter-spacing: 1px; }
            .url { margin-top: 4mm; color:#9ca3af; font-size: 7pt; word-break:break-all; }
        </style></head><body><div class="grid">${cards}</div>
        <script>window.onload=()=>window.print();</script></body></html>`);
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
                <div className="flex gap-2 mb-6 border-b border-zinc-200">
                    {(['info', 'schedule', 'participants'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 font-bold text-sm transition ${activeTab === tab ? 'border-b-2 border-rose-500 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                            {tab === 'info' && '📋 Informacje'}
                            {tab === 'schedule' && '📅 Program'}
                            {tab === 'participants' && `👥 Uczestnicy (${w.participants.length})`}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'info' && <InfoTab workshop={w} editing={editing} form={form} setForm={setForm} />}
                {activeTab === 'schedule' && <ScheduleTab workshop={w} reload={load} />}
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
                    <label className="text-xs font-bold text-zinc-600 uppercase">Data rozpoczęcia</label>
                    {!editing ? (
                        <div className="text-zinc-900 mt-1">{workshop.starts_at ? new Date(workshop.starts_at).toLocaleDateString('pl-PL') : '—'}</div>
                    ) : (
                        <input type="date" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })}
                            className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1" />
                    )}
                </div>
                <div>
                    <label className="text-xs font-bold text-zinc-600 uppercase">Data zakończenia</label>
                    {!editing ? (
                        <div className="text-zinc-900 mt-1">{workshop.ends_at ? new Date(workshop.ends_at).toLocaleDateString('pl-PL') : '—'}</div>
                    ) : (
                        <input type="date" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })}
                            className="w-full border border-zinc-300 rounded px-3 py-2 text-zinc-900 mt-1" />
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
        </div>
    );
}

function ScheduleTab({ workshop, reload }: { workshop: Workshop; reload: () => void }) {
    const [items, setItems] = useState<any[]>(workshop.schedule || []);
    const [adding, setAdding] = useState(false);
    const [newItem, setNewItem] = useState({ date: '', start: '', end: '', topic: '', plan: '' });

    useEffect(() => { setItems(workshop.schedule || []); }, [workshop.schedule]);

    async function save() {
        const token = localStorage.getItem('admin_token') || '';
        await fetch(`/api/admin/workshops/${workshop.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ schedule: items }),
        });
        reload();
    }

    function add() {
        if (!newItem.topic) return;
        setItems([...items, { ...newItem }]);
        setNewItem({ date: '', start: '', end: '', topic: '', plan: '' });
        setAdding(false);
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
                        className="border border-zinc-300 rounded px-2 py-1.5 text-zinc-900 text-sm" />
                    <input type="time" value={newItem.start} onChange={e => setNewItem({ ...newItem, start: e.target.value })}
                        placeholder="Start" className="border border-zinc-300 rounded px-2 py-1.5 text-zinc-900 text-sm" />
                    <input type="time" value={newItem.end} onChange={e => setNewItem({ ...newItem, end: e.target.value })}
                        placeholder="Koniec" className="border border-zinc-300 rounded px-2 py-1.5 text-zinc-900 text-sm" />
                    <input value={newItem.topic} onChange={e => setNewItem({ ...newItem, topic: e.target.value })}
                        placeholder="Temat (np. Ekspozycja)" className="border border-zinc-300 rounded px-2 py-1.5 text-zinc-900 text-sm md:col-span-2" />
                    <textarea value={newItem.plan} onChange={e => setNewItem({ ...newItem, plan: e.target.value })}
                        placeholder="Plan szczegółowy (opcjonalnie)" rows={2}
                        className="border border-zinc-300 rounded px-2 py-1.5 text-zinc-900 text-sm md:col-span-4" />
                    <div className="flex gap-2">
                        <button onClick={add} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-sm font-bold">Dodaj</button>
                        <button onClick={() => setAdding(false)} className="text-zinc-600 px-2">Anuluj</button>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <div className="text-zinc-500 text-center py-8">Brak harmonogramu. Dodaj pierwsze zajęcia powyżej.</div>
            ) : (
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div key={idx} className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-xs text-zinc-600 font-mono">{item.date || '—'}</span>
                                    <span className="text-xs text-zinc-500 font-mono">{item.start} – {item.end}</span>
                                </div>
                                <div className="font-bold text-zinc-900">{item.topic}</div>
                                {item.plan && <div className="text-sm text-zinc-600 mt-1">{item.plan}</div>}
                            </div>
                            <button onClick={() => setItems(items.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-700">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {items.length > 0 && (
                <button onClick={save} className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2">
                    <Save size={16} /> Zapisz harmonogram
                </button>
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
