/**
 * Navbar.tsx
 * Ostatnia aktualizacja: 2024-12-09 23:48
 * Przywrócono z commit 21383194 - poprawione chowanie navbara przy scrollu
 * Zmiany: scroll visibility, isScrolled state, płynne przejścia
 */
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Linki w menu */
const LEFT = [
    { to: "/blog", label: "Blog" },
    { to: "/jak-sie-ubrac", label: "Jak się ubrać" },
    { to: "/omnie", label: "O mnie" },
];

const LOCALS = [
    { to: "/fotograf-torun", label: "Toruń" },
    { to: "/fotograf-wabrzezno", label: "Wąbrzeźno" },
    { to: "/fotograf-pluznica", label: "Płużnica" },
    { to: "/fotograf-lisewo", label: "Lisewo" },
    { to: "/fotograf-grudziadz", label: "Grudziądz" },
    { to: "/fotograf-powiat-torunski", label: "Powiat toruński" },
    { to: "/fotograf-powiat-wabrzeski", label: "Powiat wąbrzeski" },
];

const RIGHT = [
    { to: "/portfolio", label: "Portfolio" },
    { to: "/rezerwacja", label: "Rezerwacja" },
    { label: "Lokalizacje", children: LOCALS }, // dropdown
];

// ------------------------------------
// Brand Logo Component
// ------------------------------------
import Image from "next/image";

function BrandLogo({
    src,
    darkSrc,
    size = 44, // Default fallback if not provided
    isScrolledOrDark = false
}: {
    src?: string;
    darkSrc?: string;
    size?: number;
    isScrolledOrDark?: boolean;
}) {
    const DEFAULT_LOGO = "/assets/brand/logo.png";
    let logoToUse = DEFAULT_LOGO;

    if (isScrolledOrDark) {
        logoToUse = darkSrc || src || DEFAULT_LOGO;
    } else {
        logoToUse = src || DEFAULT_LOGO;
    }

    return (
        <Link href="/" aria-label="Strona główna" className="inline-flex items-center group">
            <div className="relative overflow-hidden transition-all duration-300">
                <Image
                    src={logoToUse}
                    alt="Logo"
                    width={size}
                    height={size} // Aspect ratio is handled by auto height if needed, but next/image needs dims.
                    style={{ width: 'auto', height: size + 'px' }}
                    className="object-contain group-hover:opacity-90"
                    priority={true} // Priority loading as requested
                />
            </div>
        </Link>
    );
}

function IconBurger() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 6h18M6 12h12M9 18h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}
function IconClose() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}

