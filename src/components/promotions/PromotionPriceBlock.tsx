'use client';

import { useEffect, useRef } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatPricePln, type PublicPackagePromotion } from '@/lib/packagePromotionPricing';

type PromotionPriceBlockProps = {
    promotion: PublicPackagePromotion;
    variant: 'home' | 'booking' | 'summary';
    className?: string;
};

function formatEndDate(value: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Warsaw',
    }).format(date);
}

export default function PromotionPriceBlock({
    promotion,
    variant,
    className = '',
}: PromotionPriceBlockProps) {
    const endsAt = formatEndDate(promotion.endsAt);
    const referenceWindowLabel = promotion.referencePeriod === 'SINCE_OFFERING'
        ? 'od rozpoczęcia oferowania'
        : 'z 30 dni';
    const { trackEvent } = useAnalytics();
    const tracked = useRef(false);

    useEffect(() => {
        if (tracked.current) return;
        tracked.current = true;
        void trackEvent('promotion_view', {
            promotion_id: promotion.id,
            package_id: promotion.packageId,
            service: promotion.serviceName,
            placement: variant,
        });
    }, [promotion.id, promotion.packageId, promotion.serviceName, trackEvent, variant]);

    if (variant === 'home') {
        return (
            <div
                className={`max-w-[19rem] rounded-2xl border border-[#f0dcb8]/45 bg-[#2d211a]/92 p-4 text-left shadow-[0_18px_50px_rgba(0,0,0,.28)] backdrop-blur-md ${className}`}
                data-promotion-id={promotion.id}
                data-package-id={promotion.packageId}
            >
                <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#a84631] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.18em] text-white">
                        {promotion.label}
                    </span>
                    {promotion.displayDiscountPercent > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#f4dfb6]">
                            −{promotion.displayDiscountPercent}%
                        </span>
                    )}
                </div>
                <p className="mt-3 text-xs font-semibold text-white/80">{promotion.packageName}</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <strong className="font-display text-3xl font-normal text-white">
                        {formatPricePln(promotion.price)}
                    </strong>
                    <span className="text-[11px] text-white/60">Cena regularna <span className="line-through decoration-[#d9a081] decoration-2">{formatPricePln(promotion.regularPrice)}</span></span>
                </div>
                <p className="mt-2 text-[10px] leading-4 text-[#eadfce]">
                    {promotion.legalText}
                </p>
                {endsAt && (
                    <p className="mt-1 text-[10px] font-semibold text-[#f4dfb6]">
                        Oferta do {endsAt}
                    </p>
                )}
            </div>
        );
    }

    if (variant === 'summary') {
        return (
            <div
                className={`rounded-xl border border-[#a84631]/45 bg-[#2c211c] p-3 text-left ${className}`}
                data-promotion-id={promotion.id}
                data-package-id={promotion.packageId}
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-[#a84631] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-white">
                        {promotion.label}
                    </span>
                    {promotion.displayDiscountPercent > 0 && (
                        <span className="text-[10px] font-bold text-[#f1c5b7]">−{promotion.displayDiscountPercent}%</span>
                    )}
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <strong className="text-xl font-extrabold text-[#f6d4c9]">{formatPricePln(promotion.price)}</strong>
                    <span className="text-xs font-semibold text-zinc-500">Cena regularna <span className="line-through">{formatPricePln(promotion.regularPrice)}</span></span>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400">{promotion.legalText}</p>
                {endsAt && <p className="mt-1 text-[10px] font-semibold text-[#e8b4a4]">Oferta do {endsAt}</p>}
            </div>
        );
    }

    return (
        <div
            className={`rounded-xl border border-[#c9826f]/45 bg-[#fff8f3] p-4 shadow-[0_12px_35px_rgba(91,61,47,.08)] ${className}`}
            data-promotion-id={promotion.id}
            data-package-id={promotion.packageId}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-[#a84631] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-white">
                    {promotion.label}
                </span>
                {promotion.displayDiscountPercent > 0 && (
                    <span className="text-xs font-extrabold text-[#8a3423]">
                        −{promotion.displayDiscountPercent}% względem ceny {referenceWindowLabel}
                    </span>
                )}
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <strong className="text-3xl font-extrabold text-[#8a3423]">
                    {formatPricePln(promotion.price)}
                </strong>
                <span className="text-sm font-semibold text-[#7b7168]">Cena regularna <span className="line-through decoration-[#b95b44] decoration-2">{formatPricePln(promotion.regularPrice)}</span></span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#5f554c]">
                {promotion.legalText}
            </p>
            {endsAt && (
                <p className="mt-1 text-xs font-bold text-[#8a3423]">
                    Promocja obowiązuje do {endsAt}
                </p>
            )}
            {!promotion.allowPromoCode && (
                <p className="mt-2 text-[11px] leading-4 text-[#7b7168]">
                    Promocja pakietu nie łączy się z kodami rabatowymi.
                </p>
            )}
        </div>
    );
}
