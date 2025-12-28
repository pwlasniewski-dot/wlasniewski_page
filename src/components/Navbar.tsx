'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';

interface MenuItem {
    id: number;
    label: string;
    href: string;
    children?: { id: number; label: string; href: string }[];
}

const MENU_ITEMS: MenuItem[] = [];

const CTA_ITEMS: MenuItem[] = [];

interface NavbarSettings {
    logo_url?: string;
    logo_dark_url?: string;
    logo_size?: number;
    navbar_font_size?: number;
    navbar_font_family?: string;
    navbar_layout?: string;
    navbar_sticky?: boolean;
    navbar_transparent?: boolean;
}

export default function Navbar() {
    const pathname = usePathname();
    const isHome = pathname === '/';
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<NavbarSettings>({});
    const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
    const [ctaItems, setCtaItems] = useState<MenuItem[]>(CTA_ITEMS);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [logoLoaded, setLogoLoaded] = useState(false);
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);



    // B2B Context State
    const [isB2B, setIsB2B] = useState(false);

    // Unified B2B Check & Menu Fetch
    useEffect(() => {
        const init = async () => {
            // 1. Determine Context
            const host = window.location.hostname;
            const port = window.location.port;
            const path = window.location.pathname;

            const isB2BContext = host.includes('b2b') ||
                host.includes('dron') ||
                port === '3001' ||
                path.startsWith('/b2b');

            setIsB2B(isB2BContext);

            // 2. Fetch Menu for this context
            try {
                const type = isB2BContext ? 'b2b' : 'b2c';
                // Add timestamp to prevent caching
                const res = await fetch(`/api/menu?type=${type}&t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: { 'Pragma': 'no-cache' }
                });

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                const data = await res.json();

                if (Array.isArray(data)) {
                    const dynamicMenuItems = data.map((item: any) => ({
                        id: item.id,
                        label: item.title,
                        href: item.url || '#',
                        children: item.children && item.children.length > 0 ? item.children.map((child: any) => ({
                            id: child.id,
                            label: child.title,
                            href: child.url || '#'
                        })) : undefined
                    }));
                    setMenuItems(dynamicMenuItems);
                } else {
                    console.error('Menu data is not an array:', data);
                    setMenuItems([]); // Clear menu on error/empty
                }
            } catch (error) {
                console.error('Failed to fetch menu:', error);
                setMenuItems([]);
            }
        };

        init();
    }, [pathname]); // Re-run on navigation

    // Helper to resolve links based on context (prevents double /b2b/ on subdomains)
    const resolveHref = (href: string) => {
        if (!href) return '#';
        // If we are on a B2B domain (not localhost), we can show "clean" links 
        // because middleware handles the rewrite.
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        const isB2BHost = host.includes('b2b') || host.includes('dron');

        // On B2B dedicated domain: clean the /b2b prefix (handled by middleware)
        if (isB2BHost && href.startsWith('/b2b')) {
            const clean = href.replace('/b2b', '');
            return clean === '' ? '/' : clean;
        }

        // On main domain in B2B context: ensure /b2b prefix exists for relative links
        if (!isB2BHost && isB2B && !href.startsWith('/b2b') && !href.startsWith('http') && !href.startsWith('#')) {
            return `/b2b${href.startsWith('/') ? href : '/' + href}`;
        }

        return href;
    };

    // Unified Menu Source
    const currentMenuItems = menuItems.map(item => ({
        ...item,
        href: resolveHref(item.href),
        children: item.children?.map(child => ({
            ...child,
            href: resolveHref(child.href)
        }))
    }));
    const currentCtaItems = ctaItems;

    // Fetch settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/public', { cache: 'no-store' });
                const data = await res.json();
                if (data.success && data.settings) {
                    setSettings(data.settings);
                    setLogoLoaded(true);
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
                setLogoLoaded(true); // Show default logo on error
            }
        };
        fetchSettings();
    }, []);
    const getSplitMenuItems = (items: MenuItem[], ctas: MenuItem[]) => {
        const allItems = [...items, ...ctas];
        const midPoint = Math.ceil(allItems.length / 2);
        return {
            leftItems: allItems.slice(0, midPoint),
            rightItems: allItems.slice(midPoint)
        };
    };


    const logoSize = settings.logo_size || 140; // Use full value from settings
    const logoDisplaySize = logoSize; // Removed Math.min(logoSize, 100) cap to respect slider
    // B2B uses dark mode logo if available
    const logoSrc = (isB2B && settings.logo_dark_url)
        ? settings.logo_dark_url
        : (settings.logo_url || '/assets/brand/logo.png');
    const navbarFontSize = settings.navbar_font_size || 16;
    const navbarFontFamily = settings.navbar_font_family || 'Montserrat';
    const isNavbarSticky = settings.navbar_sticky !== false; // default true
    const isNavbarTransparent = settings.navbar_transparent === true; // default false
    const navbarLayout = settings.navbar_layout || 'logo_center_menu_split';

    // Homepage requirement: transparent navbar over full-screen hero
    const forceTransparent = isHome;
    const linkColorClass = forceTransparent
        ? 'text-white hover:text-gold-400'
        : (isScrolled ? 'text-zinc-700 hover:text-gold-500' : 'text-white hover:text-gold-400');

    const isActive = (href: string) => pathname === href;

    const { leftItems, rightItems } = navbarLayout === 'logo_center_menu_split'
        ? getSplitMenuItems(currentMenuItems, currentCtaItems)
        : { leftItems: [], rightItems: [] };

    // Force Dark styling for B2B
    const navStyle = isB2B ? {
        backgroundColor: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
    } : {};

    return (
        <header
            className={`${(forceTransparent || isNavbarSticky) ? 'fixed left-0 right-0 top-0' : 'absolute top-0'} w-full z-[100] transition-all duration-300 ${forceTransparent
                ? 'bg-transparent py-6'
                : (isNavbarSticky
                    ? (isNavbarTransparent && !isScrolled
                        ? 'bg-transparent py-6'
                        : 'bg-black/90 backdrop-blur-md py-4 border-b border-white/10 shadow-lg shadow-black/50')
                    : 'bg-transparent py-8')
                } ${!isNavbarVisible && (forceTransparent || isNavbarSticky) ? '-translate-y-full' : 'translate-y-0'}`}
            style={{
                fontFamily: navbarFontFamily,
                transform: !isNavbarVisible && (forceTransparent || isNavbarSticky) ? 'translateY(-100%)' : 'translateY(0)',
                ...navStyle
            }}
        >
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative transition-all duration-300">
                <div
                    className={`flex items-center justify-between relative transition-all duration-300 ${navbarLayout === 'logo_center_menu_bottom' ? 'flex-col py-4 gap-4' : 'min-h-[80px] py-2'
                        }`}
                >
                    {navbarLayout === 'logo_center_menu_split' && (
                        <>
                            {/* LEFT MENU - flex-1 for balanced spacing */}
                            <div className="hidden md:flex items-center gap-8 flex-1 justify-end pr-8">
                                {leftItems.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={`font-medium transition-colors py-2 ${isActive(item.href)
                                                ? 'text-gold-500'
                                                : linkColorClass
                                                } flex items-center gap-1`}
                                            style={{
                                                fontSize: `${navbarFontSize}px`
                                            }}
                                        >
                                            {item.label}
                                            {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4" />}
                                        </Link>
                                        {item.children && item.children.length > 0 && (
                                            <div className="absolute left-0 mt-2 w-48 bg-neutral-900/95 backdrop-blur-md border border-white/5 shadow-xl shadow-black/50 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40 transform origin-top-left group-hover:translate-y-0 translate-y-2">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className="block px-5 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-gold-400 transition-colors border-b border-white/5 last:border-0 font-medium tracking-wide text-center"
                                                    >
                                                        {child.label.toUpperCase()}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* CENTER LOGO */}
                            {logoLoaded && (
                                <Link
                                    href="/"
                                    className="hover:opacity-80 transition-opacity z-10 flex-shrink-0"
                                    aria-label="Strona główna"
                                >
                                    <div
                                        className="relative transition-all duration-300"
                                        style={{
                                            width: isScrolled ? logoDisplaySize * 0.8 : logoDisplaySize,
                                            height: isScrolled ? logoDisplaySize * 0.8 : logoDisplaySize
                                        }}
                                    >
                                        <Image
                                            src={logoSrc}
                                            alt="Logo"
                                            fill
                                            className="object-contain"
                                            priority
                                        />
                                    </div>
                                </Link>
                            )}

                            {/* RIGHT MENU - flex-1 for balanced spacing */}
                            <div className="hidden md:flex items-center gap-8 flex-1 justify-start pl-8">
                                {rightItems.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={`font-medium transition-colors py-2 ${isActive(item.href)
                                                ? 'text-gold-500'
                                                : linkColorClass
                                                } flex items-center gap-1`}
                                            style={{
                                                fontSize: `${navbarFontSize}px`
                                            }}
                                        >
                                            {item.label}
                                            {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4" />}
                                        </Link>
                                        {item.children && item.children.length > 0 && (
                                            <div className="absolute right-0 mt-2 w-48 bg-neutral-900/95 backdrop-blur-md border border-white/5 shadow-xl shadow-black/50 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40 transform origin-top-right group-hover:translate-y-0 translate-y-2">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className="block px-5 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-gold-400 transition-colors border-b border-white/5 last:border-0 font-medium tracking-wide text-center"
                                                    >
                                                        {child.label.toUpperCase()}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {navbarLayout === 'logo_left_menu_right' && (
                        <>
                            {/* LOGO LEFT */}
                            {logoLoaded && (
                                <Link
                                    href="/"
                                    className="hover:opacity-80 transition-opacity"
                                    aria-label="Strona główna"
                                >
                                    <div
                                        className="relative transition-all duration-300"
                                        style={{
                                            width: isScrolled ? logoDisplaySize * 0.7 : logoDisplaySize,
                                            height: isScrolled ? logoDisplaySize * 0.7 : logoDisplaySize
                                        }}
                                    >
                                        <Image
                                            src={logoSrc}
                                            alt="Logo"
                                            fill
                                            className="object-contain"
                                            priority
                                        />
                                    </div>
                                </Link>
                            )}

                            {/* MENU LEFT-RIGHT */}
                            <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
                                {currentMenuItems.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={`font-medium transition-colors py-2 ${isActive(item.href)
                                                ? 'text-gold-500'
                                                : linkColorClass
                                                } flex items-center gap-1`}
                                            style={{
                                                fontSize: `${navbarFontSize}px`
                                            }}
                                        >
                                            {item.label}
                                            {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4" />}
                                        </Link>
                                        {item.children && item.children.length > 0 && (
                                            <div className="absolute left-0 mt-2 w-48 bg-neutral-900/95 backdrop-blur-md border border-white/5 shadow-xl shadow-black/50 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40 transform origin-top-left group-hover:translate-y-0 translate-y-2">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className="block px-5 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-gold-400 transition-colors border-b border-white/5 last:border-0 font-medium tracking-wide text-center"
                                                    >
                                                        {child.label.toUpperCase()}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* RIGHT CTA */}
                            <div className="hidden md:flex items-center gap-8 flex-1 justify-end">
                                {currentCtaItems.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={`font-medium transition-colors py-2 ${isActive(item.href)
                                                ? 'text-gold-500'
                                                : linkColorClass
                                                } flex items-center gap-1`}
                                            style={{
                                                fontSize: `${navbarFontSize}px`
                                            }}
                                        >
                                            {item.label}
                                            {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4" />}
                                        </Link>
                                        {item.children && item.children.length > 0 && (
                                            <div className="absolute right-0 mt-2 w-48 bg-neutral-900/95 backdrop-blur-md border border-white/5 shadow-xl shadow-black/50 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40 transform origin-top-right group-hover:translate-y-0 translate-y-2">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className="block px-5 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-gold-400 transition-colors border-b border-white/5 last:border-0 font-medium tracking-wide text-center"
                                                    >
                                                        {child.label.toUpperCase()}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {navbarLayout === 'logo_center_menu_bottom' && (
                        <>
                            {/* CENTER LOGO TOP */}
                            <div className="w-full flex justify-center">
                                {logoLoaded && (
                                    <Link
                                        href="/"
                                        className="hover:opacity-80 transition-opacity"
                                        aria-label="Strona główna"
                                    >
                                        <div
                                            className="relative transition-all duration-300"
                                            style={{
                                                width: isScrolled ? logoDisplaySize * 0.8 : logoDisplaySize,
                                                height: isScrolled ? logoDisplaySize * 0.8 : logoDisplaySize
                                            }}
                                        >
                                            <Image
                                                src={logoSrc}
                                                alt="Logo"
                                                fill
                                                className="object-contain"
                                                priority
                                            />
                                        </div>
                                    </Link>
                                )}
                            </div>

                            {/* MENU BOTTOM CENTER */}
                            <div className="hidden md:flex items-center gap-8 justify-center">
                                {[...currentMenuItems, ...currentCtaItems].map((item) => (
                                    <div key={item.id} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={`font-medium transition-colors py-2 ${isActive(item.href)
                                                ? 'text-gold-500'
                                                : linkColorClass
                                                } flex items-center gap-1`}
                                            style={{
                                                fontSize: `${navbarFontSize}px`
                                            }}
                                        >
                                            {item.label}
                                            {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4" />}
                                        </Link>
                                        {item.children && item.children.length > 0 && (
                                            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-neutral-900/95 backdrop-blur-md border border-white/5 shadow-xl shadow-black/50 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40 transform origin-top group-hover:translate-y-0 translate-y-2">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className="block px-5 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-gold-400 transition-colors border-b border-white/5 last:border-0 font-medium tracking-wide text-center"
                                                    >
                                                        {child.label.toUpperCase()}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {navbarLayout === 'logo_right_menu_left' && (
                        <>
                            {/* LEFT MENU */}
                            <div className="hidden md:flex items-center gap-8 flex-1">
                                {[...currentMenuItems, ...currentCtaItems].map((item) => (
                                    <div key={item.id} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={`font-medium transition-colors py-2 ${isActive(item.href)
                                                ? 'text-gold-500'
                                                : linkColorClass
                                                } flex items-center gap-1`}
                                            style={{
                                                fontSize: `${navbarFontSize}px`
                                            }}
                                        >
                                            {item.label}
                                            {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4" />}
                                        </Link>
                                        {item.children && item.children.length > 0 && (
                                            <div className="absolute left-0 mt-2 w-48 bg-neutral-900/95 backdrop-blur-md border border-white/5 shadow-xl shadow-black/50 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40 transform origin-top-left group-hover:translate-y-0 translate-y-2">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className="block px-5 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-gold-400 transition-colors border-b border-white/5 last:border-0 font-medium tracking-wide text-center"
                                                    >
                                                        {child.label.toUpperCase()}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* LOGO RIGHT - Absolutely positioned */}
                            {logoLoaded && (
                                <Link
                                    href="/"
                                    className="absolute right-4 sm:right-6 lg:right-8 hover:opacity-80 transition-opacity"
                                    aria-label="Strona główna"
                                >
                                    <div
                                        className="relative transition-all duration-300"
                                        style={{
                                            width: isScrolled ? logoDisplaySize * 0.7 : logoDisplaySize,
                                            height: isScrolled ? logoDisplaySize * 0.7 : logoDisplaySize
                                        }}
                                    >
                                        <Image
                                            src={logoSrc}
                                            alt="Logo"
                                            fill
                                            className="object-contain"
                                            priority
                                        />
                                    </div>
                                </Link>
                            )}
                        </>
                    )}

                    {/* MOBILE MENU BUTTON */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2"
                        aria-label="Otwórz menu"
                    >
                        {isOpen ? (
                            <X className={`w-6 h-6 ${forceTransparent ? 'text-white' : (isScrolled ? 'text-zinc-700' : 'text-white')}`} />
                        ) : (
                            <Menu className={`w-6 h-6 ${forceTransparent ? 'text-white' : (isScrolled ? 'text-zinc-700' : 'text-white')}`} />
                        )}
                    </button>
                </div>

                {/* MOBILE MENU */}
                {isOpen && (
                    <div className="md:hidden bg-white shadow-lg rounded-lg mt-2 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        {[...currentMenuItems, ...currentCtaItems].map((item) => (
                            <div key={item.label}>
                                <Link
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-4 py-2 font-medium transition-colors rounded ${isActive(item.href)
                                        ? 'bg-gold-100 text-gold-600'
                                        : 'text-zinc-700 hover:bg-zinc-50'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                                {item.children && item.children.length > 0 && (
                                    <button
                                        onClick={() => setOpenSubmenu(openSubmenu === String(item.id) ? null : String(item.id))}
                                        className="w-full text-left px-4 py-1 text-xs text-zinc-500 hover:text-zinc-700"
                                    >
                                        {openSubmenu === String(item.id) ? '▼' : '▶'} Pokaż więcej
                                    </button>
                                )}
                                {item.children && item.children.length > 0 && openSubmenu === String(item.id) && (
                                    <div className="pl-4 space-y-1">
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.id}
                                                href={child.href}
                                                onClick={() => setIsOpen(false)}
                                                className="block px-3 py-1 text-sm text-zinc-600 hover:text-gold-500"
                                            >
                                                • {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </nav>
        </header>
    );
}
