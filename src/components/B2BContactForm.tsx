'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader2, Send } from 'lucide-react';
import { AERO_SITE } from '@/lib/aeroanaliza/content';
import { useAnalytics } from '@/hooks/useAnalytics';

const serviceOptions = [
    'Termowizja dronem',
    'Inspekcja fotowoltaiki dronem',
    'Inspekcja dachu dronem',
    'Monitoring inwestycji dronem',
    'Usługa dronem — kujawsko-pomorskie',
    'Konsultacja / dobór usługi',
];

const serviceByPath: Record<string, string> = {
    '/termowizja': serviceOptions[0],
    '/inspekcja-fotowoltaiki-dronem': serviceOptions[1],
    '/inspekcja-dachu-dronem': serviceOptions[2],
    '/monitoring': serviceOptions[3],
    '/kujawsko-pomorskie': serviceOptions[4],
};

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function B2BContactForm({ defaultService }: { defaultService?: string }) {
    const pathname = usePathname();
    const { trackEvent } = useAnalytics();
    const derivedService = defaultService || serviceByPath[pathname.replace(/^\/b2b/, '')] || serviceOptions[5];
    const started = useRef(false);
    const submitting = useRef(false);
    const requestId = useRef('');
    const [status, setStatus] = useState<FormStatus>('idle');
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '', company: '', email: '', phone: '', serviceType: derivedService,
        location: '', objectType: '', timeframe: 'Do uzgodnienia', preferredContact: 'Telefon lub e-mail',
        message: '', website: '', sourcePage: '', landingPage: '', referrer: '',
        utmSource: '', utmMedium: '', utmCampaign: '',
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setForm(current => ({
            ...current,
            serviceType: defaultService || serviceByPath[window.location.pathname] || current.serviceType,
            sourcePage: window.location.pathname,
            landingPage: window.location.href,
            referrer: document.referrer,
            utmSource: params.get('utm_source') || '',
            utmMedium: params.get('utm_medium') || '',
            utmCampaign: params.get('utm_campaign') || '',
        }));
    }, [defaultService, derivedService]);

    const update = (field: string, value: string) => {
        if (!started.current) {
            started.current = true;
            void trackEvent('aero_inquiry_started');
            window.dataLayer?.push?.({ event: 'aero_inquiry_started' });
        }
        setForm(current => ({ ...current, [field]: value }));
        if (field === 'serviceType') {
            void trackEvent('service_selected');
            window.dataLayer?.push?.({ event: 'aero_service_selected' });
        }
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        setStatus('loading');
        setError('');
        try {
            const response = await fetch('/api/aeroanaliza/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, requestId: requestId.current || (requestId.current = crypto.randomUUID()) }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Nie udało się wysłać zapytania.');
            setStatus('success');
            void trackEvent('aero_inquiry_submitted');
            window.dataLayer?.push?.({ event: 'aero_inquiry_submitted' });
        } catch (submissionError) {
            setStatus('error');
            setError(submissionError instanceof Error ? submissionError.message : 'Nie udało się wysłać zapytania.');
            void trackEvent('client_error', { status: 'error', area: 'booking_form', reason_code: 'request_failed' });
            window.dataLayer?.push?.({ event: 'aero_inquiry_error' });
        } finally {
            submitting.current = false;
        }
    };

    if (status === 'success') {
        return (
            <div className="grid min-h-[520px] place-items-center p-8 text-center" role="status" aria-live="polite">
                <div className="max-w-md">
                    <CheckCircle className="mx-auto mb-5 text-[#1f6feb]" size={48} />
                    <h3 className="aero-heading text-3xl font-semibold text-[#102c48]">Zapytanie zostało zapisane</h3>
                    <p className="mt-4 leading-relaxed text-[#607286]">Przemysław Właśniewski skontaktuje się po sprawdzeniu zakresu i warunków realizacji.</p>
                </div>
            </div>
        );
    }

    const labelClass = 'text-sm font-semibold text-[#34516b]';
    const fieldClass = 'mt-2 w-full rounded-xl border border-[#ccd9e3] bg-[#f8fafc] px-4 py-3 text-[#16314b] shadow-inner outline-none transition placeholder:text-[#8ba0b2] hover:border-[#aebfcd] focus:border-[#1f6feb] focus:bg-white focus:ring-4 focus:ring-[#1f6feb]/10';

    return (
        <form id="aero-inquiry-form" name="aero-inquiry-form" data-analytics="aero-inquiry-form" onSubmit={submit} className="space-y-5 bg-white p-6 md:p-10 lg:p-12" aria-describedby="aero-form-note">
            <div>
                <h3 className="aero-heading text-3xl font-semibold tracking-[-.025em] text-[#102c48]">Zapytanie o zakres i wycenę</h3>
                <p id="aero-form-note" className="mt-2 text-sm leading-6 text-[#6a7d8f]">Pola oznaczone * są wymagane. Dane służą wyłącznie do obsługi tego zapytania.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                <label className={labelClass}>Imię i nazwisko *<input required autoComplete="name" value={form.name} onChange={e => update('name', e.target.value)} className={fieldClass} /></label>
                <label className={labelClass}>Firma / organizacja<input autoComplete="organization" value={form.company} onChange={e => update('company', e.target.value)} className={fieldClass} /></label>
                <label className={labelClass}>E-mail *<input required type="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} className={fieldClass} /></label>
                <label className={labelClass}>Telefon<input type="tel" autoComplete="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className={fieldClass} /></label>
            </div>

            <label className={`block ${labelClass}`}>Usługa *<select required value={form.serviceType} onChange={e => update('serviceType', e.target.value)} className={fieldClass}>{serviceOptions.map(service => <option key={service} value={service}>{service}</option>)}</select></label>

            <div className="grid gap-5 md:grid-cols-2">
                <label className={labelClass}>Lokalizacja obiektu *<input required value={form.location} onChange={e => update('location', e.target.value)} placeholder="miejscowość lub adres" className={fieldClass} /></label>
                <label className={labelClass}>Rodzaj obiektu<input value={form.objectType} onChange={e => update('objectType', e.target.value)} placeholder="np. dach hali, instalacja PV" className={fieldClass} /></label>
                <label className={labelClass}>Preferowany termin<select value={form.timeframe} onChange={e => update('timeframe', e.target.value)} className={fieldClass}><option>Do uzgodnienia</option><option>W ciągu 7 dni</option><option>W ciągu 30 dni</option><option>Konkretny termin opiszę poniżej</option></select></label>
                <label className={labelClass}>Preferowany kontakt<select value={form.preferredContact} onChange={e => update('preferredContact', e.target.value)} className={fieldClass}><option>Telefon lub e-mail</option><option>Telefon</option><option>E-mail</option></select></label>
            </div>

            <label className={`block ${labelClass}`}>Co chcesz sprawdzić lub udokumentować? *<textarea required minLength={20} rows={5} value={form.message} onChange={e => update('message', e.target.value)} placeholder="Opisz problem, wielkość obiektu i oczekiwany rezultat." className={`${fieldClass} resize-y`} /></label>
            <label className="absolute -left-[9999px]" aria-hidden="true">Strona internetowa<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e => update('website', e.target.value)} /></label>

            <p className="text-xs leading-6 text-[#778a9b]">
                Administratorem danych jest {AERO_SITE.legalName}. Dane wykorzystuję do odpowiedzi na zapytanie i przygotowania oferty. Szczegóły znajdziesz w{' '}
                <Link href="/polityka-prywatnosci" className="font-semibold text-[#1b5fa7] underline underline-offset-2 hover:text-[#164c80]">polityce prywatności Aero Analiza</Link>.
            </p>

            {status === 'error' && <div className="flex gap-3 rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert"><AlertCircle className="shrink-0" size={20} /><p>{error} Możesz też napisać na <a data-analytics="aero-cta-email-error" className="underline" href={`mailto:${AERO_SITE.email}`}>{AERO_SITE.email}</a>.</p></div>}

            <button type="submit" disabled={status === 'loading'} className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#ff5d37] px-6 py-4 font-bold text-white shadow-[0_14px_28px_rgba(255,93,55,.2)] transition hover:-translate-y-0.5 hover:bg-[#e94c28] disabled:cursor-wait disabled:opacity-70">
                {status === 'loading' ? <><Loader2 className="animate-spin" size={19} />Zapisywanie zapytania…</> : <>Wyślij zapytanie <Send size={19} /></>}
            </button>
        </form>
    );
}

declare global { interface Window { dataLayer?: Array<Record<string, unknown>> } }
