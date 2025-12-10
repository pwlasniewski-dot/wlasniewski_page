"use client";

import React, { useMemo, useState } from "react";
import BookingCalendar from "@/components/BookingCalendar";
import { buildICS } from "@/utils/ics";
import TestimonialsSection from "@/components/TestimonialsSection";

// Type definitions
type ServiceType = "Sesja" | "Ślub" | "Przyjęcie" | "Urodziny";
type PackageType = "Ekonomiczny" | "Złoty" | "Platynowy" | "Foto" | "Standard";

// Package pricing
const packages: Record<ServiceType, { name: PackageType; hours: number; price: number }[]> = {
    Sesja: [
        { name: "Ekonomiczny", hours: 1, price: 350 },
        { name: "Złoty", hours: 2, price: 650 },
        { name: "Platynowy", hours: 2, price: 950 },
    ],
    Ślub: [
        { name: "Ekonomiczny", hours: 6, price: 2500 },
        { name: "Złoty", hours: 10, price: 3900 },
        { name: "Platynowy", hours: 12, price: 5500 },
    ],
    Przyjęcie: [
        { name: "Ekonomiczny", hours: 4, price: 100 },
        { name: "Złoty", hours: 6, price: 250 },
        { name: "Platynowy", hours: 6, price: 350 },
    ],
    Urodziny: [
        { name: "Ekonomiczny", hours: 4, price: 850 },
        { name: "Foto", hours: 6, price: 1000 },
        { name: "Standard", hours: 4, price: 1300 },
    ],
};

// Package descriptions
const sessionDetails: Record<Exclude<PackageType, "Foto" | "Standard">, { subtitle: string; bullets: string[] }> = {
    Ekonomiczny: {
        subtitle: "Szybka Pamiątka",
        bullets: [
            "🌿 Naturalny spacer z emocjami",
            "📍 1 lokalizacja",
            "📸 30 zdjęć (retusz + koloryzacja)",
            "☁️ Galeria online (7 dni)",
        ],
    },
    Złoty: {
        subtitle: "Pełna Historia",
        bullets: [
            "🌿 Swobodna sesja w 2 lokalizacjach",
            "📸 70 zdjęć (retusz + koloryzacja)",
            "💾 Pendrive z plikami",
            "☁️ Galeria online",
        ],
    },
    Platynowy: {
        subtitle: "Pakiet Prestiżowy",
        bullets: [
            "☕ Konsultacja wizerunkowa",
            "🌍 3 lokalizacje do wyboru",
            "📸 150 zdjęć premium",
            "📖 Album Premium + Pendrive",
            "☔ Rezerwowa data w pakiecie",
        ],
    },
    // Fallbacks for other types if needed, though mostly used for 'Sesja'
};

