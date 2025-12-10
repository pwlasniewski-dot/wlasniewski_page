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
            {/* Use a div wrapper instead of <main> so page-level <main> elements are not nested.
                Add top padding to offset the fixed header (header height ~56-64px). */}
            <div className="flex-1 pt-16 md:pt-20">
                {children}
            </div>
            {!isAdmin && <Footer />}
            {!isAdmin && <CookieBanner />}
        </>
    );
}
