'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface GiftCardProps {
    code: string;
    value: number;
    theme: 'christmas' | 'wosp' | 'valentines' | 'easter' | 'halloween' | 'mothers-day' | 'childrens-day' | 'wedding' | 'birthday' | 'gold' | 'blue' | 'green';
    logoUrl?: string;
    recipientName?: string;
    senderName?: string;
    message?: string;
    cardTitle?: string;
    cardDescription?: string;
    isPrint?: boolean;
    hideCode?: boolean;
    showPrice?: boolean;
    orderId?: string;
}

type ThemeConfig = {
    backgroundImage: string;
    title: string;
    description: string;
    textClass: string;
    mutedClass: string;
    borderClass: string;
    overlayClass: string;
    objectPosition: string;
};

const themeConfigs: Record<string, ThemeConfig> = {
    christmas: {
        backgroundImage: '/gift-cards/velvet-premium.webp',
        title: 'Świąteczna sesja',
        description: 'Czas dla bliskich i wspólne zdjęcia',
        textClass: 'text-stone-50',
        mutedClass: 'text-stone-200/80',
        borderClass: 'border-white/20',
        overlayClass: 'bg-black/20',
        objectPosition: 'center'
    },
    wosp: {
        backgroundImage: '/gift-cards/celebration-premium.webp',
        title: 'Sesja fotograficzna',
        description: 'Prezent, który zostaje na dłużej',
        textClass: 'text-stone-50',
        mutedClass: 'text-stone-200/80',
        borderClass: 'border-white/20',
        overlayClass: 'bg-black/15',
        objectPosition: 'center'
    },
    valentines: {
        backgroundImage: '/gift-cards/wedding-premium.webp',
        title: 'Sesja dla dwojga',
        description: 'Wspólny czas przed obiektywem',
        textClass: 'text-stone-900',
        mutedClass: 'text-stone-700/80',
        borderClass: 'border-stone-900/15',
        overlayClass: 'bg-white/5',
        objectPosition: 'right center'
    },
    easter: {
        backgroundImage: '/gift-cards/family-premium.webp',
        title: 'Sesja rodzinna',
        description: 'Spokojne spotkanie i ważne zdjęcia',
        textClass: 'text-stone-900',
        mutedClass: 'text-stone-700/80',
        borderClass: 'border-stone-900/15',
        overlayClass: 'bg-white/5',
        objectPosition: 'right center'
    },
    halloween: {
        backgroundImage: '/gift-cards/celebration-premium.webp',
        title: 'Sesja fotograficzna',
        description: 'Pomysł na wyjątkowe spotkanie',
        textClass: 'text-stone-50',
        mutedClass: 'text-stone-200/80',
        borderClass: 'border-white/20',
        overlayClass: 'bg-black/15',
        objectPosition: 'center'
    },
    'mothers-day': {
        backgroundImage: '/gift-cards/family-premium.webp',
        title: 'Sesja dla mamy',
        description: 'Zdjęcia, na których wreszcie jest cała rodzina',
        textClass: 'text-stone-900',
        mutedClass: 'text-stone-700/80',
        borderClass: 'border-stone-900/15',
        overlayClass: 'bg-white/5',
        objectPosition: 'right center'
    },
    'childrens-day': {
        backgroundImage: '/gift-cards/family-premium.webp',
        title: 'Sesja rodzinna',
        description: 'Wspólna przygoda i zdjęcia na lata',
        textClass: 'text-stone-900',
        mutedClass: 'text-stone-700/80',
        borderClass: 'border-stone-900/15',
        overlayClass: 'bg-white/5',
        objectPosition: 'right center'
    },
    wedding: {
        backgroundImage: '/gift-cards/wedding-premium.webp',
        title: 'Prezent ślubny',
        description: 'Sesja, którą para wybierze po swojemu',
        textClass: 'text-stone-900',
        mutedClass: 'text-stone-700/80',
        borderClass: 'border-stone-900/15',
        overlayClass: 'bg-white/5',
        objectPosition: 'right center'
    },
    birthday: {
        backgroundImage: '/gift-cards/celebration-premium.webp',
        title: 'Prezent urodzinowy',
        description: 'Sesja zamiast kolejnego przedmiotu',
        textClass: 'text-stone-50',
        mutedClass: 'text-stone-200/80',
        borderClass: 'border-white/20',
        overlayClass: 'bg-black/15',
        objectPosition: 'center'
    },
    gold: {
        backgroundImage: '/gift-cards/velvet-premium.webp',
        title: 'Sesja fotograficzna',
        description: 'Czas, zdjęcia i wspomnienia',
        textClass: 'text-stone-50',
        mutedClass: 'text-stone-200/80',
        borderClass: 'border-white/20',
        overlayClass: 'bg-black/20',
        objectPosition: 'center'
    },
    blue: {
        backgroundImage: '/gift-cards/celebration-premium.webp',
        title: 'Sesja fotograficzna',
        description: 'Prezent dopasowany do obdarowanej osoby',
        textClass: 'text-stone-50',
        mutedClass: 'text-stone-200/80',
        borderClass: 'border-white/20',
        overlayClass: 'bg-black/15',
        objectPosition: 'center'
    },
    green: {
        backgroundImage: '/gift-cards/family-premium.webp',
        title: 'Sesja rodzinna',
        description: 'Spokojny czas razem',
        textClass: 'text-stone-900',
        mutedClass: 'text-stone-700/80',
        borderClass: 'border-stone-900/15',
        overlayClass: 'bg-white/5',
        objectPosition: 'right center'
    }
};

