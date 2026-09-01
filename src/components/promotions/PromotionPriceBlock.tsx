'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, Clock3 } from 'lucide-react';
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
        month: 'short',
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
    const savings = Math.max(0, promotion.regularPrice - promotion.price);
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
                className={`w-full max-w-[19rem] rounded-[1.15rem] border border-[#ead5ab]/45 bg-black/58 px-4 py-3.5 text-left shadow-[0_18px_55px_rgba(0,0,0,.32)] backdrop-blur-md ${className}`}
                data-promotion-id={promotion.id}
                data-package-id={promotion.packageId}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#b5523c] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.18em] text-white">
                        {promotion.label}
                    </span>
                    {promotion.displayDiscountPercent > 0 && (
                        <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#f4dfb6]">
                            −{promotion.displayDiscountPercent}%
                        </span>
                    )}
                </div>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/72">
                    {promotion.packageName}
                </p>
                <div className="mt-1.5 flex items-end gap-3">
                    <strong className="font-display text-[2.25rem] font-normal leading-none text-white">
                        {formatPricePln(promotion.price)}
                    </strong>
                    <span className="mb-0.5 text-xs text-white/62 line-through decoration-[#e0a48f] decoration-2">
                        {formatPricePln(promotion.regularPrice)}
                    </span>
                    <ArrowRight className="mb-0.5 ml-auto shrink-0 text-[#ead5ab]" size={18} />
                </div>
                <p className="mt-2 text-[11px] leading-4 text-[#eee4d5]">{promotion.legalText}</p>
                {endsAt && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-[#f4dfb6]">
                        <Clock3 size={12} /> Do {endsAt}
                    </p>
                )}
            </div>
        );
    }

    if (variant === 'summary') {
        return (
            <div
                className={`border-l-2 border-[#c66f57] pl-3 text-left ${className}`}
                data-promotion-id={promotion.id}
                data-package-id={promotion.packageId}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#a84631] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-white">{promotion.label}</span>
                    {promotion.displayDiscountPercent > 0 && <span className="text-[10px] font-bold text-[#e9b3a4]">−{promotion.displayDiscountPercent}%</span>}
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <strong className="text-xl font-extrabold text-[#f6d4c9]">{formatPricePln(promotion.price)}</strong>
                    <span className="text-xs text-zinc-500 line-through">{formatPricePln(promotion.regularPrice)}</span>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-zinc-400">{promotion.legalText}</p>
            </div>
        );
    }

    return (
        <div
            className={`text-left ${className}`}
            data-promotion-id={promotion.id}
            data-package-id={promotion.packageId}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-[#a84631] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.17em] text-white">
                    {promotion.label}
                </span>
                <span className="text-[11px] font-bold text-[#8a3423]">
                    {savings > 0 ? `Oszczędzasz ${formatPricePln(savings)}` : `−${promotion.displayDiscountPercent}%`}
                </span>
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                <strong className="text-[2.35rem] font-extrabold leading-none tracking-[-.035em] text-[#8a3423]">
                    {formatPricePln(promotion.price)}
                </strong>
                <span className="pb-0.5 text-sm font-semibold text-[#7b7168] line-through decoration-[#b95b44] decoration-2">
                    {formatPricePln(promotion.regularPrice)}
                </span>
                {promotion.displayDiscountPercent > 0 && (
                    <span className="pb-0.5 text-xs font-extrabold text-[#9d402c]">−{promotion.displayDiscountPercent}%</span>
                )}
            </div>
            <p className="mt-3 border-t border-[#dcb7a8]/65 pt-2.5 text-[11px] leading-4 text-[#5f554c]">
                {promotion.legalText}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-[#7b6359]">
                {endsAt && <span className="inline-flex items-center gap-1"><Clock3 size={11} /> Do {endsAt}</span>}
                {!promotion.allowPromoCode && <span>Bez dodatkowego kodu</span>}
            </div>
        </div>
    );
}
