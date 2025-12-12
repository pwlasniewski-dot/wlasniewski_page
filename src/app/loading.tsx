import React from 'react';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center">
                {/* Gold Spinner */}
                <div className="w-16 h-16 border-4 border-zinc-800 border-t-gold-400 rounded-full animate-spin mb-4" />

                {/* Text */}
                <span className="text-gold-400 font-display tracking-widest text-sm animate-pulse">
                    WCZYTYWANIE...
                </span>
            </div>
        </div>
    );
}
