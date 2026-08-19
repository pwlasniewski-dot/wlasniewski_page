import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Building2,
    Camera,
    Check,
    CloudSun,
    Heart,
    MapPin,
    Play,
    ShieldCheck,
    ThermometerSun,
} from 'lucide-react';
import {
    droneBookingHref,
    formatDronePrice,
    getDronePhotographyPackage,
    safeDroneHref,
    type DronePhotographyConfig,
    type DronePhotographyModule,
    type DroneUseCase,
} from '@/lib/dronePhotographyOffer';

type PortfolioPhoto = { src: string; alt: string };

const paletteTokens = {
    sand: { surface: '#f3efe8', paper: '#f8f5f0', raised: '#fffaf1', soft: '#ebe4da', ink: '#28221c', muted: '#686057', border: '#c8bbab', dark: '#211d19' },
    pearl: { surface: '#f7f7f5', paper: '#ffffff', raised: '#ffffff', soft: '#ececeb', ink: '#222322', muted: '#636663', border: '#c8cac7', dark: '#202320' },
    charcoal: { surface: '#262626', paper: '#303030', raised: '#363636', soft: '#1f1f1f', ink: '#f5f0e7', muted: '#c4beb4', border: '#57534e', dark: '#171717' },
} as const;

const accentTokens = { gold: '#94733d', copper: '#a45f3f', forest: '#47705b' } as const;
const headingClasses = { display: 'font-display', serif: 'font-serif', sans: 'font-sans' } as const;
const bodyClasses = { sans: 'font-sans', serif: 'font-serif' } as const;

export default function DronePhotographyLanding({
    config,
    portfolioByCategory,
}: {
    config: DronePhotographyConfig;
    portfolioByCategory: Record<string, PortfolioPhoto[]>;
}) {
    const palette = paletteTokens[config.theme.palette] || paletteTokens.sand;
    const accent = accentTokens[config.theme.accent] || accentTokens.gold;
    const style = {
        '--drone-surface': palette.surface,
        '--drone-paper': palette.paper,
        '--drone-raised': palette.raised,
        '--drone-soft': palette.soft,
        '--drone-ink': palette.ink,
        '--drone-muted': palette.muted,
        '--drone-border': palette.border,
        '--drone-dark': palette.dark,
        '--drone-accent': accent,
    } as CSSProperties;
    const headingClass = headingClasses[config.theme.headingFont] || headingClasses.display;
    const activePackages = config.packages.filter(item => item.active !== false);
    const standardPrices = activePackages.filter(item => item.audience !== 'slub').map(item => item.price);
    const allPrices = activePackages.map(item => item.price);
    const entryPrice = standardPrices.length ? Math.min(...standardPrices) : allPrices.length ? Math.min(...allPrices) : 0;

    return (
        <main style={style} className={`min-h-screen bg-[var(--drone-surface)] text-[var(--drone-ink)] selection:bg-[var(--drone-accent)] ${bodyClasses[config.theme.bodyFont] || bodyClasses.sans}`}>
            {config.modules.filter(module => module.enabled).map(module => renderModule(module, {
                config,
                activePackages,
                entryPrice,
                headingClass,
                portfolioByCategory,
            }))}
        </main>
    );
}

type RenderContext = {
    config: DronePhotographyConfig;
    activePackages: DronePhotographyConfig['packages'];
    entryPrice: number;
    headingClass: string;
    portfolioByCategory: Record<string, PortfolioPhoto[]>;
};

