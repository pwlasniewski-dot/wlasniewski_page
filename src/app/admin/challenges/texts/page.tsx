'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Save, ArrowLeft, RotateCcw, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { TEXT_FIELDS, TEXT_SECTIONS, TEXT_DEFAULTS } from '@/lib/photo-challenge/texts';

type TextsMap = Record<string, string>;

export default function FotoWyzwanieTextsPage() {
    const [texts, setTexts] = useState<TextsMap>({});
    const [initial, setInitial] = useState<TextsMap>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState(TEXT_SECTIONS[0].id);

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                const res = await fetch('/api/admin/challenges/texts', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) {
                    setTexts(data.texts);
                    setInitial(data.texts);
                } else {
                    toast.error(data.error || 'Błąd ładowania');
                }
            } catch (e) {
                toast.error('Nie udało się pobrać tekstów');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const dirtyKeys = Object.keys(texts).filter(k => texts[k] !== initial[k]);
    const isDirty = dirtyKeys.length > 0;

    const handleChange = (key: string, value: string) => {
        setTexts(prev => ({ ...prev, [key]: value }));
    };

    const handleResetField = (key: string) => {
        setTexts(prev => ({ ...prev, [key]: TEXT_DEFAULTS[key] || '' }));
    };

    const handleSave = async () => {
        if (!isDirty) {
            toast('Nic do zapisania', { icon: 'ℹ️' });
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const payload: TextsMap = {};
            for (const k of dirtyKeys) payload[k] = texts[k];

            const res = await fetch('/api/admin/challenges/texts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Zapisano ${data.updated} pól. Strona odświeży się w ciągu kilku minut.`);
                setInitial({ ...texts });
            } else {
                toast.error(data.error || 'Błąd zapisu');
            }
        } catch (e) {
            toast.error('Błąd sieci');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Ładowanie tekstów…
            </div>
        );
    }

    const fieldsForSection = TEXT_FIELDS.filter(f => f.section === activeSection);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <Link href="/admin/challenges" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-amber-400 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Foto Wyzwania
                    </Link>
                    <h1 className="text-3xl font-display font-bold text-white">Edycja tekstów strony</h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        Zmieniaj nagłówki, opisy korzyści, bio autora i CTA. Zmiany pojawią się na <Link href="/foto-wyzwanie" target="_blank" className="text-amber-400 hover:underline">/foto-wyzwanie</Link> w ciągu ~10 min (cache ISR).
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/foto-wyzwanie" target="_blank"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm">
                        <Eye className="w-4 h-4" /> Podgląd
                    </Link>
                    <button onClick={handleSave} disabled={!isDirty || saving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Zapisz {isDirty && `(${dirtyKeys.length})`}
                    </button>
                </div>
            </div>

            {/* Section tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-800 pb-3">
                {TEXT_SECTIONS.map(s => {
                    const dirty = TEXT_FIELDS.some(f => f.section === s.id && texts[f.key] !== initial[f.key]);
                    const active = activeSection === s.id;
                    return (
                        <button key={s.id} onClick={() => setActiveSection(s.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition relative ${active ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                            <span className="mr-1">{s.icon}</span>{s.title}
                            {dirty && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />}
                        </button>
                    );
                })}
            </div>

            {/* Fields */}
            <div className="space-y-5">
                {fieldsForSection.map(field => {
                    const value = texts[field.key] ?? '';
                    const isDefault = value === TEXT_DEFAULTS[field.key];
                    const wasChanged = value !== initial[field.key];
                    return (
                        <div key={field.key}
                            className={`rounded-xl border p-4 ${wasChanged ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <label className="text-sm font-semibold text-white">
                                    {field.label}
                                    {wasChanged && <span className="ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">zmienione</span>}
                                </label>
                                {!isDefault && (
                                    <button onClick={() => handleResetField(field.key)} title="Przywróć domyślny"
                                        className="text-xs text-zinc-500 hover:text-amber-400 inline-flex items-center gap-1">
                                        <RotateCcw className="w-3 h-3" /> reset
                                    </button>
                                )}
                            </div>
                            {field.hint && <p className="text-xs text-zinc-500 mb-2">{field.hint}</p>}
                            {field.kind === 'short' ? (
                                <input type="text" value={value} onChange={e => handleChange(field.key, e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white focus:border-amber-500 focus:outline-none" />
                            ) : (
                                <textarea value={value} onChange={e => handleChange(field.key, e.target.value)} rows={3}
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white focus:border-amber-500 focus:outline-none resize-y font-mono text-sm" />
                            )}
                            <p className="text-[10px] text-zinc-600 mt-1 font-mono">key: {field.key}</p>
                        </div>
                    );
                })}
            </div>

            {/* Sticky save bar */}
            {isDirty && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900 border border-amber-500/40 rounded-full px-5 py-3 shadow-2xl shadow-amber-500/20 flex items-center gap-3 z-50">
                    <span className="text-sm text-amber-300 font-semibold">{dirtyKeys.length} niezapisane zmiany</span>
                    <button onClick={handleSave} disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Zapisz
                    </button>
                </div>
            )}
        </div>
    );
}
