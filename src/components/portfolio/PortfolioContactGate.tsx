'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/** Contact is useful below the photographs, and disappears when returning to them. */
export default function PortfolioContactGate() {
    const marker = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        let observer: IntersectionObserver | undefined;
        const publish = () => {
            const visible = Boolean(marker.current && marker.current.getBoundingClientRect().top <= window.innerHeight - 180);
            window.dispatchEvent(new CustomEvent('portfolio-contact-visibility', { detail: { pathname, visible } }));
        };
        const observe = () => {
            observer?.disconnect();
            observer = new IntersectionObserver(publish, { rootMargin: '0px 0px -180px 0px' });
            if (marker.current) observer.observe(marker.current);
            publish();
        };
        observe();
        window.addEventListener('resize', observe);
        window.addEventListener('portfolio-contact-check', publish);
        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', observe);
            window.removeEventListener('portfolio-contact-check', publish);
            window.dispatchEvent(new CustomEvent('portfolio-contact-visibility', { detail: { pathname, visible: false } }));
        };
    }, [pathname]);

    return <div ref={marker} data-portfolio-contact-gate="" aria-hidden="true" className="h-px w-full" />;
}
