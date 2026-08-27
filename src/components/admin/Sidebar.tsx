'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    Image,
    Camera,
    FileText,
    Megaphone,
    Tag,
    MessageSquare,
    BarChart3,
    Settings,
    LogOut,
    X,
    Calendar,
    List,
    Trophy,
    Sparkles,
    Menu,
    Users,
    ChevronDown,
    Zap,
    Briefcase,
    Shield,
    FileEdit,
    Search,
    Box,
    Cake,
    TrendingUp,
    GraduationCap,
    MapPin,
    Mail,
    BookOpen,
    AlertTriangle
} from 'lucide-react';

const navigation = [
    { name: 'Pulpit', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Media', href: '/admin/media', icon: Image },
    { name: 'Portfolio', href: '/admin/portfolio', icon: Camera },
    { name: 'Strony', href: '/admin/pages', icon: FileText },
    { name: 'Jak się ubrać', href: '/admin/style-guide/outfits', icon: Sparkles },
    { name: 'Przygotowanie klienta', href: '/admin/pages/przygotowanie-klienta', icon: BookOpen },
    {
        name: 'Rezerwacje',
        href: '/admin/bookings',
        icon: Calendar,
        children: [
            { name: 'Złożone rezerwacje', href: '/admin/bookings' },
            { name: 'Kalendarz', href: '/admin/bookings/calendar' },
            { name: 'Grafik / Dostępność', href: '/admin/bookings/calendar' },
            { name: 'Zamówienia', href: '/admin/bookings/orders' },
            { name: 'Pakiety rezerwacji', href: '/admin/rezerwacja' },
            { name: 'Lejek zapytań', href: '/admin/photo-funnel' },
        ]
    },
    { name: 'Galerie', href: '/admin/galleries', icon: Image },
    { name: 'Albumy nPhoto', href: '/admin/nphoto-albums', icon: Box },
    { name: 'Multimedia', href: '/admin/multimedia', icon: Sparkles },
    { name: 'Kostka 3D', href: '/admin/photo-cube', icon: Box },
    { name: 'Menu', href: '/admin/menu', icon: Menu },
    { name: 'Foto Wyzwania', href: '/admin/challenges', icon: Trophy },
    { name: 'Blog', href: '/admin/blog', icon: FileText },
    { name: 'Kody rabatowe', href: '/admin/socio', icon: Megaphone },
    { name: 'Kody promocyjne', href: '/admin/promo-codes', icon: Sparkles },
    { name: 'Banery', href: '/admin/banners', icon: Tag },
    { name: 'Opinie', href: '/admin/testimonials', icon: MessageSquare },
    {
        name: 'Karty podarunkowe',
        href: '/admin/gift-cards',
        icon: FileText,
        children: [
            { name: 'Karty', href: '/admin/gift-cards' },
            { name: 'Sklep', href: '/admin/gift-cards/sklep' },
        ]
    },
    { name: 'Zlecenia Dronowe', href: '/admin/drone-orders', icon: Zap },
    { name: 'Zapytania', href: '/admin/inquiries', icon: MessageSquare },
    {
        name: 'Klienci (CRM)',
        href: '/admin/clients',
        icon: Users,
        children: [
            { name: 'Lista klientów', href: '/admin/clients' },
        ]
    },
    {
        name: 'Foto-Match',
        href: '/admin/foto-match',
        icon: Sparkles,
        children: [
            { name: 'Dashboard', href: '/admin/foto-match' },
            { name: 'Profile', href: '/admin/foto-match/profiles' },
            { name: 'Zdjęcia do akceptacji', href: '/admin/foto-match/photos' },
            { name: 'Lista oczekujących', href: '/admin/foto-match/waitlist' },
            { name: 'Matching i bonusy', href: '/admin/foto-match/match-settings' },
            { name: 'Ustawienia', href: '/admin/foto-match/settings' },
        ]
    },
    {
        name: 'Warsztaty',
        href: '/admin/warsztaty',
        icon: GraduationCap,
        children: [
            { name: 'Lista warsztatów', href: '/admin/warsztaty' },
            { name: 'Uczestnicy', href: '/admin/warsztaty/uczestnicy' },
        ]
    },
    { name: 'Administratorzy', href: '/admin/users', icon: Shield },
    { name: 'Fotografowie', href: '/admin/photographers', icon: Camera },

    { name: 'Analityka', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Marketing & UTM', href: '/admin/marketing', icon: TrendingUp },
    { name: 'Mailing', href: '/admin/mailing', icon: Mail },
    {
        name: 'SEO Ops',
        href: '/admin/seo',
        icon: Search,
        children: [
            { name: 'Audyt & Autopilot', href: '/admin/seo' },
            { name: 'Nagłówki H1/H2/H3', href: '/admin/seo/headings' },
        ]
    },
    { name: 'Local SEO / Maps', href: '/admin/local-seo', icon: MapPin },
    { name: 'Logi', href: '/admin/logs', icon: List },
    { name: 'Incydenty', href: '/admin/incidents', icon: AlertTriangle },
    { name: 'Stopka', href: '/admin/footer', icon: FileText },
    {
        name: 'Ustawienia',
        href: '/admin/settings',
        icon: Settings,
        children: [
            { name: 'Ogólne', href: '/admin/settings' },
            { name: 'aeroanaliza.pl', href: '/admin/settings/aeroanaliza' },
        ]
    },
];

interface SidebarProps {
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

    useEffect(() => {
        const activeParent = navigation.find((item) => {
            if (!('children' in item) || !item.children) return false;

            return item.children.some((child: any) => {
                return pathname === child.href || pathname.startsWith(`${child.href}/`);
            });
        });

        if (activeParent) {
            setExpandedMenu(activeParent.name);
        }
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        router.push('/admin/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsOpen?.(false)}
            />

            {/* Sidebar Container */}
            <div className={`fixed inset-y-0 z-50 flex w-64 flex-col bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex h-16 flex-shrink-0 items-center justify-between px-4">
                    <span className="text-xl font-display font-bold text-white tracking-wider">
                        WŁAŚNIEWSKI<span className="text-gold-400">.</span>PL
                    </span>
                    <button
                        onClick={() => setIsOpen?.(false)}
                        className="md:hidden text-zinc-400 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                    <nav className="mt-2 flex-1 space-y-1 px-2">
                        {navigation.map((item) => {
                            const isPreparationEditor = pathname.startsWith('/admin/pages/przygotowanie-klienta');
                            const isActive = item.href === '/admin/pages'
                                ? pathname.startsWith(item.href) && !isPreparationEditor
                                : pathname.startsWith(item.href);
                            const hasChildren = 'children' in item && item.children;
                            const isExpanded = expandedMenu === item.name;

                            if (hasChildren) {
                                return (
                                    <div key={item.name}>
                                        <button
                                            onClick={() => setExpandedMenu(isExpanded ? null : item.name)}
                                            className={`w-full group flex items-center justify-between px-2 py-3 text-base font-medium rounded-md transition-colors ${isActive
                                                ? 'bg-zinc-800 text-gold-400'
                                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <item.icon
                                                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-gold-400' : 'text-zinc-500 group-hover:text-zinc-300'
                                                        }`}
                                                    aria-hidden="true"
                                                />
                                                {item.name}
                                            </div>
                                            <ChevronDown
                                                className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {isExpanded && (
                                            <div className="ml-6 space-y-1 mt-1">
                                                {item.children.map((child: any) => (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        onClick={() => setIsOpen?.(false)}
                                                        className={`block px-2 py-2 text-sm rounded-md transition-colors ${pathname === child.href
                                                            ? 'bg-zinc-800 text-gold-400'
                                                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                                            }`}
                                                    >
                                                        {child.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen?.(false)}
                                    className={`group flex items-center px-2 py-3 text-base font-medium rounded-md transition-colors ${isActive
                                        ? 'bg-zinc-800 text-gold-400'
                                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                        }`}
                                >
                                    <item.icon
                                        className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-gold-400' : 'text-zinc-500 group-hover:text-zinc-300'
                                            }`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex flex-shrink-0 bg-zinc-900 p-4 border-t border-zinc-800">
                    <button
                        onClick={handleLogout}
                        className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        <LogOut
                            className="mr-3 h-5 w-5 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300"
                            aria-hidden="true"
                        />
                        Wyloguj się
                    </button>
                </div>
            </div>
        </>
    );
}
