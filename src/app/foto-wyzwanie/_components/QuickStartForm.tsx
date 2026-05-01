'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gift, ArrowRight, Mail, User as UserIcon, Phone, Heart, Shield } from 'lucide-react';

export default function QuickStartForm() {
    const router = useRouter();
    const [inviterName, setInviterName] = useState('');
    const [inviterEmail, setInviterEmail] = useState('');
    const [inviterPhone, setInviterPhone] = useState('');
    const [inviteeName, setInviteeName] = useState('');
    const [inviteeEmail, setInviteeEmail] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const valid =
        inviterName.trim().length >= 2 &&
        /\S+@\S+\.\S+/.test(inviterEmail) &&
        inviterPhone.trim().length >= 6 &&
        inviteeName.trim().length >= 2 &&
        /\S+@\S+\.\S+/.test(inviteeEmail) &&
        acceptTerms;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!valid) return;
        setSubmitting(true);
        const params = new URLSearchParams({
            inviter_name: inviterName.trim(),
            inviter_email: inviterEmail.trim(),
            inviter_phone: inviterPhone.trim(),
            invitee_name: inviteeName.trim(),
            invitee_email: inviteeEmail.trim(),
            skip_step1: '1',
        });
        router.push(`/foto-wyzwanie/stworz?${params.toString()}`);
    };

    return (
        <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-amber-300/40 via-rose-300/30 to-amber-300/40 rounded-3xl blur-2xl -z-10" />

            <form
                onSubmit={handleSubmit}
                className="bg-white/95 backdrop-blur-xl border border-amber-200 rounded-3xl shadow-2xl shadow-amber-500/20 p-6 md:p-8"
            >
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md">
                        <Gift className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-display font-bold text-xl text-stone-900 leading-tight">Stwórz wyzwanie w 30 sek</div>
                        <div className="text-xs text-stone-500">Bez zakładania konta</div>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Ty (zapraszający)</span>
                        <div className="flex-1 h-px bg-amber-100" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Field icon={<UserIcon className="w-4 h-4" />} placeholder="Twoje imię" value={inviterName} onChange={setInviterName} autoComplete="given-name" />
                        <Field icon={<Phone className="w-4 h-4" />} placeholder="Telefon" value={inviterPhone} onChange={setInviterPhone} type="tel" autoComplete="tel" />
                    </div>
                    <div className="mt-2">
                        <Field icon={<Mail className="w-4 h-4" />} placeholder="Twój email" value={inviterEmail} onChange={setInviterEmail} type="email" autoComplete="email" />
                    </div>
                </div>

                <div className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-700">On / Ona (zapraszany)</span>
                        <div className="flex-1 h-px bg-rose-100" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Field icon={<Heart className="w-4 h-4" />} placeholder="Imię osoby" value={inviteeName} onChange={setInviteeName} />
                        <Field icon={<Mail className="w-4 h-4" />} placeholder="Email osoby" value={inviteeEmail} onChange={setInviteeEmail} type="email" />
                    </div>
                </div>

                <label className="flex items-start gap-2 mb-5 cursor-pointer text-xs text-stone-600">
                    <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                        Akceptuję{' '}
                        <Link href="/regulamin" target="_blank" className="text-amber-700 underline hover:text-amber-800">regulamin</Link>{' '}
                        i{' '}
                        <Link href="/polityka-prywatnosci" target="_blank" className="text-amber-700 underline hover:text-amber-800">politykę prywatności</Link>.
                    </span>
                </label>

                <button
                    type="submit"
                    disabled={!valid || submitting}
                    className={`w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-base transition-all ${valid && !submitting
                        ? 'bg-gradient-to-r from-amber-600 to-rose-500 text-white shadow-lg shadow-amber-500/40 hover:shadow-xl hover:shadow-amber-500/60 hover:-translate-y-0.5 animate-pulse-soft'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        }`}
                >
                    <Gift className="w-5 h-5" />
                    {submitting ? 'Chwilę...' : 'Wybieram pakiet i termin'}
                    <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-center text-xs text-stone-500 mt-3 flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-600" />
                    100% gwarancja zwrotu, jeśli osoba odrzuci
                </p>
            </form>
        </div>
    );
}

function Field({
    icon, placeholder, value, onChange, type = 'text', autoComplete,
}: {
    icon: React.ReactNode;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    autoComplete?: string;
}) {
    return (
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">{icon}</div>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all text-sm"
            />
        </div>
    );
}
