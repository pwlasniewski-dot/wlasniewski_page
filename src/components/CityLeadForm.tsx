'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, Phone, MessageCircle } from 'lucide-react';
import { trackPhotoInquiryConversion } from '@/lib/analytics/photoInquiryConversion';
import { useAnalytics } from '@/hooks/useAnalytics';
import { readConsentedClientAttribution } from '@/lib/analytics/clientAttribution';
import {
    DEFAULT_PHOTO_FUNNEL_CONFIG,
    type PhotoFunnelConfig,
    type PhotoServiceValue,
} from '@/lib/marketing/photo-funnel';

interface CityLeadFormProps {
    city?: string;
    citySlug?: string;
    initialService?: string;
    initialPackageSlug?: string;
    source?: string;
    showCityField?: boolean;
    funnelConfig?: PhotoFunnelConfig;
}

function normalizeService(value?: string | null): PhotoServiceValue {
    const normalized = (value || '').trim().toLocaleLowerCase('pl-PL');
    if (normalized.includes('ślub') || normalized.includes('slub')) return 'Ślub';
    if (normalized.includes('urodzin') || normalized.includes('przyję') || normalized.includes('przyjec')) return 'Urodziny';
    if (normalized.includes('dron')) return 'Dron';
    if (normalized.includes('biznes') || normalized.includes('wizer')) return 'Wizerunek';
    if (normalized.includes('sesj') || normalized.includes('rodzin') || normalized.includes('par')) return 'Sesja';
    return 'Inne';
}

