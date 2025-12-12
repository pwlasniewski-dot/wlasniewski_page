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
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<NavbarSettings>({});
    const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
    const [ctaItems, setCtaItems] = useState<MenuItem[]>(CTA_ITEMS);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [logoLoaded, setLogoLoaded] = useState(false);
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

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

    // Fetch menu items from database
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await fetch('/api/menu');
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    // Convert API response to MenuItem format with children
                    const dynamicMenuItems = data.map((item: any) => ({
                        id: item.id,
                        label: item.title,
                        href: item.url,
                        children: item.children && item.children.length > 0 ? item.children.map((child: any) => ({
                            id: child.id,
                            label: child.title,
                            href: child.url
                        })) : undefined
                    }));
                    setMenuItems(dynamicMenuItems);
                }
            } catch (error) {
                console.error('Failed to fetch menu:', error);
                // Keep empty menu on error (no fallback to hardcoded values)
            }
        };
        fetchMenu();
    }, []);

    // Track scroll
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            setIsScrolled(currentScrollY > 50);
            
            // Show navbar when scrolling up, hide when scrolling down
            if (currentScrollY > 100) {
                if (currentScrollY < lastScrollY) {
                    // Scrolling up
                    setIsNavbarVisible(true);
                } else if (currentScrollY > lastScrollY) {
                    // Scrolling down
                    setIsNavbarVisible(false);
                }
            } else {
                // Always show navbar near top
                setIsNavbarVisible(true);
            }
            
            setLastScrollY(currentScrollY);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const logoSize = settings.logo_size || 140; // Use full value from settings
    const logoDisplaySize = Math.min(logoSize, 100); // On desktop, limit displayed size
    const logoSrc = settings.logo_url || '/assets/brand/logo.png';
    const navbarFontSize = settings.navbar_font_size || 16;
    const navbarFontFamily = settings.navbar_font_family || 'Montserrat';
    const isNavbarSticky = settings.navbar_sticky !== false; // default true
    const isNavbarTransparent = settings.navbar_transparent === true; // default false
    const navbarLayout = settings.navbar_layout || 'logo_center_menu_split'; // ADDED THIS

    const isActive = (href: string) => pathname === href;

    return (
        <header
            className={`${isNavbarSticky ? 'fixed left-0 right-0 top-0' : 'absolute top-0'} w-full z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-lg'
                    : isNavbarTransparent
                        ? 'bg-transparent'
                        : 'bg-white/10 backdrop-blur-sm'
                } ${!isNavbarVisible && isNavbarSticky ? '-translate-y-full' : 'translate-y-0'}`}
                style={{
                    fontFamily: navbarFontFamily,
                    transform: !isNavbarVisible && isNavbarSticky ? 'translateY(-100%)' : 'translateY(0)'
                }}
            >
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex items-center justify-between h-20 relative">
                    {navbarLayout === 'logo_center_menu_split' && (
                        <>
                            {/* LEFT MENU - flex-1 for balanced spacing */}
                            <div className="hidden md:flex items-center gap-8 flex-1">
                                {menuItems.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={`font-medium transition-colors py-2 ${isActive(item.href)
                                                    ? 'text-gold-500'
                                                    : isScrolled
                                                        ? 'text-zinc-700 hover:text-gold-500'
                                                        : 'text-white hover:text-gold-400'
                                                } flex items-center gap-1`}
                                            style={{
                                                fontSize: `${navbarFontSize}px`
                                            }}
                                        >
                                            {item.label}
                                            {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4" />}
                                        </Link>
                                        {item.children && item.children.length > 0 && (
                                            <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-40">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-gold-500 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                                    >
                                                        {child.label}
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
                                    className="absolute left-1/2 transform -translate-x-1/2 hover:opacity-80 transition-opacity"
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

                            {/* RIGHT MENU - flex-1 for balanced spacing */}
                            <div className="hidden md:flex items-center gap-8 flex-1 justify-end">
                                {ctaItems.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={`font-medium transition-colors py-2 ${isActive(item.href)
                                                    ? 'text-gold-500'
                                                    : isScrolled
                                                        ? 'text-zinc-700 hover:text-gold-500'
                                                        : 'text-white hover:text-gold-400'
                                                } flex items-center gap-1`}
                                            style={{
                                                fontSize: `${navbarFontSize}px`
                                            }}
                                        >
                                            {item.label}
                                            {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4" />}
                                        </Link>
                                        {item.children && item.children.length > 0 && (
                                            <div className="absolute right-0 mt-0 w-48 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-40">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-gold-500 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                                    >
                                                        {child.label}
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
                                {menuItems.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={`font-medium transition-colors py-2 ${isActive(item.href)
                                                    ? 'text-gold-500'
                                                    : isScrolled
                                                        ? 'text-zinc-700 hover:text-gold-500'
                                                        : 'text-white hover:text-gold-400'
                                                } flex items-center gap-1`}
                                            style={{
                                                fontSize: `${navbarFontSize}px`
                                            }}
                                        >
                                            {item.label}
                                            {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4" />}
                                        </Link>
                                        {item.children && item.children.length > 0 && (
                                            <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-40">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-gold-500 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                                    >
                                                        {child.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* RIGHT CTA */}
                            <div className="hidden md:flex items-center gap-8 flex-1 justify-end">
                                {ctaItems.map((item) => (
                                    <div key={item.id} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={`font-medium transition-colors py-2 ${isActive(item.href)
                                                    ? 'text-gold-500'
                                                    : isScrolled
                                                        ? 'text-zinc-700 hover:text-gold-500'
                                                        : 'text-white hover:text-gold-400'
                                                } flex items-center gap-1`}
                                            style={{
                                                fontSize: `${navbarFontSize}px`
                                            }}
                                        >
                                            {item.label}
                                            {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4" />}
                                        </Link>
                                        {item.children && item.children.length > 0 && (
                                            <div className="absolute right-0 mt-0 w-48 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-40">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-gold-500 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                                    >
                                                        {child.label}
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
                            {/* CENTER LOGO ONLY ON TOP */}
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
                            </div>
                        </>
                    )}

                    {navbarLayout === 'logo_right_menu_left' && (
                        <>
                            {/* LEFT MENU */}
                            <div className="hidden md:flex items-center gap-8 flex-1">
                                {[...menuItems, ...ctaItems].map((item) => (
                                    <div key={item.id} className="relative group">
                                        <Link
                                            href={item.href}
                                            className={`font-medium transition-colors py-2 ${isActive(item.href)
                                                    ? 'text-gold-500'
                                                    : isScrolled
                                                        ? 'text-zinc-700 hover:text-gold-500'
                                                        : 'text-white hover:text-gold-400'
                                                } flex items-center gap-1`}
                                            style={{
                                                fontSize: `${navbarFontSize}px`
                                            }}
                                        >
                                            {item.label}
                                            {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4" />}
                                        </Link>
                                        {item.children && item.children.length > 0 && (
                                            <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-40">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-gold-500 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                                    >
                                                        {child.label}
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
                            <X className={`w-6 h-6 ${isScrolled ? 'text-zinc-700' : 'text-white'}`} />
                        ) : (
                            <Menu className={`w-6 h-6 ${isScrolled ? 'text-zinc-700' : 'text-white'}`} />
                        )}
                    </button>
                </div>

                {/* MOBILE MENU */}
                {isOpen && (
                    <div className="md:hidden bg-white shadow-lg rounded-lg mt-2 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        {[...menuItems, ...ctaItems].map((item) => (
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
