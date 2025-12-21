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

    return (
        <>
            {!isAdmin && <GiftCardPromoBar />}
            {!isAdmin && <PromocodeBar />}
            {!isAdmin && <Navbar />}
            <div className="flex-1 pt-48">
                {!isAdmin && <SocialProofBanner />}
                {!isAdmin && <UrgencyBanner />}
                {children}
            </div>
            {!isAdmin && <Footer />}
            {!isAdmin && <CookieBanner />}
        </>
    );
}
