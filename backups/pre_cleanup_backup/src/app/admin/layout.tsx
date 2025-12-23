'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        // Pages that don't require authentication
        const publicPages = [
            '/admin/login',
            '/admin/forgot-password',
            '/admin/reset-password',
            '/admin/emergency-reset'
        ];

        // Skip auth check for public pages
        if (publicPages.some(page => pathname?.startsWith(page))) {
            setAuthorized(true);
            return;
        }

        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
        } else {
            setAuthorized(true);
        }
    }, [pathname, router]);

    if (!authorized) {
        return null; // Or a loading spinner
    }

    // Public pages get simple layout (no sidebar)
    const publicPages = ['/admin/login', '/admin/forgot-password', '/admin/reset-password', '/admin/emergency-reset'];
    if (publicPages.some(page => pathname?.startsWith(page))) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            <Toaster position="top-right" />

            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex flex-1 flex-col md:pl-64">
                <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-zinc-900 shadow md:hidden">
                    <button
                        type="button"
                        className="px-4 text-zinc-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold-500 md:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Otwórz menu</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="flex flex-1 justify-between px-4 items-center">
                        <span className="text-lg font-display font-bold text-white">
                            Panel Admina
                        </span>
                    </div>
                </div>

                <main className="flex-1">
                    <div className="py-6">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
