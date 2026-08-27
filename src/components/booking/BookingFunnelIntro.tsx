import React from 'react';
import {
    formatPhotoFunnelTemplate,
    type PhotoFunnelConfig,
} from '@/lib/marketing/photo-funnel';

interface BookingFunnelIntroProps {
    config: PhotoFunnelConfig;
    splitPaymentInfo: { enabled: boolean; percent: number } | null;
}

/**
 * Public rendering boundary for the CMS-controlled booking proposition.
 * Kept presentational so the admin save → public read → customer render
 * contract can be tested without a browser or production database.
 */
export default function BookingFunnelIntro({ config, splitPaymentInfo }: BookingFunnelIntroProps) {
    const copy = config.bookingCopy;

    return (
        <>
            <h1 className="font-display text-4xl md:text-5xl font-medium text-[#25221f] mb-4 text-center">
                {copy.heroTitle}
            </h1>
            <p className="text-[#514b44] text-center max-w-2xl mx-auto mb-8 leading-relaxed">
                {copy.heroDescription}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12 text-sm">
                {[
                    ['1', copy.stepService],
                    ['2', copy.stepDate],
                    ['3', copy.stepPayment],
                ].map(([number, label]) => (
                    <div key={number} className="rounded-xl border border-[#ddd6cc] bg-white/85 px-4 py-3 text-[#514b44]">
                        <span className="mr-2 font-semibold text-[#766958]">{number}.</span>{label}
                    </div>
                ))}
            </div>

            {splitPaymentInfo && (
                <div className="mb-8 rounded-2xl border border-[#c9b78f] bg-[#fffaf0] px-5 py-4 text-sm leading-relaxed text-[#514b44]">
                    <strong className="text-[#25221f]">{copy.paymentLead}</strong>{' '}
                    {splitPaymentInfo.enabled
                        ? formatPhotoFunnelTemplate(copy.paymentSplitTemplate, { percent: splitPaymentInfo.percent })
                        : copy.paymentFull}
                </div>
            )}
        </>
    );
}
