'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";

interface FooterLink {
    id: string;
    label: string;
    url: string;
}

interface FooterSection {
    title: string;
    enabled: boolean;
    links: FooterLink[];
}

interface FooterSettings {
    brand_name: string;
    tagline: string;
    phone: string;
    email: string;
    facebook_url: string;
    instagram_url: string;
    sections: {
        oferta: FooterSection;
        lokalnie: FooterSection;
        inne: FooterSection;
    };
}

const defaultSettings: FooterSettings = {
    brand_name: 'Przemysław Właśniewski — Fotograf',
    tagline: 'Naturalne zdjęcia rodzinne, ślubne, portretowe i komunijne. Toruń, Lisewo, Wąbrzeźno, Płużnica i okolice.',
    phone: '+48 530 788 694',
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
    facebook_url: 'https://www.facebook.com/przemyslaw.wlasniewski.fotografia',
    instagram_url: 'https://www.instagram.com/wlasniewski.pl/',
    sections: {
        oferta: {
            title: 'Oferta',
            enabled: true,
            links: [
                { id: '1', label: 'Fotografia rodzinna', url: '/portfolio/family' },
                { id: '2', label: 'Fotografia ślubna', url: '/portfolio/wedding' },
                { id: '3', label: 'Portret i wizerunkowa', url: '/portfolio/portrait' },
                { id: '4', label: 'Fotografia komunijna', url: '/portfolio/communion' },
            ]
        },
        lokalnie: {
            title: 'Lokalnie',
            enabled: true,
            links: [
                { id: '1', label: 'Fotograf Toruń', url: '/fotograf-torun' },
                { id: '2', label: 'Fotograf Lisewo', url: '/fotograf-lisewo' },
                { id: '3', label: 'Fotograf Wąbrzeźno', url: '/fotograf-wabrzezno' },
            ]
        },
        inne: {
            title: 'Inne',
            enabled: true,
            links: [
                { id: '1', label: 'O mnie', url: '/o-mnie' },
                { id: '2', label: 'Jak się ubrać', url: '/jak-sie-ubrac' },
                { id: '3', label: 'Blog', url: '/blog' },
            ]
        }
    }
};

const defaultB2BSettings: FooterSettings = {
    brand_name: 'FOTO-DRON Solutions',
    tagline: 'Zaawansowana termowizja i inspekcje techniczne z powietrza. Kompleksowa dokumentacja dla przemysłu, OZE i budownictwa.',
    phone: '+48 530 788 694',
    email: 'biuro@wlasniewski.pl',
    facebook_url: '',
    instagram_url: '',
    sections: {
        oferta: {
            title: 'Usługi Specjalistyczne',
            enabled: true,
            links: [
                { id: '1', label: 'Audyty Termowizyjne', url: '/b2b/termowizja' },
                { id: '2', label: 'Inspekcje Farm PV', url: '/b2b/fotowoltaika' },
                { id: '3', label: 'Monitoring Budowy', url: '/b2b/monitoring' },
                { id: '4', label: 'Ortofotomapy', url: '/b2b/mapowanie' },
            ]
        },
        lokalnie: {
            title: 'Współpraca',
            enabled: true,
            links: [
                { id: '1', label: 'Szybka Wycena (RFQ)', url: '/b2b#rfq' },
                { id: '2', label: 'Obszary Działania', url: '/b2b#lokalizacja' },
                { id: '3', label: 'Kontakt Bezpośredni', url: '/b2b/kontakt' },
            ]
        },
        inne: {
            title: 'Prawne',
            enabled: true,
            links: [
                { id: '1', label: 'Polityka Prywatności', url: '/polityka-prywatnosci' },
                { id: '2', label: 'Regulamin Usług B2B', url: '/regulamin' },
            ]
        }
    }
};

