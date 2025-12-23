"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { RefreshCw, Calendar, Check, X, Clock, DollarSign, Image as ImageIcon } from 'lucide-react';

type Booking = {
    id: number;
    service: string;
    package: string;
    price: number;
    date: string;
    start_time: string | null;
    end_time: string | null;
    client_name: string;
    email: string;
    phone: string | null;
    venue_city: string | null;
    venue_place: string | null;
    notes: string | null;
    promo_code: string | null;
    gift_card_code: string | null;
    challenge_id: number | null;
    status: string;
    created_at: string;
};

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Booking>>({});

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [serviceFilter, setServiceFilter] = useState("all");

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [bookings, statusFilter, serviceFilter]);

    useEffect(() => {
        if (selectedBooking) {
            setEditForm(selectedBooking);
            setIsEditing(false);
        }
    }, [selectedBooking]);

    const fetchBookings = async () => {
        try {
            const res = await fetch("/api/bookings");
            const data = await res.json();
            if (data.bookings) {
                setBookings(data.bookings);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterBookings = () => {
        let filtered = [...bookings];

        if (statusFilter !== "all") {
            filtered = filtered.filter(b => b.status === statusFilter);
        }

        if (serviceFilter !== "all") {
            filtered = filtered.filter(b => b.service === serviceFilter);
        }

        setFilteredBookings(filtered);
    };

    const updateStatus = async (id: number, newStatus: string) => {
        try {
            const res = await fetch(`/api/bookings?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                fetchBookings();
                const updated = { ...selectedBooking!, status: newStatus };
                // Update selected booking references if it's the one being viewed
                if (selectedBooking && selectedBooking.id === id) {
                    setSelectedBooking(updated as Booking);
                }
            } else {
                alert("Błąd podczas aktualizacji statusu");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Błąd podczas aktualizacji");
        }
    };

    const handleSave = async () => {
        if (!selectedBooking) return;

        try {
            const res = await fetch(`/api/bookings?id=${selectedBooking.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                alert("Zapisano zmiany");
                setIsEditing(false);
                fetchBookings();
                // Update selected info
                const updated = { ...selectedBooking, ...editForm } as Booking;
                setSelectedBooking(updated);
            } else {
                alert("Błąd zapisu");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Błąd podczas zapisu");
        }
    };

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === "pending").length,
        confirmed: bookings.filter(b => b.status === "confirmed").length,
        cancelled: bookings.filter(b => b.status === "cancelled").length,
    };

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-8">Rezerwacje</h1>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border border-zinc-200">
                    <div className="text-zinc-500 text-sm font-medium">Wszystkie</div>
                    <div className="text-3xl font-bold text-zinc-900 mt-2">{stats.total}</div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                    <div className="text-yellow-700 text-sm font-medium">Oczekujące</div>
                    <div className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</div>
                </div>
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <div className="text-green-700 text-sm font-medium">Potwierdzone</div>
                    <div className="text-3xl font-bold text-green-900 mt-2">{stats.confirmed}</div>
                </div>
                <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                    <div className="text-red-700 text-sm font-medium">Anulowane</div>
                    <div className="text-3xl font-bold text-red-900 mt-2">{stats.cancelled}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 mb-6 border border-zinc-200 flex gap-4">
                <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-zinc-300 rounded-lg"
                    >
                        <option value="all">Wszystkie</option>
                        <option value="pending">Oczekujące</option>
                        <option value="confirmed">Potwierdzone</option>
                        <option value="cancelled">Anulowane</option>
                        <option value="completed">Zakończone</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">Usługa:</label>
                    <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="px-4 py-2 border border-zinc-300 rounded-lg"
                    >
                        <option value="all">Wszystkie</option>
                        <option value="Sesja">Sesja</option>
                        <option value="Ślub">Ślub</option>
                        <option value="Przyjęcie">Przyjęcie</option>
                        <option value="Urodziny">Urodziny</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Ładowanie...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-200">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Klient</th>
                                    <th className="px-6 py-4">Usługa / Pakiet</th>
                                    <th className="px-6 py-4">Termin</th>
                                    <th className="px-6 py-4">Cena</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Akcje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-zinc-50/50">
                                        <td className="px-6 py-4 font-mono text-zinc-400">#{booking.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-zinc-900">{booking.client_name}</div>
                                            <div className="text-zinc-500 text-xs">{booking.email}</div>
                                            {booking.phone && <div className="text-zinc-500 text-xs">{booking.phone}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-zinc-900">{booking.service}</div>
                                            <div className="text-zinc-500 text-xs">{booking.package}</div>
                                            <div className="flex gap-2 mt-1 flex-wrap">
                                                {booking.challenge_id && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gold-100 text-gold-800 border border-gold-300">
                                                        📸 FOTO WYZWANIE
                                                    </span>
                                                )}
                                                {booking.promo_code && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        💸 PROMOCJA: {booking.promo_code}
                                                    </span>
                                                )}
                                                {booking.gift_card_code && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                        🎁 KARTA: {booking.gift_card_code}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-zinc-900">
                                                {new Date(booking.date).toLocaleDateString("pl-PL")}
                                            </div>
                                            {booking.start_time && (
                                                <div className="text-zinc-500 text-xs">
                                                    {booking.start_time} - {booking.end_time}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-zinc-900">
                                            {booking.price} zł
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === "confirmed"
                                                    ? "bg-green-100 text-green-800"
                                                    : booking.status === "cancelled"
                                                        ? "bg-red-100 text-red-800"
                                                        : booking.status === "completed"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                            >
                                                {booking.status === "confirmed"
                                                    ? "Potwierdzona"
                                                    : booking.status === "cancelled"
                                                        ? "Anulowana"
                                                        : booking.status === "completed"
                                                            ? "Zakończona"
                                                            : "Oczekująca"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedBooking(booking)}
                                                className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                                            >
                                                Szczegóły
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredBookings.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                                            Brak rezerwacji spełniających kryteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal - Booking Details */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-2xl font-bold text-zinc-900">
                                {isEditing ? "Edycja rezerwacji" : `Rezerwacja #${selectedBooking.id}`}
                            </h2>
                            <div className="flex items-center gap-3">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50"
                                    >
                                        Edytuj
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="text-sm font-medium text-zinc-500 hover:text-zinc-700 px-3 py-1 rounded-lg hover:bg-zinc-100"
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg shadow-sm"
                                        >
                                            Zapisz
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="text-zinc-400 hover:text-zinc-600 p-1"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Client Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-900 mb-3">Dane klienta</h3>
                                <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Imię i nazwisko</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.client_name || ''}
                                                    onChange={e => setEditForm({ ...editForm, client_name: e.target.value })}
                                                    className="w-full text-sm p-2 rounded border border-zinc-300"
                                                />
                                            ) : (
                                                <div className="font-medium text-zinc-900">{selectedBooking.client_name}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Email</label>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    value={editForm.email || ''}
                                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                    className="w-full text-sm p-2 rounded border border-zinc-300"
                                                />
                                            ) : (
                                                <div className="font-medium text-zinc-900">{selectedBooking.email}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Telefon</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.phone || ''}
                                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                                    className="w-full text-sm p-2 rounded border border-zinc-300"
                                                />
                                            ) : (
                                                <div className="font-medium text-zinc-900">{selectedBooking.phone || '-'}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-900 mb-3">Szczegóły rezerwacji</h3>
                                <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Usługa</label>
                                            {isEditing ? (
                                                <select
                                                    value={editForm.service || ''}
                                                    onChange={e => setEditForm({ ...editForm, service: e.target.value })}
                                                    className="w-full text-sm p-2 rounded border border-zinc-300"
                                                >
                                                    <option value="Sesja">Sesja</option>
                                                    <option value="Ślub">Ślub</option>
                                                    <option value="Przyjęcie">Przyjęcie</option>
                                                    <option value="Urodziny">Urodziny</option>
                                                </select>
                                            ) : (
                                                <div className="font-medium text-zinc-900">{selectedBooking.service}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Pakiet</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.package || ''}
                                                    onChange={e => setEditForm({ ...editForm, package: e.target.value })}
                                                    className="w-full text-sm p-2 rounded border border-zinc-300"
                                                />
                                            ) : (
                                                <div className="font-medium text-zinc-900">{selectedBooking.package}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Data</label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={editForm.date ? new Date(editForm.date).toISOString().split('T')[0] : ''}
                                                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                                    className="w-full text-sm p-2 rounded border border-zinc-300"
                                                />
                                            ) : (
                                                <div className="font-medium text-zinc-900">
                                                    {new Date(selectedBooking.date).toLocaleDateString("pl-PL")}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Godziny (Start - Koniec)</label>
                                            {isEditing ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="time"
                                                        value={editForm.start_time || ''}
                                                        onChange={e => setEditForm({ ...editForm, start_time: e.target.value })}
                                                        className="w-full text-sm p-2 rounded border border-zinc-300"
                                                    />
                                                    <input
                                                        type="time"
                                                        value={editForm.end_time || ''}
                                                        onChange={e => setEditForm({ ...editForm, end_time: e.target.value })}
                                                        className="w-full text-sm p-2 rounded border border-zinc-300"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="font-medium text-zinc-900">
                                                    {selectedBooking.start_time ? `${selectedBooking.start_time} - ${selectedBooking.end_time}` : '-'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Cena (zł)</label>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={editForm.price || 0}
                                                    onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                                    className="w-full text-sm p-2 rounded border border-zinc-300"
                                                />
                                            ) : (
                                                <div className="font-medium text-zinc-900">{selectedBooking.price} zł</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Venue */}
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-900 mb-3">Miejsce</h3>
                                <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Miejscowość</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.venue_city || ''}
                                                    onChange={e => setEditForm({ ...editForm, venue_city: e.target.value })}
                                                    className="w-full text-sm p-2 rounded border border-zinc-300"
                                                />
                                            ) : (
                                                <div className="font-medium text-zinc-900">{selectedBooking.venue_city || '-'}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Lokal</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.venue_place || ''}
                                                    onChange={e => setEditForm({ ...editForm, venue_place: e.target.value })}
                                                    className="w-full text-sm p-2 rounded border border-zinc-300"
                                                />
                                            ) : (
                                                <div className="font-medium text-zinc-900">{selectedBooking.venue_place || '-'}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Promo/Gift Card */}
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-900 mb-3">Promocje</h3>
                                <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Kod promocyjny</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.promo_code || ''}
                                                    onChange={e => setEditForm({ ...editForm, promo_code: e.target.value })}
                                                    className="w-full text-sm p-2 rounded border border-zinc-300"
                                                />
                                            ) : (
                                                <div className="font-medium text-green-700">{selectedBooking.promo_code || '-'}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Karta podarunkowa</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.gift_card_code || ''}
                                                    onChange={e => setEditForm({ ...editForm, gift_card_code: e.target.value })}
                                                    className="w-full text-sm p-2 rounded border border-zinc-300"
                                                />
                                            ) : (
                                                <div className="font-medium text-purple-700">{selectedBooking.gift_card_code || '-'}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-900 mb-3">Uwagi</h3>
                                <div className="bg-zinc-50 rounded-lg p-4">
                                    {isEditing ? (
                                        <textarea
                                            value={editForm.notes || ''}
                                            onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                            className="w-full text-sm p-2 rounded border border-zinc-300 min-h-[100px]"
                                        />
                                    ) : (
                                        <p className="text-zinc-700 whitespace-pre-wrap">{selectedBooking.notes || '-'}</p>
                                    )}
                                </div>
                            </div>

                            {/* Status Actions - Only show when NOT editing */}
                            {!isEditing && (
                                <div>
                                    <h3 className="text-lg font-semibold text-zinc-900 mb-3">Zmień status</h3>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedBooking.status !== "pending" && (
                                            <button
                                                onClick={() => updateStatus(selectedBooking.id, "pending")}
                                                className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200"
                                            >
                                                Oczekująca
                                            </button>
                                        )}
                                        {selectedBooking.status !== "confirmed" && (
                                            <button
                                                onClick={() => updateStatus(selectedBooking.id, "confirmed")}
                                                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200"
                                            >
                                                Potwierdź
                                            </button>
                                        )}
                                        {selectedBooking.status !== "completed" && (
                                            <button
                                                onClick={() => updateStatus(selectedBooking.id, "completed")}
                                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200"
                                            >
                                                Zakończona
                                            </button>
                                        )}
                                        {selectedBooking.status !== "cancelled" && (
                                            <button
                                                onClick={() => updateStatus(selectedBooking.id, "cancelled")}
                                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200"
                                            >
                                                Anuluj
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
