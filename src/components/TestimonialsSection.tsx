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
            <h2 className="text-2xl font-bold text-white text-center mb-8">
                Zaufali mi
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
                {testimonials.map((t) => (
                    <div key={t.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div
                                className="relative shrink-0 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700"
                                style={{ width: 48, height: 48 }}
                            >
                                {t.client_photo ? (
                                    <Image
                                        src={t.client_photo.file_path}
                                        alt={t.client_photo.alt_text || t.client_name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-white">{t.client_name}</div>
                                <div className="flex text-amber-500 text-xs">
                                    {"★".repeat(t.rating)}
                                </div>
                            </div>
                        </div>
                        <p className="text-zinc-300 text-sm italic leading-relaxed">
                            "{t.testimonial_text}"
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
