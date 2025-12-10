'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Image,
    Camera,
    FileText,
    Megaphone,
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
    Users
} from 'lucide-react';

const navigation = [
    { name: 'Pulpit', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Media', href: '/admin/media', icon: Image },
    { name: 'Portfolio', href: '/admin/portfolio', icon: Camera },
    { name: 'Strony', href: '/admin/pages', icon: FileText },
    { name: 'Rezerwacje', href: '/admin/bookings', icon: Calendar },
    { name: 'Galerie', href: '/admin/galleries', icon: Image },
    { name: 'Multimedia', href: '/admin/multimedia', icon: Sparkles },
    { name: 'Menu', href: '/admin/menu', icon: Menu },
    { name: 'Foto Wyzwania', href: '/admin/challenges', icon: Trophy },
    { name: 'Blog', href: '/admin/blog', icon: FileText },
    { name: 'Kody rabatowe', href: '/admin/socio', icon: Megaphone },
    { name: 'Kody promocyjne', href: '/admin/promo-codes', icon: Sparkles },
    { name: 'Opinie', href: '/admin/testimonials', icon: MessageSquare },
    { name: 'Karty podarunkowe', href: '/admin/gift-cards', icon: FileText },
    { name: 'Zapytania', href: '/admin/inquiries', icon: MessageSquare },
    { name: 'Użytkownicy', href: '/admin/users', icon: Users },
    { name: 'Analityka', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Logi', href: '/admin/logs', icon: List },
    { name: 'Stopka', href: '/admin/footer', icon: FileText },
    { name: 'Ustawienia', href: '/admin/settings', icon: Settings },
];

interface SidebarProps {
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

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
                            const isActive = pathname.startsWith(item.href);
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
