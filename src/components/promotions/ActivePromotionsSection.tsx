'use client';

import Link from 'next/link';
import PromotionPriceBlock from '@/components/promotions/PromotionPriceBlock';
import { activeHomepagePromotions, homepagePromotionBookingHref } from '@/lib/homepagePromotions';
import type { PublicPackagePromotion } from '@/lib/packagePromotionPricing';
import { useAnalytics } from '@/hooks/useAnalytics';
import PackageScope from '@/components/booking/PackageScope';
import { formatPackageDuration } from '@/lib/packageScope';

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
        <section className="border-y border-[#d5cabd] bg-[#ebe4da] px-5 py-10 text-[#2b251f] sm:px-8 md:py-14" data-home-promotions>
            <div className="mx-auto w-full max-w-[1280px]">
                {title && <h2 className="font-display text-4xl leading-tight md:text-5xl">{title}</h2>}
                {subtitle && <p className="mt-4 max-w-3xl leading-relaxed text-[#686057]">{subtitle}</p>}
                {active.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-[#d5cabd] bg-[#f8f5f0] p-6">
                        <p className="leading-relaxed text-[#686057]">{emptyMessage}</p>
                        {emptyButtonText && <Link href={emptyHref} className="mt-5 inline-flex rounded-full bg-[#2b251f] px-5 py-3 text-sm font-semibold text-[#ffffff]">{emptyButtonText}</Link>}
                    </div>
                ) : <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
                    {active.map(promotion => (
                        <article key={promotion.id} className="flex min-w-0 flex-col rounded-2xl border border-[#d5cabd] bg-[#f8f5f0] p-6 sm:p-7">
                            <div className="mb-5">
                                <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#686057]">{promotion.serviceName}</p>
                                <h3 className="mt-2 font-display text-3xl leading-tight text-[#2b251f]">{promotion.packageName}</h3>
                                {Number.isFinite(promotion.hours) && Number(promotion.hours) > 0 && <p className="mt-2 text-sm text-[#686057]">{formatPackageDuration(Number(promotion.hours))}</p>}
                            </div>
                            <PromotionPriceBlock promotion={promotion} variant="booking" tone="light" showRegularPriceSavings={false} />
                            <PackageScope scopeLines={promotion.scopeLines?.slice(0, 3) || []} className="mt-5 text-[#514b44]" />
                            <div className="flex-1" />
                            {buttonText && <Link href={homepagePromotionBookingHref(promotion)}
                                onClick={() => void trackEvent('promotion_package_selected', {
                                    promotion_id: promotion.id, package_id: promotion.packageId,
                                    service: promotion.serviceName, placement: 'home-promotions',
                                })}
                                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#2b251f] px-5 py-3 text-sm font-semibold text-[#ffffff] transition hover:bg-[#4a4036]">
                                {buttonText}
                            </Link>}
                        </article>
                    ))}
                </div>}
            </div>
        </section>
    );
}
