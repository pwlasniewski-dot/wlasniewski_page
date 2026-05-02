'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageCircle, ArrowLeft, Sparkles } from 'lucide-react';

type Conversation = {
    partner: {
        id: number;
        display_name: string;
        city: string | null;
        photos: { url: string }[];
    };
    last_message: {
        body: string;
        from_profile_id: number;
        created_at: string;
    } | null;
    unread_count: number;
    matched_at: string | null;
};

function getToken() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('user_token') || localStorage.getItem('client_token') || '';
}

function timeAgo(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'teraz';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} d`;
    return d.toLocaleDateString('pl-PL');
}

export default function MessagesListClient() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            window.location.href = '/logowanie?redirect=/foto-match/wiadomosci';
            return;
        }
        fetch('/api/foto-match/messages', { headers: { Authorization: `Bearer ${token}` } })
            .then(async r => {
                const d = await r.json();
                if (!r.ok) {
                    if (d.error === 'NO_FOTO_MATCH_PROFILE') {
                        window.location.href = '/foto-match/onboarding';
                        return;
                    }
                    if (d.error === 'PROFILE_NOT_ACTIVE') {
                        setError('Twój profil jeszcze czeka na weryfikację.');
                        return;
                    }
                    setError(d.error || 'Błąd ładowania wiadomości');
                    return;
                }
                setConversations(d.conversations || []);
            })
            .catch(e => setError(String(e?.message || e)))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Wczytywanie…
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-white">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <Link href="/foto-match" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-amber-400 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Foto-Match
                </Link>
                <h1 className="text-3xl font-black mb-1 flex items-center gap-2">
                    <MessageCircle className="w-7 h-7 text-amber-400" /> Wiadomości
                </h1>
                <p className="text-zinc-400 text-sm mb-6">Twoje rozmowy z osobami, z którymi macie wzajemny match.</p>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/40 text-rose-200 rounded-xl p-4 mb-4">
                        {error}
                    </div>
                )}

                {!error && conversations.length === 0 && (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center">
                        <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                        <p className="text-lg font-bold mb-2">Jeszcze brak rozmów</p>
                        <p className="text-zinc-400 text-sm mb-5">
                            Najpierw musisz mieć wzajemny <strong>match</strong> z drugą osobą — Wy oboje musicie się polubić.
                        </p>
                        <Link href="/foto-match/odkryj"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold hover:scale-[1.02] transition-transform">
                            Odkryj profile →
                        </Link>
                    </div>
                )}

                <ul className="space-y-2">
                    {conversations.map(c => {
                        const photo = c.partner.photos[0]?.url;
                        // "Moja wiadomość" = nadawca to NIE partner
                        const isFromMe = c.last_message ? c.last_message.from_profile_id !== c.partner.id : false;
                        const previewPrefix = c.last_message ? (isFromMe ? 'Ty: ' : '') : '';
                        const preview = c.last_message?.body || '✨ Macie nowy match — zacznij rozmowę!';
                        const timeIso = c.last_message?.created_at || c.matched_at;
                        return (
                            <li key={c.partner.id}>
                                <Link href={`/foto-match/wiadomosci/${c.partner.id}`}
                                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800 transition">
                                    <div className="relative shrink-0">
                                        {photo ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={photo} alt={c.partner.display_name}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-zinc-800" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">📸</div>
                                        )}
                                        {c.unread_count > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center border-2 border-zinc-950">
                                                {c.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="font-bold text-white truncate">{c.partner.display_name}</span>
                                            <span className="text-xs text-zinc-500 shrink-0">{timeAgo(timeIso)}</span>
                                        </div>
                                        <p className={`text-sm truncate ${c.unread_count > 0 ? 'text-white font-semibold' : 'text-zinc-400'}`}>
                                            {previewPrefix}{preview}
                                        </p>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </main>
    );
}
