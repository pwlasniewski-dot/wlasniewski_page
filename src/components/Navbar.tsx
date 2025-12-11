'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';

const MENU_ITEMS = [
    { label: 'Blog', href: '/blog' },
    { label: 'Jak się ubrać', href: '/jak-sie-ubrac' },
    { label: 'O mnie', href: '/o-mnie' },
    {
        label: 'Portfolio',
        href: '/portfolio',
        submenu: [
            { label: 'Sesje ślubne', href: '/portfolio/slub' },
            { label: 'Sesje rodzinne', href: '/portfolio/rodzina' },
            { label: 'Sesje ciążowe', href: '/portfolio/ciaza' },
        ]
    },
];

const CTA_ITEMS = [
    { label: 'Rezerwacja', href: '/rezerwacja' },
    {
        label: 'Lokalizacje',
        href: '/lokalizacje',
        submenu: [
            { label: 'Toruń', href: '/fotograf-torun' },
            { label: 'Wąbrzeźno', href: '/fotograf-wabrzezno' },
            { label: 'Płużnica', href: '/fotograf-pluznica' },
            { label: 'Lisewo', href: '/fotograf-lisewo' },
            { label: 'Grudziądz', href: '/fotograf-grudziadz' },
        ]
    },
];

interface NavbarSettings {
    logo_url?: string;
    logo_dark_url?: string;
    logo_size?: number;
    navbar_font_size?: number;
    navbar_font_family?: string;
    navbar_layout?: string;
}

export default function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<NavbarSettings>({});
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [logoLoaded, setLogoLoaded] = useState(false);

    // Fetch settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/public');
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

    // Track scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const logoSize = Math.min(settings.logo_size || 50, 80);
    const logoSrc = settings.logo_url || '/assets/brand/logo.png';

    const isActive = (href: string) => pathname === href;

    return (
        <header
            className={`fixed w-full top-0 z-50 transition-all duration-300 ${
                isScrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-lg'
                    : 'bg-transparent'
            }`}
        >
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* LEFT MENU */}
                    <div className="hidden md:flex items-center gap-8">
                        {MENU_ITEMS.map((item) => (
                            <div key={item.label} className="relative group">
                                <Link
                                    href={item.href}
                                    className={`text-sm font-medium transition-colors py-2 ${
                                        isActive(item.href)
                                            ? 'text-gold-500'
                                            : isScrolled
                                            ? 'text-zinc-700 hover:text-gold-500'
                                            : 'text-white hover:text-gold-400'
                                    } flex items-center gap-1`}
                                >
                                    {item.label}
                                    {item.submenu && <ChevronDown className="w-4 h-4" />}
                                </Link>
                                {item.submenu && (
                                    <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-40">
                                        {item.submenu.map((sub) => (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-gold-500 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                            >
                                                {sub.label}
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
                            className="flex-shrink-0 hover:opacity-80 transition-opacity"
                            aria-label="Strona główna"
                        >
                            <div className="relative" style={{ width: logoSize, height: logoSize }}>
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

                    {/* RIGHT MENU */}
                    <div className="hidden md:flex items-center gap-8">
                        {CTA_ITEMS.map((item) => (
                            <div key={item.label} className="relative group">
                                <Link
                                    href={item.href}
                                    className={`text-sm font-medium transition-colors py-2 ${
                                        isActive(item.href)
                                            ? 'text-gold-500'
                                            : isScrolled
                                            ? 'text-zinc-700 hover:text-gold-500'
                                            : 'text-white hover:text-gold-400'
                                    } flex items-center gap-1`}
                                >
                                    {item.label}
                                    {item.submenu && <ChevronDown className="w-4 h-4" />}
                                </Link>
                                {item.submenu && (
                                    <div className="absolute right-0 mt-0 w-48 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-40">
                                        {item.submenu.map((sub) => (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-gold-500 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                            >
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* MOBILE MENU BUTTON */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2"
                        aria-label="Otwórz menu"
                    >
                        {isOpen ? (
                            <X className={`w-6 h-6 ${isScrolled ? 'text-zinc-700' : 'text-white'}`} />
                        ) : (
                            <Menu className={`w-6 h-6 ${isScrolled ? 'text-zinc-700' : 'text-white'}`} />
                        )}
                    </button>
                </div>

                {/* MOBILE MENU */}
                {isOpen && (
                    <div className="md:hidden bg-white shadow-lg rounded-lg mt-2 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        {[...MENU_ITEMS, ...CTA_ITEMS].map((item) => (
                            <div key={item.label}>
                                <Link
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-4 py-2 font-medium transition-colors rounded ${
                                        isActive(item.href)
                                            ? 'bg-gold-100 text-gold-600'
                                            : 'text-zinc-700 hover:bg-zinc-50'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                                {item.submenu && (
                                    <button
                                        onClick={() => setOpenSubmenu(openSubmenu === item.label ? null : item.label)}
                                        className="w-full text-left px-4 py-1 text-xs text-zinc-500 hover:text-zinc-700"
                                    >
                                        {openSubmenu === item.label ? '▼' : '▶'} Pokaż więcej
                                    </button>
                                )}
                                {item.submenu && openSubmenu === item.label && (
                                    <div className="pl-4 space-y-1">
                                        {item.submenu.map((sub) => (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                onClick={() => setIsOpen(false)}
                                                className="block px-3 py-1 text-sm text-zinc-600 hover:text-gold-500"
                                            >
                                                • {sub.label}
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
