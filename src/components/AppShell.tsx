'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UrgencyBanner from "@/components/UrgencyBanner";
import CookieBanner from "@/components/CookieBanner";
import GiftCardPromoBar from "@/components/GiftCardPromoBar";
import SocialProofBanner from "@/components/PhotoChallenge/SocialProofBanner";
import PromocodeBar from "@/components/PromocodeBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const isHome = pathname === '/';

    return (
        <>
            {!isAdmin && <GiftCardPromoBar />}
            {!isAdmin && <PromocodeBar />}
            {!isAdmin && <Navbar />}
            <div className={`flex-1 ${isAdmin ? '' : (isHome ? 'pt-0' : 'pt-32')} ${isAdmin ? '' : 'pb-24'}`}>
                {!isAdmin && !isHome && <UrgencyBanner />}
                {children}
                {!isAdmin && <Footer />}
            </div>
            {!isAdmin && <CookieBanner />}

            {!isAdmin && (
                <div className="fixed bottom-0 left-0 right-0 z-[60]">
                    <SocialProofBanner />
                </div>
            )}
        </>
    );
}
