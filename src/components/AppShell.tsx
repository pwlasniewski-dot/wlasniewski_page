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
                Add top padding to offset the fixed header (header height ~20 = 80px).
                Use 'relative' for scroll-based animations (parallax, etc.) to calculate offsets correctly. */}
            <div className="relative flex-1 pt-20">
                {children}
            </div>
            {!isAdmin && <Footer />}
            {!isAdmin && <CookieBanner />}
        </>
    );
}
