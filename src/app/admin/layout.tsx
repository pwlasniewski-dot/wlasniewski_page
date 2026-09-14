'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import AdminDownloadDiagnostics from '@/components/admin/AdminDownloadDiagnostics';
import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';
import { checkAdminSession, clearAdminIdentity, publicAdminPaths } from '@/lib/admin/session';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const isPublic = publicAdminPaths.has(pathname);
    const [session, setSession] = useState<'checking' | 'authorized' | 'unavailable'>('checking');
    const [retry, setRetry] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (isPublic) { setSession('checking'); return; }
        const controller = new AbortController();
        setSession('checking');
        checkAdminSession(controller.signal).then(result => {
            if (controller.signal.aborted) return;
            if (result === 'invalid') {
                clearAdminIdentity();
                router.replace('/admin/login');
            } else setSession(result);
        }).catch(() => {
            if (!controller.signal.aborted) setSession('unavailable');
        });
        return () => controller.abort();
    }, [isPublic, router, retry]);

    if (!isPublic && session !== 'authorized') {
        return <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-200">
            <div className="max-w-md text-center" role={session === 'unavailable' ? 'alert' : 'status'}>
                <p>{session === 'unavailable' ? 'Nie można teraz sprawdzić sesji. Sprawdź połączenie i spróbuj ponownie.' : 'Sprawdzanie sesji administratora…'}</p>
                {session === 'unavailable' && <button type="button" onClick={() => setRetry(value => value + 1)} className="mt-5 min-h-11 rounded-xl bg-gold-400 px-5 py-3 font-semibold text-zinc-950">Spróbuj ponownie</button>}
            </div>
        </div>;
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

    if (noSidebarPages.includes(pathname) || isEditingOffer || isEditingContract) {
        return <div className="min-h-screen bg-zinc-950"><Toaster position="top-right" />{children}</div>;
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
                        <div className={/^\/admin\/galleries\/\d+$/.test(pathname || '') ? "w-full min-w-0 px-3 sm:px-5 md:px-6" : "mx-auto max-w-7xl px-4 sm:px-6 md:px-8"}>
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
