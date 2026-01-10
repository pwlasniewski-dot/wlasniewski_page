'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard,
    Calendar,
    Package,
    DollarSign,
    Image,
    LogOut,
    X
} from 'lucide-react';

const navigation = [
    { name: 'Pulpit', href: '/provider-panel', icon: LayoutDashboard },
    { name: 'Moje Pakiety', href: '/provider-panel/packages', icon: Package },
    { name: 'Dostępność', href: '/provider-panel/availability', icon: Calendar },
    { name: 'Rozliczenia', href: '/provider-panel/payouts', icon: DollarSign },
    { name: 'Portfolio', href: '/provider-panel/portfolio', icon: Image },
];

interface SidebarProps {
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export default function ProviderSidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('provider_token');
        localStorage.removeItem('provider_user');
        router.push('/provider-panel/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen?.(false)}
            />

            {/* Sidebar Container */}
            <div className={`fixed inset-y-0 z-50 flex w-64 flex-col bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-16 flex-shrink-0 items-center justify-between px-4" title="Panel Dostawcy - Właśniewski.pl">
                    <span className="text-xl font-display font-bold text-white tracking-wider">
                        PROVIDER<span className="text-gold-400">.</span>PANEL
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
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                                        className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-gold-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}
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
