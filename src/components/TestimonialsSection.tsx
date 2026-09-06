"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { selectPublicReviews, summarizeGoogleReviews, googleReviewSummaryLabel } from '@/lib/public-reviews';

type Testimonial = {
    id: number;
    client_name: string;
    testimonial_text: string;
    rating: number;
    source: string | null;
    is_featured?: boolean;
    show_on_booking_page?: boolean;
    display_order?: number;
    photo_size: number;
    client_photo?: {
        file_path: string;
        alt_text: string | null;
    } | null;
};

export default function TestimonialsSection({ placement = 'general' }: { placement?: 'general' | 'booking' }) {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<ReturnType<typeof summarizeGoogleReviews>>(null);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await fetch("/api/testimonials", { cache: 'no-store' });
                if (!res.ok) throw new Error('Opinie są chwilowo niedostępne.');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setTestimonials(selectPublicReviews(data as Testimonial[], placement));
                    setSummary(summarizeGoogleReviews(data));
                }
            } catch (error) {
                console.error("Error fetching testimonials:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, [placement]);

    if (loading || testimonials.length === 0) return null;

    return (
        <section className="mb-16">
            <h2 className="text-2xl font-bold text-[var(--wedding-brown)] text-center mb-12 uppercase tracking-widest font-serif">
                Zaufali mi
            </h2>
            {summary && <p className="mb-8 text-center text-sm text-[#a17e42]">{googleReviewSummaryLabel(summary)}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                {testimonials.map((t) => (
                    <article key={t.id} className="h-full bg-zinc-800/75 border border-zinc-700/70 p-6 rounded-xl shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                            <div
                                className="relative shrink-0 rounded-full overflow-hidden border border-gold-500/30"
                                style={{ width: 56, height: 56 }}
                            >
                                {t.client_photo ? (
                                    <Image
                                        src={t.client_photo.file_path}
                                        alt={t.client_photo.alt_text || t.client_name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl bg-zinc-800 text-gold-500">👤</div>
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-zinc-50 font-serif text-lg">{t.client_name}</div>
                                <div className="flex text-gold-500 text-xs gap-0.5">
                                    {"★".repeat(Math.max(0, Math.min(5, t.rating || 0)))}
                                </div>
                                {t.source && <p className="mt-1 text-xs text-zinc-300">{t.source}</p>}
                            </div>
                        </div>
                        <p className="mt-auto text-zinc-200 text-base italic leading-relaxed font-serif">
                            "{t.testimonial_text}"
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}
