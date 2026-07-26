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

    return (
        <AuthProvider>
            <CartProvider>
                {!isAdmin && !isB2B && <GiftCardPromoBar />}
                {!isAdmin && !isB2B && <PromocodeBar />}
                {!isAdmin && <Navbar isB2B={isB2B} />}
                <div className={`flex-1 ${isAdmin ? '' : (isHome ? 'pt-0' : 'pt-32')}`}>
                    {!isAdmin && !isHome && !isB2B && <UrgencyBanner />}
                    {children}
                    {!isAdmin && <Footer isB2B={isB2B} />}
                </div>
                {!isAdmin && <CookieBanner />}
                {!isAdmin && <ScrollToTop />}
                {!isAdmin && !isB2B && <BasketDrawer />}
            </CartProvider>
        </AuthProvider>
    );
}
