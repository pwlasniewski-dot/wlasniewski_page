'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UrgencyBanner from "@/components/UrgencyBanner";
import CookieBanner from "@/components/CookieBanner";
import GiftCardPromoBar from "@/components/GiftCardPromoBar";
import PromocodeBar from "@/components/PromocodeBar";
import ScrollToTop from "@/components/ScrollToTop";
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import BasketDrawer from '@/components/BasketDrawer';
import { isB2BContext } from '@/lib/context';
import AeroHeader from '@/components/aero/AeroHeader';
import AeroFooter from '@/components/aero/AeroFooter';

export default function AppShell({ children, isB2B: serverIsB2B }: { children: React.ReactNode; isB2B?: boolean }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const clientIsB2B = isB2BContext({
        pathname,
        hostname: typeof window !== 'undefined' ? window.location.hostname : undefined,
        port: typeof window !== 'undefined' ? window.location.port : undefined
    });
    const isB2B = serverIsB2B || clientIsB2B;
    const isHome = pathname === '/';

    // Public Aero Analiza deliberately does not mount the photography account,
    // basket, promotions or customer-zone providers.
    if (isB2B && !isAdmin) {
        return (
            <div className="aero-site flex min-h-screen flex-col bg-[#f4f8fb] text-[#142e49]">
                <AeroHeader />
                <div className="flex-1 pt-20">
                    {children}
                    <AeroFooter />
                </div>
                <CookieBanner variant="aero" />
                <ScrollToTop />
            </div>
        );
    }

    return (
        <AuthProvider>
            <CartProvider>
                {!isAdmin && !isB2B && <GiftCardPromoBar />}
                {!isAdmin && !isB2B && <PromocodeBar />}
                {!isAdmin && <Navbar isB2B={false} />}
                <div className={`flex-1 ${isAdmin ? '' : (isHome ? 'pt-0' : 'pt-32')}`}>
                    {!isAdmin && !isHome && !isB2B && <UrgencyBanner />}
                    {children}
                    {!isAdmin && <Footer isB2B={false} />}
                </div>
                {!isAdmin && !isB2B && <CookieBanner />}
                {!isAdmin && <ScrollToTop />}
                {!isAdmin && !isB2B && <BasketDrawer />}
            </CartProvider>
        </AuthProvider>
    );
}