export default function Footer() {
    const year = new Date().getFullYear();
    const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
    const [isB2B, setIsB2B] = useState(false);

    useEffect(() => {
        // Check B2B Context
        const checkB2B = () => {
            const host = window.location.hostname;
            const port = window.location.port;
            const path = window.location.pathname;

            if (host.includes('b2b') || host.includes('dron') || port === '3001' || path.startsWith('/b2b')) {
                return true;
            }
            return false;
        };
        const activeIsB2B = checkB2B();
        setIsB2B(activeIsB2B);

        const fetchSettings = async () => {

            try {
                // Fetch footer settings
                const res = await fetch(getApiUrl('settings'));
                const data = await res.json();
                let footerConfig = activeIsB2B ? defaultB2BSettings : defaultSettings;

                if (data.success && data.settings) {
                    const configKey = activeIsB2B ? 'b2b_footer_config' : 'footer_config';
                    if (data.settings[configKey]) {
                        try {
                            const parsed = JSON.parse(data.settings[configKey]);
                            // Deep merge sections to preserve enabled flag
                            const mergedSections = {
                                oferta: { ...(activeIsB2B ? defaultB2BSettings : defaultSettings).sections.oferta, ...parsed.sections?.oferta },
                                lokalnie: { ...(activeIsB2B ? defaultB2BSettings : defaultSettings).sections.lokalnie, ...parsed.sections?.lokalnie },
                                inne: { ...(activeIsB2B ? defaultB2BSettings : defaultSettings).sections.inne, ...parsed.sections?.inne },
                            };
                            footerConfig = { ...(activeIsB2B ? defaultB2BSettings : defaultSettings), ...parsed, sections: mergedSections };
                        } catch (e) {
                            // Use defaults
                        }
                    }
                }

                // ONLY auto-populate portfolio categories for B2C
                if (!activeIsB2B) {
                    try {
                        const portfolioRes = await fetch(getApiUrl('portfolio'));
                        const portfolioData = await portfolioRes.json();

                        if (portfolioData.success && portfolioData.sessions?.length > 0) {
                            // ... portfolio logic stays same ...
                            const categories = new Map<string, { name: string; slug: string }>();
                            portfolioData.sessions.forEach((session: any) => {
                                if (session.category && !categories.has(session.category)) {
                                    categories.set(session.category, {
                                        name: session.category_name || session.category,
                                        slug: session.category
                                    });
                                }
                            });

                            const dynamicLinks = Array.from(categories.values()).map((cat, index) => ({
                                id: `portfolio-${cat.slug}`,
                                label: cat.name,
                                url: `/portfolio/${cat.slug}`
                            }));

                            if (dynamicLinks.length > 0) {
                                footerConfig = {
                                    ...footerConfig,
                                    sections: {
                                        ...footerConfig.sections,
                                        oferta: {
                                            ...footerConfig.sections.oferta,
                                            links: dynamicLinks
                                        }
                                    }
                                };
                            }
                        }
                    } catch (e) { }
                }

                setSettings(footerConfig);
            } catch (error) {
                // Use defaults
            }
        };
        fetchSettings();
    }, []);


    return (
        <footer className={`mt-16 border-t ${isB2B ? 'border-zinc-900 bg-black text-zinc-400' : 'border-zinc-800 bg-black'} relative z-10 isolate`}>

            <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {/* Brand + tagline */}
                <div>
                    <div className={`text-sm font-semibold ${isB2B ? 'text-white tracking-widest' : 'text-zinc-50'}`}>{settings.brand_name}</div>
                    <p className="mt-2 text-sm text-zinc-400">
                        {settings.tagline}
                    </p>
                </div>

                {/* Oferta */}
                {settings.sections.oferta.enabled && (
                    <nav aria-label={settings.sections.oferta.title} className="text-sm text-zinc-400">
                        <div className={`font-semibold ${isB2B ? 'text-zinc-200' : 'text-zinc-50'}`}>{settings.sections.oferta.title}</div>
                        <ul className="mt-2 space-y-1">
                            {settings.sections.oferta.links.map(link => (
                                <li key={link.id}>
                                    <Link href={link.url} className={`hover:underline ${isB2B ? 'hover:text-yellow-500' : 'hover:text-zinc-200'} transition-colors`}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}

                {/* Lokalnie / Firma */}
                {settings.sections.lokalnie.enabled && (
                    <nav aria-label={settings.sections.lokalnie.title} className="text-sm text-zinc-400">
                        <div className={`font-semibold ${isB2B ? 'text-zinc-200' : 'text-zinc-50'}`}>{settings.sections.lokalnie.title}</div>
                        <ul className="mt-2 grid grid-cols-1 gap-1">
                            {settings.sections.lokalnie.links.map(link => (
                                <li key={link.id}>
                                    <Link href={link.url} className={`hover:underline ${isB2B ? 'hover:text-yellow-500' : 'hover:text-zinc-200'} transition-colors`}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}

                {/* Kontakt */}
                <div className="text-sm text-zinc-400">
                    <div className={`font-semibold ${isB2B ? 'text-zinc-200' : 'text-zinc-50'}`}>Kontakt</div>
                    <address className="not-italic mt-2 space-y-1 text-zinc-400">
                        <div>tel. <a className={`hover:underline ${isB2B ? 'hover:text-white' : 'hover:text-zinc-200'}`} href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a></div>
                        <div>e-mail <a className={`hover:underline ${isB2B ? 'hover:text-white' : 'hover:text-zinc-200'}`} href={`mailto:${settings.email}`}>{settings.email}</a></div>
                    </address>
                    <div className={`mt-3 space-x-3 ${isB2B ? 'opacity-90' : ''}`}>
                        {settings.sections.inne.enabled && settings.sections.inne.links.map(link => (
                            <Link key={link.id} href={link.url} className={`hover:underline ${isB2B ? 'hover:text-white' : 'hover:text-zinc-200'} transition-colors`}>{link.label}</Link>
                        ))}
                        {!isB2B && <Link href="/rezerwacja" className="hover:underline font-semibold hover:text-zinc-200">Rezerwacja</Link>}
                    </div>
                    <div className="mt-6 flex gap-4">
                        {settings.facebook_url && (
                            <a
                                href={settings.facebook_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-12 h-12 rounded-full border-2 ${isB2B ? 'border-zinc-800 hover:border-white hover:text-white' : 'border-zinc-700 hover:border-gold-500 hover:text-gold-500'} bg-transparent flex items-center justify-center text-zinc-400 hover:bg-gold-500/10 transition-all duration-300`}
                                aria-label="Facebook"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                </svg>
                            </a>
                        )}
                        {settings.instagram_url && (
                            <a
                                href={settings.instagram_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-12 h-12 rounded-full border-2 ${isB2B ? 'border-zinc-800 hover:border-white hover:text-white' : 'border-zinc-700 hover:border-gold-500 hover:text-gold-500'} bg-transparent flex items-center justify-center text-zinc-400 hover:bg-gold-500/10 transition-all duration-300`}
                                aria-label="Instagram"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                </svg>
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-zinc-800">
                <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-3">
                    <div>© {year} {settings.brand_name}. Wszelkie prawa zastrzeżone.</div>
                    <div className="flex gap-4">
                        <Link href="/regulamin" className="hover:underline hover:text-zinc-200">Regulamin</Link>
                        <Link href="/polityka-prywatnosci" className="hover:underline hover:text-zinc-200">Polityka Prywatności</Link>
                        <Link href="/reklamacje" className="hover:underline hover:text-zinc-200">Reklamacje</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
