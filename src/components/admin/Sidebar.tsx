'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, X, ChevronDown } from 'lucide-react';
import { navigation, activeAdminNavigation } from '@/lib/admin/navigation';
import { logoutAdmin } from '@/lib/admin/session';
import toast from 'react-hot-toast';

interface SidebarProps {
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

    const [loggingOut, setLoggingOut] = useState(false);
    const active = activeAdminNavigation(pathname);
    useEffect(() => {
        setExpandedMenu(active?.parent ?? null);
    }, [active?.parent]);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await logoutAdmin();
            router.replace('/admin/login');
            router.refresh();
        } catch {
            toast.error('Nie udało się zakończyć sesji. Spróbuj ponownie.');
        } finally {
            setLoggingOut(false);
        }
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
                        aria-label="Zamknij menu"
                        className="md:hidden text-zinc-400 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                    <nav aria-label="Panel administratora" className="mt-2 flex-1 space-y-1 px-2">
                        {navigation.map((item) => {
                            const isActive = active?.parent === item.name;
                            const hasChildren = 'children' in item && item.children;
                            const isExpanded = expandedMenu === item.name;

                            if (hasChildren) {
                                return (
                                    <div key={item.name}>
                                        <button
                                            aria-expanded={isExpanded}
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
                                                        aria-current={active?.href === child.href ? 'page' : undefined}
                                                        href={child.href}
                                                        onClick={() => setIsOpen?.(false)}
                                                        className={`block px-2 py-2 text-sm rounded-md transition-colors ${active?.href === child.href
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
                                    aria-current={isActive ? 'page' : undefined}
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
                        disabled={loggingOut}
                        className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        <LogOut
                            className="mr-3 h-5 w-5 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300"
                            aria-hidden="true"
                        />
                        {loggingOut ? 'Wylogowywanie…' : 'Wyloguj się'}
                    </button>
                </div>
            </div>
        </>
    );
}
