"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

type Testimonial = {
    id: number;
    client_name: string;
    testimonial_text: string;
    rating: number;
    source: string | null;
    photo_size: number;
    client_photo?: {
        file_path: string;
        alt_text: string | null;
    } | null;
};

export default function TestimonialsSection() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await fetch("/api/testimonials");
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filter for booking page specific testimonials first, then featured/high rated
                    const bookingTestimonials = data.filter((t: any) => t.show_on_booking_page);

                    if (bookingTestimonials.length > 0) {
                        setTestimonials(bookingTestimonials);
                    } else {
                        // Fallback to featured or high rated
                        const featured = data.filter((t: any) => t.is_featured || t.rating === 5).slice(0, 5);
                        setTestimonials(featured.length > 0 ? featured : data.slice(0, 5));
                    }
                }
            } catch (error) {
                console.error("Error fetching testimonials:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    if (loading || testimonials.length === 0) return null;

    return (
        <section className="mb-16">
            <h2 className="text-2xl font-bold text-[var(--wedding-brown)] text-center mb-12 uppercase tracking-widest font-serif">
                Zaufali mi
            </h2>
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
                                    {"★".repeat(t.rating)}
                                </div>
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
