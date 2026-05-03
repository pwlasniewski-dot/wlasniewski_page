'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, BookOpen, Camera, CalendarDays, Upload, Trash2, Sparkles } from 'lucide-react';

interface Participant { id: number; login: string; display_name: string | null; avatar: string | null; }
interface Meta { id: number; slug: string; title: string; }
interface ScheduleDay { date?: string; start?: string; end?: string; topic?: string; plan?: string; image_url?: string }
interface MaterialItem { title?: string; body_md?: string; image_url?: string }
interface UploadItem { id: number; file_url: string; thumb_url?: string | null; caption?: string | null; feedback?: string | null; rating?: number | null; created_at: string; }

function renderMd(s: string): { __html: string } {
    if (!s) return { __html: '' };
    let html = s
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
        .replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>(\n|$))+/g, m => `<ul>${m.replace(/\n/g, '')}</ul>`);
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    html = html.split(/\n{2,}/).map(p => p.startsWith('<') ? p : `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    return { __html: html };
}

export default function WorkshopPanelPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();
    const [me, setMe] = useState<Participant | null>(null);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [tab, setTab] = useState<'plan' | 'edu' | 'photos'>('plan');
    const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
    const [materials, setMaterials] = useState<MaterialItem[]>([]);
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const [token, setToken] = useState<string>('');
    const [caption, setCaption] = useState('');
    const fileRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const tk = localStorage.getItem('workshop_token');
        const p = localStorage.getItem('workshop_participant');
        const m = localStorage.getItem('workshop_meta');
        if (!tk || !p || !m) { router.replace(`/warsztaty/${slug}/login`); return; }
        setToken(tk);
        setMe(JSON.parse(p));
        setMeta(JSON.parse(m));
        loadWorkshop();
        loadUploads(tk);
    }, [slug, router]);

    async function loadWorkshop() {
        try {
            const r = await fetch(`/api/workshops/${slug}`);
            if (r.ok) {
                const j = await r.json();
                setSchedule(Array.isArray(j.workshop?.schedule) ? j.workshop.schedule : []);
                setMaterials(Array.isArray(j.workshop?.materials) ? j.workshop.materials : []);
            }
        } catch { /* ignore */ }
    }

    async function loadUploads(tk?: string) {
        const t = tk || token;
        if (!t) return;
        try {
            const r = await fetch(`/api/workshops/${slug}/uploads`, { headers: { Authorization: `Bearer ${t}` } });
            if (r.ok) { const j = await r.json(); setUploads(j.uploads || []); }
        } catch { /* ignore */ }
    }

    function logout() {
        localStorage.removeItem('workshop_token');
        localStorage.removeItem('workshop_participant');
        localStorage.removeItem('workshop_meta');
        router.replace(`/warsztaty/${slug}/login`);
    }

    async function uploadPhoto(file: File) {
        if (!file || uploading) return;
        if (file.size > 10 * 1024 * 1024) { alert('Zdjęcie za duże — max 10 MB. Spróbuj zmniejszyć.'); return; }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            if (caption) fd.append('caption', caption);
            const r = await fetch(`/api/workshops/${slug}/uploads`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const j = await r.json();
            if (!r.ok) { alert(j.error || 'Coś poszło nie tak — spróbuj jeszcze raz'); return; }
            setCaption('');
            if (fileRef.current) fileRef.current.value = '';
            loadUploads();
        } finally { setUploading(false); }
    }

    async function deleteUpload(id: number) {
        if (!confirm('Usunąć to zdjęcie?')) return;
        const r = await fetch(`/api/workshops/${slug}/uploads?id=${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) loadUploads();
    }

    if (!me || !meta) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50">
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b-4 border-rose-300 px-4 py-3 flex items-center gap-3 shadow-sm">
                <span className="text-4xl drop-shadow">{me.avatar || '✨'}</span>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-zinc-900 text-lg truncate">Cześć, {me.display_name || me.login}!</div>
                    <div className="text-xs text-zinc-500 truncate">{meta.title}</div>
                </div>
                <button onClick={logout} title="Wyloguj" className="text-zinc-500 hover:text-rose-600 p-2 rounded-full hover:bg-rose-50"><LogOut size={20} /></button>
            </header>

            <nav className="bg-white border-b border-zinc-200 px-2 flex gap-1 overflow-x-auto sticky top-[68px] z-10">
                {([
                    ['plan', 'Plan zajęć', CalendarDays],
                    ['edu', 'Powtórki', BookOpen],
                    ['photos', `Moje zdjęcia (${uploads.length})`, Camera],
                ] as const).map(([key, label, Icon]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-4 transition whitespace-nowrap ${tab === key ? 'border-rose-500 text-rose-600' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
                    >
                        <Icon size={16} /> {label}
                    </button>
                ))}
            </nav>

            <main className="max-w-3xl mx-auto p-4 pb-24">
                {tab === 'plan' && <PlanTab schedule={schedule} />}
                {tab === 'edu' && <EduTab materials={materials} />}
                {tab === 'photos' && (
                    <PhotosTab
                        uploads={uploads}
                        uploading={uploading}
                        onUpload={uploadPhoto}
                        onDelete={deleteUpload}
                        caption={caption}
                        setCaption={setCaption}
                        fileRef={fileRef}
                    />
                )}
            </main>
        </div>
    );
}

