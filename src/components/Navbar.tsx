'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, User, ShoppingBag, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { isB2BContext, B2B_DOMAINS } from '@/lib/context';

interface MenuItem {
    id: number;
    label: string;
    href: string;
    children?: { id: number; label: string; href: string }[];
}

const MENU_ITEMS: MenuItem[] = [];

const B2B_MENU_ITEMS: MenuItem[] = [
    { id: 1, label: 'Start', href: '/' },
    { id: 2, label: 'Usługi Dronem', href: '/dron' },
    { id: 3, label: 'Termowizja', href: '/dron#termowizja' },
    { id: 4, label: 'Kontakt', href: '/b2b/kontakt' },
];

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

export default function Navbar({ isB2B: serverIsB2B }: { isB2B?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const isHome = pathname === '/';
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<NavbarSettings>({});
    const [menuItems, setMenuItems] = useState<MenuItem[]>(serverIsB2B ? B2B_MENU_ITEMS : MENU_ITEMS);
    const [ctaItems, setCtaItems] = useState<MenuItem[]>(CTA_ITEMS);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [logoLoaded, setLogoLoaded] = useState(false);
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const { user, isAuthenticated, logout } = useAuth();
    const { totalCount, setIsOpen: setIsCartOpen } = useCart();
    const [isAccountOpen, setIsAccountOpen] = useState(false);

    // Scroll Logic (Auto-hide & Sticky)
    useEffect(() => {
        let lastY = window.scrollY;

        const handleScroll = () => {
            const currentY = window.scrollY;

            // Sticky background effect
            setIsScrolled(currentY > 20);

            // Auto-hide logic
            // Hide when scrolling down and not at the very top (buffer of 100px)
            if (currentY > lastY && currentY > 100) {
                setIsNavbarVisible(false);
            } else {
                // Show when scrolling up
                setIsNavbarVisible(true);
            }

            lastY = currentY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);



    // B2B Context State
    const [isB2B, setIsB2B] = useState(false);

    // Unified B2B Check & Menu Fetch
    useEffect(() => {
        const init = async () => {
            // 1. Determine Context
            const host = window.location.hostname;
            const port = window.location.port;
            const path = window.location.pathname;

            const isB2BContextActive = isB2BContext({
                hostname: host,
                port: port,
                pathname: path
            });

            setIsB2B(isB2BContextActive);

            // 2. Fetch Menu for this context
            try {
                const type = isB2BContextActive ? 'b2b' : 'b2c';
                // Add timestamp to prevent caching
                const res = await fetch(`/api/menu?type=${type}&t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: { 'Pragma': 'no-cache' }
                });

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                const data = await res.json();

                if (Array.isArray(data) && data.length > 0) {
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
                } else if (Array.isArray(data) && data.length === 0 && isB2BContextActive) {
                    setMenuItems(B2B_MENU_ITEMS);
                } else {
                    console.error('Menu data is not an array:', data);
                    setMenuItems(isB2BContextActive ? B2B_MENU_ITEMS : []);
                }
            } catch (error) {
                console.error('Failed to fetch menu:', error);
                setMenuItems(isB2BContextActive ? B2B_MENU_ITEMS : []);
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
        const isB2BHost = B2B_DOMAINS.some(d => host.toLowerCase() === d.toLowerCase()) ||
            host.includes('b2b') ||
            host.includes('dron');

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

    // Homepage requirement: transparent navbar over full-screen hero, BUT dark when scrolled
    // Previously: const forceTransparent = isHome; (This kept it transparent forever)
    const forceTransparent = isHome && !isScrolled;

    // When scrolled, we have a dark background (bg-black/90), so text must be white.
    // When transparent (at top of Home), text must be white (over dark hero).
    // So distinct 'text-zinc-700' is only for a hypothetical White Sticky Header, which we don't seem to have here properly.
    // For now, let's force White text for clean Dark Mode aesthetics.
    const linkColorClass = isScrolled
        ? 'text-zinc-200 hover:text-gold-500' // Scrolled (Dark background)
        : 'text-white hover:text-gold-400';   // Transparent (Dark Hero background)

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
            className={`${(isHome || isNavbarSticky) ? 'fixed left-0 right-0 top-0' : 'absolute top-0'} w-full z-[100] transition-transform duration-300 ease-in-out ${forceTransparent
                ? 'bg-transparent py-4'
                : (isNavbarSticky
                    ? (isNavbarTransparent && !isScrolled && !isHome
                        ? 'bg-transparent py-4'
                        : 'bg-black/90 backdrop-blur-md py-4 shadow-lg shadow-black/50')
                    : 'bg-transparent py-6')
                } ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}`}
            style={{
                fontFamily: navbarFontFamily,
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
                                    href={isB2B ? '/b2b' : '/'}
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
                                    href={isB2B ? '/b2b' : '/'}
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
                                        href={isB2B ? '/b2b' : '/'}
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
                                    href={isB2B ? '/b2b' : '/'}
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

                    {/* RIGHT ACTIONS TRAY (Account + Cart) */}
                    <div className="flex items-center gap-2 sm:gap-4 z-20">
                        {/* Account Button - Hidden in B2B to avoid domain redirect issues */}
                        {!isB2B && (
                            <div className="relative">
                                <button
                                    onClick={() => isAuthenticated ? setIsAccountOpen(!isAccountOpen) : router.push('/logowanie')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${forceTransparent
                                        ? 'bg-white/10 hover:bg-white/20 text-white'
                                        : (isScrolled ? 'bg-black/5 hover:bg-black/10 text-zinc-700' : 'bg-white/10 hover:bg-white/20 text-white')
                                        }`}
                                    title={isAuthenticated ? "Twój profil" : "Zaloguj się"}
                                >
                                    <User className="w-5 h-5" />
                                    <span className="hidden sm:inline text-sm font-medium">
                                        {isAuthenticated ? user?.name?.split(' ')[0] : 'Konto'}
                                    </span>
                                </button>

                                {/* Account Dropdown */}
                                {isAuthenticated && isAccountOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-white/10 shadow-2xl rounded-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-white/5 mb-2">
                                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Witaj,</p>
                                            <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                                        </div>
                                        <Link
                                            href="/konto"
                                            onClick={() => setIsAccountOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-gold-400 transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Panel Klienta
                                        </Link>
                                        <button
                                            onClick={() => { logout(); setIsAccountOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Wyloguj się
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cart Button */}
                        {!isB2B && (
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className={`relative p-2.5 rounded-full transition-all duration-300 ${forceTransparent
                                    ? 'bg-white/10 hover:bg-white/20 text-white'
                                    : (isScrolled ? 'bg-black/5 hover:bg-black/10 text-zinc-700' : 'bg-white/10 hover:bg-white/20 text-white')
                                    }`}
                                aria-label="Twój koszyk"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                {totalCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-600 text-black text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">
                                        {totalCount}
                                    </span>
                                )}
                            </button>
                        )}

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
                </div>

                {/* MOBILE MENU */}
                {isOpen && (
                    <div className="md:hidden bg-white shadow-lg rounded-lg mt-2 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        {[...currentMenuItems, ...currentCtaItems].map((item) => (
                            <div key={item.label}>
                                <div className="flex items-center justify-between px-4 py-2 hover:bg-zinc-50 rounded">
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex-1 font-medium transition-colors ${isActive(item.href) ? 'text-gold-600' : 'text-zinc-700'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                    {item.children && item.children.length > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setOpenSubmenu(openSubmenu === String(item.id) ? null : String(item.id));
                                            }}
                                            className="p-2 text-zinc-500 hover:text-gold-500"
                                        >
                                            <ChevronDown className={`w-4 h-4 transition-transform ${openSubmenu === String(item.id) ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}
                                </div>
                                {item.children && item.children.length > 0 && openSubmenu === String(item.id) && (
                                    <div className="pl-6 pr-4 pb-2 space-y-1 bg-zinc-50/50">
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.id}
                                                href={child.href}
                                                onClick={() => setIsOpen(false)}
                                                className="block py-2 text-sm text-zinc-600 hover:text-gold-500 border-l-2 border-transparent hover:border-gold-300 pl-3 transition-all"
                                            >
                                                {child.label}
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
