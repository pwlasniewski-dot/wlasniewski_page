'use client';

/**
 * Success page after invitee accepts the photo-challenge invitation.
 *
 * Profesjonalne potwierdzenie rezerwacji:
 *  - bez "Hurra! 🎉" i animowanych emoji
 *  - karta podsumowania (data, godzina, miejsce, pakiet)
 *  - 3 realne akcje: pobierz voucher PDF, dodaj do kalendarza (.ics), kontakt z fotografem
 *  - 3-punktowa oś czasu "co dalej" (bez fałszywych obietnic udostępniania pustej galerii)
 *
 * Stary plik zachowany w `page.OLD_2026-04-28.tsx.bak`.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    Check, Download, CalendarPlus, Phone, Mail, MapPin,
    Clock, Package, ShieldCheck, Sparkles,
} from 'lucide-react';

interface ChallengeData {
    id: number;
    inviter_name: string;
    invitee_name: string;
    status: string;
    session_date?: string | null;
    package?: { name: string; challenge_price: number; accent_color?: string };
    location?: { name: string; address?: string; google_maps_url?: string };
    custom_location?: string;
    booking?: { date: string; start_time: string; end_time: string; status: string } | null;
}

import { BUSINESS_INFO } from '@/lib/business-info';

const PHOTOGRAPHER = {
    name: BUSINESS_INFO.name,
    studio: BUSINESS_INFO.tagline,
    phone: BUSINESS_INFO.phone,
    email: BUSINESS_INFO.email,
    nip: BUSINESS_INFO.nip,
    locationNote: BUSINESS_INFO.locationNote,
};

export default function ChallengeSuccessPage() {
    const params = useParams();
    const uniqueLink = params.unique_link as string;

    const [challenge, setChallenge] = useState<ChallengeData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await fetch(`/api/photo-challenge/${uniqueLink}`);
                const data = await res.json();
                if (active && data.success) setChallenge(data.challenge);
            } catch (e) {
                console.error(e);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [uniqueLink]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 flex items-center justify-center px-4">
                <div className="text-zinc-500 text-sm">Ładuję potwierdzenie…</div>
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 flex items-center justify-center px-4 text-center">
                <div className="max-w-md">
                    <h1 className="text-2xl font-display font-bold text-white mb-2">Nie znaleziono rezerwacji</h1>
                    <p className="text-zinc-400 mb-6 text-sm">Spróbuj otworzyć link z maila ponownie.</p>
                    <Link href="/foto-wyzwanie" className="inline-block px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg">
                        Wróć
                    </Link>
                </div>
            </div>
        );
    }

    const sessionDate = challenge.booking?.date || challenge.session_date;
    const formattedDate = sessionDate
        ? new Date(sessionDate).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : 'Termin do uzgodnienia';
    const formattedTime = challenge.booking?.start_time && challenge.booking?.end_time
        ? `${challenge.booking.start_time} – ${challenge.booking.end_time}`
        : (challenge.booking?.start_time || 'godzina do uzgodnienia');
    const locationLine = challenge.location?.name || challenge.custom_location || 'Lokalizacja do uzgodnienia';

    const voucherUrl = `/api/photo-challenge/${uniqueLink}/voucher`;
    const icsUrl = `/api/photo-challenge/${uniqueLink}/calendar.ics`;

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-zinc-900 text-white">
            <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
                {/* HERO — minimalistyczne potwierdzenie */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 mb-5">
                        <Check size={28} className="text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                        Rezerwacja potwierdzona
                    </h1>
                    <p className="text-zinc-400 text-sm md:text-base">
                        Dzięki, <span className="text-zinc-200 font-medium">{challenge.invitee_name}</span>. Wszystko ustawione.
                    </p>
                </div>

                {/* KARTA PODSUMOWANIA */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-gold-500/10 via-amber-500/5 to-transparent border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-gold-400" />
                            <span className="text-xs uppercase tracking-widest text-zinc-400">Szczegóły sesji</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5 uppercase tracking-wider">
                            Opłacone
                        </span>
                    </div>
                    <div className="p-6 space-y-4">
                        <Row icon={<Package size={16} />} label="Pakiet" value={challenge.package?.name || '—'} />
                        <Row icon={<Clock size={16} />} label="Data" value={formattedDate} />
                        <Row icon={<Clock size={16} />} label="Godzina" value={formattedTime} />
                        <Row
                            icon={<MapPin size={16} />}
                            label="Miejsce"
                            value={locationLine}
                            extra={challenge.location?.address}
                            link={challenge.location?.google_maps_url}
                        />
                    </div>
                </div>

                {/* AKCJE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <a
                        href={voucherUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-gold-500/40 rounded-xl px-5 py-4 transition-colors"
                    >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                            <Download size={18} className="text-gold-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white">Pobierz voucher PDF</div>
                            <div className="text-[11px] text-zinc-500">A4 z kodem QR i kodem weryfikacyjnym</div>
                        </div>
                    </a>
                    <a
                        href={icsUrl}
                        className="group flex items-center gap-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-gold-500/40 rounded-xl px-5 py-4 transition-colors"
                    >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                            <CalendarPlus size={18} className="text-gold-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white">Dodaj do kalendarza</div>
                            <div className="text-[11px] text-zinc-500">Plik .ics dla Google/Apple/Outlook</div>
                        </div>
                    </a>
                </div>

                {/* CO DALEJ — uczciwie, 3 punkty */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-5">Co dalej</h2>
                    <ol className="space-y-4">
                        <Step
                            num={1}
                            title="Potwierdzenie e-mail"
                            text={`Na Twój adres trafiło potwierdzenie z pełnymi szczegółami. Dałem też znać ${challenge.inviter_name}, że termin został przyjęty.`}
                        />
                        <Step
                            num={2}
                            title="Przypomnienie 24h przed sesją"
                            text="Wyślę krótką wiadomość z dokładnym miejscem zbiórki, sugestią ubioru i kontaktem awaryjnym."
                        />
                        <Step
                            num={3}
                            title="Sesja i odbiór zdjęć"
                            text="Po sesji otrzymasz prywatny link do galerii w jakości pełnej rozdzielczości. Nic publicznego — tylko dla Was."
                        />
                    </ol>
                </div>

                {/* KARTA FOTOGRAFA */}
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-amber-700 flex items-center justify-center flex-shrink-0 text-xl">
                            📸
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-white">{PHOTOGRAPHER.name}</div>
                            <div className="text-xs text-zinc-400">{PHOTOGRAPHER.studio}</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                                <ShieldCheck size={11} className="text-emerald-400" />
                                NIP {PHOTOGRAPHER.nip}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <a
                            href={`tel:${PHOTOGRAPHER.phone.replace(/\s/g, '')}`}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
                        >
                            <Phone size={14} />
                            <span className="font-mono text-xs">{PHOTOGRAPHER.phone}</span>
                        </a>
                        <a
                            href={`mailto:${PHOTOGRAPHER.email}`}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
                        >
                            <Mail size={14} />
                            <span className="text-xs">{PHOTOGRAPHER.email}</span>
                        </a>
                    </div>
                </div>

                {/* Footer mini */}
                <div className="text-center text-[11px] text-zinc-600 pt-4 border-t border-zinc-900">
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

function Row({
    icon, label, value, extra, link,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    extra?: string;
    link?: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800/80 text-zinc-400 flex items-center justify-center">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
                <div className="text-sm font-medium text-white capitalize-first">{value}</div>
                {extra && <div className="text-xs text-zinc-400 mt-0.5">{extra}</div>}
                {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 mt-1">
                        <MapPin size={11} /> Otwórz w Google Maps
                    </a>
                )}
            </div>
        </div>
    );
}

function Step({ num, title, text }: { num: number; title: string; text: string }) {
    return (
        <li className="flex gap-4">
            <div className="flex-shrink-0 w-7 h-7 rounded-full border border-gold-500/40 text-gold-400 text-xs font-bold flex items-center justify-center">
                {num}
            </div>
            <div className="flex-1 pt-0.5">
                <div className="text-sm font-semibold text-white mb-1">{title}</div>
                <div className="text-xs text-zinc-400 leading-relaxed">{text}</div>
            </div>
        </li>
    );
}
