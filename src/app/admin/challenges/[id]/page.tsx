'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';
import Link from 'next/link';
import {
    ArrowLeft, Save, Calendar, MapPin, User, DollarSign,
    Eye, MousePointerClick, CreditCard, Cog, Share2, Download,
    CheckCircle2, XCircle, Clock, Activity, Copy, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ChallengeDetails {
    id: number;
    unique_link: string;
    inviter_name: string;
    inviter_contact: string;
    inviter_contact_type: string;
    invitee_name: string;
    invitee_contact: string;
    invitee_contact_type: string;
    status: string;
    created_at: string;
    viewed_at: string | null;
    accepted_at: string | null;
    rejected_at: string | null;
    session_date: string | null;
    acceptance_deadline: string | null;
    preferred_dates: string | null;
    discount_amount: number;
    discount_percentage: number;
    admin_notes: string | null;
    package: {
        name: string;
        base_price: number;
        challenge_price: number;
    };
    location: {
        name: string;
    } | null;
    custom_location: string | null;
    timeline: {
        id: number;
        event_type: string;
        event_description: string;
        metadata?: string | null;
        created_at: string;
    }[];
}

// Visual config per event_type. Unknown events fall back to neutral.
const EVENT_META: Record<string, { label: string; icon: any; color: string; cat: 'visit' | 'cta' | 'payment' | 'system' | 'share' }> = {
    page_viewed: { label: 'Otworzył(a) zaproszenie', icon: Eye, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30', cat: 'visit' },
    scrolled_25: { label: 'Przewinął(a) 25%', icon: Activity, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-600', cat: 'visit' },
    scrolled_50: { label: 'Przewinął(a) 50%', icon: Activity, color: 'text-zinc-300 bg-zinc-500/10 border-zinc-600', cat: 'visit' },
    scrolled_75: { label: 'Przewinął(a) 75%', icon: Activity, color: 'text-zinc-200 bg-zinc-500/10 border-zinc-600', cat: 'visit' },
    scrolled_100: { label: 'Doczytał(a) do końca', icon: Activity, color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', cat: 'visit' },
    package_details_opened: { label: 'Rozwinął(a) szczegóły bezpieczeństwa', icon: MousePointerClick, color: 'text-amber-300 bg-amber-500/10 border-amber-500/30', cat: 'visit' },
    maps_opened: { label: 'Otworzył(a) Google Maps', icon: MapPin, color: 'text-amber-300 bg-amber-500/10 border-amber-500/30', cat: 'visit' },
    gallery_opened: { label: 'Otworzył(a) galerię', icon: Eye, color: 'text-amber-300 bg-amber-500/10 border-amber-500/30', cat: 'visit' },
    shared_clicked: { label: 'Kliknął(a) udostępnij', icon: Share2, color: 'text-purple-300 bg-purple-500/10 border-purple-500/30', cat: 'share' },
    cta_accept_clicked: { label: 'Kliknął(a) AKCEPTUJĘ', icon: CheckCircle2, color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40', cat: 'cta' },
    cta_reject_clicked: { label: 'Kliknął(a) ODRZUĆ', icon: XCircle, color: 'text-rose-300 bg-rose-500/15 border-rose-500/40', cat: 'cta' },
    cta_pay_clicked: { label: 'Kliknął(a) ZAPŁAĆ', icon: CreditCard, color: 'text-amber-300 bg-amber-500/15 border-amber-500/40', cat: 'cta' },
    pdf_downloaded: { label: 'Pobrał(a) PDF voucher', icon: Download, color: 'text-blue-300 bg-blue-500/10 border-blue-500/30', cat: 'cta' },
    ics_downloaded: { label: 'Pobrał(a) plik kalendarza', icon: Download, color: 'text-blue-300 bg-blue-500/10 border-blue-500/30', cat: 'cta' },
    booking_created: { label: 'Zarezerwowano termin', icon: Calendar, color: 'text-gold-300 bg-gold-500/15 border-gold-500/40', cat: 'system' },
    photos_ready_notification: { label: 'Wysłano powiadomienie „zdjęcia gotowe”', icon: Cog, color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', cat: 'system' },
};

function prettifyEvent(e: { event_type: string; event_description?: string }): { label: string; icon: any; color: string; cat: string } {
    const m = EVENT_META[e.event_type];
    if (m) return m;
    if (e.event_type.startsWith('status_')) {
        return {
            label: `Zmiana statusu → ${e.event_type.replace('status_', '')}`,
            icon: Cog,
            color: 'text-zinc-300 bg-zinc-500/10 border-zinc-600',
            cat: 'system',
        };
    }
    return {
        label: e.event_description || e.event_type,
        icon: Activity,
        color: 'text-zinc-300 bg-zinc-500/10 border-zinc-600',
        cat: 'system',
    };
}

function safeJson<T = any>(raw: string | null | undefined): T | null {
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
}

export default function ChallengeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const challengeId = params?.id as string;

    const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [sessionDate, setSessionDate] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (challengeId) {
            fetchChallenge();
        }
    }, [challengeId]);

    const fetchChallenge = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`photo-challenge/admin/${challengeId}`), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setChallenge(data.challenge);
                setAdminNotes(data.challenge.admin_notes || '');
                setSessionDate(data.challenge.session_date || '');
                setStatus(data.challenge.status);
            }
        } catch (error) {
            console.error('Failed to fetch challenge');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`photo-challenge/admin/${challengeId}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    admin_notes: adminNotes,
                    session_date: sessionDate || null,
                    status,
                }),
            });

            if (res.ok) {
                toast.success('Zapisano zmiany');
                fetchChallenge();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-zinc-400">Ładowanie...</div>;
    if (!challenge) return <div className="text-zinc-400">Nie znaleziono wyzwania</div>;

    let preferredDates: string[] = [];
    try {
        const datesStr = challenge.preferred_dates?.trim();
        if (datesStr && datesStr !== "undefined" && datesStr !== "null" && datesStr.length > 0) {
            preferredDates = JSON.parse(datesStr);
        }
    } catch (e) {
        console.error('Error parsing preferred_dates:', e);
        preferredDates = [];
    }

    return (
        <div className="max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/challenges"
                        className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white">
                            Wyzwanie #{challenge.id}
                        </h1>
                        <p className="text-zinc-400 mt-1">
                            {challenge.inviter_name} → {challenge.invitee_name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {status === 'accepted' && (
                        <button
                            onClick={async () => {
                                const token = localStorage.getItem('admin_token');
                                const res = await fetch(getApiUrl(`photo-challenge/admin/${challengeId}/notify-ready`), {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) toast.success('Klient został powiadomiony!');
                                else toast.error('Błąd wysyłki powiadomienia');
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
                        >
                            📸 Zdjęcia gotowe
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded-md font-medium disabled:opacity-50"
                    >
                        <Save className="w-4 h-4 inline mr-2" />
                        {saving ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Podstawowe informacje</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-zinc-800">
                                <span className="text-zinc-400">Status:</span>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-white"
                                >
                                    <option value="sent">Wysłane</option>
                                    <option value="viewed">Wyświetlone</option>
                                    <option value="accepted">Zaakceptowane</option>
                                    <option value="rejected">Odrzucone</option>
                                    <option value="scheduled">Zaplanowane</option>
                                    <option value="completed">Zakończone</option>
                                    <option value="expired">Wygasłe</option>
                                </select>
                            </div>
                            <div className="flex justify-between py-2 border-b border-zinc-800">
                                <span className="text-zinc-400">Link:</span>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/foto-wyzwanie/invite/${challenge.unique_link}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gold-400 hover:underline inline-flex items-center gap-1"
                                    >
                                        <ExternalLink size={12} /> Otwórz
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = `${window.location.origin}/foto-wyzwanie/invite/${challenge.unique_link}`;
                                            navigator.clipboard.writeText(url);
                                            toast.success('Skopiowano link');
                                        }}
                                        className="text-zinc-400 hover:text-white inline-flex items-center gap-1"
                                        title="Kopiuj link zaproszenia"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between py-2 border-b border-zinc-800">
                                <span className="text-zinc-400">Utworzone:</span>
                                <span className="text-white">{new Date(challenge.created_at).toLocaleString('pl-PL')}</span>
                            </div>
                            {challenge.viewed_at && (
                                <div className="flex justify-between py-2 border-b border-zinc-800">
                                    <span className="text-zinc-400">Wyświetlone:</span>
                                    <span className="text-white">{new Date(challenge.viewed_at).toLocaleString('pl-PL')}</span>
                                </div>
                            )}
                            {challenge.accepted_at && (
                                <div className="flex justify-between py-2 border-b border-zinc-800">
                                    <span className="text-zinc-400">Zaakceptowane:</span>
                                    <span className="text-white">{new Date(challenge.accepted_at).toLocaleString('pl-PL')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inviter */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Zapraszający
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div><span className="text-zinc-400">Imię:</span> <span className="text-white ml-2">{challenge.inviter_name}</span></div>
                            <div><span className="text-zinc-400">Kontakt ({challenge.inviter_contact_type}):</span> <span className="text-white ml-2">{challenge.inviter_contact}</span></div>
                        </div>
                    </div>

                    {/* Invitee */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Zaproszony
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div><span className="text-zinc-400">Imię:</span> <span className="text-white ml-2">{challenge.invitee_name}</span></div>
                            <div><span className="text-zinc-400">Kontakt ({challenge.invitee_contact_type}):</span> <span className="text-white ml-2">{challenge.invitee_contact}</span></div>
                        </div>
                    </div>

                    {/* Package Info */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Pakiet i cena
                        </h2>
                        <div className="space-y-3">
                            <div><span className="text-zinc-400">Pakiet:</span> <span className="text-white ml-2 font-semibold">{challenge.package.name}</span></div>
                            <div>
                                <span className="text-zinc-400">Cena po rabacie:</span>
                                <span className="text-gold-400 ml-2 font-bold text-lg">{challenge.package.challenge_price} zł</span>
                                <span className="text-zinc-500 line-through ml-2 text-sm">{challenge.package.base_price} zł</span>
                            </div>
                            <div>
                                <span className="text-zinc-400">Oszczędność:</span>
                                <span className="text-green-400 ml-2 font-semibold">{challenge.discount_amount} zł ({challenge.discount_percentage}%)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Session Date */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Termin sesji
                        </h2>
                        <input
                            type="datetime-local"
                            value={sessionDate}
                            onChange={e => setSessionDate(e.target.value)}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                        />
                        {preferredDates.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                                <p className="text-sm text-zinc-400 mb-2">Preferowane terminy:</p>
                                <div className="space-y-1">
                                    {preferredDates.map((date: string, i: number) => (
                                        <div key={i} className="text-sm text-white">
                                            {i + 1}. {new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Lokalizacja
                        </h2>
                        <div className="text-white">
                            {challenge.location ? challenge.location.name : challenge.custom_location || 'Nie podano'}
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Notatki admina</h2>
                        <textarea
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            rows={6}
                            placeholder="Dodaj notatki dotyczące tego wyzwania..."
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white resize-none"
                        />
                    </div>

                    {/* Timeline */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5" /> Zachowanie klienta
                            </h2>
                            <span className="text-xs text-zinc-500">{challenge.timeline.length} zdarzeń</span>
                        </div>

                        {/* Behavior summary */}
                        {(() => {
                            const t = challenge.timeline;
                            const count = (k: string) => t.filter((e) => e.event_type === k).length;
                            const last = (k: string) => t.filter((e) => e.event_type === k).slice(-1)[0]?.created_at;
                            const visits = count('page_viewed');
                            const maxScroll = ['scrolled_100', 'scrolled_75', 'scrolled_50', 'scrolled_25'].find((k) => count(k) > 0);
                            const scrollPct = maxScroll ? maxScroll.replace('scrolled_', '') : '0';
                            const acceptClicks = count('cta_accept_clicked');
                            const rejectClicks = count('cta_reject_clicked');
                            const lastVisit = last('page_viewed');
                            return (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                                    <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
                                        <div className="text-[10px] uppercase text-zinc-500 mb-1">Wejścia</div>
                                        <div className="text-xl font-bold text-sky-300">{visits || (challenge.viewed_at ? 1 : 0)}</div>
                                        {lastVisit && (
                                            <div className="text-[10px] text-zinc-500 mt-1">
                                                ostatnio {new Date(lastVisit).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
                                        <div className="text-[10px] uppercase text-zinc-500 mb-1">Przeczytał(a)</div>
                                        <div className="text-xl font-bold text-emerald-300">{scrollPct}%</div>
                                        <div className="text-[10px] text-zinc-500 mt-1">strony</div>
                                    </div>
                                    <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
                                        <div className="text-[10px] uppercase text-zinc-500 mb-1">CTA Akceptuję</div>
                                        <div className={`text-xl font-bold ${acceptClicks ? 'text-emerald-300' : 'text-zinc-600'}`}>{acceptClicks}</div>
                                    </div>
                                    <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
                                        <div className="text-[10px] uppercase text-zinc-500 mb-1">CTA Odrzuć</div>
                                        <div className={`text-xl font-bold ${rejectClicks ? 'text-rose-300' : 'text-zinc-600'}`}>{rejectClicks}</div>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                            {challenge.timeline.length === 0 ? (
                                <p className="text-sm text-zinc-500 italic">Brak zarejestrowanych zdarzeń.</p>
                            ) : (
                                [...challenge.timeline]
                                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                    .map((event) => {
                                        const meta = prettifyEvent(event);
                                        const Icon = meta.icon;
                                        const md = safeJson<{ ua?: string; ref?: string; ip?: string }>(event.metadata);
                                        const device = md?.ua
                                            ? /mobile|iphone|android/i.test(md.ua) ? 'mobile' : 'desktop'
                                            : null;
                                        return (
                                            <div key={event.id} className={`flex items-start gap-3 p-2.5 rounded-lg border ${meta.color}`}>
                                                <Icon size={16} className="mt-0.5 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium">{meta.label}</div>
                                                    {event.event_description && event.event_description !== meta.label && (
                                                        <div className="text-xs opacity-80 mt-0.5">{event.event_description}</div>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] opacity-70 mt-1">
                                                        <span>
                                                            {new Date(event.created_at).toLocaleString('pl-PL', {
                                                                day: '2-digit', month: '2-digit', year: '2-digit',
                                                                hour: '2-digit', minute: '2-digit',
                                                            })}
                                                        </span>
                                                        {device && (<><span>·</span><span>{device}</span></>)}
                                                        {md?.ref && (<><span>·</span><span className="truncate max-w-[180px]" title={md.ref}>ref: {md.ref}</span></>)}
                                                        {md?.ip && (<><span>·</span><span className="font-mono">{md.ip}</span></>)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
