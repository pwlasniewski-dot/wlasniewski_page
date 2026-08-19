'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Check, CheckCircle2, LoaderCircle } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
    formatDronePrice,
    getDronePhotographyPackage,
    type DroneBookingCopy,
    type DronePhotographyPackage,
} from '@/lib/dronePhotographyOffer';

type FormState = {
    clientName: string;
    companyName: string;
    email: string;
    phone: string;
    city: string;
    preferredDate: string;
    address: string;
    goal: string;
    notes: string;
    consent: boolean;
};

const initialForm: FormState = {
    clientName: '',
    companyName: '',
    email: '',
    phone: '',
    city: '',
    preferredDate: '',
    address: '',
    goal: '',
    notes: '',
    consent: false,
};

export default function DronePhotographyBookingForm({
    packages,
    areas,
    copy,
}: {
    packages: DronePhotographyPackage[];
    areas: string[];
    copy: DroneBookingCopy;
}) {
    const searchParams = useSearchParams();
    const { trackEvent } = useAnalytics();
    const started = useRef(false);
    const [packageSlug, setPackageSlug] = useState(searchParams.get('pakiet') || 'nieruchomosc-foto');
    const selectedPackage = useMemo(() => getDronePhotographyPackage(packageSlug, packages), [packageSlug, packages]);
    const [form, setForm] = useState<FormState>(initialForm);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [orderId, setOrderId] = useState<number | null>(null);

    useEffect(() => {
        void trackEvent('drone_booking_view', {
            package_slug: selectedPackage.slug,
            package_price: selectedPackage.price,
            source: searchParams.get('source') || 'direct',
        });
    }, []);

    function markStarted() {
        if (started.current) return;
        started.current = true;
        void trackEvent('drone_booking_started', {
            package_slug: selectedPackage.slug,
            source: searchParams.get('source') || 'direct',
        });
    }

    function validate() {
        if (form.clientName.trim().length < 2) return 'Wpisz imię i nazwisko.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Wpisz prawidłowy adres e-mail.';
        if (form.phone.replace(/\D/g, '').length < 7) return 'Wpisz numer telefonu.';
        if (!form.city.trim()) return 'Wpisz miejscowość realizacji.';
        if (!form.preferredDate) return 'Wybierz preferowaną datę.';
        if (!form.goal) return 'Wybierz główne zadanie materiału.';
        if (!form.consent) return 'Zaznacz zgodę na kontakt w sprawie zlecenia.';
        return null;
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const validationError = validate();
        if (validationError) {
            setStatus('error');
            setMessage(validationError);
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch('/api/drone/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_name: form.clientName.trim(),
                    company_name: form.companyName.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim(),
                    package_slug: selectedPackage.slug,
                    city: form.city.trim(),
                    preferred_date: form.preferredDate,
                    address: form.address.trim(),
                    goal: form.goal,
                    notes: form.notes.trim(),
                    source: searchParams.get('source') || 'direct',
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Nie udało się wysłać rezerwacji.');

            setOrderId(data.id);
            setStatus('success');
            await trackEvent('drone_booking_submitted', {
                package_slug: selectedPackage.slug,
                package_price: selectedPackage.price,
                city: form.city.trim(),
                order_id: data.id,
                source: searchParams.get('source') || 'direct',
            });
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Nie udało się wysłać rezerwacji. Spróbuj ponownie.');
        }
    }

    if (status === 'success') {
        return (
            <div className="border border-[#b8a889] bg-[#fffaf1] p-7 sm:p-10">
                <CheckCircle2 className="text-[#8a7048]" size={42} strokeWidth={1.5} />
                <h2 className="mt-6 font-display text-4xl text-[#28221c]">{copy.successTitle}</h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[#686057]">
                    {copy.successNumberLabel}: <strong className="text-[#28221c]">#{orderId}</strong>. {copy.successText}
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link href="/fotografia-z-drona" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#28221c] px-6 py-3 text-xs font-bold uppercase tracking-[.14em] text-white"><ArrowLeft size={16} /> {copy.backToOfferLabel}</Link>
                    <Link href="/konto" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#b8a889] px-6 py-3 text-xs font-bold uppercase tracking-[.14em] text-[#28221c]">{copy.accountLabel}</Link>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={submit} onFocus={markStarted} className="space-y-8">
            <fieldset>
                <legend className="text-xs font-bold uppercase tracking-[.22em] text-[#8a7048]">{copy.packageLegend}</legend>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {packages.filter(item => item.active !== false).map(item => (
                        <label key={item.slug} className={`cursor-pointer border p-5 transition ${selectedPackage.slug === item.slug ? 'border-[#8a7048] bg-[#fffaf1] shadow-[0_14px_40px_rgba(78,63,43,.08)]' : 'border-[#d5cabd] bg-white/40 hover:border-[#a99b89]'}`}>
                            <input type="radio" name="package" value={item.slug} checked={selectedPackage.slug === item.slug} onChange={() => setPackageSlug(item.slug)} className="sr-only" />
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="font-semibold text-[#28221c]">{item.name}</div>
                                    <div className="mt-1 text-xs leading-5 text-[#686057]">{item.summary}</div>
                                </div>
                                <div className="shrink-0 font-display text-2xl text-[#8a7048]">{formatDronePrice(item)}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </fieldset>

            <fieldset>
                <legend className="text-xs font-bold uppercase tracking-[.22em] text-[#8a7048]">{copy.locationLegend}</legend>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                    <Field label={copy.cityLabel} required>
                        <input list="drone-cities" value={form.city} onChange={event => setForm(current => ({ ...current, city: event.target.value }))} placeholder={copy.cityPlaceholder} className="field" />
                        <datalist id="drone-cities">{areas.map(city => <option key={city} value={city} />)}</datalist>
                    </Field>
                    <Field label={copy.dateLabel} required>
                        <input type="date" value={form.preferredDate} min={new Date().toISOString().slice(0, 10)} onChange={event => setForm(current => ({ ...current, preferredDate: event.target.value }))} className="field" />
                    </Field>
                    <Field label={copy.addressLabel}>
                        <input value={form.address} onChange={event => setForm(current => ({ ...current, address: event.target.value }))} placeholder={copy.addressPlaceholder} className="field" />
                    </Field>
                    <Field label={copy.goalLabel} required>
                        <select value={form.goal} onChange={event => setForm(current => ({ ...current, goal: event.target.value }))} className="field">
                            <option value="">Wybierz...</option>
                            {copy.goalOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </Field>
                </div>
            </fieldset>

            <fieldset>
                <legend className="text-xs font-bold uppercase tracking-[.22em] text-[#8a7048]">{copy.contactLegend}</legend>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                    <Field label={copy.clientNameLabel} required><input value={form.clientName} onChange={event => setForm(current => ({ ...current, clientName: event.target.value }))} autoComplete="name" className="field" /></Field>
                    <Field label={copy.companyLabel}><input value={form.companyName} onChange={event => setForm(current => ({ ...current, companyName: event.target.value }))} autoComplete="organization" className="field" /></Field>
                    <Field label={copy.emailLabel} required><input type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} autoComplete="email" className="field" /></Field>
                    <Field label={copy.phoneLabel} required><input type="tel" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} autoComplete="tel" className="field" /></Field>
                    <div className="md:col-span-2">
                        <Field label={copy.notesLabel}>
                            <textarea value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} rows={4} placeholder={copy.notesPlaceholder} className="field resize-y" />
                        </Field>
                    </div>
                </div>
            </fieldset>

            {status === 'error' && <div role="alert" className="flex gap-3 border border-red-300 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={19} className="shrink-0" /> {message}</div>}

            <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#686057]">
                <input type="checkbox" checked={form.consent} onChange={event => setForm(current => ({ ...current, consent: event.target.checked }))} className="mt-1 h-4 w-4 accent-[#8a7048]" />
                <span>{copy.consentText} <Link href="/polityka-prywatnosci" className="underline">{copy.privacyLabel}</Link>.</span>
            </label>

            <div className="border-t border-[#d5cabd] pt-7">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <div className="text-sm font-semibold text-[#28221c]">{selectedPackage.name}</div>
                        <div className="mt-1 text-xs text-[#686057]">{copy.noPaymentText}</div>
                    </div>
                    <button type="submit" disabled={status === 'loading'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#28221c] px-8 py-3 text-xs font-bold uppercase tracking-[.14em] text-white transition hover:bg-[#8a7048] disabled:cursor-wait disabled:opacity-60">
                        {status === 'loading' ? <><LoaderCircle size={17} className="animate-spin" /> {copy.sendingLabel}</> : <>{copy.submitLabel} <Check size={17} /></>}
                    </button>
                </div>
            </div>
        </form>
    );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <label className="block text-sm font-medium text-[#3d362f]">
            <span>{label}{required && <span className="ml-1 text-[#8a7048]">*</span>}</span>
            <div className="mt-2 [&_.field]:w-full [&_.field]:border [&_.field]:border-[#c8bbab] [&_.field]:bg-white/70 [&_.field]:px-4 [&_.field]:py-3.5 [&_.field]:text-[#28221c] [&_.field]:outline-none [&_.field]:transition [&_.field]:focus:border-[#8a7048] [&_.field]:focus:ring-2 [&_.field]:focus:ring-[#8a7048]/15">
                {children}
            </div>
        </label>
    );
}
