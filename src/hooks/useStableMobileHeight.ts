'use client';

import { useEffect, type RefObject } from 'react';

/** In-app browser toolbars can resize the WebView during a vertical gesture. */
export function useStableMobileHeight(ref: RefObject<HTMLElement>, enabled = true) {
    useEffect(() => {
        const element = ref.current;
        if (!enabled || !element) return;
        let previousWidth = -1;
        const measure = () => {
            const width = window.innerWidth;
            if (width === previousWidth) return;
            previousWidth = width;
            // Read the existing responsive height only at mount or a real width
            // change (including rotation); height-only toolbar changes are ignored.
            element.style.removeProperty('--gallery-hero-height');
            if (width < 768) {
                element.style.setProperty('--gallery-hero-height', `${element.getBoundingClientRect().height}px`);
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => {
            window.removeEventListener('resize', measure);
            element.style.removeProperty('--gallery-hero-height');
        };
    }, [ref, enabled]);
}
