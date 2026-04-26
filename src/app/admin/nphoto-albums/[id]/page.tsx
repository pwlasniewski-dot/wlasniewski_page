'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Save, Trash2, Plus, X, Loader2, Sparkles,
    Image as ImageIcon, Film, Search as SearchIcon, ExternalLink,
    Star, Eye, EyeOff
} from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';

const CATEGORIES = [
    { value: 'album', label: 'Albumy' },
    { value: 'photobook', label: 'Fotoksiążki' },
    { value: 'canvas', label: 'Płótna' },
    { value: 'frame', label: 'Ramy' },
    { value: 'box', label: 'Pudełka prezentowe' },
];

const OCCASIONS = [
    { value: 'wedding', label: '💍 Ślub' },
    { value: 'communion', label: '🕊️ Komunia' },
    { value: 'birthday', label: '🎂 Urodziny' },
    { value: 'family', label: '👨‍👩‍👧 Rodzinna' },
    { value: 'newborn', label: '👶 Noworodki' },
    { value: 'engagement', label: '💕 Zaręczyny' },
    { value: 'graduation', label: '🎓 Studniówka' },
];

export default function AlbumDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [album, setAlbum] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imgPickerField, setImgPickerField] = useState<null | 'cover' | 'preview' | 'sample'>(null);

    useEffect(() => { if (id) fetchAlbum(); }, [id]);

    async function fetchAlbum() {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/nphoto-albums/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                const a = data.album;
                setAlbum({
                    ...a,
                    preview_images: Array.isArray(a.preview_images) ? a.preview_images : [],
                    sample_pages: Array.isArray(a.sample_pages) ? a.sample_pages : [],
                    occasion: Array.isArray(a.occasion) ? a.occasion : [],
                });
            } else {
                toast.error('Nie znaleziono albumu');
                router.push('/admin/nphoto-albums');
            }
        } catch {
            toast.error('Błąd ładowania');
        } finally {
            setLoading(false);
        }
    }

    function update(field: string, value: any) {
        setAlbum((a: any) => ({ ...a, [field]: value }));
    }

    function toggleOccasion(value: string) {
        setAlbum((a: any) => ({
            ...a,
            occasion: a.occasion.includes(value) ? a.occasion.filter((x: string) => x !== value) : [...a.occasion, value]
        }));
    }

    async function handleSave() {
        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/nphoto-albums/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(album)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Zapisano!');
                fetchAlbum();
            } else {
                toast.error(data.error || 'Błąd zapisu');
            }
        } catch {
            toast.error('Błąd');
        } finally {
            setSaving(false);
        }
    }

    function addPreviewImage(url: string) {
        if (!url || !album) return;
        update('preview_images', [...album.preview_images, url]);
    }
    function removePreviewImage(index: number) {
        update('preview_images', album.preview_images.filter((_: any, i: number) => i !== index));
    }
    function addSamplePage(url: string) {
        if (!url || !album) return;
        update('sample_pages', [...album.sample_pages, url]);
    }
    function removeSamplePage(index: number) {
        update('sample_pages', album.sample_pages.filter((_: any, i: number) => i !== index));
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
            </div>
        );
    }

    if (!album) return null;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link href="/admin/nphoto-albums" className="text-zinc-400 hover:text-white text-sm flex items-center gap-2 mb-3">
                    <ArrowLeft className="w-4 h-4" /> Powrót do listy
                </Link>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white">{album.title || 'Bez tytułu'}</h1>
                        <p className="text-zinc-400 text-sm mt-1">/{album.slug}</p>
                    </div>
                    <button onClick={handleSave} disabled={saving}
                        className="bg-gold-500 hover:bg-gold-600 text-zinc-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-gold-500/20">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Zapisz zmiany
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Podstawowe */}
                    <Card title="Informacje podstawowe">
                        <Field label="Tytuł"><Input value={album.title} onChange={v => update('title', v)} /></Field>
                        <Field label="Slug (URL)"><Input value={album.slug} onChange={v => update('slug', v)} /></Field>
                        <Field label="Podtytuł"><Input value={album.subtitle || ''} onChange={v => update('subtitle', v)} /></Field>
                        <Field label="Pełny opis">
                            <textarea value={album.description || ''} onChange={e => update('description', e.target.value)}
                                rows={5}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none" />
                        </Field>
                    </Card>

                    {/* Specyfikacja */}
                    <Card title="Specyfikacja produktu">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Kategoria">
                                <select value={album.category} onChange={e => update('category', e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none">
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </Field>
                            <Field label="Format (np. 30x30 cm)"><Input value={album.format || ''} onChange={v => update('format', v)} /></Field>
                            <Field label="Liczba stron">
                                <input type="number" value={album.pages_count || ''} onChange={e => update('pages_count', e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none" />
                            </Field>
                            <Field label="Typ okładki"><Input value={album.cover_type || ''} onChange={v => update('cover_type', v)} placeholder="np. Skóra naturalna" /></Field>
                            <Field label="Typ papieru"><Input value={album.paper_type || ''} onChange={v => update('paper_type', v)} placeholder="np. Mat 200g" /></Field>
                        </div>
                    </Card>

                    {/* Cena */}
                    <Card title="Cena">
                        <div className="grid grid-cols-3 gap-3">
                            <Field label="Cena (zł)">
                                <input type="number" value={album.price || 0} onChange={e => update('price', parseInt(e.target.value || '0'))}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none" />
                                <div className="text-xs text-zinc-500 mt-1">{album.price || 0} zł</div>
                            </Field>
                            <Field label="Cena od (zł)">
                                <input type="number" value={album.price_from || ''} onChange={e => update('price_from', e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none" />
                            </Field>
                            <Field label="Waluta"><Input value={album.currency} onChange={v => update('currency', v)} /></Field>
                        </div>
                    </Card>

                    {/* Okazje */}
                    <Card title="Okazje (do dopasowania w ofertach)">
                        <div className="flex flex-wrap gap-2">
                            {OCCASIONS.map(o => (
                                <button key={o.value} onClick={() => toggleOccasion(o.value)}
                                    className={`px-3 py-2 rounded-lg text-sm transition ${album.occasion.includes(o.value) ? 'bg-gold-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Media */}
                    <Card title="Okładka">
                        {album.cover_image_url ? (
                            <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={album.cover_image_url} alt="Okładka"
                                    className="w-full max-w-sm rounded-lg border border-zinc-700" />
                                <button onClick={() => update('cover_image_url', '')}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="text-zinc-500 text-sm mb-2">Brak okładki</div>
                        )}
                        <ImageDualAdder
                            currentValue={album.cover_image_url || ''}
                            onChange={v => update('cover_image_url', v)}
                            placeholder="URL okładki (https://...)"
                            mode="single"
                        />
                    </Card>

                    <Card title="Zdjęcia podglądowe">
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {album.preview_images.map((url: string, i: number) => (
                                <div key={i} className="relative aspect-square bg-zinc-800 rounded overflow-hidden group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button onClick={() => removePreviewImage(i)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <ImageDualAdder onAdd={addPreviewImage} placeholder="URL zdjęcia podglądowego..." mode="multi" />
                    </Card>

                    <Card title="Próbki stron (sample pages)">
                        <p className="text-xs text-zinc-400 mb-3">Pojedyncze rozkładówki / strony albumu - używane w 3D viewerze i karuzeli klienta.</p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {album.sample_pages.map((url: string, i: number) => (
                                <div key={i} className="relative aspect-[3/2] bg-zinc-800 rounded overflow-hidden group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button onClick={() => removeSamplePage(i)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <ImageDualAdder onAdd={addSamplePage} placeholder="URL strony albumu..." mode="multi" />
                    </Card>

                    <Card title="Wideo prezentacyjne">
                        <Field label="Główny film (YouTube / Vimeo / MP4)">
                            <Input value={album.video_url || ''} onChange={v => update('video_url', v)} placeholder="https://youtube.com/watch?v=... lub https://...mp4" />
                            <VideoUploader onUploaded={url => update('video_url', url)} />
                        </Field>
                        <Field label="Miniatura wideo (URL)">
                            <Input value={album.video_thumbnail || ''} onChange={v => update('video_thumbnail', v)} />
                        </Field>

                        <div className="mt-4 pt-4 border-t border-zinc-800">
                            <div className="text-xs text-zinc-400 mb-2 font-medium">Dodatkowe filmy prezentacyjne (różne ujęcia, animacje 360°, itp.)</div>
                            <AdditionalVideosEditor
                                value={Array.isArray(album.additional_videos) ? album.additional_videos : []}
                                onChange={v => update('additional_videos', v)}
                            />
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-800">
                            <Field label="Galeria 3D - URL embed">
                                <Input value={album.gallery_3d_url || ''} onChange={v => update('gallery_3d_url', v)} placeholder="iframe URL z nPhoto 3D" />
                            </Field>
                        </div>
                    </Card>

                    {/* nPhoto Integration */}
                    <Card title="🔗 Integracja nPhoto">
                        <Field label="ID produktu nPhoto"><Input value={album.nphoto_product_id || ''} onChange={v => update('nphoto_product_id', v)} /></Field>
                        <Field label="Link do sklepu nPhoto">
                            <Input value={album.nphoto_shop_url || ''} onChange={v => update('nphoto_shop_url', v)} placeholder="https://nphoto.pl/..." />
                        </Field>
                        <Field label="Kod embed nPhoto">
                            <textarea value={album.nphoto_embed_code || ''} onChange={e => update('nphoto_embed_code', e.target.value)}
                                rows={4}
                                placeholder="<iframe src='...'></iframe>"
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-gold-500 focus:outline-none" />
                        </Field>
                    </Card>

                    {/* SEO */}
                    <Card title="🚀 SEO">
                        <Field label="SEO Title (max 60 zn)">
                            <Input value={album.seo_title || ''} onChange={v => update('seo_title', v)} maxLength={60} />
                            <div className="text-xs text-zinc-500 mt-1">{(album.seo_title || '').length}/60</div>
                        </Field>
                        <Field label="SEO Description (max 160 zn)">
                            <textarea value={album.seo_description || ''} onChange={e => update('seo_description', e.target.value)}
                                maxLength={160} rows={2}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none" />
                            <div className="text-xs text-zinc-500 mt-1">{(album.seo_description || '').length}/160</div>
                        </Field>
                        <Field label="SEO Keywords (przecinki)">
                            <Input value={album.seo_keywords || ''} onChange={v => update('seo_keywords', v)} placeholder="album ślubny, fotoksiążka, premium" />
                        </Field>
                        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3 text-xs text-emerald-300 mt-2">
                            ✅ JSON-LD Product schema generowany automatycznie z danych produktu (cena, opis, okładka).
                        </div>
                    </Card>
                </div>

                {/* RIGHT: Sidebar */}
                <div className="space-y-6">
                    <Card title="Status">
                        <label className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg cursor-pointer">
                            <span className="flex items-center gap-2 text-zinc-200"><Eye className="w-4 h-4" /> Aktywny</span>
                            <input type="checkbox" checked={album.is_active} onChange={e => update('is_active', e.target.checked)}
                                className="w-5 h-5 accent-gold-500" />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg cursor-pointer mt-2">
                            <span className="flex items-center gap-2 text-zinc-200"><Star className="w-4 h-4 text-gold-400" /> Wyróżniony</span>
                            <input type="checkbox" checked={album.is_featured} onChange={e => update('is_featured', e.target.checked)}
                                className="w-5 h-5 accent-gold-500" />
                        </label>
                        <Field label="Sort order">
                            <input type="number" value={album.sort_order || 0} onChange={e => update('sort_order', parseInt(e.target.value || '0'))}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none" />
                        </Field>
                    </Card>

                    <Card title="Podgląd okładki">
                        {album.cover_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={album.cover_image_url} alt={album.title} className="w-full rounded-lg" />
                        ) : (
                            <div className="aspect-square bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600">
                                <ImageIcon className="w-12 h-12" />
                            </div>
                        )}
                        <div className="mt-3 text-sm">
                            <div className="text-white font-bold">{album.title}</div>
                            {album.subtitle && <div className="text-zinc-400 text-xs">{album.subtitle}</div>}
                            {album.price > 0 && <div className="text-gold-400 font-bold mt-2">{album.price} {album.currency}</div>}
                        </div>
                    </Card>

                    {album.nphoto_shop_url && (
                        <a href={album.nphoto_shop_url} target="_blank" rel="noopener"
                            className="block bg-blue-900/20 hover:bg-blue-900/40 border border-blue-700/30 rounded-xl p-4 text-blue-300 text-center transition">
                            <ExternalLink className="w-5 h-5 mx-auto mb-1" />
                            Otwórz w sklepie nPhoto
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">{title}</h2>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">{label}</label>
            {children}
        </div>
    );
}

function Input({ value, onChange, placeholder, className, maxLength }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; maxLength?: number }) {
    return <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
        className={`w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none ${className || ''}`} />;
}

function ImageDualAdder(props: {
    placeholder: string;
    mode: 'single' | 'multi';
    onAdd?: (url: string) => void;
    currentValue?: string;
    onChange?: (url: string) => void;
}) {
    const { placeholder, mode, onAdd, currentValue, onChange } = props;
    const [url, setUrl] = useState(mode === 'single' ? (currentValue || '') : '');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    function commit(value: string) {
        if (!value.trim()) return;
        if (mode === 'multi') { onAdd?.(value.trim()); setUrl(''); }
        else { onChange?.(value.trim()); setUrl(value.trim()); }
    }

    async function uploadFiles(files: FileList | File[]) {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (arr.length === 0) return;
        setUploading(true);
        try {
            const token = localStorage.getItem('admin_token') || localStorage.getItem('provider_token');
            for (const file of arr) {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('folder', 'albums');
                const res = await fetch('/api/media/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: fd,
                });
                const data = await res.json();
                if (data.success && data.media?.file_path) {
                    if (mode === 'multi') onAdd?.(data.media.file_path);
                    else { onChange?.(data.media.file_path); setUrl(data.media.file_path); }
                    toast.success(`✓ ${file.name}`);
                } else {
                    toast.error(`Błąd: ${file.name} – ${data.error || 'unknown'}`);
                }
                if (mode === 'single') break;
            }
        } catch (e: any) {
            toast.error('Błąd uploadu: ' + (e?.message || ''));
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder={placeholder}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(url); } }}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500 focus:outline-none" />
                <button type="button" onClick={() => commit(url)}
                    title="Dodaj z URL"
                    className="bg-gold-500 hover:bg-gold-600 text-zinc-950 font-bold px-3 rounded-lg flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <label
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
                className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-4 cursor-pointer text-sm transition ${dragOver ? 'border-gold-500 bg-gold-500/10 text-gold-300' : 'border-zinc-700 hover:border-gold-500 hover:bg-zinc-900/40 text-zinc-300'} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                {uploading
                    ? 'Wysyłanie...'
                    : (mode === 'multi' ? 'Przeciągnij pliki tutaj lub kliknij (możesz wybrać kilka)' : 'Przeciągnij plik tutaj lub kliknij')}
                <input type="file" accept="image/*" multiple={mode === 'multi'} className="hidden"
                    onChange={e => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ''; }} />
            </label>

            <button type="button" onClick={() => setPickerOpen(true)}
                className="w-full text-xs text-zinc-500 hover:text-gold-400 underline transition">
                lub wybierz z istniejącej biblioteki mediów
            </button>

            <MediaPicker
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                multiple={mode === 'multi'}
                onSelect={(selUrl) => {
                    if (Array.isArray(selUrl)) {
                        if (mode === 'multi') { selUrl.forEach(u => onAdd?.(u)); }
                        else if (selUrl[0]) { onChange?.(selUrl[0]); setUrl(selUrl[0]); }
                    } else {
                        if (mode === 'multi') onAdd?.(selUrl);
                        else { onChange?.(selUrl); setUrl(selUrl); }
                    }
                    setPickerOpen(false);
                }}
            />
        </div>
    );
}

function VideoUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);

    async function upload(file: File) {
        if (!file) return;
        const maxMB = 200;
        if (file.size > maxMB * 1024 * 1024) {
            toast.error(`Plik za duży (max ${maxMB} MB)`);
            return;
        }
        setUploading(true);
        setProgress(0);
        try {
            const token = localStorage.getItem('admin_token') || localStorage.getItem('provider_token');

            // 1. Get presigned URL
            const presRes = await fetch('/api/media/upload/presigned', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ fileName: file.name, fileType: file.type, folder: 'videos' }),
            });
            const presData = await presRes.json();
            if (!presData.success) throw new Error(presData.error || 'Brak presigned URL');

            // 2. Upload directly to S3 with progress
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', presData.uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
                };
                xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 ${xhr.status}`));
                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send(file);
            });

            onUploaded(presData.publicUrl);
            toast.success(`✓ Film wgrany (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
        } catch (e: any) {
            toast.error('Błąd uploadu: ' + (e?.message || ''));
        } finally {
            setUploading(false);
            setProgress(0);
        }
    }

    return (
        <label
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
            className={`mt-2 flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-3 cursor-pointer text-sm transition ${dragOver ? 'border-gold-500 bg-gold-500/10 text-gold-300' : 'border-zinc-700 hover:border-gold-500 hover:bg-zinc-900/40 text-zinc-300'} ${uploading ? 'opacity-70 pointer-events-none' : ''}`}>
            {uploading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Wysyłanie... {progress}%</span>
                    <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gold-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                </>
            ) : (
                <>
                    <Film className="w-4 h-4" />
                    <span>Przeciągnij film MP4 tutaj lub kliknij (max 200 MB)</span>
                </>
            )}
            <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
        </label>
    );
}

interface ExtraVideo { url: string; label?: string; thumbnail?: string }

function AdditionalVideosEditor({ value, onChange }: { value: ExtraVideo[]; onChange: (v: ExtraVideo[]) => void }) {
    function update(i: number, patch: Partial<ExtraVideo>) {
        const next = value.slice();
        next[i] = { ...next[i], ...patch };
        onChange(next);
    }
    function remove(i: number) {
        onChange(value.filter((_, idx) => idx !== i));
    }
    function add() {
        onChange([...value, { url: '', label: '', thumbnail: '' }]);
    }

    return (
        <div className="space-y-3">
            {value.map((v, i) => (
                <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gold-400 flex items-center gap-1">
                            <Film className="w-3 h-3" /> Film #{i + 2}
                        </span>
                        <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <input
                        value={v.label || ''}
                        onChange={e => update(i, { label: e.target.value })}
                        placeholder="Etykieta (np. Animacja 360°, Rozkładówka, Detal okładki)"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500 focus:outline-none" />
                    <input
                        value={v.url}
                        onChange={e => update(i, { url: e.target.value })}
                        placeholder="URL filmu (YouTube / Vimeo / MP4)"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500 focus:outline-none" />
                    <VideoUploader onUploaded={url => update(i, { url })} />
                    <input
                        value={v.thumbnail || ''}
                        onChange={e => update(i, { thumbnail: e.target.value })}
                        placeholder="Miniatura (opcjonalnie)"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs focus:border-gold-500 focus:outline-none" />
                </div>
            ))}
            <button type="button" onClick={add}
                className="w-full border-2 border-dashed border-zinc-700 hover:border-gold-500 hover:bg-gold-500/5 rounded-lg py-3 text-sm text-zinc-400 hover:text-gold-300 transition flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Dodaj kolejny film
            </button>
        </div>
    );
}