/** Jeden wspólny navbar — reagujący na tryb light/dark (dla linków, nie tła) */
export default function Navbar({
    mode = "dark",
    logoLight,
    logoDark,
    ctaWhatsapp = "https://wa.me/48530788694",
}: {
    mode?: "light" | "dark";
    logoLight?: string;
    logoDark?: string;
    ctaWhatsapp?: string;
}) {
    const pathname = usePathname();
    const [open, setOpen] = React.useState(false);
    const headerRef = React.useRef<HTMLElement>(null);
    const [menuItems, setMenuItems] = React.useState<any[]>([]);
    const [fontSettings, setFontSettings] = React.useState({ size: 16, family: 'var(--font-sans)', logoSize: 140 });
    const [dynamicLogo, setDynamicLogo] = React.useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    React.useEffect(() => {
        // Check for auth token (simple check)
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/settings/public");
                const data = await res.json();
                if (data.success && data.settings) {
                    const s = data.settings;

                    // Map font names to CSS variables
                    let familyVar = 'var(--font-sans)';
                    if (s.navbar_font_family === 'Playfair Display') familyVar = 'var(--font-playfair)';
                    else if (s.navbar_font_family === 'Lato') familyVar = 'var(--font-lato)';
                    else if (s.navbar_font_family === 'Great Vibes') familyVar = 'var(--font-great-vibes)';
                    else if (s.navbar_font_family === 'Cinzel') familyVar = 'var(--font-cinzel)';
                    else if (s.navbar_font_family === 'Montserrat') familyVar = 'var(--font-sans)';

                    setFontSettings({
                        size: s.navbar_font_size || 16,
                        family: familyVar,
                        logoSize: s.logo_size || 140
                    });

                    // Set dynamic logo
                    if (s.logo_url) {
                        setDynamicLogo(s.logo_url);
                        // Update logoLight prop if we could, but here we use local state or pass it to BrandLogo
                        // But wait, Navbar props logoLight/logoDark are passed from parent?
                        // Actually, looking at usages, Navbar is usually used with hardcoded props or from context.
                        // But here we want to override with settings?
                        // The BrandLogo uses 'src' which corresponds to 'logo' from props or dynamic.
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings for navbar", error);
            }
        };

        const fetchMenu = async () => {
            try {
                const res = await fetch("/api/menu");
                const data = await res.json();

                // API returns array directly
                if (Array.isArray(data)) {
                    // Filter out items without titles (safety check)
                    const validItems = data.filter(item => item.title && item.title.trim());
                    setMenuItems(validItems);
                } else if (data.success && data.menu) {
                    // Fallback for previous structure if changed
                    setMenuItems(data.menu);
                } else {
                    console.error('Unexpected menu format:', data);
                    setMenuItems([]);
                }
            } catch (error) {
                console.error("Failed to fetch menu", error);
                setMenuItems([]);
            }
        };

        fetchSettings();
        fetchMenu();
    }, []);

    // Scroll listener
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [visible, setVisible] = React.useState(true);
    const lastScrollY = React.useRef(0);
    React.useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY || 0;
            // Use a slightly higher threshold to avoid small gestures toggling header
            setIsScrolled(current > 80);

            // Hide on scroll down, show on scroll up
            if (current > lastScrollY.current && current > 120) {
                // scrolling down
                setVisible(false);
            } else {
                // scrolling up
                setVisible(true);
            }

            lastScrollY.current = current;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        // Run once on mount to initialise
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Logic for colors
    const isDark = mode === "dark";
    // If scrolled -> white bg, dark text
    // If not scrolled -> transparent bg. Text depends on 'mode'.
    //   mode='dark' -> text white (e.g. on hero image)
    //   mode='light' -> text black (e.g. on white page)

    // BUT: design requirement "scrolled -> white bg".
    // "not scrolled" -> transparent.

    // Text colors:
    // Scrolled -> black
    // Not scrolled && mode=dark -> white
    // Not scrolled && mode=light -> black

    const isScrolledOrLightMode = isScrolled || mode === "light";
    const linkBase = "text-sm font-medium transition-colors hover:text-gold-400 relative uppercase tracking-wider";
    const linkColor = isScrolledOrLightMode ? "text-zinc-900" : "text-white/90";
    const activeLinkIndicator = isScrolledOrLightMode ? "bg-gold-400" : "bg-white";

    // Logo logic
    // We have props: logoLight, logoDark.
    // Also fetched dynamicLogo (which is essentially 'logoLight' / master logo).
    // Let's assume dynamicLogo overrides logoLight if present.
    const logo = dynamicLogo || logoLight || "/assets/brand/logo.png";

    // Burger color
    const mobileButtonColor = isScrolledOrLightMode ? "text-zinc-900 hover:bg-zinc-100" : "text-white hover:bg-white/10";

    return (
        <>
            <header
                ref={headerRef}
                // CSS variable for header height so pages can offset content precisely
                style={{ fontFamily: fontSettings.family, ['--header-height' as any]: isScrolled ? '56px' : '64px' }}
                className={`fixed top-0 inset-x-0 z-50 transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}
            >
                <div className={`transition-all duration-500 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-zinc-200/50 py-2" : "bg-transparent py-4"}`}>
                <nav className="max-w-7xl mx-auto px-4 grid grid-cols-[1fr_auto_1fr] items-center h-14 md:h-16">

                    {/* lewa (desktop) - Pierwsza połowa menu */}
                    <ul
                        className="hidden md:flex justify-end gap-6 pr-3"
                        style={{ fontSize: `${fontSettings.size}px` }}
                    >
                        {menuItems.filter((_, i) => i < Math.ceil(menuItems.length / 2)).map((item) => {
                            const href = item.url || `/${item.slug}`;
                            const isActive = pathname === href;
                            const hasChildren = item.children && item.children.length > 0;

                            if (hasChildren) {
                                return (
                                    <li key={item.id} className="relative group">
                                        <button
                                            type="button"
                                            className={`${linkBase} ${linkColor} inline-flex items-center gap-1`}
                                        >
                                            {item.title}
                                            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="opacity-90">
                                                <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                        {/* Dropdown */}
                                        <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 hover:visible hover:opacity-100 hover:translate-y-0 focus-within:visible focus-within:opacity-100 focus-within:translate-y-0 absolute right-0 top-full min-w-[220px] rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur shadow-2xl p-2 transition">
                                            {item.children.map((child: any) => {
                                                const childHref = child.slug ? `/${child.slug}` : child.url || "#";
                                                return (
                                                    <Link
                                                        key={child.id}
                                                        href={childHref}
                                                        className="block rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                                                    >
                                                        {child.title}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </li>
                                );
                            }

                            return (
                                <li key={item.id}>
                                    <Link
                                        href={href}
                                        className={`${linkBase} ${linkColor} ${isActive ? `after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:w-7 ${activeLinkIndicator}` : ""}`}
                                    >
                                        {item.title}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    {/* logo środek */}
                    <div className="hidden md:flex justify-center flex-col items-center">
                        <BrandLogo src={logo} size={(fontSettings as any).logoSize} />
                        {isLoggedIn && (
                            <Link
                                href="/konto"
                                className="mt-2 text-xs text-gold-400 hover:text-white uppercase tracking-widest transition-colors font-medium"
                            >
                                Moje Konto
                            </Link>
                        )}
                    </div>

                    {/* prawa (desktop) - Druga połowa menu */}
                    <ul
                        className="hidden md:flex justify-start gap-6 pl-3"
                        style={{ fontSize: `${fontSettings.size}px` }}
                    >
                        {menuItems.filter((_, i) => i >= Math.ceil(menuItems.length / 2)).map((item) => {
                            const href = item.url || `/${item.slug}`;
                            const isActive = pathname === href;
                            const hasChildren = item.children && item.children.length > 0;

                            if (hasChildren) {
                                return (
                                    <li key={item.id} className="relative group">
                                        <button
                                            type="button"
                                            className={`${linkBase} ${linkColor} inline-flex items-center gap-1`}
                                        >
                                            {item.title}
                                            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="opacity-90">
                                                <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                        <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 hover:visible hover:opacity-100 hover:translate-y-0 focus-within:visible focus-within:opacity-100 focus-within:translate-y-0 absolute left-0 top-full min-w-[220px] rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur shadow-2xl p-2 transition">
                                            {item.children.map((child: any) => {
                                                const childHref = child.slug ? `/${child.slug}` : child.url || "#";
                                                return (
                                                    <Link
                                                        key={child.id}
                                                        href={childHref}
                                                        className="block rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                                                    >
                                                        {child.title}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </li>
                                );
                            }

                            return (
                                <li key={item.id}>
                                    <Link
                                        href={href}
                                        className={`${linkBase} ${linkColor} ${isActive ? `after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:w-7 ${activeLinkIndicator}` : ""}`}
                                    >
                                        {item.title}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    {/* mobile: logo + burger */}
                    <div className="md:hidden col-span-3 flex items-center justify-between">
                        <BrandLogo src={logo} size={60} />
                        <button
                            aria-label="Menu"
                            onClick={() => setOpen(true)}
                            className={`rounded-xl p-2 transition active:scale-[.98] ${mobileButtonColor}`}
                        >
                            <IconBurger />
                        </button>
                    </div>
                </nav>
                </div>
            </header>

            {/* drawer mobile (pozostaje ciemny) */}
            <div className={`fixed inset-0 z-[9999] ${open ? "" : "pointer-events-none"}`}>
                <div
                    className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setOpen(false)}
                />
                <div
                    className={`absolute inset-x-0 top-0 mx-auto mt-10 w-[92%] max-w-md rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-md shadow-2xl transition-all duration-300 ${open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}`}
                >
                    <div className="flex items-center justify-between px-4 py-3">
                        <BrandLogo src={logoDark} size={50} />
                        <button
                            aria-label="Zamknij"
                            onClick={() => setOpen(false)}
                            className="rounded-lg p-2 text-white/80 hover:bg-white/10"
                        >
                            <IconClose />
                        </button>
                    </div>
                    <nav className="px-3 pb-3">
                        <ul className="divide-y divide-white/10 text-white">
                            {menuItems.map((item) => {
                                const href = item.url || `/${item.slug}`;
                                const hasChildren = item.children && item.children.length > 0;

                                if (hasChildren) {
                                    return (
                                        <li key={item.id}>
                                            <h3 className="block py-3 px-3 text-lg font-sans font-semibold tracking-wide text-white/50">
                                                {item.title}
                                            </h3>
                                            {item.children.map((child: any) => {
                                                const childHref = child.slug ? `/${child.slug}` : child.url || "#";
                                                return (
                                                    <Link
                                                        key={child.id}
                                                        href={childHref}
                                                        onClick={() => setOpen(false)}
                                                        className="block py-2 pl-6 pr-3 text-base hover:bg-white/5 rounded-lg font-sans font-medium tracking-wide"
                                                    >
                                                        {child.title}
                                                    </Link>
                                                );
                                            })}
                                        </li>
                                    );
                                }

                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={href}
                                            onClick={() => setOpen(false)}
                                            className="block py-3 px-3 text-lg hover:bg-white/5 rounded-lg font-sans font-semibold tracking-wide"
                                        >
                                            {item.title}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="p-3 grid grid-cols-2 gap-2 mt-2">
                            <Link
                                href="/rezerwacja"
                                onClick={() => setOpen(false)}
                                className="rounded-xl bg-white text-zinc-900 px-4 py-3 text-center font-sans font-semibold"
                            >
                                Rezerwacja
                            </Link>
                            <a
                                href={ctaWhatsapp}
                                className="rounded-xl border border-white/25 px-4 py-3 text-center text-white font-sans font-semibold hover:bg-white/10"
                            >
                                WhatsApp
                            </a>
                            {isLoggedIn && (
                                <Link
                                    href="/konto"
                                    onClick={() => setOpen(false)}
                                    className="col-span-2 rounded-xl border border-gold-400/25 px-4 py-3 text-center text-gold-400 font-sans font-semibold hover:bg-gold-400/10"
                                >
                                    Moje Konto
                                </Link>
                            )}
                        </div>
                    </nav>
                </div>
            </div>
        </>
    );
}
