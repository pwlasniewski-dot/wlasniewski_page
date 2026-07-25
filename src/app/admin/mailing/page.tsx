'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Mail, Send } from 'lucide-react';

type Template = { id: number; title: string; subject: string; content: string };

export default function MailingPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [consent, setConsent] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        fetch('/api/admin/marketing/templates', { headers: { Authorization: `Bearer ${token}` } })
            .then(async response => response.ok ? response.json() : [])
            .then(setTemplates)
            .catch(() => setTemplates([]));
    }, []);

    function useTemplate(templateId: string) {
        const template = templates.find(item => item.id === Number(templateId));
        if (template) {
            setSubject(template.subject);
            setContent(template.content);
        }
    }

    async function send(event: FormEvent) {
        event.preventDefault();
        setSending(true);
        setStatus(null);
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch('/api/admin/marketing/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipientEmail, subject, content, consentConfirmed: consent }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Nie udało się wysłać wiadomości.');
            setStatus('Wiadomość została wysłana i zapisana w historii.');
        } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Nie udało się wysłać wiadomości.');
        } finally {
            setSending(false);
        }
    }

    return <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-2"><Mail className="text-gold-400" /><h1 className="text-3xl font-bold text-white">Mailing</h1></div>
        <p className="text-zinc-400 mb-6">Wysyłaj pojedyncze wiadomości do klientów. Przed wysyłką potwierdź podstawę kontaktu.</p>
        <form onSubmit={send} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <label className="block text-sm text-zinc-300">Szablon (opcjonalnie)
                <select onChange={e => useTemplate(e.target.value)} defaultValue="" className="mt-1 w-full rounded bg-zinc-950 border border-zinc-700 p-3 text-white">
                    <option value="">Własna wiadomość</option>{templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
            </label>
            <label className="block text-sm text-zinc-300">Adres odbiorcy<input required type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} className="mt-1 w-full rounded bg-zinc-950 border border-zinc-700 p-3 text-white" /></label>
            <label className="block text-sm text-zinc-300">Temat<input required maxLength={180} value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full rounded bg-zinc-950 border border-zinc-700 p-3 text-white" /></label>
            <label className="block text-sm text-zinc-300">Treść HTML<textarea required maxLength={100000} rows={12} value={content} onChange={e => setContent(e.target.value)} className="mt-1 w-full rounded bg-zinc-950 border border-zinc-700 p-3 text-white font-mono text-sm" /></label>
            <label className="flex gap-3 text-sm text-zinc-300"><input required type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />Potwierdzam, że mam podstawę prawną i aktualną zgodę na kontakt marketingowy z tym odbiorcą.</label>
            <button disabled={sending || !consent} className="inline-flex items-center gap-2 rounded bg-gold-500 px-5 py-3 font-semibold text-black disabled:opacity-50"><Send size={18} />{sending ? 'Wysyłanie…' : 'Wyślij wiadomość'}</button>
            {status && <p className="text-sm text-zinc-200">{status}</p>}
        </form>
    </div>;
}
