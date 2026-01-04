'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UrgencyBanner from "@/components/UrgencyBanner";
import CookieBanner from "@/components/CookieBanner";
import GiftCardPromoBar from "@/components/GiftCardPromoBar";
import SocialProofBanner from "@/components/PhotoChallenge/SocialProofBanner";
import PromocodeBar from "@/components/PromocodeBar";
import ScrollToTop from "@/components/ScrollToTop";
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import BasketDrawer from '@/components/BasketDrawer';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const isB2B = pathname?.startsWith('/b2b') || pathname?.startsWith('/dron');
    const isHome = pathname === '/';

    return (
        <AuthProvider>
            <CartProvider>
                {!isAdmin && !isB2B && <GiftCardPromoBar />}
                {!isAdmin && !isB2B && <PromocodeBar />}
                {!isAdmin && <Navbar />}
                <div className={`flex-1 ${isAdmin ? '' : (isHome ? 'pt-0' : 'pt-32')} ${isAdmin ? '' : 'pb-20 md:pb-24'}`}>
                    {!isAdmin && !isHome && !isB2B && <UrgencyBanner />}
                    {children}
                    {!isAdmin && <Footer />}
                </div>
                {!isAdmin && <CookieBanner />}

                {!isAdmin && !isB2B && (
                    <div className="fixed bottom-0 left-0 right-0 z-[60]">
                        <SocialProofBanner />
                    </div>
                )}
                {!isAdmin && <ScrollToTop />}
                {!isAdmin && <BasketDrawer />}
            </CartProvider>
        </AuthProvider>
    );
}
