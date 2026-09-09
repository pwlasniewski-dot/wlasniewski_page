'use client';

import { useEffect, type RefObject } from 'react';

/** Let native scrolling settle before scheduling the next automatic photo. */
export function useSliderAutoplay(
    rootRef: RefObject<HTMLElement>,
    trackRef: RefObject<HTMLDivElement>,
    count: number,
    enabled = true,
    interval = 6000,
) {
    useEffect(() => {
        const root = rootRef.current;
        const track = trackRef.current;
        if (!enabled || count < 2 || !root || !track) return;

        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let timer: ReturnType<typeof setTimeout> | undefined;
        let visible = false;
        let pressed = false;
        let hovered = false;
        let focused = false;
        const clear = () => clearTimeout(timer);
        const schedule = () => {
            clear();
            if (!visible || pressed || hovered || focused || document.hidden || motion.matches
                || document.documentElement.dataset.photoViewerOpen === 'true') return;
            timer = setTimeout(() => {
                if (!track.clientWidth) return;
                const current = Math.round(track.scrollLeft / track.clientWidth);
                const next = (current + 1) % count;
                track.scrollTo({
                    left: next * track.clientWidth,
                    // Do not sweep through every photo when looping back.
                    behavior: next === 0 ? 'instant' : 'smooth',
                });
                schedule();
            }, interval);
        };
        const down = () => { pressed = true; clear(); };
        const up = () => { if (pressed) { pressed = false; schedule(); } };
        const enter = (event: PointerEvent) => {
            if (event.pointerType === 'mouse') { hovered = true; clear(); }
        };
        const leave = () => { hovered = false; schedule(); };
        const focus = () => { focused = root.matches(':focus-visible') || !!root.querySelector(':focus-visible'); schedule(); };
        const blur = (event: FocusEvent) => {
            if (!root.contains(event.relatedTarget as Node | null)) { focused = false; schedule(); }
        };
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            schedule();
        });
        observer.observe(track);
        root.addEventListener('pointerdown', down);
        root.addEventListener('pointerenter', enter);
        root.addEventListener('pointerleave', leave);
        root.addEventListener('focusin', focus);
        root.addEventListener('focusout', blur);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        track.addEventListener('scroll', schedule, { passive: true });
        document.addEventListener('visibilitychange', schedule);
        window.addEventListener('photo-viewer-visibility', schedule);
        motion.addEventListener('change', schedule);
        return () => {
            clear();
            observer.disconnect();
            root.removeEventListener('pointerdown', down);
            root.removeEventListener('pointerenter', enter);
            root.removeEventListener('pointerleave', leave);
            root.removeEventListener('focusin', focus);
            root.removeEventListener('focusout', blur);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
            track.removeEventListener('scroll', schedule);
            document.removeEventListener('visibilitychange', schedule);
            window.removeEventListener('photo-viewer-visibility', schedule);
            motion.removeEventListener('change', schedule);
        };
    }, [rootRef, trackRef, count, enabled, interval]);
}
