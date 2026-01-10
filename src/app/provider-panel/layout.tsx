'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';
import ProviderSidebar from '@/components/provider/ProviderSidebar';

export default function ProviderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        // Public pages
        if (pathname?.startsWith('/provider-panel/login')) {
            setAuthorized(true);
            return;
        }

        const token = localStorage.getItem('provider_token');
        const userStr = localStorage.getItem('provider_user');

        if (!token || !userStr) {
            router.push('/provider-panel/login');
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'PHOTOGRAPHER') {
                // Wrong role, kick out
                localStorage.removeItem('provider_token');
                router.push('/provider-panel/login');
                return;
            }
            setAuthorized(true);
        } catch (e) {
            localStorage.removeItem('provider_token');
            router.push('/provider-panel/login');
        }

    }, [pathname, router, isClient]);

    if (!isClient || !authorized) {
        // Show login layout if on login page, else nothing while redirecting
        if (pathname?.startsWith('/provider-panel/login')) {
            return <>{children}</>;
        }
        return null;
    }

    // Login page renders without layout
    if (pathname?.startsWith('/provider-panel/login')) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
            <Toaster position="top-right" toastOptions={{
                style: {
                    background: '#18181b',
                    color: '#fff',
                    border: '1px solid #27272a'
                }
            }} />

            <ProviderSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex flex-1 flex-col md:pl-64 transition-all duration-300">
                <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-4 shadow-sm md:hidden">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-zinc-400 hover:text-white"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Otwórz menu</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="flex-1 text-sm font-semibold leading-6 text-white">
                        Panel Dostawcy
                    </div>
                </div>

                <main className="py-8">
                    <div className="px-4 sm:px-6 md:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
