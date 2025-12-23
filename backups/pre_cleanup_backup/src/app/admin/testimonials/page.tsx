"use client";

import React, { useEffect, useState } from "react";
import MediaPicker from "@/components/admin/MediaPicker";
import Image from "next/image";

type Testimonial = {
    id: number;
    client_name: string;
    client_photo_id: number | null;
    testimonial_text: string;
    rating: number;
    source: string | null;
    photo_size: number;
    is_featured: boolean;
    show_on_booking_page: boolean;
    display_order: number;
    client_photo?: {
        file_path: string;
        alt_text: string | null;
    } | null;
};

export default function AdminTestimonialsPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Testimonial>>({
        client_name: "",
        testimonial_text: "",
        rating: 5,
        source: "",
        photo_size: 80,
        is_featured: false,
        show_on_booking_page: false,
        display_order: 0,
        client_photo_id: null,
    });

    const [showMediaPicker, setShowMediaPicker] = useState(false);

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            const res = await fetch("/api/testimonials");
            const data = await res.json();
            if (Array.isArray(data)) {
                setTestimonials(data);
            }
        } catch (error) {
            console.error("Error fetching testimonials:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (t: Testimonial) => {
        setEditingId(t.id);
        setFormData({
            client_name: t.client_name,
            testimonial_text: t.testimonial_text,
            rating: t.rating,
            source: t.source || "",
            photo_size: t.photo_size,
            is_featured: t.is_featured,
            show_on_booking_page: t.show_on_booking_page || false,
            display_order: t.display_order,
            client_photo_id: t.client_photo_id,
        });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({
            client_name: "",
            testimonial_text: "",
            rating: 5,
            source: "",
            photo_size: 80,
            is_featured: false,
            show_on_booking_page: false,
            display_order: 0,
            client_photo_id: null,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const url = "/api/testimonials";
        const method = editingId ? "PUT" : "POST";
        const body = editingId ? { ...formData, id: editingId } : formData;

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                alert(editingId ? "Zaktualizowano opinię!" : "Dodano opinię!");
                handleCancel();
                fetchTestimonials();
            } else {
                alert("Wystąpił błąd.");
            }
        } catch (error) {
            console.error("Error saving testimonial:", error);
            alert("Błąd sieci.");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Czy na pewno chcesz usunąć tę opinię?")) return;

        try {
            const res = await fetch(`/api/testimonials?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                fetchTestimonials();
            } else {
                alert("Nie udało się usunąć.");
            }
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-8">Opinie klientów</h1>

            {/* Formularz */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 mb-12">
                <h2 className="text-xl font-semibold mb-6 text-zinc-900">
                    {editingId ? "Edytuj opinię" : "Dodaj nową opinię"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Imię i nazwisko / Podpis</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-zinc-900"
                                value={formData.client_name}
                                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Źródło (np. Google, Facebook)</label>
                            <input
                                type="text"
                                className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-zinc-900"
                                value={formData.source || ""}
                                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Treść opinii</label>
                        <textarea
                            required
                            rows={4}
                            className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-zinc-900"
                            value={formData.testimonial_text}
                            onChange={(e) => setFormData({ ...formData, testimonial_text: e.target.value })}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Ocena (1-5)</label>
                            <select
                                className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-zinc-900"
                                value={formData.rating}
                                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                            >
                                {[5, 4, 3, 2, 1].map(r => (
                                    <option key={r} value={r}>{r} gwiazdek</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Kolejność wyświetlania</label>
                            <input
                                type="number"
                                className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-zinc-900"
                                value={formData.display_order}
                                onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Photo Section */}
                    <div className="border-t pt-6">
                        <h3 className="text-sm font-medium text-zinc-900 mb-4">Zdjęcie klienta (opcjonalne)</h3>
                        <div className="flex items-start gap-6">
                            <div className="flex-1">
                                <button
                                    type="button"
                                    onClick={() => setShowMediaPicker(true)}
                                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {formData.client_photo_id ? "Zmień zdjęcie" : "Wybierz zdjęcie"}
                                </button>
                                {formData.client_photo_id && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, client_photo_id: null })}
                                        className="ml-2 text-red-600 hover:text-red-700 text-sm"
                                    >
                                        Usuń
                                    </button>
                                )}
                            </div>

                            {/* Preview & Size Slider */}
                            <div className="flex flex-col items-center gap-4">
                                <div
                                    className="relative overflow-hidden rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center"
                                    style={{ width: formData.photo_size, height: formData.photo_size }}
                                >
                                    {formData.client_photo_id ? (
                                        <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-xs text-zinc-500">
                                            {/* We don't have the URL easily here without fetching, just show placeholder or fetch logic */}
                                            IMG #{formData.client_photo_id}
                                        </div>
                                    ) : (
                                        <span className="text-2xl">👤</span>
                                    )}
                                </div>
                                <div className="w-48">
                                    <label className="block text-xs text-center text-zinc-500 mb-1">
                                        Rozmiar kółka: {formData.photo_size}px
                                    </label>
                                    <input
                                        type="range"
                                        min="32"
                                        max="200"
                                        value={formData.photo_size}
                                        onChange={(e) => setFormData({ ...formData, photo_size: Number(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_featured"
                                checked={formData.is_featured}
                                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            />
                            <label htmlFor="is_featured" className="text-sm text-zinc-700">Wyróżnij na stronie głównej</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="show_on_booking_page"
                                checked={formData.show_on_booking_page}
                                onChange={(e) => setFormData({ ...formData, show_on_booking_page: e.target.checked })}
                                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            />
                            <label htmlFor="show_on_booking_page" className="text-sm text-zinc-700">Pokaż na stronie rezerwacji</label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="bg-zinc-900 text-white px-6 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                            {editingId ? "Zapisz zmiany" : "Dodaj opinię"}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="bg-white border border-zinc-300 text-zinc-700 px-6 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
                            >
                                Anuluj
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Lista - Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((t) => (
                    <div key={t.id} className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 flex flex-col gap-4 h-full relative group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="shrink-0 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 relative"
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
                                        <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 line-clamp-1">{t.client_name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                                        <span className="text-amber-500 font-medium">★ {t.rating}</span>
                                        {t.source && <span>• {t.source}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-zinc-100">
                                <button
                                    onClick={() => handleEdit(t)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                    title="Edytuj"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Usuń"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <div className="flex-1">
                            <p className="text-zinc-600 text-sm italic line-clamp-4">"{t.testimonial_text}"</p>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-zinc-100">
                            {t.is_featured && (
                                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-xs font-medium">
                                    ⭐ Główna
                                </span>
                            )}
                            {t.show_on_booking_page && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                                    📅 Rezerwacja
                                </span>
                            )}
                            <span className="bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md text-xs">
                                Kolejność: {t.display_order}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {showMediaPicker && (
                <MediaPicker
                    isOpen={showMediaPicker}
                    onSelect={(url: string | string[], id: number | number[]) => {
                        setFormData({ ...formData, client_photo_id: Number(Array.isArray(id) ? id[0] : id) });
                        setShowMediaPicker(false);
                    }}
                    onClose={() => setShowMediaPicker(false)}
                />
            )}
        </div>
    );
}