export default function RezerwacjaPage() {
    const [service, setService] = useState<ServiceType>("Sesja");
    const [pack, setPack] = useState<PackageType | null>(null);
    const [slot, setSlot] = useState<{ date: string; start?: string; end?: string } | null>(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [venueCity, setVenueCity] = useState("");
    const [venuePlace, setVenuePlace] = useState("");
    const [notes, setNotes] = useState("");
    const [rodo, setRodo] = useState(false);

    // Promo code state
    const [promoCode, setPromoCode] = useState("");
    const [discount, setDiscount] = useState<{ code: string; value: number; type: string } | null>(null);
    const [checkingCode, setCheckingCode] = useState(false);
    const [codeMessage, setCodeMessage] = useState("");

    // Gift card state
    const [giftCardCode, setGiftCardCode] = useState("");
    const [giftCard, setGiftCard] = useState<{ code: string; amount: number } | null>(null);
    const [checkingGiftCard, setCheckingGiftCard] = useState(false);
    const [giftCardMessage, setGiftCardMessage] = useState("");

    const needsVenue = service === "Ślub" || service === "Przyjęcie" || service === "Urodziny";

    const chosenPackage = useMemo(
        () => (pack ? packages[service].find((p) => p.name === pack) ?? null : null),
        [service, pack]
    );

    const finalPrice = useMemo(() => {
        if (!chosenPackage) return 0;
        let price = chosenPackage.price;

        // Apply promo code discount
        if (discount) {
            if (discount.type === "percentage") {
                price = Math.round(price * (1 - discount.value / 100));
            } else if (discount.type === "fixed") {
                price = Math.max(0, price - discount.value);
            }
        }

        // Apply gift card
        if (giftCard) {
            price = Math.max(0, price - giftCard.amount);
        }

        return price;
    }, [chosenPackage, discount, giftCard]);

    const handleCheckPromoCode = async () => {
        if (!promoCode) return;
        setCheckingCode(true);
        setCodeMessage("");
        setDiscount(null);

        try {
            const res = await fetch("/api/promo-codes/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: promoCode }),
            });
            const data = await res.json();

            if (data.success) {
                setDiscount(data.discount);
                setCodeMessage("✓ Kod rabatowy zastosowany!");
            } else {
                setCodeMessage(data.message || "Nieprawidłowy kod");
            }
        } catch (error) {
            console.error("Error checking promo code:", error);
            setCodeMessage("Wystąpił błąd podczas sprawdzania kodu");
        } finally {
            setCheckingCode(false);
        }
    };

    const handleCheckGiftCard = async () => {
        if (!giftCardCode) return;
        setCheckingGiftCard(true);
        setGiftCardMessage("");
        setGiftCard(null);

        try {
            const res = await fetch(`/api/gift-cards/check?code=${giftCardCode}`);
            const data = await res.json();

            if (data.success && data.giftCard) {
                if (data.giftCard.is_used) {
                    setGiftCardMessage("Ta karta została już wykorzystana");
                } else {
                    setGiftCard({ code: data.giftCard.code, amount: data.giftCard.amount });
                    setGiftCardMessage(`✓ Karta o wartości ${data.giftCard.amount} zł zastosowana!`);
                }
            } else {
                setGiftCardMessage("Nieprawidłowy kod karty");
            }
        } catch (error) {
            console.error("Error checking gift card:", error);
            setGiftCardMessage("Wystąpił błąd podczas sprawdzania karty");
        } finally {
            setCheckingGiftCard(false);
        }
    };

    const isReadyToSubmit =
        !!chosenPackage &&
        !!name &&
        !!email &&
        !!rodo &&
        !!slot?.date &&
        (service !== "Sesja" || (!!slot?.start && !!slot?.end)) &&
        (!needsVenue || (!!venueCity && !!venuePlace));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isReadyToSubmit || !slot || !chosenPackage) {
            alert("Uzupełnij wszystkie wymagane pola i wybierz termin!");
            return;
        }

        const title = `${service} — ${chosenPackage.name}`;
        const location = needsVenue && venueCity && venuePlace ? `${venuePlace}, ${venueCity}` : "Do ustalenia";

        const descLines = [
            `Usługa: ${service}`,
            `Pakiet: ${chosenPackage.name}`,
            `Cena: ${finalPrice} zł`,
            `Klient: ${name}`,
            `Email: ${email}`,
            `Telefon: ${phone || "-"}`,
            needsVenue ? `Miejsce: ${venuePlace}, ${venueCity}` : undefined,
            `Uwagi: ${notes || "-"}`,
        ].filter(Boolean) as string[];

        const ics = buildICS({
            uid: `booking-${Date.now()}@wlasniewski.pl`,
            title,
            description: descLines.join("\n"),
            date: slot.date,
            start: slot.start,
            end: slot.end,
            attendeeEmail: email,
            organizerEmail: "przemyslaw@wlasniewski.pl",
            location,
        });

        const payload = {
            service,
            date: slot.date,
            start: slot.start ?? null,
            end: slot.end ?? null,
            name,
            email,
            phone,
            package: chosenPackage.name,
            hours: chosenPackage.hours,
            price: finalPrice,
            originalPrice: chosenPackage.price,
            promo_code: discount ? discount.code : null,
            gift_card_code: giftCard ? giftCard.code : null,
            venue_city: needsVenue ? venueCity : null,
            venue_place: needsVenue ? venuePlace : null,
            notes,
            ics,
        };

        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Booking failed");

            alert("✅ Rezerwacja została złożona! Wkrótce otrzymasz potwierdzenie na email.");
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("❌ Wystąpił błąd podczas rezerwacji. Spróbuj ponownie.");
        }
    };

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Rezerwacja <span className="text-amber-500">Online</span>
                    </h1>
                    <p className="text-lg text-zinc-400">
                        Zarezerwuj termin w kilka minut. Wybierz pakiet idealny dla siebie.
                    </p>
                </div>

                {/* Testimonials Section */}
                <TestimonialsSection />

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Step 1: Service Selection */}
                    <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                            Wybierz Usługę
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(["Sesja", "Ślub", "Przyjęcie", "Urodziny"] as ServiceType[]).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => {
                                        setService(s);
                                        setPack(null);
                                        setSlot(null);
                                    }}
                                    className={`px-4 py-3 rounded-xl font-medium transition-all ${service === s
                                        ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20"
                                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Step 2: Package Selection */}
                    <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                            Wybierz Pakiet
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {packages[service].map((p) => {
                                const details = service === "Sesja" ? sessionDetails[p.name as Exclude<PackageType, "Foto" | "Standard">] : null;
                                const selected = pack === p.name;
                                return (
                                    <button
                                        key={p.name}
                                        type="button"
                                        onClick={() => setPack(p.name)}
                                        className={`text-left p-6 rounded-xl border-2 transition-all ${selected
                                            ? "border-amber-500 bg-amber-900/10 shadow-lg shadow-amber-900/20"
                                            : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                                            }`}
                                    >
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            Pakiet {p.name}
                                        </h3>
                                        {details?.subtitle && (
                                            <p className="text-sm text-amber-500 mb-4 font-medium">{details.subtitle}</p>
                                        )}
                                        {details?.bullets && (
                                            <ul className="space-y-2 mb-4 text-sm text-zinc-400">
                                                {details.bullets.map((b, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-amber-500 mt-1">✓</span>
                                                        {b}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div className="text-3xl font-bold text-white mt-auto">
                                            {p.price} <span className="text-lg font-medium text-zinc-500">zł</span>
                                        </div>
                                        <div className="text-sm text-zinc-500 mt-1">
                                            ⏱️ {p.hours}h
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Step 3: Date Selection */}
                    <section className={`bg-zinc-900 rounded-2xl border border-zinc-800 p-6 transition-all ${!pack ? "opacity-50 pointer-events-none grayscale" : ""
                        }`}>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                            Wybierz Termin
                        </h2>
                        <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                            <BookingCalendar
                                service={service}
                                value={slot}
                                onChange={(val: { date: string; start?: string; end?: string } | null) => setSlot(val)}
                            />
                        </div>
                    </section>

                    {/* Step 4: Client Data */}
                    <section className={`bg-zinc-900 rounded-2xl border border-zinc-800 p-6 transition-all ${!slot ? "opacity-50 pointer-events-none grayscale" : ""
                        }`}>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                            Twoje Dane
                        </h2>

                        <div className="space-y-6">
                            {/* Name & Email */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Imię i nazwisko *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Jan Kowalski"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                        placeholder="jan@example.com"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Telefon
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                    placeholder="123 456 789"
                                />
                            </div>

                            {/* Venue (for weddings/parties) */}
                            {needsVenue && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                                            Miejscowość *
                                        </label>
                                        <input
                                            type="text"
                                            value={venueCity}
                                            onChange={(e) => setVenueCity(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Toruń"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                                            Miejsce *
                                        </label>
                                        <input
                                            type="text"
                                            value={venuePlace}
                                            onChange={(e) => setVenuePlace(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Hotel Copernicus"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Uwagi
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    maxLength={500}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Dodatkowe informację..."
                                />
                                <div className="text-xs text-zinc-500 mt-1 text-right">
                                    {notes.length}/500
                                </div>
                            </div>

                            {/* Pricing Summary */}
                            <div className="bg-zinc-950 rounded-xl p-6 space-y-4 border border-zinc-800">
                                <h3 className="text-lg font-bold text-white">Podsumowanie</h3>

                                {/* Package Price */}
                                <div className="flex justify-between text-zinc-400">
                                    <span>Pakiet {chosenPackage?.name}:</span>
                                    <span className="font-medium text-white">{chosenPackage?.price} zł</span>
                                </div>

                                {/* Promo Code */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Kod promocyjny
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            disabled={!!discount}
                                            className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white uppercase focus:ring-2 focus:ring-amber-500 outline-none"
                                            placeholder="WPISZ KOD"
                                        />
                                        {discount ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDiscount(null);
                                                    setPromoCode("");
                                                    setCodeMessage("");
                                                }}
                                                className="px-4 py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg font-medium hover:bg-red-900/50"
                                            >
                                                Usuń
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleCheckPromoCode}
                                                disabled={!promoCode || checkingCode}
                                                className="px-6 py-2 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 disabled:opacity-50"
                                            >
                                                {checkingCode ? "..." : "Zastosuj"}
                                            </button>
                                        )}
                                    </div>
                                    {codeMessage && (
                                        <p className={`text-sm mt-2 ${discount ? "text-green-400" : "text-red-400"}`}>
                                            {codeMessage}
                                        </p>
                                    )}
                                </div>

                                {/* Gift Card */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Karta podarunkowa
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={giftCardCode}
                                            onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                                            disabled={!!giftCard}
                                            className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white uppercase focus:ring-2 focus:ring-amber-500 outline-none"
                                            placeholder="KOD KARTY"
                                        />
                                        {giftCard ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setGiftCard(null);
                                                    setGiftCardCode("");
                                                    setGiftCardMessage("");
                                                }}
                                                className="px-4 py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg font-medium hover:bg-red-900/50"
                                            >
                                                Usuń
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleCheckGiftCard}
                                                disabled={!giftCardCode || checkingGiftCard}
                                                className="px-6 py-2 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 disabled:opacity-50"
                                            >
                                                {checkingGiftCard ? "..." : "Zastosuj"}
                                            </button>
                                        )}
                                    </div>
                                    {giftCardMessage && (
                                        <p className={`text-sm mt-2 ${giftCard ? "text-green-400" : "text-red-400"}`}>
                                            {giftCardMessage}
                                        </p>
                                    )}
                                </div>

                                {/* Discounts */}
                                {discount && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Rabat ({discount.code}):</span>
                                        <span className="font-medium">
                                            -{discount.type === "percentage" ? `${discount.value}%` : `${discount.value} zł`}
                                        </span>
                                    </div>
                                )}
                                {giftCard && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Karta podarunkowa:</span>
                                        <span className="font-medium">-{giftCard.amount} zł</span>
                                    </div>
                                )}

                                {/* Final Price */}
                                <div className="flex justify-between text-2xl font-bold text-white pt-4 border-t border-zinc-800">
                                    <span>Do zapłaty:</span>
                                    <span>{finalPrice} zł</span>
                                </div>
                            </div>

                            {/* RODO */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={rodo}
                                    onChange={(e) => setRodo(e.target.checked)}
                                    required
                                    className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                    Zgadzam się na przetwarzanie danych osobowych (RODO) w celu realizacji usługi. *
                                </span>
                            </label>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={!isReadyToSubmit}
                                className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-900/20"
                            >
                                Potwierdź Rezerwację
                            </button>
                        </div>
                    </section>
                </form>
            </div>
        </main>
    );
}
