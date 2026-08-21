'use client';

import Link from 'next/link';
import {
    ArrowRight,
    Building2,
    Camera,
    Check,
    CheckCircle2,
    FileText,
    Phone,
    ScanLine,
    ShieldCheck,
    Sparkles,
    Thermometer,
    Workflow,
    Zap,
} from 'lucide-react';
import type { PageSection } from '@/components/admin/PageBuilder';
import B2BContactForm from '@/components/B2BContactForm';
import ThermalHeroSlider from '@/components/ThermalHeroSlider';
import ThermalSlider from '@/components/ThermalSlider';
import { AERO_SITE } from '@/lib/aeroanaliza/content';

type SectionData = Record<string, any>;

const iconMap: Record<string, typeof Zap> = {
    thermometer: Thermometer,
    building: Building2,
    shield: ShieldCheck,
    zap: Zap,
    briefcase: FileText,
    camera: Camera,
};

function sectionData(section: PageSection): SectionData {
    const raw = ((section as PageSection & { data?: SectionData }).data || section) as SectionData;
    return Object.fromEntries(Object.entries(raw).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.replace(/file:\/\/\/[A-Za-z]:\//gi, '/') : value,
    ]));
}

function plainText(value = '') {
    return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function AeroHero({ data, sectionId }: { data: SectionData; sectionId: string }) {
    const imagePosition = data.imagePosition || 'center center';
    const imagePositionMobile = data.imagePositionMobile || imagePosition;
    const mediaStyle = {
        '--aero-media-position': imagePosition,
        '--aero-media-position-mobile': imagePositionMobile,
    } as React.CSSProperties;

    return (
        <section key={sectionId} className="relative isolate overflow-hidden bg-[#f4f8fb] px-4 pb-20 pt-12 sm:px-6 md:pb-28 md:pt-16">
            <div className="aero-grid absolute inset-0 -z-20 opacity-55" />
            <div className="absolute -right-40 -top-48 -z-10 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(255,93,55,.17),rgba(255,255,255,0)_68%)]" />
            <div className="absolute -bottom-52 -left-40 -z-10 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(31,111,235,.14),rgba(255,255,255,0)_68%)]" />

            <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(480px,.88fr)] lg:gap-16">
                <div className="max-w-3xl py-6">
                    {data.tag && (
                        <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#cfdeea] bg-white/85 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1b5fa7] shadow-[0_8px_30px_rgba(28,54,83,.06)]">
                            <ScanLine size={14} aria-hidden="true" /> {data.tag}
                        </p>
                    )}
                    <h1 className="aero-heading max-w-[13ch] text-balance text-[clamp(2.75rem,6vw,5.35rem)] font-semibold leading-[.98] tracking-[-0.055em] text-[#10253c]" dangerouslySetInnerHTML={{ __html: data.title || '' }} />
                    {data.subtitle && <p className="mt-7 max-w-2xl text-lg leading-8 text-[#536579] md:text-xl md:leading-9">{data.subtitle}</p>}

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                        {data.buttonText && (
                            <Link href={data.buttonLink || '#wycena'} data-analytics="aero-cta-hero" className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#102c48] px-7 py-4 text-sm font-bold text-white shadow-[0_16px_34px_rgba(16,44,72,.19)] transition hover:-translate-y-0.5 hover:bg-[#174f82] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1f6feb]">
                                {data.buttonText}<ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                        )}
                        <a href={`tel:${AERO_SITE.phoneHref}`} data-analytics="aero-cta-phone-hero" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-bold text-[#173c60] transition hover:bg-white">
                            <Phone size={17} aria-hidden="true" /> Porozmawiaj o zleceniu
                        </a>
                    </div>

                    <div className="mt-10 grid max-w-2xl gap-3 border-t border-[#d8e3ec] pt-6 sm:grid-cols-3">
                        {[
                            ['Bezpośredni kontakt', 'z operatorem'],
                            ['DJI Mavic 3 Thermal', 'RGB i termowizja'],
                            ['Kujawsko-pomorskie', 'wycena po kwalifikacji'],
                        ].map(([title, text]) => (
                            <div key={title} className="flex gap-3">
                                <CheckCircle2 className="mt-0.5 shrink-0 text-[#1f6feb]" size={18} aria-hidden="true" />
                                <p className="text-xs leading-5 text-[#607286]"><strong className="block text-[#17324d]">{title}</strong>{text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
                    <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2.25rem] bg-gradient-to-br from-[#dceaf4] via-white to-[#ffe4db]" />
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border-[6px] border-white bg-[#dce7ee] shadow-[0_30px_80px_rgba(20,48,76,.21)] md:aspect-[5/4]">
                        {data.videoUrl && data.videoType === 'direct' ? (
                            <video src={data.videoUrl} autoPlay={data.videoAutoPlay !== false} muted loop={data.videoLoop !== false} playsInline className="aero-media h-full w-full object-cover" style={mediaStyle} />
                        ) : data.image ? (
                            <img src={data.image} alt={plainText(data.title) || 'Aero Analiza — inspekcje dronem'} className="aero-media h-full w-full object-cover" style={mediaStyle} />
                        ) : (
                            <div className="grid h-full place-items-center bg-gradient-to-br from-[#eaf2f7] to-white text-[#8aa1b5]"><Camera size={64} aria-hidden="true" /></div>
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071c31]/55 via-transparent to-white/10" />
                        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                            <div className="rounded-2xl border border-white/25 bg-[#0a2238]/82 px-5 py-4 text-white shadow-xl backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b8d6ee]">Platforma pomiarowa</p>
                                <p className="mt-1 text-base font-bold">DJI Mavic 3 Thermal</p>
                            </div>
                            <div className="hidden h-14 w-14 place-items-center rounded-2xl bg-white text-[#ff5d37] shadow-xl sm:grid"><Thermometer size={25} aria-hidden="true" /></div>
                        </div>
                    </div>
                    <div className="absolute -right-3 top-10 hidden rounded-2xl border border-white bg-white/92 px-4 py-3 shadow-[0_18px_48px_rgba(17,45,72,.15)] backdrop-blur sm:block">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#7890a6]">Dane do decyzji</p>
                        <p className="mt-1 text-sm font-bold text-[#17324d]">RGB • zoom • termowizja</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function AeroFeatures({ data, sectionId, index }: { data: SectionData; sectionId: string; index: number }) {
    const items = data.items || (data.features || []).filter((feature: SectionData) => feature.enabled !== false).map((feature: SectionData) => ({
        ...feature,
        text: Array.isArray(feature.items) ? feature.items.join(' ') : feature.text,
        href: feature.buttonLink,
        linkText: feature.buttonText,
    }));

    return (
        <section key={sectionId} className={`${index % 2 ? 'bg-[#eef4f8]' : 'bg-white'} px-4 py-20 sm:px-6 md:py-28`}>
            <div className="mx-auto max-w-7xl">
                <div className="mb-12 max-w-3xl md:mb-16">
                    {data.subtitle && <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-[#1f6feb]">{data.subtitle}</p>}
                    {data.title && <h2 className="aero-heading text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.04em] text-[#10253c] md:text-6xl">{plainText(data.title)}</h2>}
                </div>
                <div className={`grid gap-5 ${items.length > 3 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
                    {items.map((item: SectionData, itemIndex: number) => {
                        const Icon = iconMap[String(item.icon || '').toLowerCase()] || [Thermometer, Zap, ShieldCheck, Building2][itemIndex % 4];
                        const card = (
                            <>
                                <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e7f1ff] to-[#fff0eb] text-[#1b5fa7]"><Icon size={23} aria-hidden="true" /></div>
                                <h3 className="aero-heading text-2xl font-semibold tracking-[-0.025em] text-[#142e49]">{plainText(item.title)}</h3>
                                <p className="mt-4 flex-1 text-[15px] leading-7 text-[#5d7083]">{plainText(item.text || '')}</p>
                                {(item.href || item.buttonLink) && <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#1b5fa7]">{item.linkText || 'Sprawdź zakres'} <ArrowRight size={16} aria-hidden="true" /></span>}
                            </>
                        );
                        const classes = "group flex min-h-[285px] flex-col rounded-[1.75rem] border border-[#dbe5ed] bg-white p-7 shadow-[0_14px_45px_rgba(29,57,82,.07)] transition duration-300 hover:-translate-y-1 hover:border-[#aec8dc] hover:shadow-[0_22px_55px_rgba(29,57,82,.12)] md:p-8";
                        return item.href || item.buttonLink ? <Link key={item.id || itemIndex} href={item.href || item.buttonLink} className={classes}>{card}</Link> : <article key={item.id || itemIndex} className={classes}>{card}</article>;
                    })}
                </div>
            </div>
        </section>
    );
}

function AeroImageText({ data, sectionId }: { data: SectionData; sectionId: string }) {
    const mediaFirst = data.layout !== 'right';
    return (
        <section key={sectionId} className="overflow-hidden bg-[#f7f3ee] px-4 py-20 sm:px-6 md:py-28">
            <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
                <div className={`relative ${mediaFirst ? '' : 'lg:order-2'}`}>
                    <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-[#dbeaf5] to-[#ffdacf]" />
                    <div className="aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-[#dfe8ee] shadow-[0_24px_70px_rgba(25,51,76,.15)]">
                        {data.image ? <img src={data.image} alt={plainText(data.title) || 'Realizacja Aero Analiza'} className="aero-media h-full w-full object-cover" style={{ '--aero-media-position': data.imagePosition || 'center center', '--aero-media-position-mobile': data.imagePositionMobile || data.imagePosition || 'center center' } as React.CSSProperties} /> : <div className="grid h-full place-items-center text-[#8aa1b5]"><Camera size={58} aria-hidden="true" /></div>}
                    </div>
                </div>
                <div className={mediaFirst ? '' : 'lg:order-1'}>
                    {data.subtitle && <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.2em] text-[#d94b2b]">{data.subtitle}</p>}
                    {data.title && <h2 className="aero-heading text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#10253c] md:text-6xl" dangerouslySetInnerHTML={{ __html: data.title }} />}
                    <div className="aero-prose mt-7 text-lg leading-8 text-[#586b7e]" dangerouslySetInnerHTML={{ __html: data.content || '' }} />
                    {data.buttonText && data.buttonLink && <Link href={data.buttonLink} className="group mt-8 inline-flex items-center gap-3 rounded-full border border-[#b9cad7] bg-white px-6 py-3.5 text-sm font-bold text-[#183b5b] transition hover:border-[#1f6feb] hover:text-[#1f6feb]">{data.buttonText}<ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>}
                </div>
            </div>
        </section>
    );
}

function AeroProcess({ data, sectionId }: { data: SectionData; sectionId: string }) {
    const steps = data.b2b_process || [];
    return (
        <section key={sectionId} className="relative overflow-hidden bg-[#102a43] px-4 py-20 text-white sm:px-6 md:py-28">
            <div className="absolute inset-0 opacity-[.09] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:48px_48px]" />
            <div className="relative mx-auto max-w-7xl">
                <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
                    <div>
                        <p className="mb-5 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[#9ec9f5]"><Workflow size={16} aria-hidden="true" />{data.subtitle || 'Przebieg zlecenia'}</p>
                        <h2 className="aero-heading text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.04em] md:text-6xl" dangerouslySetInnerHTML={{ __html: data.title || '' }} />
                        {data.description && <p className="mt-7 max-w-lg text-lg leading-8 text-[#c0d0de]">{data.description}</p>}
                        <div className="mt-9 rounded-2xl border border-white/15 bg-white/[.07] p-5 backdrop-blur-sm">
                            <ShieldCheck className="mb-3 text-[#ff8b6d]" size={25} aria-hidden="true" />
                            <p className="font-bold">{data.featureTitle || 'Ocena wykonalności'}</p>
                            <p className="mt-1 text-sm leading-6 text-[#b7c8d7]">{data.featureContent || 'Warunki i ograniczenia ustalamy przed realizacją.'}</p>
                        </div>
                    </div>
                    <ol className="grid gap-4 sm:grid-cols-2">
                        {steps.map((step: SectionData, stepIndex: number) => (
                            <li key={step.id || stepIndex} className="rounded-[1.6rem] border border-white/12 bg-white/[.075] p-6 backdrop-blur-sm md:p-7">
                                <div className="mb-7 flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-full bg-white text-sm font-extrabold text-[#173b5d]">{String(stepIndex + 1).padStart(2, '0')}</span><Sparkles className="text-[#ff8b6d]" size={18} aria-hidden="true" /></div>
                                <h3 className="aero-heading text-2xl font-semibold">{step.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-[#b9cad8]">{step.description}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}

function AeroCases({ data, sectionId }: { data: SectionData; sectionId: string }) {
    return (
        <section key={sectionId} className="bg-white px-4 py-20 sm:px-6 md:py-28">
            <div className="mx-auto max-w-7xl">
                <div className="mb-12 max-w-3xl">{data.subtitle && <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-[#1f6feb]">{data.subtitle}</p>}{data.title && <h2 className="aero-heading text-4xl font-semibold tracking-[-0.04em] text-[#10253c] md:text-6xl">{plainText(data.title)}</h2>}</div>
                <div className="grid gap-6 md:grid-cols-2">
                    {(data.b2b_cases || []).map((item: SectionData, itemIndex: number) => <article key={item.id || itemIndex} className="overflow-hidden rounded-[1.75rem] border border-[#dce6ed] bg-[#f7fafc] shadow-[0_16px_44px_rgba(26,51,75,.07)]">{item.image && <div className="aspect-[16/9] overflow-hidden"><img src={item.image} alt={item.title || ''} className="h-full w-full object-cover transition duration-700 hover:scale-105" /></div>}<div className="p-7">{item.client && <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1f6feb]">{item.client}</p>}<h3 className="aero-heading mt-2 text-2xl font-semibold text-[#15324d]">{item.title}</h3><p className="mt-3 leading-7 text-[#5d7083]">{item.description}</p></div></article>)}
                </div>
            </div>
        </section>
    );
}

function AeroContact({ data, sectionId }: { data: SectionData; sectionId: string }) {
    return (
        <section key={sectionId} id="wycena" className="scroll-mt-24 bg-[#eaf1f6] px-4 py-20 sm:px-6 md:py-28">
            <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#cddce7] bg-white shadow-[0_28px_90px_rgba(17,47,75,.15)] md:rounded-[2.5rem]">
                <div className="grid lg:grid-cols-[.78fr_1.22fr]">
                    <div className="relative overflow-hidden bg-[#0f2b46] p-8 text-white md:p-12 lg:p-14">
                        <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#ff5d37]/20 blur-3xl" />
                        <div className="relative">
                            <p className="mb-6 text-xs font-extrabold uppercase tracking-[0.2em] text-[#a9d2f6]">Konkretna wycena bez zobowiązań</p>
                            <h2 className="aero-heading text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.04em] md:text-5xl" dangerouslySetInnerHTML={{ __html: data.title || 'Opisz obiekt. Otrzymasz zakres i wycenę.' }} />
                            <p className="mt-6 text-base leading-8 text-[#c0d1de]">{data.subtitle || 'Podaj najważniejsze informacje o obiekcie i oczekiwanym rezultacie.'}</p>
                            <div className="mt-9 space-y-4 border-t border-white/15 pt-7">
                                {[data.featureTitle || 'Bezpośredni kontakt z operatorem', data.featureContent || 'Ocena wykonalności przed potwierdzeniem terminu'].map(item => <div key={item} className="flex items-start gap-3 text-sm font-semibold"><Check className="mt-0.5 shrink-0 text-[#ff8b6d]" size={19} aria-hidden="true" />{item}</div>)}
                            </div>
                            <div className="mt-10 flex items-center gap-3 rounded-2xl bg-white/[.07] p-4"><Phone className="text-[#ff8b6d]" size={20} aria-hidden="true" /><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9fb7ca]">Wolisz zadzwonić?</p><a className="font-bold hover:text-[#ffb09c]" href={`tel:${AERO_SITE.phoneHref}`}>{AERO_SITE.phone}</a></div></div>
                        </div>
                    </div>
                    <B2BContactForm defaultService={data.defaultService} />
                </div>
            </div>
        </section>
    );
}

export default function AeroPageRenderer({ sections }: { sections: PageSection[] }) {
    if (!sections?.length) return null;
    return (
        <div className="aero-page-flow">
            {sections.map((section, index) => {
                const data = sectionData(section);
                switch (section.type) {
                    case 'b2b_hero': return <AeroHero key={section.id} data={data} sectionId={section.id} />;
                    case 'features': return <AeroFeatures key={section.id} data={data} sectionId={section.id} index={index} />;
                    case 'image_text': return <AeroImageText key={section.id} data={data} sectionId={section.id} />;
                    case 'b2b_process': return <AeroProcess key={section.id} data={data} sectionId={section.id} />;
                    case 'b2b_cases': return <AeroCases key={section.id} data={data} sectionId={section.id} />;
                    case 'b2b_contact': return <AeroContact key={section.id} data={data} sectionId={section.id} />;
                    case 'thermal_hero': return <ThermalHeroSlider key={section.id} slides={data.thermal_hero_slides || []} interval={(data.switchInterval || 10) * 1000} />;
                    case 'thermal_slider': return <section key={section.id} className="bg-white px-4 py-20 sm:px-6 md:py-28"><div className="mx-auto max-w-7xl"><ThermalSlider visualImage={data.visualImage} thermalImage={data.thermalImage} labelLeft={data.labelLeft} labelRight={data.labelRight} sections={data.thermalSections || []} title={data.title} alignmentStatus={data.alignmentStatus} objectPosition={data.objectPosition} objectPositionMobile={data.objectPositionMobile} /></div></section>;
                    default: return null;
                }
            })}
        </div>
    );
}