function PlanTab({ schedule }: { schedule: ScheduleDay[] }) {
    if (schedule.length === 0) {
        return (
            <div className="bg-white border-2 border-dashed border-rose-300 rounded-2xl p-6 text-center">
                <Sparkles className="mx-auto mb-2 text-rose-400" />
                <p className="text-zinc-600">Plan będzie wkrótce dostępny. Zapytaj prowadzącego.</p>
            </div>
        );
    }
    return (
        <div className="space-y-4">
            {schedule.map((d, i) => {
                const dateStr = d.date ? new Date(d.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
                return (
                    <article key={i} className="bg-white border-2 border-rose-200 rounded-2xl shadow-md overflow-hidden">
                        {d.image_url && (
                            <a href={d.image_url} target="_blank" rel="noreferrer" className="block bg-zinc-100">
                                <img src={d.image_url} alt={d.topic || ''} className="w-full max-h-64 object-cover" />
                            </a>
                        )}
                        <div className="p-4 sm:p-5">
                            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap mb-3">
                                <span className="bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">DZIEŃ {i + 1}</span>
                                {dateStr && <span className="text-zinc-600 text-sm font-medium capitalize">{dateStr}</span>}
                                {(d.start || d.end) && <span className="text-zinc-500 text-xs font-mono whitespace-nowrap">{d.start} – {d.end}</span>}
                            </div>
                            {d.topic && <h3 className="font-bold text-zinc-900 text-lg sm:text-xl mb-3 leading-snug">{d.topic}</h3>}
                            {d.plan && (
                                <div
                                    className="text-zinc-700 leading-relaxed text-sm sm:text-base
                                               [&_p]:mb-3 [&_p]:break-words
                                               [&_strong]:text-rose-700 [&_strong]:font-bold
                                               [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ul]:space-y-1.5
                                               [&_li]:break-words [&_li]:leading-relaxed
                                               [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50 [&_blockquote]:px-3 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:italic
                                               [&_br]:block [&_br]:mb-2"
                                    dangerouslySetInnerHTML={renderMd(d.plan)}
                                />
                            )}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

function EduTab({ materials }: { materials: MaterialItem[] }) {
    if (materials.length === 0) {
        return (
            <div className="bg-white border-2 border-dashed border-violet-300 rounded-2xl p-6 text-center">
                <BookOpen className="mx-auto mb-2 text-violet-400" />
                <p className="text-zinc-600">Materiały do powtórki pojawią się wkrótce.</p>
            </div>
        );
    }
    return (
        <div className="space-y-4">
            <div className="bg-violet-100 border-2 border-violet-200 rounded-2xl p-4 text-violet-900 text-sm">
                <strong>Powtórka materiału</strong> — wszystko co omówiliśmy razem. Wracaj tu kiedy chcesz, w domu też. 📚
            </div>
            {materials.map((m, i) => (
                <article key={i} className="bg-white border-2 border-violet-200 rounded-2xl shadow-md overflow-hidden">
                    {m.image_url && (
                        <a href={m.image_url} target="_blank" rel="noreferrer" className="block bg-zinc-100">
                            <img src={m.image_url} alt={m.title || ''} className="w-full max-h-72 object-cover" />
                        </a>
                    )}
                    <div className="p-5">
                        <h3 className="font-bold text-zinc-900 text-xl mb-3 flex items-center gap-2">
                            <span className="bg-violet-500 text-white text-xs px-2 py-0.5 rounded">#{i + 1}</span>
                            {m.title}
                        </h3>
                        <div
                            className="text-zinc-700 leading-relaxed text-sm
                                       [&_p]:mb-2 [&_strong]:text-violet-700 [&_strong]:font-bold
                                       [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1
                                       [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50 [&_blockquote]:px-3 [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:italic"
                            dangerouslySetInnerHTML={renderMd(m.body_md || '')}
                        />
                    </div>
                </article>
            ))}
        </div>
    );
}

function PhotosTab({ uploads, uploading, onUpload, onDelete, caption, setCaption, fileRef }: {
    uploads: UploadItem[]; uploading: boolean;
    onUpload: (f: File) => void; onDelete: (id: number) => void;
    caption: string; setCaption: (s: string) => void;
    fileRef: React.MutableRefObject<HTMLInputElement | null>;
}) {
    return (
        <div className="space-y-5">
            <div className="bg-gradient-to-br from-amber-100 via-rose-100 to-violet-100 border-2 border-amber-300 rounded-2xl p-5 shadow-md">
                <h3 className="font-bold text-zinc-900 text-lg mb-1 flex items-center gap-2">
                    <Camera className="text-rose-500" /> Wgraj swoje zdjęcie
                </h3>
                <p className="text-zinc-700 text-sm mb-3">Wybierz zdjęcie z telefonu lub komputera. Możesz dopisać krótki opis (np. „portret mojego brata"). Prowadzący zobaczy je i napisze Ci wskazówkę.</p>
                <input value={caption} onChange={e => setCaption(e.target.value)}
                    placeholder="Opis zdjęcia (opcjonalnie)" maxLength={120}
                    className="w-full border-2 border-amber-300 bg-white rounded-lg px-3 py-2 text-zinc-900 text-sm mb-3" />
                <label className={`block text-center bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold px-5 py-4 rounded-xl cursor-pointer text-lg shadow ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                    {uploading ? '⏳ Wgrywam zdjęcie…' : (<><Upload className="inline mr-2" size={20} /> Wybierz zdjęcie</>)}
                    <input ref={fileRef} type="file" accept="image/*" hidden disabled={uploading}
                        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
                </label>
                <p className="text-xs text-zinc-500 mt-2 text-center">Max 10 MB · do 50 zdjęć</p>
            </div>

            {uploads.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-8 text-center text-zinc-500">
                    <Camera className="mx-auto mb-2 text-amber-400" />
                    Tutaj pokażą się Twoje zdjęcia po wgraniu.
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {uploads.map(u => (
                        <div key={u.id} className="bg-white border-2 border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                            <a href={u.file_url} target="_blank" rel="noreferrer" className="block aspect-square bg-zinc-100">
                                <img src={u.file_url} alt={u.caption || ''} className="w-full h-full object-cover" />
                            </a>
                            <div className="p-2 space-y-1">
                                {u.caption && <div className="text-xs text-zinc-700 italic">„{u.caption}"</div>}
                                {u.rating ? (
                                    <div className="text-amber-500 text-sm">{'★'.repeat(u.rating)}<span className="text-zinc-300">{'★'.repeat(5 - u.rating)}</span></div>
                                ) : null}
                                {u.feedback && (
                                    <div className="text-xs text-zinc-800 bg-amber-50 border-l-4 border-amber-400 p-2 rounded">
                                        <strong className="text-amber-700">Prowadzący:</strong> {u.feedback}
                                    </div>
                                )}
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[10px] text-zinc-400">{new Date(u.created_at).toLocaleDateString('pl-PL')}</span>
                                    <button onClick={() => onDelete(u.id)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 size={12} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