function slugifyCity(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function safeContextValue(value: string | null | undefined, fallback: string, maxLength = 120) {
    const trimmed = (value || '').trim();
    return trimmed && trimmed.length <= maxLength ? trimmed : fallback;
}

function photoLeadSource(value: string) {
    const normalized = value.replace(/[^a-zA-Z0-9._:-]+/g, '-').slice(0, 114);
    return normalized.startsWith('photo:') ? normalized : `photo:${normalized || 'website'}`;
}

export default function CityLeadForm({
    city = '',
    citySlug = '',
    initialService = 'Sesja',
    initialPackageSlug,
    source,
    showCityField = false,
    funnelConfig = DEFAULT_PHOTO_FUNNEL_CONFIG,
}: CityLeadFormProps) {
    const searchParams = useSearchParams();
    const { trackEvent } = useAnalytics();
    const inquiryStarted = useRef(false);
    const serviceOptions = useMemo(
        () => funnelConfig.serviceOptions.filter(option => option.enabled).sort((a, b) => a.position - b.position),
        [funnelConfig.serviceOptions],
    );
    const resolveEnabledService = (value?: string | null) => {
        const normalized = normalizeService(value);
        return serviceOptions.some(option => option.value === normalized)
            ? normalized
            : serviceOptions[0]?.value || 'Sesja';
    };
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [data, setData] = useState({
        name: '',
        phone: '',
        email: '',
        city,
        serviceType: resolveEnabledService(initialService),
        preferredDate: '',
        message: '',
    });

    const queryService = searchParams.get('service');
    const packageSlug = safeContextValue(
        searchParams.get('package_slug') || searchParams.get('pakiet'),
        initialPackageSlug || '',
        120,
    );
    const leadSource = photoLeadSource(safeContextValue(
        searchParams.get('source'),
        source || `landing-${citySlug || slugifyCity(data.city) || 'service'}`,
    ));

    useEffect(() => {
        if (!queryService || inquiryStarted.current) return;
        setData(current => ({ ...current, serviceType: resolveEnabledService(queryService) }));
    }, [queryService, serviceOptions]);

    const serviceLabel = useMemo(
        () => serviceOptions.find(option => option.value === data.serviceType)?.label || data.serviceType,
        [data.serviceType, serviceOptions],
    );

    const analyticsMetadata = (service = data.serviceType) => ({
        city_slug: citySlug || slugifyCity(data.city || city) || undefined,
        service_slug: slugifyCity(service) || undefined,
        lead_source: leadSource,
        package_slug: packageSlug || undefined,
    });

    const markInquiryStarted = (service = data.serviceType) => {
        if (inquiryStarted.current) return;
        if (typeof window === 'undefined' || window.localStorage.getItem('cookie_consent') !== 'accepted') return;
        inquiryStarted.current = true;
        void trackEvent('photo_inquiry_started', analyticsMetadata(service));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!data.name.trim() || (!data.phone.trim() && !data.email.trim())) {
            setStatus('error');
            event.currentTarget.reportValidity();
            return;
        }

        markInquiryStarted();
        setStatus('loading');

        try {
            const selectedCity = data.city.trim() || city;
            const context = [
                `Usługa: ${serviceLabel}.`,
                selectedCity ? `Miasto: ${selectedCity}.` : '',
                data.preferredDate ? `Preferowany termin: ${data.preferredDate}.` : '',
                packageSlug ? `Wybrany pakiet: ${packageSlug}.` : '',
            ].filter(Boolean).join(' ');
            const message = data.message.trim()
                ? `${data.message.trim()}\n\n${context}`
                : `Proszę o kontakt w sprawie terminu. ${context}`;
            const attribution = readConsentedClientAttribution();

            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name.trim(),
                    email: data.email.trim(),
                    phone: data.phone.trim(),
                    message,
                    serviceType: data.serviceType,
                    preferred_date: data.preferredDate || undefined,
                    lead_source: leadSource,
                    lead_campaign: 'soft-inquiry',
                    city_slug: citySlug || slugifyCity(selectedCity),
                    package_slug: packageSlug || undefined,
                    ...attribution,
                }),
            });
            const result = await response.json().catch(() => null);
            if (!response.ok || !result?.inquiryId) throw new Error('contact_failed');

            await trackEvent('photo_inquiry_submitted', {
                ...analyticsMetadata(),
                inquiry_id: result.inquiryId,
            });
            trackPhotoInquiryConversion(result.inquiryId, analyticsMetadata());

            setStatus('success');
            setData(current => ({
                ...current,
                name: '',
                phone: '',
                email: '',
                preferredDate: '',
                message: '',
            }));
        } catch {
            setStatus('error');
        }
    };

    const minMonth = new Date().toLocaleDateString('sv-SE').slice(0, 7);

    return (
        <div className="container mx-auto max-w-3xl px-0">
            <motion.form
                id="city-lead-form"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onFocusCapture={() => markInquiryStarted()}
                onSubmit={handleSubmit}
                className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-sm md:p-8"
            >
                <div className="mb-4 grid gap-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="lead-name" className="mb-2 block text-sm font-medium text-zinc-300">
                            {funnelConfig.copy.nameLabel} <span className="text-amber-400">*</span>
                        </label>
                        <input
                            id="lead-name"
                            type="text"
                            required
                            autoComplete="name"
                            value={data.name}
                            onChange={event => setData({ ...data, name: event.target.value })}
                            placeholder={funnelConfig.copy.namePlaceholder}
                            className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white transition-colors focus:border-amber-400 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="lead-service" className="mb-2 block text-sm font-medium text-zinc-300">
                            {funnelConfig.copy.serviceLabel} <span className="text-amber-400">*</span>
                        </label>
                        <select
                            id="lead-service"
                            value={data.serviceType}
                            onChange={event => {
                                const nextService = resolveEnabledService(event.target.value);
                                markInquiryStarted(nextService);
                                setData({ ...data, serviceType: nextService });
                            }}
                            className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white transition-colors focus:border-amber-400 focus:outline-none"
                        >
                            {serviceOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {showCityField && (
                    <div className="mb-4 grid gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="lead-city" className="mb-2 block text-sm font-medium text-zinc-300">
                                {funnelConfig.copy.cityLabel} <span className="text-zinc-500 text-xs">({funnelConfig.copy.optionalLabel})</span>
                            </label>
                            <input
                                id="lead-city"
                                type="text"
                                value={data.city}
                                onChange={event => setData({ ...data, city: event.target.value.slice(0, 80) })}
                                placeholder={funnelConfig.copy.cityPlaceholder}
                                className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white transition-colors focus:border-amber-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label htmlFor="lead-date" className="mb-2 block text-sm font-medium text-zinc-300">
                                {funnelConfig.copy.dateLabel} <span className="text-zinc-500 text-xs">({funnelConfig.copy.optionalLabel})</span>
                            </label>
                            <input
                                id="lead-date"
                                type="month"
                                min={minMonth}
                                value={data.preferredDate}
                                onChange={event => setData({ ...data, preferredDate: event.target.value })}
                                className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white transition-colors focus:border-amber-400 focus:outline-none"
                            />
                        </div>
                    </div>
                )}

                <div className="mb-4 grid gap-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="lead-phone" className="mb-2 block text-sm font-medium text-zinc-300">
                            {funnelConfig.copy.phoneLabel} <span className="text-zinc-500 text-xs">({funnelConfig.copy.phoneHint})</span>
                        </label>
                        <input
                            id="lead-phone"
                            type="tel"
                            autoComplete="tel"
                            value={data.phone}
                            onChange={event => setData({ ...data, phone: event.target.value })}
                            placeholder={funnelConfig.copy.phonePlaceholder}
                            className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white transition-colors focus:border-amber-400 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="lead-email" className="mb-2 block text-sm font-medium text-zinc-300">
                            {funnelConfig.copy.emailLabel} <span className="text-zinc-500 text-xs">({funnelConfig.copy.emailHint})</span>
                        </label>
                        <input
                            id="lead-email"
                            type="email"
                            autoComplete="email"
                            value={data.email}
                            onChange={event => setData({ ...data, email: event.target.value })}
                            placeholder={funnelConfig.copy.emailPlaceholder}
                            className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white transition-colors focus:border-amber-400 focus:outline-none"
                        />
                    </div>
                </div>

                {!showCityField && (
                    <div className="mb-4">
                        <label htmlFor="lead-date" className="mb-2 block text-sm font-medium text-zinc-300">
                            {funnelConfig.copy.dateLabel} <span className="text-zinc-500 text-xs">({funnelConfig.copy.optionalLabel})</span>
                        </label>
                        <input
                            id="lead-date"
                            type="month"
                            min={minMonth}
                            value={data.preferredDate}
                            onChange={event => setData({ ...data, preferredDate: event.target.value })}
                            className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white transition-colors focus:border-amber-400 focus:outline-none"
                        />
                    </div>
                )}

                <div className="mb-6">
                    <label htmlFor="lead-message" className="mb-2 block text-sm font-medium text-zinc-300">
                        {funnelConfig.copy.messageLabel} <span className="text-zinc-500 text-xs">({funnelConfig.copy.optionalLabel})</span>
                    </label>
                    <textarea
                        id="lead-message"
                        rows={3}
                        value={data.message}
                        onChange={event => setData({ ...data, message: event.target.value.slice(0, 1000) })}
                        placeholder={funnelConfig.copy.messagePlaceholder}
                        className="w-full resize-none rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white transition-colors focus:border-amber-400 focus:outline-none"
                    />
                </div>

                <p className="mb-4 text-xs leading-relaxed text-zinc-400">
                    {funnelConfig.copy.privacyHelper}
                </p>

                <button
                    type="submit"
                    data-analytics="photo-cta-inquiry-submit"
                    disabled={status === 'loading' || status === 'success' || !data.name.trim() || (!data.phone.trim() && !data.email.trim())}
                    className={`inline-flex w-full items-center justify-center gap-3 rounded-xl px-8 py-4 text-lg font-bold transition-all ${
                        status === 'success'
                            ? 'bg-green-500 text-white'
                            : status === 'loading'
                                ? 'cursor-wait bg-zinc-700 text-zinc-400'
                                : 'bg-amber-500 text-black hover:scale-[1.02] hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'
                    }`}
                >
                    {status === 'loading' && funnelConfig.copy.sendingLabel}
                    {status === 'success' && (<><CheckCircle className="h-5 w-5" /> {funnelConfig.copy.successButtonLabel}</>)}
                    {status === 'error' && (<><AlertCircle className="h-5 w-5" /> {funnelConfig.copy.retryLabel}</>)}
                    {status === 'idle' && (<>{funnelConfig.copy.inquiryCtaLabel} <Send className="h-5 w-5" /></>)}
                </button>

                {status === 'success' && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-green-400">
                        {funnelConfig.copy.successMessage}
                    </motion.p>
                )}
            </motion.form>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-400">
                <span>{funnelConfig.copy.directContactPrompt}</span>
                <a href={funnelConfig.contact.phoneHref} data-analytics="photo-cta-phone-inquiry" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-800/60 px-4 py-2 transition-colors hover:bg-zinc-800">
                    <Phone className="h-4 w-4 text-amber-400" /> {funnelConfig.copy.phoneDisplay}
                </a>
                <a href={funnelConfig.contact.whatsappHref} data-analytics="photo-cta-whatsapp-inquiry" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-800/60 px-4 py-2 transition-colors hover:bg-zinc-800">
                    <MessageCircle className="h-4 w-4 text-green-400" /> {funnelConfig.copy.whatsappLabel}
                </a>
            </div>
        </div>
    );
}
