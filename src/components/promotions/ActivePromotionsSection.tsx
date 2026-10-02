'use client';

import Link from 'next/link';
import PromotionPriceBlock from '@/components/promotions/PromotionPriceBlock';
import { activeHomepagePromotions, homepagePromotionBookingHref } from '@/lib/homepagePromotions';
import type { PublicPackagePromotion } from '@/lib/packagePromotionPricing';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function ActivePromotionsSection({ promotions, title, subtitle, buttonText, emptyMessage, emptyButtonText, emptyButtonLink }: {
    promotions: PublicPackagePromotion[];
    title: string;
    subtitle?: string;
    buttonText: string;
    emptyMessage: string;
    emptyButtonText: string;
    emptyButtonLink: string;
}) {
    const active = activeHomepagePromotions(promotions);
    const { trackEvent } = useAnalytics();
    const emptyHref = emptyButtonLink?.startsWith('/') && !emptyButtonLink.startsWith('//')
        && !/[\\\u0000-\u0020]/.test(emptyButtonLink)
        ? emptyButtonLink : '/rezerwacja';

    return (
        <section className="border-y border-[#d5cabd] bg-[#ebe4da] px-5 py-16 text-[#2b251f] sm:px-8 md:py-24" data-home-promotions>
            <div className="mx-auto max-w-6xl">
                {title && <h2 className="font-display text-4xl leading-tight md:text-5xl">{title}</h2>}
                {subtitle && <p className="mt-4 max-w-3xl leading-relaxed text-[#686057]">{subtitle}</p>}
                {active.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-[#d5cabd] bg-[#f8f5f0] p-6">
                        <p className="leading-relaxed text-[#686057]">{emptyMessage}</p>
                        {emptyButtonText && <Link href={emptyHref} className="mt-5 inline-flex rounded-full bg-[#2b251f] px-5 py-3 text-sm font-semibold text-white">{emptyButtonText}</Link>}
                    </div>
                ) : <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {active.map(promotion => (
                        <article key={promotion.id} className="flex flex-col rounded-2xl border border-[#d5cabd] bg-[#f8f5f0] p-6">
                            <p className="mb-4 text-sm text-[#686057]">{promotion.serviceName}</p>
                            <PromotionPriceBlock promotion={promotion} variant="compact" tone="light" />
                            {buttonText && <Link href={homepagePromotionBookingHref(promotion)}
                                onClick={() => void trackEvent('promotion_package_selected', {
                                    promotion_id: promotion.id, package_id: promotion.packageId,
                                    service: promotion.serviceName, placement: 'home-promotions',
                                })}
                                className="mt-6 inline-flex items-center justify-center rounded-full bg-[#2b251f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4a4036]">
                                {buttonText}
                            </Link>}
                        </article>
                    ))}
                </div>}
            </div>
        </section>
    );
}
