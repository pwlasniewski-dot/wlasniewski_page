import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import DronePhotoGallery from '@/components/DronePhotoGallery';
import styles from './DronePhotographyLanding.module.css';
import {
    ArrowRight,
    Camera,
    Check,
    CloudSun,
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
    isDroneImageUrl,
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
        <main style={style} className={`${styles.page} min-h-screen bg-[var(--drone-surface)] text-[var(--drone-ink)] selection:bg-[var(--drone-accent)] ${bodyClasses[config.theme.bodyFont] || bodyClasses.sans}`}>
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
                <section key={module.id} className={`${styles.hero} ${toneClass}`}>
                    {module.image ? <img src={module.image} alt={module.imageAlt || ''} fetchPriority="high" className={styles.heroImage} /> : null}
                    <div aria-hidden="true" className={styles.heroShade} />
                    <div className={styles.heroContent}>
                        <div className={styles.heroGrid}>
                            <div>
                                <p className={styles.heroEyebrow}>{module.eyebrow}</p>
                                <h1 className={`${styles.heroTitle} ${headingClass}`}>
                                    {module.title}<br /><em>{module.titleAccent}</em>
                                </h1>
                                <p className={styles.heroDescription}>{module.description}</p>
                            </div>
                            <div className={styles.heroOffer}>
                                <div className={styles.heroPriceLabel}>{module.priceLabel}</div>
                                <div className={`${styles.heroPrice} ${headingClass}`}>{new Intl.NumberFormat('pl-PL').format(entryPrice)} zł</div>
                                <ActionLink href={module.ctaHref} className={styles.heroCta}>
                                    {module.ctaLabel} <ArrowRight size={17} />
                                </ActionLink>
                            </div>
                        </div>
                        <div className={styles.heroBadges}>
                            {module.badges.map((badge, index) => {
                                const Icon = index === 0 ? MapPin : index === 1 ? ShieldCheck : CloudSun;
                                return <span key={`${module.id}-badge-${index}`}><Icon size={14} /> {badge}</span>;
                            })}
                        </div>
                    </div>
                </section>
            );

        case 'use_cases':
            return (
                <section key={module.id} className={`${styles.useCases} ${toneClass}`}>
                    <div className={styles.useCasesGrid}>
                        {module.items.map((item, index) => <UseCaseCard key={item.id} item={item} index={index} headingClass={headingClass} />)}
                    </div>
                </section>
            );

        case 'packages':
            return (
                <section key={module.id} id="pakiety" className={`${styles.packages} scroll-mt-24 px-5 py-20 sm:px-8 md:py-24 ${toneClass}`}>
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
                                <article id={item.audience === 'firma' ? 'firma' : undefined} key={item.slug} className={`${styles.packageCard} relative flex scroll-mt-24 flex-col border p-7 sm:p-9 ${item.featured ? 'border-[var(--drone-accent)] bg-[var(--drone-raised)]' : 'border-[var(--drone-border)] bg-[var(--drone-paper)]'}`}>
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
                <section key={module.id} id="slub" className={`${styles.wedding} scroll-mt-24 border-y border-white/10 px-5 py-20 sm:px-8 md:py-24 ${toneClass}`}>
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
                ? module.images.filter(image => isDroneImageUrl(image.url)).slice(0, module.limit).map(image => ({ ...image, src: image.url }))
                : (portfolioByCategory[module.categorySlug] || []).slice(0, module.limit);
            if (!photos.length) return null;
            if (module.layout === 'parallax') return <section key={module.id} className={styles.panoramaSection} aria-labelledby={`${module.id}-heading`}>
                <DronePhotoGallery photos={photos} module={module} headingClass={headingClass} />
            </section>;
            return (
                <section key={module.id} className={`${styles.portfolioSection} ${toneClass}`} data-tone={tone} aria-labelledby={`${module.id}-heading`}>
                    <div className={styles.portfolioInner}>
                        <div className={styles.portfolioHeading}>
                            <div><Eyebrow>{module.eyebrow}</Eyebrow>
                            <h2 id={`${module.id}-heading`} className={`${styles.portfolioTitle} ${headingClass}`}>{module.title}</h2></div>
                            {module.description && <p className={`${styles.portfolioDescription} ${mutedClass}`}>{module.description}</p>}
                        </div>
                        <DronePhotoGallery photos={photos} module={module} />
                    </div>
                </section>
            );
        }

        case 'equipment':
            return (
                <section key={module.id} className={`${styles.equipment} border-y border-[var(--drone-border)] px-5 py-14 sm:px-8 md:py-20 ${toneClass}`}>
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
                <section key={module.id} className={`${styles.ctaSection} px-5 py-20 text-center sm:px-8 md:py-28 ${toneClass}`}>
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

function UseCaseCard({ item, index, headingClass }: { item: DroneUseCase; index: number; headingClass: string }) {
    return <ActionLink href={item.href} className={styles.useCase}>
        <span className={styles.useCaseNumber}>{String(index + 1).padStart(2, '0')}</span>
        <div><p className={styles.useCaseEyebrow}>{item.eyebrow}</p>
        <h2 className={headingClass}>{item.title}</h2>
        <p className={styles.useCaseDescription}>{item.description}</p></div>
        <ArrowRight size={20} className={styles.useCaseArrow} />
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
