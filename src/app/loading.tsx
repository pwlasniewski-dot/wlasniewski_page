import React from 'react';

export default function Loading() {
    return (
        <div role="status" aria-label="Ładowanie strony" className="mx-auto min-h-[65svh] w-full max-w-6xl px-5 pb-12 pt-32">
            <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
                <div className="h-[42svh] rounded-sm bg-stone-500/10" />
                <div className="h-6 w-2/3 rounded bg-stone-500/15" />
                <div className="h-3 w-1/3 rounded bg-stone-500/10" />
            </div>
            <span className="sr-only">Ładowanie strony</span>
        </div>
    );
}
