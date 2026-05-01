'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Facebook, MessageCircle, Send, Mail, Copy, Check, Share2, Instagram,
    Sparkles, Users, Trophy, Loader2, ArrowLeft,
} from 'lucide-react';

interface Bonus {
    enabled: boolean;
    amount_grosze: number;
    percent: number;
    type: string;
    min_to_redeem: number;
    expires_days: number;
}

interface Referral {
    id: number;
    invite_token: string;
    invited_email: string | null;
    status: string;
    share_count: number;
    click_count: number;
    created_at: string;
    reward_voucher_code: string | null;
    reward_redeemed_at: string | null;
}

interface PayloadGet {
    referrals: Referral[];
    stats: { total: number; registered: number; active: number; rewarded: number };
    bonus: Bonus;
}

function formatBonus(b: Bonus): string {
    if (!b.enabled) return '';
    if (b.type === 'PERCENT') return `-${b.percent}%`;
    if (b.type === 'BOTH') return `${(b.amount_grosze / 100).toFixed(0)} zł + ${b.percent}%`;
    return `${(b.amount_grosze / 100).toFixed(0)} zł`;
}

export default function ZaprosPage() {
    const [data, setData] = useState<PayloadGet | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeToken, setActiveToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    function authHeaders(): HeadersInit {
        const t = typeof window !== 'undefined' ? localStorage.getItem('user_token') || localStorage.getItem('client_token') : null;
        return t ? { Authorization: `Bearer ${t}` } : {};
    }

    async function load() {
        setLoading(true);
        try {
            const r = await fetch('/api/foto-match/referrals', { headers: authHeaders() });
            if (r.status === 401 || r.status === 403) {
                setError('Musisz być zalogowany i mieć profil Foto-Match, by polecać znajomych.');
                return;
            }
            const j = (await r.json()) as PayloadGet;
            setData(j);
            if (j.referrals.length > 0) setActiveToken(j.referrals[0].invite_token);
        } catch {
            setError('Nie udało się załadować danych.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function createInvite() {
        setCreating(true);
        try {
            const r = await fetch('/api/foto-match/referrals', {
                method: 'POST',
                headers: { 'content-type': 'application/json', ...authHeaders() },
                body: JSON.stringify({}),
            });
            const j = await r.json();
            if (j.referral) {
                setActiveToken(j.referral.invite_token);
                await load();
            }
        } finally {
            setCreating(false);
        }
    }

    async function track(token: string, event: 'share' | 'click') {
        try {
            await fetch(`/api/foto-match/referrals/public/${token}`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ event }),
            });
        } catch { /* ignore */ }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <p className="text-lg mb-4">{error}</p>
                    <Link href="/konto" className="inline-block bg-amber-400 text-zinc-900 font-bold px-6 py-3 rounded-xl">
                        Wróć do panelu
                    </Link>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const shareUrl = activeToken ? `${window.location.origin}/foto-match/i/${activeToken}` : '';
    const ogPreview = activeToken ? `/api/og/foto-match-referral/${activeToken}` : '';
    const text = `Dołącz do Foto-Match — programu, który łączy ludzi do wspólnych sesji zdjęciowych. Sprawdź:`;
    const encUrl = encodeURIComponent(shareUrl);
    const encText = encodeURIComponent(text);

    const open = (url: string) => {
        if (activeToken) track(activeToken, 'share');
        window.open(url, '_blank', 'noopener,noreferrer,width=640,height=720');
    };

    const copyLink = async () => {
        if (!activeToken) return;
        await track(activeToken, 'share');
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Skopiuj link:', shareUrl);
        }
    };

    const nativeShare = async () => {
        if (!activeToken) return;
        await track(activeToken, 'share');
        const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
        if (nav.share) {
            try {
                await nav.share({ title: 'Foto-Match', text, url: shareUrl });
            } catch { /* anulował */ }
        } else {
            copyLink();
        }
    };

    const instagramShare = async () => {
        await copyLink();
        alert('Link skopiowany! Wklej go w Instagram Stories, w bio lub w wiadomości.');
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-400/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-pink-500/40 blur-3xl pointer-events-none" />

            <div className="relative max-w-4xl mx-auto px-6 pt-8 pb-20">
                <Link href="/konto" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6">
                    <ArrowLeft className="w-4 h-4" /> Panel klienta
                </Link>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <Sparkles className="w-4 h-4" /> Polecaj — Zarabiaj
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-3">Zaproś znajomych do Foto-Match</h1>
                    {data.bonus.enabled ? (
                        <p className="text-xl text-white/90 max-w-2xl mx-auto">
                            Za każdą polecioną osobę, która założy profil, otrzymujesz{' '}
                            <span className="font-black text-amber-300">{formatBonus(data.bonus)}</span>{' '}
                            rabatu na sesję.
                        </p>
                    ) : (
                        <p className="text-xl text-white/90">Zaproszenia są aktywne — bonus pojawi się wkrótce.</p>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <StatCard icon={<Users className="w-5 h-5" />} label="Wysłanych" value={data.stats.total} />
                    <StatCard icon={<Sparkles className="w-5 h-5" />} label="Zarejestrowanych" value={data.stats.registered} />
                    <StatCard icon={<Trophy className="w-5 h-5" />} label="Wykorzystanych" value={data.stats.rewarded} />
                </div>

                {/* Hero share card */}
                {!activeToken ? (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center">
                        <p className="text-lg mb-6">Wygeneruj swój pierwszy link polecający — to zajmie sekundę.</p>
                        <button
                            type="button"
                            onClick={createInvite}
                            disabled={creating}
                            className="bg-white text-purple-700 font-black text-lg px-8 py-4 rounded-2xl shadow-xl hover:bg-amber-300 hover:text-zinc-900 transition disabled:opacity-50"
                        >
                            {creating ? 'Tworzę…' : 'Generuj link polecający'}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8">
                        {/* Preview OG image */}
                        <div className="mb-6 rounded-2xl overflow-hidden shadow-2xl bg-black/30">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={ogPreview}
                                alt="Tak będzie wyglądać Twój post na Facebooku/Instagramie"
                                className="w-full h-auto block"
                            />
                        </div>

                        <p className="text-center text-xs text-white/80 mb-4 italic">
                            ☝️ Tak Twój link wyświetli się znajomym na Facebooku, Messengerze, WhatsAppie i Instagramie.
                        </p>

                        {/* Link box */}
                        <div className="bg-black/30 rounded-xl p-3 flex items-center gap-3 mb-5">
                            <code className="flex-1 text-sm text-white/90 truncate">{shareUrl}</code>
                            <button
                                type="button"
                                onClick={copyLink}
                                className={`px-3 py-2 rounded-lg text-sm font-bold transition ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-purple-700 hover:bg-amber-300'}`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Native share CTA */}
                        <button
                            type="button"
                            onClick={nativeShare}
                            className="w-full bg-gradient-to-r from-amber-300 to-pink-400 text-zinc-900 font-black text-lg py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition flex items-center justify-center gap-2 mb-5"
                        >
                            <Share2 className="w-5 h-5" />
                            Udostępnij teraz
                        </button>

                        {/* Social grid */}
                        <div className="grid grid-cols-4 gap-3">
                            <ShareButton
                                label="Facebook"
                                icon={<Facebook className="w-6 h-6" />}
                                color="bg-[#1877F2] hover:bg-[#0d65d9]"
                                onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encUrl}&quote=${encText}`)}
                            />
                            <ShareButton
                                label="Messenger"
                                icon={<MessageCircle className="w-6 h-6" />}
                                color="bg-gradient-to-br from-[#0084ff] to-[#a033ff] hover:opacity-90"
                                onClick={() => open(`https://www.facebook.com/dialog/send?link=${encUrl}&app_id=140586622674265&redirect_uri=${encUrl}`)}
                            />
                            <ShareButton
                                label="WhatsApp"
                                icon={<MessageCircle className="w-6 h-6" />}
                                color="bg-[#25D366] hover:bg-[#1ebe57]"
                                onClick={() => open(`https://wa.me/?text=${encText}%20${encUrl}`)}
                            />
                            <ShareButton
                                label="Instagram"
                                icon={<Instagram className="w-6 h-6" />}
                                color="bg-gradient-to-br from-[#feda75] via-[#fa7e1e] via-[#d62976] via-[#962fbf] to-[#4f5bd5] hover:opacity-90"
                                onClick={instagramShare}
                            />
                            <ShareButton
                                label="Telegram"
                                icon={<Send className="w-6 h-6" />}
                                color="bg-[#0088cc] hover:bg-[#006fa6]"
                                onClick={() => open(`https://t.me/share/url?url=${encUrl}&text=${encText}`)}
                            />
                            <ShareButton
                                label="X / Twitter"
                                icon={<span className="text-xl font-black">𝕏</span>}
                                color="bg-black hover:bg-zinc-800"
                                onClick={() => open(`https://twitter.com/intent/tweet?url=${encUrl}&text=${encText}`)}
                            />
                            <ShareButton
                                label="Email"
                                icon={<Mail className="w-6 h-6" />}
                                color="bg-zinc-700 hover:bg-zinc-600"
                                onClick={() => {
                                    if (activeToken) track(activeToken, 'share');
                                    window.location.href = `mailto:?subject=${encodeURIComponent('Foto-Match — zaproszenie')}&body=${encText}%20${encUrl}`;
                                }}
                            />
                            <ShareButton
                                label="Nowy link"
                                icon={<Sparkles className="w-6 h-6" />}
                                color="bg-white/15 hover:bg-white/25"
                                onClick={createInvite}
                            />
                        </div>
                    </div>
                )}

                {/* Lista poleceń */}
                {data.referrals.length > 0 && (
                    <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6">
                        <h2 className="text-xl font-black mb-4">Twoje polecenia</h2>
                        <div className="space-y-2">
                            {data.referrals.map(r => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setActiveToken(r.invite_token)}
                                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg text-left transition ${activeToken === r.invite_token ? 'bg-white/20 ring-2 ring-amber-300' : 'bg-black/20 hover:bg-black/30'}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-mono text-xs text-white/80 truncate">{r.invite_token.slice(0, 16)}…</p>
                                        <p className="text-xs text-white/60">
                                            {new Date(r.created_at).toLocaleDateString('pl-PL')} · {r.share_count} udostępnień · {r.click_count} kliknięć
                                        </p>
                                    </div>
                                    <StatusPill status={r.status} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-white/85 text-xs uppercase font-bold mb-1">
                {icon} {label}
            </div>
            <p className="text-3xl font-black">{value}</p>
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        PENDING: { label: 'Oczekuje', cls: 'bg-zinc-500/30 text-white' },
        REGISTERED: { label: 'Zarejestrowany', cls: 'bg-blue-500/40 text-white' },
        ACTIVE: { label: 'Aktywny', cls: 'bg-emerald-500/40 text-white' },
        REWARDED: { label: 'Bonus przyznany', cls: 'bg-amber-400 text-zinc-900' },
        EXPIRED: { label: 'Wygasł', cls: 'bg-zinc-700/50 text-white/60' },
        CANCELED: { label: 'Anulowany', cls: 'bg-rose-500/40 text-white' },
    };
    const m = map[status] || map.PENDING;
    return <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${m.cls}`}>{m.label}</span>;
}

function ShareButton({
    label,
    icon,
    color,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${color} text-white rounded-xl py-3 flex flex-col items-center justify-center gap-1 transition shadow-lg`}
            aria-label={label}
        >
            {icon}
            <span className="text-[10px] font-semibold leading-none mt-1">{label}</span>
        </button>
    );
}
