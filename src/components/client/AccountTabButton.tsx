import React, { type ReactNode } from 'react';

type AccountTabButtonProps = {
    label: string;
    active: boolean;
    onClick?: () => void;
    icon: ReactNode;
    count?: number;
    hasAlert?: boolean;
};

export default function AccountTabButton({
    label,
    active,
    onClick,
    icon,
    count,
    hasAlert,
}: AccountTabButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            data-account-tab
            className={`relative flex min-h-16 min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                active
                    ? 'border-gold-400 bg-gold-500 text-zinc-950 shadow-lg shadow-gold-500/20'
                    : hasAlert
                        ? 'border-gold-500/80 bg-gold-500/15 text-white shadow-[0_0_20px_rgba(212,175,55,0.18)]'
                        : 'border-zinc-700 bg-zinc-900/90 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800'
            }`}
        >
            {hasAlert && !active && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-gold-400" aria-label="Nowa informacja" />
            )}
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                active
                    ? 'border-black/15 bg-black/10 text-zinc-950'
                    : 'border-zinc-600 bg-zinc-800 text-gold-400'
            }`} aria-hidden>
                {icon}
            </span>
            <span className="min-w-0 flex-1 break-words leading-tight">{label}</span>
            {count !== undefined && count > 0 && (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-black ${
                    active ? 'bg-black/15 text-zinc-950' : 'bg-zinc-700 text-white'
                }`} aria-label={`${count} elementów`}>
                    {count}
                </span>
            )}
        </button>
    );
}
