'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Image as ImageIcon, Save, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';
import type { PublicGuideCmsData, PublicGuideImage } from '@/lib/publicGuideCms';

type Settings = {
    title: string; metaTitle: string; metaDescription: string; metaKeywords: string;
    isPublished: boolean; isInMenu: boolean; menuTitle: string; menuOrder: number;
};
type Target = { group: 'hero' | 'wardrobe' | 'people' | 'environments' | 'posing' | 'poseGallery'; index?: number } | null;
type Tab = 'main' | 'environment' | 'posing' | 'gallery' | 'seo';

const inputClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none';
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400';

export default function PublicGuideEditor() {
    const [data, setData] = useState<PublicGuideCmsData | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [tab, setTab] = useState<Tab>('main');
    const [target, setTarget] = useState<Target>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [recovered, setRecovered] = useState(false);

    useEffect(() => {
        fetch('/api/pages/public-guide', { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` } })
            .then(async response => {
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.error || 'Nie udało się pobrać poradnika');
                setData(payload.data); setSettings(payload.settings); setRecovered(Boolean(payload.legacyDraftIgnored));
            })
            .catch(error => toast.error(error.message))
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        if (!data || !settings) return;
        setSaving(true);
        try {
            const response = await fetch('/api/pages/public-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
                body: JSON.stringify({ data, settings }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Nie udało się zapisać poradnika');
            setRecovered(false);
            toast.success(settings.isPublished ? 'Poradnik zapisany i opublikowany' : 'Poradnik zapisany jako szkic');
        } catch (error) { toast.error(error instanceof Error ? error.message : 'Błąd zapisu'); }
        finally { setSaving(false); }
    };

    const imageFor = (current: PublicGuideCmsData, selected: NonNullable<Target>): PublicGuideImage => {
        if (selected.group === 'hero' || selected.group === 'wardrobe' || selected.group === 'people') return current[selected.group];
        return current[selected.group][selected.index || 0].image;
    };

    const updateImage = (selected: NonNullable<Target>, patch: Partial<PublicGuideImage>) => setData(current => {
        if (!current) return current;
        const next = structuredClone(current);
        const image = imageFor(next, selected);
        Object.assign(image, patch);
        return next;
    });

    const selectImage = (url: string | string[]) => {
        if (!target) return;
        updateImage(target, { src: Array.isArray(url) ? url[0] : url });
        setTarget(null);
    };

    const updateCard = (group: 'environments' | 'posing' | 'poseGallery', index: number, field: 'title' | 'description', value: string) => setData(current => {
        if (!current) return current;
        const next = structuredClone(current); next[group][index][field] = value; return next;
    });

    if (loading) return <div className="p-8 text-zinc-400">Ładowanie publicznego poradnika…</div>;
    if (!data || !settings) return <div className="p-8 text-red-400">Nie udało się uruchomić edytora.</div>;

    const tabs: Array<{ id: Tab; label: string }> = [
        { id: 'main', label: 'Główne obrazy' }, { id: 'environment', label: 'Miasto i otoczenie' },
        { id: 'posing', label: 'Jak pozować' }, { id: 'gallery', label: '10 kart z opisami' }, { id: 'seo', label: 'Publikacja i SEO' },
    ];
    const simple: Array<{ key: 'hero' | 'wardrobe' | 'people'; title: string }> = [
        { key: 'hero', title: 'Obraz otwierający stronę' }, { key: 'wardrobe', title: 'Przykład ubioru' }, { key: 'people', title: 'Przykład rodzinny' },
    ];

    return <div className="mx-auto max-w-6xl pb-24">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <Link href="/admin/pages" className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"><ArrowLeft /></Link>
                <div><p className="text-xs font-bold uppercase tracking-[.2em] text-gold-500">Pages / Strona publiczna</p><h1 className="text-2xl font-semibold text-white">Jak się ubrać i pozować</h1><p className="mt-1 text-sm text-zinc-400">Jedno miejsce do obrazów, opisów, publikacji, menu i SEO.</p></div>
            </div>
            <div className="flex gap-2"><Link href="/jak-sie-ubrac" target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-white"><ExternalLink size={17}/> Podgląd</Link><button onClick={save} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold-500 px-5 font-semibold text-black disabled:opacity-50"><Save size={18}/>{saving ? 'Zapisywanie…' : 'Zapisz'}</button></div>
        </header>
        {recovered && <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100"><strong>Odnaleziono zbędny, ręcznie utworzony szkic.</strong> Jego niekompatybilna treść nie jest publikowana. Zapisanie tego formularza świadomie zastąpi szkic prawidłowym szablonem poradnika — bez tworzenia drugiej strony.</div>}
        <nav className="mb-6 grid gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-2 sm:grid-cols-2 xl:grid-cols-5">{tabs.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`min-h-12 rounded-lg px-3 text-sm font-semibold ${tab === item.id ? 'bg-gold-500 text-black' : 'text-zinc-300 hover:bg-zinc-800'}`}>{item.label}</button>)}</nav>

        <div className="space-y-4">
            {tab === 'main' && simple.map(item => <ImageEditor key={item.key} title={item.title} image={data[item.key]} onPick={() => setTarget({ group: item.key })} onChange={patch => updateImage({ group: item.key }, patch)} />)}
            {tab === 'environment' && data.environments.map((card, index) => <CardEditor key={index} number={index + 1} card={card} onPick={() => setTarget({ group: 'environments', index })} onImage={patch => updateImage({ group: 'environments', index }, patch)} onCard={(field, value) => updateCard('environments', index, field, value)} />)}
            {tab === 'posing' && data.posing.map((card, index) => <CardEditor key={index} number={index + 1} card={card} onPick={() => setTarget({ group: 'posing', index })} onImage={patch => updateImage({ group: 'posing', index }, patch)} onCard={(field, value) => updateCard('posing', index, field, value)} />)}
            {tab === 'gallery' && data.poseGallery.map((card, index) => <CardEditor key={index} number={index + 1} card={card} onPick={() => setTarget({ group: 'poseGallery', index })} onImage={patch => updateImage({ group: 'poseGallery', index }, patch)} onCard={(field, value) => updateCard('poseGallery', index, field, value)} />)}
            {tab === 'seo' && <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="grid gap-4 sm:grid-cols-2"><Toggle label="Opublikowana na zewnątrz" value={settings.isPublished} onChange={value => setSettings({ ...settings, isPublished: value })}/><Toggle label="Widoczna w menu" value={settings.isInMenu} onChange={value => setSettings({ ...settings, isInMenu: value })}/></div>
                <Field label="Tytuł strony (H1)" value={settings.title} onChange={value => setSettings({ ...settings, title: value })}/>
                <Field label="Nazwa w menu" value={settings.menuTitle} onChange={value => setSettings({ ...settings, menuTitle: value })}/>
                <Field label={`Tytuł SEO — ${settings.metaTitle.length}/70`} value={settings.metaTitle} onChange={value => setSettings({ ...settings, metaTitle: value })}/>
                <Area label={`Opis SEO — ${settings.metaDescription.length}/180`} value={settings.metaDescription} onChange={value => setSettings({ ...settings, metaDescription: value })}/>
                <Field label="Frazy SEO, oddzielone przecinkami" value={settings.metaKeywords} onChange={value => setSettings({ ...settings, metaKeywords: value })}/>
                <label><span className={labelClass}>Kolejność w menu</span><input type="number" min={0} value={settings.menuOrder} onChange={event => setSettings({ ...settings, menuOrder: Number(event.target.value) })} className={inputClass}/></label>
                <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-5"><div className="flex items-center gap-2 text-xs text-zinc-400"><Search size={14}/> Podgląd wyniku Google</div><p className="mt-3 text-xl text-blue-400">{settings.metaTitle}</p><p className="text-sm text-green-500">https://wlasniewski.pl/jak-sie-ubrac</p><p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-300">{settings.metaDescription}</p></div>
            </div>}
        </div>
        <div className="fixed bottom-5 right-5 z-40"><button onClick={save} disabled={saving} className="flex min-h-12 items-center gap-2 rounded-full bg-gold-500 px-5 font-bold text-black shadow-xl disabled:opacity-50"><Save size={18}/> Zapisz</button></div>
        <MediaPicker isOpen={Boolean(target)} onClose={() => setTarget(null)} onSelect={selectImage}/>
    </div>;
}

function ImageEditor({ title, image, onPick, onChange }: { title: string; image: PublicGuideImage; onPick: () => void; onChange: (patch: Partial<PublicGuideImage>) => void }) {
    return <div className="grid gap-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5 md:grid-cols-[220px_1fr]"><Preview image={image} onPick={onPick}/><div className="space-y-4"><h2 className="text-lg font-semibold text-white">{title}</h2><Field label="Opis obrazu (ALT — SEO i dostępność)" value={image.alt} onChange={value => onChange({ alt: value })}/><Area label="Podpis pod obrazem" value={image.caption} onChange={value => onChange({ caption: value })}/></div></div>;
}
function CardEditor({ number, card, onPick, onImage, onCard }: { number: number; card: { title: string; description: string; image: PublicGuideImage }; onPick: () => void; onImage: (patch: Partial<PublicGuideImage>) => void; onCard: (field: 'title' | 'description', value: string) => void }) {
    return <details className="rounded-xl border border-zinc-800 bg-zinc-900 p-5" open={number === 1}><summary className="cursor-pointer font-semibold text-white">{number}. {card.title}</summary><div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]"><Preview image={card.image} onPick={onPick}/><div className="space-y-4"><Field label="Tytuł" value={card.title} onChange={value => onCard('title', value)}/><Area label="Opis widoczny pod zdjęciem" value={card.description} onChange={value => onCard('description', value)}/><Field label="Opis obrazu ALT" value={card.image.alt} onChange={value => onImage({ alt: value })}/><Area label="Podpis obrazu" value={card.image.caption} onChange={value => onImage({ caption: value })}/></div></div></details>;
}
function Preview({ image, onPick }: { image: PublicGuideImage; onPick: () => void }) { return <div><div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">{image.src ? <Image src={image.src} alt={image.alt} fill sizes="220px" className="object-contain" unoptimized/> : <div className="flex h-full items-center justify-center text-zinc-600"><ImageIcon size={42}/></div>}</div><button type="button" onClick={onPick} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-800 text-sm font-semibold text-white hover:border-gold-500">Podmień z Media</button></div>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span className={labelClass}>{label}</span><input value={value} onChange={event => onChange(event.target.value)} className={inputClass}/></label>; }
function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span className={labelClass}>{label}</span><textarea rows={4} value={value} onChange={event => onChange(event.target.value)} className={inputClass}/></label>; }
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <label className="flex min-h-12 items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-sm font-semibold text-white"><input type="checkbox" checked={value} onChange={event => onChange(event.target.checked)} className="h-5 w-5 accent-amber-500"/>{label}</label>; }
