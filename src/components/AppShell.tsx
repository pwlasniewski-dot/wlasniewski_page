'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UrgencyBanner from "@/components/UrgencyBanner";
import CookieBanner from "@/components/CookieBanner";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <>
            {!isAdmin && <UrgencyBanner />}
            {!isAdmin && <Navbar />}
            <main className="flex-1">
                {children}
            </main>
            {!isAdmin && <Footer />}
            {!isAdmin && <CookieBanner />}
        </>
    );
}
