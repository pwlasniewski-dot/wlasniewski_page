'use client';

export function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        PENDING: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        ACTIVE: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        SUSPENDED: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
        REJECTED: 'bg-zinc-700/40 text-zinc-400 border-zinc-700',
        DELETED: 'bg-black text-zinc-600 border-zinc-800',
    };
    const cls = map[status] || map.PENDING;
    return <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${cls}`}>{status}</span>;
}