function renderModule(module: DronePhotographyModule, context: RenderContext): ReactNode {
    const { config, activePackages, entryPrice, headingClass, portfolioByCategory } = context;
    const tone = module.tone || 'light';
    const toneClass = tone === 'dark'
        ? 'bg-[var(--drone-dark)] text-white'
        : tone === 'sand'
            ? 'bg-[var(--drone-soft)] text-[var(--drone-ink)]'
            : 'bg-[var(--drone-surface)] text-[var(--drone-ink)]';
    const mutedClass = tone === 'dark' ? 'text-white/65' : 'text-[var(--drone-muted)]';

    switch (module.type) {
        case 'hero':
            return (
                <section key={module.id} className={`relative overflow-hidden border-b border-white/10 px-5 pb-16 pt-20 sm:px-8 md:pb-24 md:pt-28 ${toneClass}`}>
                    {module.image ? <img src={module.image} alt={module.imageAlt || ''} className="absolute inset-0 h-full w-full object-cover opacity-25" /> : null}
                    <div aria-hidden="true" className={`absolute inset-0 ${tone === 'dark' ? 'bg-[radial-gradient(circle_at_12%_18%,rgba(212,183,124,.28),transparent_30%),linear-gradient(90deg,rgba(0,0,0,.38),transparent)]' : 'bg-[radial-gradient(circle_at_12%_18%,rgba(148,115,61,.16),transparent_30%)]'}`} />
                    <div className="relative mx-auto max-w-[1380px]">
                        <div className="grid gap-10 lg:grid-cols-[1.1fr_.55fr] lg:items-end">
                            <div>
                                <p className="mb-5 text-[10px] font-bold uppercase tracking-[.34em] text-[var(--drone-accent)] sm:text-xs">{module.eyebrow}</p>
                                <h1 className={`max-w-5xl text-[clamp(3.6rem,8vw,8.5rem)] font-normal leading-[.82] tracking-[-.055em] ${headingClass}`}>
                                    {module.title}<br /><em className="font-light text-[var(--drone-accent)]">{module.titleAccent}</em>
                                </h1>
                                <p className={`mt-8 max-w-2xl text-base leading-8 md:text-lg ${mutedClass}`}>{module.description}</p>
                            </div>
                            <div className={`border-l pl-6 lg:pb-3 ${tone === 'dark' ? 'border-white/20' : 'border-[var(--drone-border)]'}`}>
                                <div className={`text-xs font-bold uppercase tracking-[.24em] ${mutedClass}`}>{module.priceLabel}</div>
                                <div className={`mt-2 text-7xl text-[var(--drone-accent)] ${headingClass}`}>{new Intl.NumberFormat('pl-PL').format(entryPrice)} zł</div>
                                <ActionLink href={module.ctaHref} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--drone-accent)] px-7 py-3.5 text-xs font-bold uppercase tracking-[.14em] text-white transition hover:brightness-110">
                                    {module.ctaLabel} <ArrowRight size={17} />
                                </ActionLink>
                            </div>
                        </div>
                        <div className={`mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[10px] font-bold uppercase tracking-[.14em] ${mutedClass}`}>
                            {module.badges.map((badge, index) => {
                                const Icon = index === 0 ? MapPin : index === 1 ? ShieldCheck : CloudSun;
                                return <span key={`${module.id}-badge-${index}`} className="flex items-center gap-2"><Icon size={15} className="text-[var(--drone-accent)]" /> {badge}</span>;
                            })}
                        </div>
                    </div>
                </section>
            );

        case 'use_cases':
            return (
                <section key={module.id} className={`px-5 py-8 sm:px-8 ${toneClass}`}>
                    <div className="mx-auto grid max-w-[1380px] gap-px overflow-hidden border border-white/15 bg-white/15 md:grid-cols-3">
                        {module.items.map(item => <UseCaseCard key={item.id} item={item} headingClass={headingClass} />)}
                    </div>
                </section>
            );

        case 'packages':
            return (
                <section key={module.id} id="pakiety" className={`scroll-mt-24 px-5 py-20 sm:px-8 md:py-28 ${toneClass}`}>
                    <div className="mx-auto max-w-[1280px]">
                        <div className="grid items-end gap-8 lg:grid-cols-[1fr_.7fr]">
                            <div>
                                <Eyebrow>{module.eyebrow}</Eyebrow>
                                <h2 className={`mt-4 max-w-4xl text-5xl font-normal leading-[.92] tracking-[-.04em] md:text-7xl ${headingClass}`}>{module.title}</h2>
                            </div>
                            <p className={`border-l border-[var(--drone-border)] pl-6 text-sm leading-7 md:text-base ${mutedClass}`}>
                                {module.description} {module.areaLabel}: {config.areas.join(', ')}.
                            </p>
                        </div>
                        <div className="mt-12 grid gap-5 lg:grid-cols-3">
                            {activePackages.filter(item => item.audience !== 'slub').map(item => (
                                <article id={item.audience === 'firma' ? 'firma' : undefined} key={item.slug} className={`relative flex min-h-[520px] scroll-mt-24 flex-col border p-7 sm:p-9 ${item.featured ? 'border-[var(--drone-accent)] bg-[var(--drone-raised)] shadow-[0_24px_70px_rgba(78,63,43,.12)]' : 'border-[var(--drone-border)] bg-[var(--drone-paper)]'}`}>
                                    {item.featured && <span className="absolute right-5 top-5 bg-[var(--drone-accent)] px-3 py-1 text-[9px] font-bold uppercase tracking-[.16em] text-white">{module.featuredLabel}</span>}
                                    <Eyebrow>{item.shortName}</Eyebrow>
                                    <h3 className={`mt-5 text-4xl font-normal leading-none ${headingClass}`}>{item.name}</h3>
                                    <p className="mt-5 min-h-20 text-sm leading-7 text-[var(--drone-muted)]">{item.summary}</p>
                                    <div className={`my-7 border-y border-[var(--drone-border)] py-5 text-5xl ${headingClass}`}>{formatDronePrice(item)}</div>
                                    <ul className="space-y-3 text-sm leading-6">
                                        {item.features.map(feature => <li key={feature} className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-[var(--drone-accent)]" /> {feature}</li>)}
                                    </ul>
                                    <p className="mt-6 text-xs leading-5 text-[var(--drone-muted)]">{item.delivery}</p>
                                    <Link href={droneBookingHref(item.slug, 'drone-offer-package')} className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--drone-ink)] px-6 py-3 text-xs font-bold uppercase tracking-[.14em] text-[var(--drone-surface)] transition hover:bg-[var(--drone-accent)] hover:text-white">
                                        {module.bookingButtonLabel} <ArrowRight size={16} />
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            );

        case 'wedding': {
            const weddingPackage = getDronePhotographyPackage(module.packageSlug, activePackages);
            if (!weddingPackage) return null;
            return (
                <section key={module.id} id="slub" className={`scroll-mt-24 border-y border-white/10 px-5 py-20 sm:px-8 md:py-28 ${toneClass}`}>
                    <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
                        <div>
                            <Eyebrow>{module.eyebrow}</Eyebrow>
                            <h2 className={`mt-5 text-5xl font-normal leading-[.92] tracking-[-.04em] md:text-7xl ${headingClass}`}>{module.title}</h2>
                            <p className={`mt-7 max-w-xl text-base leading-8 ${mutedClass}`}>{module.description}</p>
                            <ActionLink href={module.secondaryButtonHref} className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--drone-accent)] hover:text-white">
                                {module.secondaryButtonLabel} <ArrowRight size={16} />
                            </ActionLink>
                        </div>
                        <article className={`border p-7 sm:p-10 ${tone === 'dark' ? 'border-white/15 bg-white/[.04]' : 'border-[var(--drone-border)] bg-[var(--drone-paper)]'}`}>
                            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                                <div><Eyebrow>{weddingPackage.shortName}</Eyebrow><h3 className={`mt-4 text-4xl ${headingClass}`}>{weddingPackage.name}</h3></div>
                                <div className={`text-5xl text-[var(--drone-accent)] ${headingClass}`}>{formatDronePrice(weddingPackage)}</div>
                            </div>
                            <ul className={`mt-8 grid gap-3 text-sm leading-6 sm:grid-cols-2 ${mutedClass}`}>
                                {weddingPackage.features.map(feature => <li key={feature} className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-[var(--drone-accent)]" /> {feature}</li>)}
                            </ul>
                            <Link href={droneBookingHref(weddingPackage.slug, 'drone-offer-wedding')} className="mt-9 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--drone-accent)] px-6 py-3 text-xs font-bold uppercase tracking-[.14em] text-white transition hover:brightness-110 sm:w-auto">
                                {module.bookingButtonLabel} <ArrowRight size={16} />
                            </Link>
                        </article>
                    </div>
                </section>
            );
        }

        case 'portfolio': {
            const photos = module.source === 'manual'
                ? module.images.filter(image => image.url).slice(0, module.limit).map(image => ({ src: image.url, alt: image.alt }))
                : (portfolioByCategory[module.categorySlug] || []).slice(0, module.limit);
            if (!photos.length) return null;
            return (
                <section key={module.id} className={`px-5 py-20 sm:px-8 md:py-28 ${toneClass}`} aria-labelledby={`${module.id}-heading`}>
                    <div className="mx-auto max-w-[1280px]">
                        <Eyebrow>{module.eyebrow}</Eyebrow>
                        <h2 id={`${module.id}-heading`} className={`mt-4 text-5xl font-normal md:text-7xl ${headingClass}`}>{module.title}</h2>
                        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {photos.map((photo, index) => <figure key={`${photo.src}-${index}`} className="relative aspect-[4/3] overflow-hidden bg-[var(--drone-dark)]"><img src={photo.src} alt={photo.alt || 'Zdjęcie wykonane z drona'} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 hover:scale-[1.025]" /></figure>)}
                        </div>
                    </div>
                </section>
            );
        }

        case 'equipment':
            return (
                <section key={module.id} className={`border-y border-[var(--drone-border)] px-5 py-20 sm:px-8 md:py-28 ${toneClass}`}>
                    <div className="mx-auto grid max-w-[1200px] gap-px overflow-hidden border border-[var(--drone-border)] bg-[var(--drone-border)] lg:grid-cols-2">
                        {module.cards.map((card, index) => {
                            const Icon = card.icon === 'thermal' ? ThermometerSun : Camera;
                            const dark = index % 2 === 1;
                            return <article key={card.id} className={`p-8 sm:p-12 ${dark ? 'bg-[var(--drone-dark)] text-white' : 'bg-[var(--drone-paper)] text-[var(--drone-ink)]'}`}>
                                <Icon size={34} strokeWidth={1.4} className="text-[var(--drone-accent)]" />
                                <Eyebrow className="mt-9">{card.eyebrow}</Eyebrow>
                                <h2 className={`mt-3 text-4xl font-normal ${headingClass}`}>{card.title}</h2>
                                <p className={`mt-5 text-sm leading-7 ${dark ? 'text-white/65' : 'text-[var(--drone-muted)]'}`}>{card.description}</p>
                                {card.linkLabel && card.linkHref ? <ActionLink href={card.linkHref} className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[var(--drone-accent)] hover:brightness-125">{card.linkLabel} <ArrowRight size={16} /></ActionLink> : null}
                            </article>;
                        })}
                    </div>
                </section>
            );

        case 'faq':
            return (
                <section key={module.id} className={`px-5 py-20 sm:px-8 md:py-28 ${toneClass}`}>
                    <div className="mx-auto max-w-[1100px]">
                        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
                            <div><Eyebrow>{module.eyebrow}</Eyebrow><h2 className={`mt-4 text-5xl font-normal leading-[.95] ${headingClass}`}>{module.title}</h2><p className={`mt-6 text-sm leading-7 ${mutedClass}`}>{module.description}</p></div>
                            <div className="divide-y divide-[var(--drone-border)] border-y border-[var(--drone-border)]">
                                {module.items.map(item => <details key={item.id} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold"><span>{item.question}</span><span className="text-[var(--drone-accent)] transition group-open:rotate-45">+</span></summary><p className={`mt-4 max-w-3xl text-sm leading-7 ${mutedClass}`}>{item.answer}</p></details>)}
                            </div>
                        </div>
                    </div>
                </section>
            );

        case 'cta':
            return (
                <section key={module.id} className={`px-5 py-24 text-center sm:px-8 md:py-32 ${toneClass}`}>
                    <div className="mx-auto max-w-3xl">
                        <Play className="mx-auto text-[var(--drone-accent)]" size={36} strokeWidth={1.4} />
                        {module.eyebrow ? <Eyebrow className="mt-6">{module.eyebrow}</Eyebrow> : null}
                        <h2 className={`mt-7 text-5xl font-normal leading-[.92] tracking-[-.04em] md:text-7xl ${headingClass}`}>{module.title}</h2>
                        <p className={`mx-auto mt-6 max-w-2xl text-base leading-8 ${mutedClass}`}>{module.description}</p>
                        <ActionLink href={module.buttonHref} className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--drone-accent)] px-8 py-3 text-xs font-bold uppercase tracking-[.15em] text-white transition hover:brightness-110">{module.buttonLabel} <ArrowRight size={17} /></ActionLink>
                    </div>
                </section>
            );
    }
}

function UseCaseCard({ item, headingClass }: { item: DroneUseCase; headingClass: string }) {
    const Icon = item.icon === 'building' ? Building2 : item.icon === 'heart' ? Heart : Camera;
    return <ActionLink href={item.href} className="group bg-[var(--drone-dark)] p-7 text-white transition hover:brightness-110 md:p-8">
        <div className="flex items-start justify-between gap-4"><Icon className="text-[var(--drone-accent)]" size={28} strokeWidth={1.5} /><ArrowRight className="text-white/40 transition group-hover:translate-x-1 group-hover:text-[var(--drone-accent)]" size={20} /></div>
        <p className="mt-8 text-[10px] font-bold uppercase tracking-[.24em] text-[var(--drone-accent)]">{item.eyebrow}</p>
        <h2 className={`mt-2 text-4xl font-normal ${headingClass}`}>{item.title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/60">{item.description}</p>
    </ActionLink>;
}

function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <p className={`${className} text-[10px] font-bold uppercase tracking-[.3em] text-[var(--drone-accent)]`}>{children}</p>;
}

function ActionLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
    const safeHref = safeDroneHref(href);
    return safeHref.startsWith('http')
        ? <a href={safeHref} className={className}>{children}</a>
        : <Link href={safeHref} className={className}>{children}</Link>;
}
