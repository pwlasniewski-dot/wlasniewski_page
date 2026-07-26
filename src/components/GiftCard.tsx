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
    orderId
}: GiftCardProps) {
    const config = themeConfigs[theme] || themeConfigs.gold;
    const displayTitle = cardTitle || config.title;
    const displayDescription = cardDescription || config.description;

    return (
        <motion.div
            className={`relative w-full overflow-hidden rounded-[2cqw] border ${config.borderClass} ${isPrint ? '' : 'shadow-2xl shadow-black/40'}`}
            style={{ aspectRatio: '1.586 / 1', containerType: 'inline-size', maxWidth: isPrint ? 'none' : '800px' }}
            whileHover={isPrint ? undefined : { y: -3 }}
            transition={{ duration: 0.25 }}
        >
            <Image
                src={config.backgroundImage}
                alt=""
                fill
                sizes="(max-width: 768px) 92vw, 640px"
                className="object-cover"
                style={{ objectPosition: config.objectPosition }}
                aria-hidden="true"
                priority={false}
            />
            <div className={`absolute inset-0 ${config.overlayClass}`} />

            <div className={`relative z-10 flex h-full flex-col justify-between p-[5cqw] ${config.textClass}`}>
                <div className="flex items-start justify-between gap-[3cqw]">
                    {logoUrl ? (
                        <div className="relative h-[10cqw] w-[18cqw]">
                            <Image src={logoUrl} alt="Właśniewski Fotografia" fill className="object-contain object-left" />
                        </div>
                    ) : (
                        <div className="text-[1.9cqw] font-semibold uppercase tracking-[0.28em]">Właśniewski Fotografia</div>
                    )}
                    <div className={`text-right text-[1.65cqw] uppercase tracking-[0.28em] ${config.mutedClass}`}>Karta podarunkowa</div>
                </div>

                <div className="max-w-[72%]">
                    <div className="font-display text-[6.3cqw] font-medium leading-[0.98] tracking-[-0.02em]">{displayTitle}</div>
                    <p className={`mt-[1.6cqw] text-[2.25cqw] leading-relaxed ${config.mutedClass}`}>{displayDescription}</p>
                    {recipientName && (
                        <p className={`mt-[2cqw] text-[1.9cqw] ${config.mutedClass}`}>
                            Dla <span className="font-semibold">{recipientName}</span>
                        </p>
                    )}
                    {message && <p className={`mt-[1cqw] line-clamp-2 text-[1.7cqw] italic ${config.mutedClass}`}>{message}</p>}
                </div>

                <div className="flex items-end justify-between gap-[3cqw]">
                    <div>
                        <div className={`text-[1.45cqw] uppercase tracking-[0.24em] ${config.mutedClass}`}>Wartość</div>
                        <div className="mt-[0.4cqw] text-[5.8cqw] font-semibold leading-none">{Math.round(value)} zł</div>
                    </div>
                    <div className={`rounded-full border ${config.borderClass} bg-black/10 px-[2.7cqw] py-[1.35cqw] text-right backdrop-blur-sm`}>
                        <div className={`text-[1.25cqw] uppercase tracking-[0.2em] ${config.mutedClass}`}>{hideCode ? 'Kod po opłaceniu' : 'Kod karty'}</div>
                        {!hideCode && <div className="mt-[0.35cqw] font-mono text-[2.15cqw] font-semibold tracking-[0.12em]">{code}</div>}
                    </div>
                </div>

                {senderName && <span className="sr-only">Od: {senderName}</span>}
                {orderId && <span className="sr-only">Numer zamówienia: {orderId}</span>}
            </div>
        </motion.div>
    );
}
