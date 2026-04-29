'use client';

/**
 * InviteClient — pełna wersja "trust-rebuild" (2026-04-28).
 *
 * Cele tej strony:
 *  1. Maksymalna wiarygodność: zaproszony nie ma żadnego powodu, żeby się wycofać.
 *  2. Zero kłamstw: nie ma fałszywego "10% rabatu" ani liczników FOMO. Cena = cena.
 *  3. Weryfikacja "OLX-style": kod + zamaskowany kontakt zapraszającego, do potwierdzenia w rozmowie.
 *  4. Dwa kroki decyzji (handshake): "Pokaż przyciski" → "Potwierdzam udział".
 *  5. Czysta ścieżka odrzucenia (zero presji, zachowuje twarz).
 *
 * Stary plik zachowany w `InviteClient.OLD_2026-04-28.tsx.bak`.
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Heart, Check, X, ShieldCheck, Star, MapPin, Camera, Award,
    Lock, Phone, Mail, MessageCircle, Share2, Facebook, Copy, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useChallengeTracking, trackChallengeEvent } from '@/lib/challenge-tracking';

interface PackageData {
    package_name: string;
    package_description?: string;
    challenge_price: number;
    base_price?: number;
    included_items?: string;
    accent_color?: string;
}

interface LocationData {
    location_name: string;
    location_description?: string;
    address?: string;
    google_maps_url?: string;
}

interface ChallengeData {
    id: number;
    inviter_name: string;
    invitee_name: string;
    package_id: number;
    location_id?: number;
    status: string;
    short_code: string;
    inviter_contact_masked: string;
    inviter_contact_type: 'email' | 'phone' | string;
    package?: PackageData;
    location?: LocationData;
    acceptance_deadline?: string | null;
}

interface Props {
    initialChallenge: ChallengeData | null;
    uniqueLink: string;
}

import { BUSINESS_INFO } from '@/lib/business-info';

const PHOTOGRAPHER = {
    name: BUSINESS_INFO.name,
    studio: BUSINESS_INFO.tagline,
    yearsActive: 12,
    googleReviewsUrl: 'https://g.page/r/wlasniewski-fotografia/review',
    portfolioUrl: '/portfolio',
    aboutUrl: '/o-mnie',
    phone: BUSINESS_INFO.phone,
    email: BUSINESS_INFO.email,
    nip: BUSINESS_INFO.nip,
    addressShort: BUSINESS_INFO.region,
    locationNote: BUSINESS_INFO.locationNote,
};

export default function InviteClient({ initialChallenge, uniqueLink }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const acceptToken = searchParams?.get('t') || null;
    const challenge = initialChallenge;

    const [responded, setResponded] = useState<'accepted' | 'rejected' | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [requestingLink, setRequestingLink] = useState(false);
    const [requestedLinkMasked, setRequestedLinkMasked] = useState<string | null>(null);

    const [shareUrl, setShareUrl] = useState('');
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setShareUrl(`${window.location.origin}/foto-wyzwanie/invite/${uniqueLink}`);
        }
    }, [uniqueLink]);

    // Track page view + scroll milestones (best-effort, idempotent server-side)
    useChallengeTracking(challenge ? uniqueLink : null);

    if (!challenge) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="text-5xl mb-4">🔍</div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Nie znaleziono zaproszenia</h1>
                    <p className="text-zinc-400 mb-8">Link mógł wygasnąć, zostać odwołany lub jest błędny. Skontaktuj się z osobą, która Ci go wysłała.</p>
                    <Link href="/foto-wyzwanie" className="inline-block px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-colors">
                        Czym jest Foto Wyzwanie?
                    </Link>
                </div>
            </div>
        );
    }

    const price = challenge.package?.challenge_price ?? 0;
    const accent = challenge.package?.accent_color || '#d4af37';
    const includedItems = (() => {
        if (!challenge.package?.included_items) return [] as string[];
        try {
            const parsed = JSON.parse(challenge.package.included_items);
            return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
        } catch {
            return challenge.package.included_items.split('\n').map(s => s.trim()).filter(Boolean);
        }
    })();

    const handleAccept = async () => {
        if (submitting) return;
        trackChallengeEvent(uniqueLink, 'cta_accept_clicked');

        // Bez tokena = nie da się zaakceptować. Zaproponuj wysłanie linku na maila.
        if (!acceptToken) {
            await handleRequestLink();
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/photo-challenge/${uniqueLink}/accept-invite`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setResponded('accepted');
                setTimeout(() => router.push(`/foto-wyzwanie/accept/${uniqueLink}?t=${encodeURIComponent(acceptToken)}`), 1500);
            } else {
                alert(data.error || 'Coś poszło nie tak. Spróbuj ponownie za chwilę.');
            }
        } catch (e) {
            console.error(e);
            alert('Błąd połączenia. Spróbuj ponownie.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestLink = async () => {
        if (requestingLink) return;
        setRequestingLink(true);
        try {
            const res = await fetch(`/api/photo-challenge/${uniqueLink}/request-accept`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setRequestedLinkMasked(data.masked || 'Twój adres email');
            } else {
                alert(data.error || 'Nie udało się wysłać linku. Spróbuj ponownie.');
            }
        } catch (e) {
            console.error(e);
            alert('Błąd połączenia.');
        } finally {
            setRequestingLink(false);
        }
    };

    const handleReject = async () => {
        if (submitting) return;
        trackChallengeEvent(uniqueLink, 'cta_reject_clicked');
        setSubmitting(true);
        try {
            const res = await fetch(`/api/photo-challenge/${uniqueLink}/reject`, { method: 'POST' });
            const data = await res.json();
            if (data.success) setResponded('rejected');
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (responded === 'accepted') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-zinc-900 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="text-7xl mb-4">✨</div>
                    <h2 className="text-4xl font-display font-bold text-gold-400 mb-3">Świetnie, {challenge.invitee_name}!</h2>
                    <p className="text-lg text-zinc-300 mb-2">Za chwilę otworzy się kalendarz.</p>
                    <p className="text-sm text-zinc-500">Wybierzesz datę i godzinę, która Ci pasuje.</p>
                </div>
            </div>
        );
    }

    if (responded === 'rejected') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white py-20 px-4">
                <div className="max-w-md mx-auto bg-zinc-900/60 rounded-2xl p-8 border border-zinc-800 text-center">
                    <div className="text-5xl mb-4">🤝</div>
                    <h2 className="text-2xl font-display font-bold mb-3">Dzięki za odpowiedź</h2>
                    <p className="text-zinc-400 mb-2">Dałem znać osobie, która Cię zaprosiła.</p>
                    <p className="text-zinc-500 text-sm mb-8">Bez presji, bez pytań. Może innym razem.</p>
                    <Link href="/foto-wyzwanie" className="inline-block px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors">
                        Zobacz, czym jest Foto Wyzwanie
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-zinc-900 text-white">
            {/* TRUST BAR */}
            <div className="bg-zinc-950/80 backdrop-blur border-b border-zinc-800">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <ShieldCheck size={16} />
                        <span className="hidden sm:inline">Zweryfikowane studio</span>
                        <span className="sm:hidden">Zweryfikowane</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Lock size={14} />
                        <span>Płatność PayU · SSL</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-amber-400">
                        <Star size={14} fill="currentColor" />
                        <span>Opinie Google</span>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-10">
                {/* HERO */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-medium">
                        <Heart size={14} className="fill-pink-400 text-pink-400" />
                        <span>Zaproszenie imienne — tylko dla Ciebie</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-display font-bold mb-3 leading-tight">
                        <span className="block text-zinc-300 text-2xl md:text-3xl font-light mb-1">
                            {challenge.invitee_name},
                        </span>
                        <span className="bg-gradient-to-r from-amber-300 via-gold-400 to-pink-400 bg-clip-text text-transparent">
                            {challenge.inviter_name}
                        </span>
                        <span className="block text-2xl md:text-3xl font-light text-zinc-300 mt-1">
                            zaprasza Cię na sesję foto
                        </span>
                    </h1>
                    <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto">
                        Sesja jest <strong className="text-emerald-400">już opłacona</strong>. Nic od Ciebie nie wymagamy — wystarczy, że potwierdzisz, że chcesz przyjść.
                    </p>
                </div>

                {/* WERYFIKACJA */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 mb-6">
                    <div className="flex items-start gap-3">
                        <ShieldCheck size={22} className="text-emerald-400 flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white mb-2">Sprawdź, że to prawdziwe zaproszenie</h3>
                            <p className="text-xs text-zinc-400 mb-3">
                                Zadzwoń lub napisz do <strong className="text-zinc-200">{challenge.inviter_name}</strong> i poproś o potwierdzenie kodu.
                                Prawdziwy zapraszający zna ten kod — oszust nie.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="bg-zinc-950 border border-gold-500/40 rounded-lg px-4 py-2">
                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">Kod weryfikacyjny</div>
                                    <div className="text-2xl font-mono font-bold text-gold-400 tracking-widest">
                                        {challenge.short_code}
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-400 flex items-center gap-2">
                                    {challenge.inviter_contact_type === 'phone' ? <Phone size={12} /> : <Mail size={12} />}
                                    <span className="font-mono">{challenge.inviter_contact_masked || '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* OFERTA */}
                {challenge.package && (
                    <div
                        className="bg-zinc-900/60 rounded-2xl p-6 mb-6 border"
                        style={{ borderColor: `${accent}40` }}
                    >
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1 min-w-0">
                                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Pakiet</div>
                                <h2 className="text-2xl font-display font-bold" style={{ color: accent }}>
                                    {challenge.package.package_name}
                                </h2>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-2xl font-bold text-white">{price} zł</div>
                                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5 mt-1">
                                    <Check size={10} />
                                    Już opłacone
                                </div>
                            </div>
                        </div>
                        {challenge.package.package_description && (
                            <p className="text-sm text-zinc-300 mb-4 leading-relaxed">
                                {challenge.package.package_description}
                            </p>
                        )}
                        {includedItems.length > 0 && (
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                {includedItems.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                        <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* LOKALIZACJA */}
                {challenge.location && (
                    <div className="bg-zinc-900/40 rounded-xl p-5 mb-6 border border-zinc-800">
                        <div className="flex items-start gap-3">
                            <MapPin size={20} className="text-gold-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Proponowana lokalizacja</div>
                                <h3 className="text-lg font-bold text-white mb-1">{challenge.location.location_name}</h3>
                                {challenge.location.address && (
                                    <p className="text-sm text-zinc-400">{challenge.location.address}</p>
                                )}
                                {challenge.location.location_description && (
                                    <p className="text-sm text-zinc-400 mt-2">{challenge.location.location_description}</p>
                                )}
                                {challenge.location.google_maps_url && (
                                    <a
                                        href={challenge.location.google_maps_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => trackChallengeEvent(uniqueLink, 'maps_opened')}
                                        className="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 mt-2"
                                    >
                                        <MapPin size={12} />
                                        Otwórz w Google Maps
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* KARTA FOTOGRAFA */}
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 mb-6 border border-zinc-800">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 to-amber-700 flex items-center justify-center flex-shrink-0 text-2xl">
                            📸
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white">{PHOTOGRAPHER.name}</h3>
                            <p className="text-xs text-zinc-400 mb-2">{PHOTOGRAPHER.studio} · {PHOTOGRAPHER.yearsActive} lat doświadczenia</p>
                            <p className="text-xs text-zinc-500">{PHOTOGRAPHER.addressShort}</p>
                            <div className="flex flex-wrap gap-3 mt-3 text-xs">
                                <a href={PHOTOGRAPHER.googleReviewsUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300">
                                    <Star size={12} fill="currentColor" />
                                    Opinie Google
                                </a>
                                <Link href={PHOTOGRAPHER.portfolioUrl} className="inline-flex items-center gap-1 text-zinc-400 hover:text-white">
                                    <Camera size={12} />
                                    Portfolio
                                </Link>
                                <Link href={PHOTOGRAPHER.aboutUrl} className="inline-flex items-center gap-1 text-zinc-400 hover:text-white">
                                    <Award size={12} />
                                    O mnie
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-800">
                        <a href={`tel:${PHOTOGRAPHER.phone.replace(/\s/g, '')}`}
                            className="flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-white transition-colors">
                            <Phone size={14} />
                            <span className="font-mono">{PHOTOGRAPHER.phone}</span>
                        </a>
                        <a href={`mailto:${PHOTOGRAPHER.email}`}
                            className="flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-white transition-colors">
                            <Mail size={14} />
                            <span className="text-xs">Napisz</span>
                        </a>
                    </div>
                </div>

                {/* GREEN-FLAG LIST */}
                <details className="bg-zinc-900/40 rounded-xl border border-zinc-800 mb-6 group" open={showDetails}>
                    <summary
                        onClick={(e) => {
                            e.preventDefault();
                            const next = !showDetails;
                            setShowDetails(next);
                            if (next) trackChallengeEvent(uniqueLink, 'package_details_opened');
                        }}
                        className="cursor-pointer p-5 flex items-center justify-between text-sm font-medium text-white list-none"
                    >
                        <span className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-emerald-400" />
                            Dlaczego to bezpieczne?
                        </span>
                        {showDetails ? <ChevronUp size={18} className="text-zinc-500" /> : <ChevronDown size={18} className="text-zinc-500" />}
                    </summary>
                    <div className="px-5 pb-5 space-y-2 text-sm text-zinc-300">
                        <div className="flex items-start gap-2">
                            <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span><strong>Zero opłat z Twojej strony.</strong> Sesja jest już opłacona przez {challenge.inviter_name}.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span><strong>Możesz odrzucić jednym klikiem.</strong> Bez tłumaczenia, bez konsekwencji.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span><strong>Nie podajesz żadnych danych płatniczych.</strong> Wybierasz tylko datę.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span><strong>Studio z NIP {PHOTOGRAPHER.nip}</strong> — działalność zarejestrowana w Polsce.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span><strong>RODO-OK.</strong> Twoje dane służą tylko do organizacji sesji. Nie sprzedajemy ich nikomu.</span>
                        </div>
                    </div>
                </details>

                {/* DECYZJA — handshake 2-stopniowy */}
                {requestedLinkMasked ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-6 mb-6 text-center">
                        <div className="text-4xl mb-2">📬</div>
                        <h3 className="text-lg font-bold text-emerald-300 mb-1">Wysłaliśmy Ci osobisty link</h3>
                        <p className="text-sm text-zinc-300 mb-1">Sprawdź skrzynkę: <strong className="text-white font-mono">{requestedLinkMasked}</strong></p>
                        <p className="text-xs text-zinc-500">Kliknij w link z maila, żeby zaakceptować wyzwanie. (Folder spam też warto sprawdzić.)</p>
                    </div>
                ) : !acceptToken ? (
                    <div className="bg-amber-500/5 rounded-2xl p-6 border border-amber-500/30 mb-6">
                        <div className="flex items-start gap-3 mb-4">
                            <Lock size={20} className="text-amber-400 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-sm font-bold text-amber-200 mb-1">Tylko Ty możesz zaakceptować</h3>
                                <p className="text-xs text-zinc-400">Zaproszenie potwierdzasz osobistym linkiem z maila — to gwarancja, że nikt nie zaakceptuje za Ciebie.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRequestLink}
                            disabled={requestingLink}
                            className="w-full py-4 rounded-xl font-bold text-base bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
                        >
                            <Mail size={18} />
                            {requestingLink ? 'Wysyłam…' : 'Wyślij mi osobisty link na maila'}
                        </button>
                        <p className="text-center text-[11px] text-zinc-500 mt-3">
                            Link trafi na adres podany przez {challenge.inviter_name}.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        <button
                            onClick={handleAccept}
                            disabled={submitting}
                            className="py-4 rounded-xl font-bold text-base bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
                        >
                            <Check size={20} />
                            {submitting ? 'Wysyłam…' : 'Potwierdzam udział'}
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={submitting}
                            className="py-4 rounded-xl font-bold text-base bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <X size={20} />
                            Tym razem nie
                        </button>
                    </div>
                )}

                {challenge.acceptance_deadline && (
                    <p className="text-center text-xs text-zinc-500 mb-8">
                        Zaproszenie ważne do <span className="text-zinc-400">{new Date(challenge.acceptance_deadline).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </p>
                )}

                {/* SHARE — opcjonalne */}
                <details className="bg-zinc-900/30 rounded-xl border border-zinc-800/60">
                    <summary
                        onClick={(e) => {
                            e.preventDefault();
                            const next = !shareOpen;
                            setShareOpen(next);
                            if (next) trackChallengeEvent(uniqueLink, 'shared_clicked', { description: 'share panel opened' });
                        }}
                        className="cursor-pointer px-5 py-4 flex items-center justify-between text-xs font-medium text-zinc-400 hover:text-zinc-200 list-none"
                    >
                        <span className="flex items-center gap-2">
                            <Share2 size={14} />
                            Chcesz pokazać komuś to zaproszenie?
                        </span>
                        {shareOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </summary>
                    {shareOpen && shareUrl && (
                        <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`Zobacz, dostałem/am zaproszenie na sesję foto: ${shareUrl}`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex flex-col items-center gap-1 py-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-xs text-zinc-300"
                            >
                                <MessageCircle size={18} className="text-emerald-400" />
                                WhatsApp
                            </a>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex flex-col items-center gap-1 py-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-xs text-zinc-300"
                            >
                                <Facebook size={18} className="text-blue-400" />
                                Facebook
                            </a>
                            <a
                                href={`mailto:?subject=${encodeURIComponent('Zaproszenie na sesję foto')}&body=${encodeURIComponent(`Zobacz: ${shareUrl}`)}`}
                                className="flex flex-col items-center gap-1 py-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-xs text-zinc-300"
                            >
                                <Mail size={18} className="text-zinc-400" />
                                Email
                            </a>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(shareUrl);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="flex flex-col items-center gap-1 py-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-xs text-zinc-300"
                            >
                                <Copy size={18} className={copied ? 'text-emerald-400' : 'text-zinc-400'} />
                                {copied ? 'Skopiowano' : 'Kopiuj link'}
                            </button>
                        </div>
                    )}
                </details>

                <div className="text-center mt-10 pt-6 border-t border-zinc-900 text-[11px] text-zinc-600">
                    <p>
                        Foto Wyzwanie · {PHOTOGRAPHER.studio} · NIP {PHOTOGRAPHER.nip}
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-3">
                        <Link href="/regulamin" className="hover:text-zinc-400">Regulamin</Link>
                        <span>·</span>
                        <Link href="/polityka-prywatnosci" className="hover:text-zinc-400">Prywatność</Link>
                        <span>·</span>
                        <Link href="/kontakt" className="hover:text-zinc-400">Kontakt</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
