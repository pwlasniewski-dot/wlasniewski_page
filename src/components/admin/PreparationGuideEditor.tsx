'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';
import { removePreparationGuideCmsImage, type PreparationGuideCmsData } from '@/lib/preparationGuideCms';

type EditorTab = 'wardrobe' | 'palettes' | 'checklists' | 'faqs' | 'poses';
type ImageTarget = { section: 'wardrobe' | 'palettes' | 'poses'; index: number } | null;

const inputClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none';
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400';

export default function PreparationGuideEditor() {
    const [data, setData] = useState<PreparationGuideCmsData | null>(null);
    const [tab, setTab] = useState<EditorTab>('wardrobe');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageTarget, setImageTarget] = useState<ImageTarget>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch('/api/pages/preparation-guide', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
                });
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.error || 'Nie udało się pobrać poradnika');
                setData(payload.data);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Nie udało się pobrać poradnika');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const save = async () => {
        if (!data) return;
        setSaving(true);
        try {
            const response = await fetch('/api/pages/preparation-guide', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
                },
                body: JSON.stringify(data),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Nie udało się zapisać zmian');
            setData(payload.data);
            toast.success('Poradnik został zapisany');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać zmian');
        } finally {
            setSaving(false);
        }
    };

    const selectImage = (url: string | string[]) => {
        if (!data || !imageTarget) return;
        const selected = Array.isArray(url) ? url[0] : url;
        const next = structuredClone(data);
        if (imageTarget.section === 'wardrobe') {
            next.wardrobeTips[imageTarget.index].image = selected;
        } else if (imageTarget.section === 'poses') {
            next.poseCards[imageTarget.index].image = selected;
        } else {
            const palette = next.wardrobePalettes[imageTarget.index];
            const current = Array.isArray(palette.example_images)
                ? palette.example_images[0] as { alt?: string; caption?: string } | undefined
                : undefined;
            palette.example_images = [{
                src: selected,
                alt: current?.alt || `${palette.name} — przykład stylizacji`,
                caption: current?.caption || palette.description || 'Przykład stylizacji w wybranej palecie.',
            }];
        }
        setData(next);
        setImageTarget(null);
    };

    const removeImage = (section: 'wardrobe' | 'palettes' | 'poses', index: number) => {
        setData((current) => current
            ? removePreparationGuideCmsImage(current, section, index)
            : current);
    };

    if (loading) return <div className="p-8 text-zinc-400">Ładowanie edytora…</div>;
    if (!data) return <div className="p-8 text-red-400">Nie udało się uruchomić edytora.</div>;

    const tabs: Array<{ id: EditorTab; label: string; count: number }> = [
        { id: 'wardrobe', label: 'Jak się ubrać', count: data.wardrobeTips.length },
        { id: 'palettes', label: 'Palety kolorów', count: data.wardrobePalettes.length },
        { id: 'checklists', label: 'Checklisty', count: data.wardrobeChecklists.length },
        { id: 'faqs', label: 'FAQ', count: data.wardrobeFaqs.length },
        { id: 'poses', label: 'Pozy', count: data.poseCards.length },
    ];

    return (
        <div className="mx-auto max-w-6xl pb-24">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/admin/pages" className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Wróć do stron">
                        <ArrowLeft />
                    </Link>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-500">Pages / Panel Klienta</p>
                        <h1 className="text-2xl font-semibold text-white">Przygotowanie do sesji</h1>
                        <p className="mt-1 text-sm text-zinc-400">Edytuj teksty i wybieraj obrazy z biblioteki Media.</p>
                    </div>
                </div>
                <button onClick={save} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gold-500 px-5 py-2 font-semibold text-black hover:bg-gold-400 disabled:opacity-50">
                    <Save size={18} /> {saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
                </button>
            </header>

            <nav className="mb-6 grid grid-cols-1 gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-2 sm:grid-cols-3 xl:grid-cols-5" aria-label="Sekcje poradnika">
                {tabs.map((item) => (
                    <button key={item.id} onClick={() => setTab(item.id)} className={`min-h-12 rounded-lg px-4 text-sm font-semibold ${tab === item.id ? 'bg-gold-500 text-black' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                        {item.label} <span className="ml-1 opacity-70">({item.count})</span>
                    </button>
                ))}
            </nav>

            <div className="space-y-4">
                {tab === 'wardrobe' && data.wardrobeTips.map((tip, index) => (
                    <details key={String(tip.id)} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4" open={index === 0}>
                        <summary className="cursor-pointer text-base font-semibold text-white">{index + 1}. {tip.title}</summary>
                        <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
                            <ImageField src={tip.image} alt={tip.imageAlt || tip.title} onPick={() => setImageTarget({ section: 'wardrobe', index })} onRemove={() => removeImage('wardrobe', index)} />
                            <div className="space-y-4">
                                <Field label="Tytuł" value={tip.title} onChange={(value) => setData((current) => update(current!, 'wardrobeTips', index, 'title', value))} />
                                <TextArea label="Opis" value={tip.content} onChange={(value) => setData((current) => update(current!, 'wardrobeTips', index, 'content', value))} />
                                <Field label="Opis obrazu dla dostępności" value={tip.imageAlt || ''} onChange={(value) => setData((current) => update(current!, 'wardrobeTips', index, 'imageAlt', value))} />
                            </div>
                        </div>
                    </details>
                ))}

                {tab === 'palettes' && data.wardrobePalettes.map((palette, index) => {
                    const image = Array.isArray(palette.example_images) ? palette.example_images[0] as { src?: string; alt?: string; caption?: string } | undefined : undefined;
                    return (
                        <details key={String(palette.id)} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4" open={index === 0}>
                            <summary className="cursor-pointer text-base font-semibold text-white">{index + 1}. {palette.name}</summary>
                            <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
                                <ImageField src={image?.src} alt={image?.alt || palette.name} onPick={() => setImageTarget({ section: 'palettes', index })} onRemove={() => removeImage('palettes', index)} />
                                <div className="space-y-4">
                                    <Field label="Nazwa palety" value={palette.name} onChange={(value) => setData((current) => update(current!, 'wardrobePalettes', index, 'name', value))} />
                                    <TextArea label="Opis" value={palette.description || ''} onChange={(value) => setData((current) => update(current!, 'wardrobePalettes', index, 'description', value))} />
                                    <Field label="Opis obrazu dla dostępności" value={image?.alt || ''} onChange={(value) => setData((current) => updatePaletteImage(current!, index, 'alt', value))} />
                                    <Field label="Podpis pod obrazem" value={image?.caption || ''} onChange={(value) => setData((current) => updatePaletteImage(current!, index, 'caption', value))} />
                                    <div>
                                        <span className={labelClass}>Kolory</span>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {(Array.isArray(palette.colors) ? palette.colors as Array<{ name: string; hex: string }> : []).map((color, colorIndex) => (
                                                <div key={colorIndex} className="grid grid-cols-[48px_1fr_105px] gap-2">
                                                    <input type="color" value={color.hex} onChange={(event) => setData((current) => updatePaletteColor(current!, index, colorIndex, 'hex', event.target.value))} className="h-10 w-12 rounded border border-zinc-700 bg-zinc-950" />
                                                    <input value={color.name} onChange={(event) => setData((current) => updatePaletteColor(current!, index, colorIndex, 'name', event.target.value))} className={inputClass} aria-label={`Nazwa koloru ${colorIndex + 1}`} />
                                                    <input value={color.hex} onChange={(event) => setData((current) => updatePaletteColor(current!, index, colorIndex, 'hex', event.target.value))} className={inputClass} aria-label={`Kod koloru ${colorIndex + 1}`} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </details>
                    );
                })}

                {tab === 'checklists' && data.wardrobeChecklists.map((checklist, index) => (
                    <details key={`${checklist.title}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4" open={index === 0}>
                        <summary className="cursor-pointer text-base font-semibold text-white">{index + 1}. {checklist.title}</summary>
                        <div className="mt-5 space-y-4">
                            <Field label="Tytuł checklisty" value={checklist.title} onChange={(value) => setData((current) => update(current!, 'wardrobeChecklists', index, 'title', value))} />
                            <TextArea label="Punkty — jeden w każdym wierszu" value={checklist.items.join('\n')} onChange={(value) => setData((current) => update(current!, 'wardrobeChecklists', index, 'items', value.split('\n').filter(Boolean)))} />
                        </div>
                    </details>
                ))}

                {tab === 'faqs' && data.wardrobeFaqs.map((faq, index) => (
                    <details key={String(faq.id)} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4" open={index === 0}>
                        <summary className="cursor-pointer text-base font-semibold text-white">{index + 1}. {faq.question}</summary>
                        <div className="mt-5 space-y-4">
                            <Field label="Pytanie" value={faq.question} onChange={(value) => setData((current) => update(current!, 'wardrobeFaqs', index, 'question', value))} />
                            <TextArea label="Odpowiedź" value={faq.answer} onChange={(value) => setData((current) => update(current!, 'wardrobeFaqs', index, 'answer', value))} />
                        </div>
                    </details>
                ))}

                {tab === 'poses' && data.poseCards.map((pose, index) => (
                    <details key={pose.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4" open={index === 0}>
                        <summary className="cursor-pointer text-base font-semibold text-white">{pose.id} — {pose.title}</summary>
                        <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
                            <ImageField src={pose.image} alt={pose.imageAlt} onPick={() => setImageTarget({ section: 'poses', index })} onRemove={() => removeImage('poses', index)} />
                            <div className="space-y-4">
                                <Field label="Tytuł" value={pose.title} onChange={(value) => setData((current) => update(current!, 'poseCards', index, 'title', value))} />
                                <TextArea label="Krótki opis" value={pose.purpose} onChange={(value) => setData((current) => update(current!, 'poseCards', index, 'purpose', value))} />
                                <TextArea label="Jak to zrobić — jeden krok w każdym wierszu" value={pose.steps.join('\n')} onChange={(value) => setData((current) => update(current!, 'poseCards', index, 'steps', value.split('\n').filter(Boolean)))} />
                                <TextArea label="Dodatkowa wskazówka" value={pose.body} onChange={(value) => setData((current) => update(current!, 'poseCards', index, 'body', value))} />
                                <TextArea label="Inny pomysł" value={pose.variant} onChange={(value) => setData((current) => update(current!, 'poseCards', index, 'variant', value))} />
                                <TextArea label="Możesz też" value={pose.mobility} onChange={(value) => setData((current) => update(current!, 'poseCards', index, 'mobility', value))} />
                                <Field label="Opis obrazu dla dostępności" value={pose.imageAlt} onChange={(value) => setData((current) => update(current!, 'poseCards', index, 'imageAlt', value))} />
                            </div>
                        </div>
                    </details>
                ))}
            </div>

            <div className="fixed bottom-5 right-5 z-40">
                <button onClick={save} disabled={saving} className="flex min-h-12 items-center gap-2 rounded-full bg-gold-500 px-5 font-bold text-black shadow-xl hover:bg-gold-400 disabled:opacity-50">
                    <Save size={18} /> Zapisz
                </button>
            </div>

            <MediaPicker isOpen={Boolean(imageTarget)} onClose={() => setImageTarget(null)} onSelect={selectImage} />
        </div>
    );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return <label><span className={labelClass}>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return <label><span className={labelClass}>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className={inputClass} /></label>;
}

function ImageField({ src, alt, onPick, onRemove }: { src?: string; alt: string; onPick: () => void; onRemove: () => void }) {
    return (
        <div>
            <span className={labelClass}>Obraz</span>
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
                {src ? <Image src={src} alt={alt} fill sizes="220px" className="object-contain" unoptimized /> : <div className="flex h-full items-center justify-center text-zinc-600"><ImageIcon size={42} /></div>}
            </div>
            <button onClick={onPick} type="button" className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm font-semibold text-white hover:border-gold-500">
                Wybierz z Media
            </button>
            {src && (
                <button onClick={onRemove} type="button" className="mt-2 min-h-11 w-full rounded-lg border border-red-900/60 bg-red-950/30 px-3 text-sm font-semibold text-red-300 hover:bg-red-950/60">
                    Usuń obraz
                </button>
            )}
        </div>
    );
}

function update<T extends 'wardrobeTips' | 'wardrobePalettes' | 'wardrobeChecklists' | 'wardrobeFaqs' | 'poseCards'>(data: PreparationGuideCmsData, section: T, index: number, field: string, value: unknown): PreparationGuideCmsData {
    const next = structuredClone(data);
    (next[section][index] as unknown as Record<string, unknown>)[field] = value;
    return next;
}

function updatePaletteImage(data: PreparationGuideCmsData, index: number, field: 'alt' | 'caption', value: string): PreparationGuideCmsData {
    const next = structuredClone(data);
    const palette = next.wardrobePalettes[index];
    const current = Array.isArray(palette.example_images) ? palette.example_images[0] as Record<string, unknown> | undefined : undefined;
    palette.example_images = [{ src: String(current?.src || ''), alt: String(current?.alt || ''), caption: String(current?.caption || ''), [field]: value }];
    return next;
}

function updatePaletteColor(data: PreparationGuideCmsData, paletteIndex: number, colorIndex: number, field: 'name' | 'hex', value: string): PreparationGuideCmsData {
    const next = structuredClone(data);
    const colors = next.wardrobePalettes[paletteIndex].colors as Array<Record<string, string>>;
    colors[colorIndex][field] = value;
    return next;
}
