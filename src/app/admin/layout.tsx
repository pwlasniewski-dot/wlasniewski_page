'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import AdminDownloadDiagnostics from '@/components/admin/AdminDownloadDiagnostics';
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
        let cancelled = false;

        // Pages that don't require authentication
        const publicPages = [
            '/admin/login',
            '/admin/forgot-password',
            '/admin/reset-password'
        ];

        // Skip auth check for public pages
        if (publicPages.some(page => pathname?.startsWith(page))) {
            setAuthorized(true);
            return;
        }

        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.replace('/admin/login');
        } else {
            fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            })
                .then((response) => {
                    if (!response.ok) throw new Error('Invalid admin session');
                    if (!cancelled) setAuthorized(true);
                })
                .catch(() => {
                    localStorage.removeItem('admin_token');
                    if (!cancelled) router.replace('/admin/login');
                });
        }

        return () => {
            cancelled = true;
        };
    }, [pathname, router]);

    if (!authorized) {
        return null; // Or a loading spinner
    }

    // Pages that get simple layout (no sidebar)
    const noSidebarPages = [
        '/admin/login',
        '/admin/forgot-password',
        '/admin/reset-password',
        '/admin/offers/create',
        '/admin/generator-umow'
    ];

    // Check if current path matches EXACTLY for editing an offer (avoid matching /admin/offers list which is now redirected anyway)
    const isEditingOffer = pathname?.match(/^\/admin\/offers\/\d+$/);
    const isEditingContract = pathname?.match(/^\/admin\/offers\/\d+\/contract/);

    if (noSidebarPages.some(page => pathname?.startsWith(page)) || isEditingOffer || isEditingContract) {
        return <div className="min-h-screen bg-zinc-950">{children}</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            <Toaster position="top-right" />
            <AdminDownloadDiagnostics />

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
