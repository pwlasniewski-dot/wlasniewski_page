'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FAQ { q: string; a: string; }

export default function FAQAccordion({ items }: { items: FAQ[] }) {
    return (
        <div className="space-y-3">
            {items.map((it, i) => (
                <FAQItem key={i} q={it.q} a={it.a} />
            ))}
        </div>
    );
}

function FAQItem({ q, a }: FAQ) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`rounded-xl border transition-all ${open ? 'bg-amber-50 border-amber-300' : 'bg-white border-stone-200 hover:border-amber-200'}`}>
            <button
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
            >
                <span className={`font-semibold text-lg ${open ? 'text-amber-800' : 'text-stone-800'}`}>{q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180 text-amber-700' : 'text-stone-400'}`} />
            </button>
            {open && (
                <div className="px-6 pb-5 text-stone-700 leading-relaxed">
                    {a}
                </div>
            )}
        </div>
    );
}
