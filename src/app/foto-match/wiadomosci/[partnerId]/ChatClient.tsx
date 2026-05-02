'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, ShieldCheck } from 'lucide-react';

type Partner = {
    id: number;
    display_name: string;
    city: string | null;
    photos: { url: string }[];
};

type Message = {
    id: number;
    from_profile_id: number;
    to_profile_id: number;
    body: string;
    created_at: string;
    read_at: string | null;
};

function getToken() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('user_token') || localStorage.getItem('client_token') || '';
}

function fmtTime(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
        return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }) + ' ' +
        d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatClient({ partnerId }: { partnerId: string }) {
    const pid = parseInt(partnerId, 10);
    const [partner, setPartner] = useState<Partner | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }, 50);
    };

    useEffect(() => {
        const token = getToken();
        if (!token) {
            window.location.href = `/logowanie?redirect=${encodeURIComponent(`/foto-match/wiadomosci/${partnerId}`)}`;
            return;
        }
        if (Number.isNaN(pid)) { setError('Niepoprawny identyfikator'); setLoading(false); return; }

        Promise.all([
            fetch(`/api/foto-match/messages?with=${pid}`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`/api/foto-match/profile/${pid}`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
            .then(async ([rMsgs, rProf]) => {
                const dMsgs = await rMsgs.json();
                if (!rMsgs.ok) {
                    if (dMsgs.error === 'NO_MATCH') { setError('Nie macie jeszcze matcha — wzajemne polubienie wymagane.'); return; }
                    if (dMsgs.error === 'BLOCKED') { setError('Nie możesz pisać do tej osoby.'); return; }
                    if (dMsgs.error === 'PROFILE_NOT_ACTIVE') { setError('Twój profil czeka na weryfikację.'); return; }
                    setError(dMsgs.error || 'Błąd ładowania rozmowy');
                    return;
                }
                setMessages(dMsgs.messages || []);
                if (rProf.ok) {
                    const dProf = await rProf.json();
                    setPartner(dProf.profile);
                }
                scrollToBottom();
            })
            .catch(e => setError(String(e?.message || e)))
            .finally(() => setLoading(false));
    }, [pid, partnerId]);

    async function send() {
        const body = text.trim();
        if (!body || sending) return;
        setSending(true);
        try {
            const r = await fetch('/api/foto-match/messages', {
                method: 'POST',
                headers: { 'content-type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ to_profile_id: pid, body }),
            });
            const d = await r.json();
            if (!r.ok) {
                setError(d.error === 'RATE_LIMITED' ? 'Zbyt wiele wiadomości. Poczekaj chwilę.' :
                         d.error === 'NO_MATCH' ? 'Brak matcha.' :
                         d.error || 'Błąd wysyłania');
                return;
            }
            setMessages(prev => [...prev, d.message]);
            setText('');
            scrollToBottom();
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setSending(false);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Wczytywanie…
            </main>
        );
    }

    if (error && !partner) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
                <div className="bg-rose-500/10 border border-rose-500/40 text-rose-200 rounded-xl p-6 max-w-md text-center mb-4">
                    {error}
                </div>
                <Link href="/foto-match/wiadomosci" className="text-amber-400 hover:underline">← Wszystkie rozmowy</Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <Link href="/foto-match/wiadomosci" className="text-zinc-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    {partner?.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={partner.photos[0].url} alt={partner.display_name}
                            className="w-10 h-10 rounded-full object-cover border border-zinc-800" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800" />
                    )}
                    <div className="flex-1 min-w-0">
                        <Link href={`/foto-match/u/${pid}`}
                            className="font-bold truncate hover:text-amber-400 inline-flex items-center gap-1">
                            {partner?.display_name || `Profil ${pid}`}
                        </Link>
                        {partner?.city && <p className="text-xs text-zinc-500">{partner.city}</p>}
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
                <div className="max-w-2xl mx-auto space-y-2">
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-3">
                                <ShieldCheck className="w-3 h-3" /> Macie match
                            </div>
                            <p className="text-zinc-400 text-sm">Brak jeszcze wiadomości — napisz pierwsza/y!</p>
                        </div>
                    ) : (
                        messages.map(m => {
                            const mine = m.to_profile_id === pid; // wysłałem do partnera = ja
                            return (
                                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                                        mine
                                            ? 'bg-gradient-to-br from-amber-500 to-rose-500 text-white rounded-br-sm'
                                            : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                                    }`}>
                                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                        <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-zinc-500'}`}>
                                            {fmtTime(m.created_at)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/40 text-rose-200 rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Composer */}
            <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 px-4 py-3">
                <div className="max-w-2xl mx-auto flex gap-2">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                send();
                            }
                        }}
                        placeholder="Napisz wiadomość…"
                        rows={1}
                        maxLength={2000}
                        className="flex-1 resize-none bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none max-h-32"
                    />
                    <button
                        onClick={send}
                        disabled={!text.trim() || sending}
                        className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform"
                    >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </main>
    );
}
