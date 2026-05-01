'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

type Form = {
    display_name: string;
    birth_year: number;
    gender: 'male' | 'female' | 'other';
    city: string;
    radius_km: number;
    bio: string;
    interests: string[];
    experience: '' | 'never_modeled' | 'few_times' | 'experienced';
    comfort_level: '' | 'shy' | 'neutral' | 'open';
};

const EXPERIENCE_OPTIONS = [
    { v: '', label: '— nie wybrano —' },
    { v: 'never_modeled', label: 'Nigdy nie pozowałam/em' },
    { v: 'few_times', label: 'Kilka razy' },
    { v: 'experienced', label: 'Doświadczona/y' },
];
const COMFORT_OPTIONS = [
    { v: '', label: '— nie wybrano —' },
    { v: 'shy', label: 'Nieśmiała/y' },
    { v: 'neutral', label: 'Neutralnie' },
    { v: 'open', label: 'Otwarta/y' },
];

function getToken() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('user_token') || '';
}

export default function EditProfileForm() {
    const [form, setForm] = useState<Form>({
        display_name: '',
        birth_year: new Date().getFullYear() - 25,
        gender: 'female',
        city: '',
        radius_km: 30,
        bio: '',
        interests: [],
        experience: '',
        comfort_level: '',
    });
    const [interestInput, setInterestInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const [status, setStatus] = useState<string>('');

    useEffect(() => {
        const token = getToken();
        if (!token) {
            window.location.href = '/logowanie?next=/foto-match/profil/edytuj';
            return;
        }
        fetch('/api/foto-match/profile/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(async r => {
                const d = await r.json();
                if (!r.ok) {
                    setMsg({ type: 'err', text: d.error || 'Błąd ładowania' });
                    return;
                }
                if (!d.profile) {
                    window.location.href = '/foto-match/onboarding';
                    return;
                }
                const p = d.profile;
                setStatus(p.status);
                setForm({
                    display_name: p.display_name || '',
                    birth_year: p.birth_year || new Date().getFullYear() - 25,
                    gender: p.gender || 'female',
                    city: p.city || '',
                    radius_km: p.radius_km || 30,
                    bio: p.bio || '',
                    interests: Array.isArray(p.interests) ? p.interests : [],
                    experience: p.experience || '',
                    comfort_level: p.comfort_level || '',
                });
            })
            .catch(e => setMsg({ type: 'err', text: String(e?.message || e) }))
            .finally(() => setLoading(false));
    }, []);

    function addInterest() {
        const v = interestInput.trim();
        if (!v) return;
        if (form.interests.includes(v)) return;
        if (form.interests.length >= 20) return;
        setForm(f => ({ ...f, interests: [...f.interests, v] }));
        setInterestInput('');
    }
    function removeInterest(v: string) {
        setForm(f => ({ ...f, interests: f.interests.filter(i => i !== v) }));
    }

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            const payload: any = {
                display_name: form.display_name,
                birth_year: Number(form.birth_year),
                gender: form.gender,
                city: form.city,
                radius_km: Number(form.radius_km),
                bio: form.bio || null,
                interests: form.interests,
                experience: form.experience || null,
                comfort_level: form.comfort_level || null,
            };
            const r = await fetch('/api/foto-match/profile', {
                method: 'POST',
                headers: { 'content-type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify(payload),
            });
            const d = await r.json();
            if (!r.ok) {
                const issues = d.issues?.fieldErrors;
                const firstIssue = issues ? Object.values(issues).flat()[0] : null;
                setMsg({ type: 'err', text: String(firstIssue || d.error || 'Błąd zapisu') });
                return;
            }
            setStatus(d.profile.status);
            setMsg({
                type: 'ok',
                text: d.resubmitted ? 'Profil ponownie wysłany do akceptacji.' : 'Zmiany zapisane.',
            });
        } catch (e: any) {
            setMsg({ type: 'err', text: e?.message || String(e) });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white pb-20">
            <div className="max-w-3xl mx-auto px-4 pt-8">
                <Link href="/foto-match/profil" className="text-zinc-400 hover:text-white inline-flex items-center gap-1 text-sm mb-4">
                    <ArrowLeft className="w-4 h-4" /> Mój profil
                </Link>

                <h1 className="text-3xl font-bold mb-2">Edycja profilu Foto-Match</h1>
                {status && (
                    <p className="text-sm text-zinc-400 mb-6">
                        Status: <span className={`font-bold ${status === 'ACTIVE' ? 'text-emerald-400' : status === 'PENDING' ? 'text-amber-400' : 'text-rose-400'}`}>{status}</span>
                    </p>
                )}

                {msg && (
                    <div className={`rounded-lg p-3 text-sm mb-4 ${msg.type === 'ok' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'}`}>
                        {msg.text}
                    </div>
                )}

                <form onSubmit={save} className="space-y-6">
                    <Section title="Podstawowe">
                        <Field label="Imię / pseudonim (2-60 znaków)">
                            <input required maxLength={60} value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2" />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Rok urodzenia">
                                <input required type="number" min={1920} max={new Date().getFullYear() - 18} value={form.birth_year} onChange={e => setForm(f => ({ ...f, birth_year: Number(e.target.value) }))} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2" />
                            </Field>
                            <Field label="Płeć">
                                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as Form['gender'] }))} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2">
                                    <option value="female">Kobieta</option>
                                    <option value="male">Mężczyzna</option>
                                    <option value="other">Inna</option>
                                </select>
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Miasto">
                                <input required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2" />
                            </Field>
                            <Field label="Promień szukania (km)">
                                <input type="number" min={5} max={200} value={form.radius_km} onChange={e => setForm(f => ({ ...f, radius_km: Number(e.target.value) }))} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2" />
                            </Field>
                        </div>
                    </Section>

                    <Section title="O mnie">
                        <Field label="Bio (max 1500 znaków)">
                            <textarea maxLength={1500} rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2" />
                            <p className="text-xs text-zinc-500 mt-1">{form.bio.length}/1500</p>
                        </Field>
                    </Section>

                    <Section title="Zainteresowania (max 20)">
                        <div className="flex gap-2 mb-2">
                            <input
                                value={interestInput}
                                onChange={e => setInterestInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }}
                                placeholder="np. portret, fashion, plener"
                                className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2"
                            />
                            <button type="button" onClick={addInterest} className="bg-amber-500 text-zinc-900 font-bold px-4 rounded-lg">Dodaj</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {form.interests.map(i => (
                                <button type="button" key={i} onClick={() => removeInterest(i)} className="bg-zinc-800 hover:bg-rose-500/30 text-zinc-200 text-xs px-3 py-1.5 rounded-full">
                                    {i} ✕
                                </button>
                            ))}
                            {form.interests.length === 0 && <p className="text-xs text-zinc-500">Brak — dodaj choć jedno tagiem.</p>}
                        </div>
                    </Section>

                    <Section title="Doświadczenie i komfort">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Doświadczenie">
                                <select value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value as Form['experience'] }))} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2">
                                    {EXPERIENCE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                                </select>
                            </Field>
                            <Field label="Komfort">
                                <select value={form.comfort_level} onChange={e => setForm(f => ({ ...f, comfort_level: e.target.value as Form['comfort_level'] }))} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2">
                                    {COMFORT_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                                </select>
                            </Field>
                        </div>
                    </Section>

                    <div className="flex justify-end">
                        <button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Zapisz zmiany
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {children}
        </div>
    );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs text-zinc-400 mb-1">{label}</label>
            {children}
        </div>
    );
}
