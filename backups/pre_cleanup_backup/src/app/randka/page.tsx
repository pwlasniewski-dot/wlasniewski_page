"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RandkaCreatorPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        inviter_name: "",
        partner_name: "",
        occasion: "",
        message: "",
        style: "romantic",
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const invite = await res.json();
                router.push(`/invite/${invite.slug}`);
            } else {
                alert("Wystąpił błąd podczas tworzenia zaproszenia.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Wystąpił błąd.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-zinc-950 pt-24 pb-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                        Stwórz Zaproszenie na Sesję
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Zaproś swoją drugą połówkę na wyjątkową sesję zdjęciową w niepowtarzalny sposób.
                    </p>
                </div>

                <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Twoje imię</label>
                                <input
                                    type="text"
                                    value={formData.inviter_name}
                                    onChange={(e) => setFormData({ ...formData, inviter_name: e.target.value })}
                                    className="w-full rounded-xl bg-zinc-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                                    required
                                    placeholder="np. Michał"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Imię partnera/partnerki</label>
                                <input
                                    type="text"
                                    value={formData.partner_name}
                                    onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                                    className="w-full rounded-xl bg-zinc-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                                    required
                                    placeholder="np. Ania"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Okazja (opcjonalnie)</label>
                            <input
                                type="text"
                                value={formData.occasion}
                                onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                                className="w-full rounded-xl bg-zinc-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                                placeholder="np. Rocznica, Walentynki, Bez okazji"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Styl zaproszenia</label>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: "romantic", label: "Romantyczny" },
                                    { id: "fun", label: "Zabawny" },
                                    { id: "elegant", label: "Elegancki" },
                                ].map((style) => (
                                    <button
                                        key={style.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, style: style.id })}
                                        className={`rounded-xl px-4 py-3 text-sm font-medium transition ${formData.style === style.id
                                                ? "bg-white text-zinc-900"
                                                : "bg-zinc-950 text-zinc-400 hover:bg-zinc-800"
                                            }`}
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Wiadomość od Ciebie</label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="w-full rounded-xl bg-zinc-950 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                                rows={4}
                                placeholder="Napisz coś od serca..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-white px-8 py-4 text-lg font-bold text-zinc-900 hover:bg-zinc-200 transition disabled:opacity-50"
                        >
                            {loading ? "Generowanie..." : "Stwórz Zaproszenie"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