export default function GiftCard({
    code,
    value,
    theme = 'gold',
    logoUrl,
    recipientName,
    senderName,
    message,
    cardTitle,
    cardDescription,
    isPrint = false,
    hideCode = false,
    showPrice = true,
    orderId
}: GiftCardProps) {
    const config = themeConfigs[theme] || themeConfigs.gold;
    const displayTitle = cardTitle || config.title;
    const displayDescription = cardDescription || config.description;
    const voucherLogoUrl = logoUrl || '/assets/brand/voucher-logo.svg';
    const isSage = ['green', 'easter', 'mothers-day', 'childrens-day'].includes(theme);
    const isRose = ['valentines', 'wedding'].includes(theme);
    const isBlue = ['blue', 'wosp', 'birthday', 'halloween'].includes(theme);
    const panelClass = isSage ? 'bg-[#dfeae3]' : isRose ? 'bg-[#f0dfdc]' : isBlue ? 'bg-[#dfe9ed]' : 'bg-[#eadfe5]';
    const accentClass = isSage ? 'text-[#5f7e70]' : isRose ? 'text-[#a96860]' : isBlue ? 'text-[#607f8b]' : 'text-[#80677a]';

    return (
        <motion.div
            className={`relative w-full overflow-hidden rounded-[2cqw] border border-stone-900/10 bg-[#f6f1eb] ${isPrint ? '' : 'shadow-2xl shadow-stone-900/15'}`}
            style={{ aspectRatio: '1.586 / 1', containerType: 'inline-size', maxWidth: isPrint ? 'none' : '800px' }}
            whileHover={isPrint ? undefined : { y: -3 }}
            transition={{ duration: 0.25 }}
        >
            <div className="grid h-full grid-cols-[43%_57%]">
                <div className="relative h-full border-r border-white/70">
                    <Image
                        src={config.backgroundImage}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 40vw, 340px"
                        className="object-cover"
                        style={{ objectPosition: config.objectPosition }}
                        aria-hidden="true"
                        priority={false}
                    />
                    <div className="absolute inset-0 bg-white/10" />
                </div>

                <div className={`flex h-full min-w-0 flex-col p-[4cqw] text-[#2f2927] ${panelClass}`}>
                    <div className="flex items-start justify-between gap-[2cqw]">
                        <div className="relative h-[7cqw] w-[23cqw]">
                            <Image src={voucherLogoUrl} alt="Przemysław Właśniewski Fotografia" fill className="object-contain object-left" />
                        </div>
                        <div className="text-right text-[1.3cqw] font-semibold uppercase tracking-[0.2em] text-[#554c48]">Karta podarunkowa</div>
                    </div>

                    <div className="mt-[4.2cqw] min-w-0">
                        <div className={`text-[1.4cqw] font-bold uppercase tracking-[0.24em] ${accentClass}`}>{displayDescription}</div>
                        <div className="mt-[1.4cqw] font-display text-[5.4cqw] font-bold leading-[1.02] tracking-[-0.02em]">{displayTitle}</div>
                        {recipientName && (
                            <p className={`mt-[2.2cqw] font-serif text-[2.9cqw] font-bold italic ${accentClass}`}>Dla {recipientName}</p>
                        )}
                        {message && <p className="mt-[2cqw] line-clamp-2 border-t border-[#2f2927]/20 pt-[1.7cqw] font-serif text-[1.8cqw] font-semibold leading-relaxed text-[#554c48]">{message}</p>}
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-[2cqw]">
                        <div>
                            {showPrice ? (
                                <>
                                    <div className="text-[1.05cqw] uppercase tracking-[0.22em] text-[#766c67]">Wartość</div>
                                    <div className="mt-[0.4cqw] font-serif text-[3.8cqw] leading-none">{Math.round(value)} zł</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-[1.05cqw] uppercase tracking-[0.22em] text-[#766c67]">Prezent</div>
                                    <div className="mt-[0.6cqw] font-display text-[2.6cqw] font-medium leading-none">Sesja fotograficzna</div>
                                </>
                            )}
                        </div>
                        <div className="rounded-full border border-[#514844]/20 bg-white/25 px-[2cqw] py-[1.05cqw] text-right">
                            <div className="text-[.9cqw] uppercase tracking-[0.2em] text-[#766c67]">{hideCode ? 'Kod po opłaceniu' : 'Kod karty'}</div>
                            {!hideCode && <div className="mt-[0.3cqw] font-mono text-[1.55cqw] font-semibold tracking-[0.1em]">{code}</div>}
                        </div>
                    </div>

                    {senderName && <span className="sr-only">Od: {senderName}</span>}
                    {orderId && <span className="sr-only">Numer zamówienia: {orderId}</span>}
                </div>
            </div>
        </motion.div>
    );
}
