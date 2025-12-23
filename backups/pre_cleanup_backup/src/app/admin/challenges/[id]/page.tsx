'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';
import Link from 'next/link';
import { ArrowLeft, Save, Calendar, MapPin, User, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChallengeDetails {
    id: number;
    unique_link: string;
    inviter_name: string;
    inviter_contact: string;
    inviter_contact_type: string;
    invitee_name: string;
    invitee_contact: string;
    invitee_contact_type: string;
    status: string;
    created_at: string;
    viewed_at: string | null;
    accepted_at: string | null;
    rejected_at: string | null;
    session_date: string | null;
    acceptance_deadline: string | null;
    preferred_dates: string | null;
    discount_amount: number;
    discount_percentage: number;
    admin_notes: string | null;
    package: {
        name: string;
        base_price: number;
        challenge_price: number;
    };
    location: {
        name: string;
    } | null;
    custom_location: string | null;
    timeline: {
        id: number;
        event_type: string;
        event_description: string;
        created_at: string;
    }[];
}

export default function ChallengeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const challengeId = params?.id as string;

    const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [sessionDate, setSessionDate] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (challengeId) {
            fetchChallenge();
        }
    }, [challengeId]);

    const fetchChallenge = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`photo-challenge/admin/${challengeId}`), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setChallenge(data.challenge);
                setAdminNotes(data.challenge.admin_notes || '');
                setSessionDate(data.challenge.session_date || '');
                setStatus(data.challenge.status);
            }
        } catch (error) {
            console.error('Failed to fetch challenge');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`photo-challenge/admin/${challengeId}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    admin_notes: adminNotes,
                    session_date: sessionDate || null,
                    status,
                }),
            });

            if (res.ok) {
                toast.success('Zapisano zmiany');
                fetchChallenge();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-zinc-400">Ładowanie...</div>;
    if (!challenge) return <div className="text-zinc-400">Nie znaleziono wyzwania</div>;

    let preferredDates: string[] = [];
    try {
        const datesStr = challenge.preferred_dates?.trim();
        if (datesStr && datesStr !== "undefined" && datesStr !== "null" && datesStr.length > 0) {
            preferredDates = JSON.parse(datesStr);
        }
    } catch (e) {
        console.error('Error parsing preferred_dates:', e);
        preferredDates = [];
    }

    return (
        <div className="max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/challenges"
                        className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white">
                            Wyzwanie #{challenge.id}
                        </h1>
                        <p className="text-zinc-400 mt-1">
                            {challenge.inviter_name} → {challenge.invitee_name}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded-md font-medium disabled:opacity-50"
                >
                    <Save className="w-4 h-4 inline mr-2" />
                    {saving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Podstawowe informacje</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-zinc-800">
                                <span className="text-zinc-400">Status:</span>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-white"
                                >
                                    <option value="sent">Wysłane</option>
                                    <option value="viewed">Wyświetlone</option>
                                    <option value="accepted">Zaakceptowane</option>
                                    <option value="rejected">Odrzucone</option>
                                    <option value="scheduled">Zaplanowane</option>
                                    <option value="completed">Zakończone</option>
                                    <option value="expired">Wygasłe</option>
                                </select>
                            </div>
                            <div className="flex justify-between py-2 border-b border-zinc-800">
                                <span className="text-zinc-400">Link:</span>
                                <a
                                    href={`/foto-wyzwanie/akceptuj/${challenge.unique_link}`}
                                    target="_blank"
                                    className="text-gold-400 hover:underline"
                                >
                                    Otwórz →
                                </a>
                            </div>
                            <div className="flex justify-between py-2 border-b border-zinc-800">
                                <span className="text-zinc-400">Utworzone:</span>
                                <span className="text-white">{new Date(challenge.created_at).toLocaleString('pl-PL')}</span>
                            </div>
                            {challenge.viewed_at && (
                                <div className="flex justify-between py-2 border-b border-zinc-800">
                                    <span className="text-zinc-400">Wyświetlone:</span>
                                    <span className="text-white">{new Date(challenge.viewed_at).toLocaleString('pl-PL')}</span>
                                </div>
                            )}
                            {challenge.accepted_at && (
                                <div className="flex justify-between py-2 border-b border-zinc-800">
                                    <span className="text-zinc-400">Zaakceptowane:</span>
                                    <span className="text-white">{new Date(challenge.accepted_at).toLocaleString('pl-PL')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inviter */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Zapraszający
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div><span className="text-zinc-400">Imię:</span> <span className="text-white ml-2">{challenge.inviter_name}</span></div>
                            <div><span className="text-zinc-400">Kontakt ({challenge.inviter_contact_type}):</span> <span className="text-white ml-2">{challenge.inviter_contact}</span></div>
                        </div>
                    </div>

                    {/* Invitee */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Zaproszony
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div><span className="text-zinc-400">Imię:</span> <span className="text-white ml-2">{challenge.invitee_name}</span></div>
                            <div><span className="text-zinc-400">Kontakt ({challenge.invitee_contact_type}):</span> <span className="text-white ml-2">{challenge.invitee_contact}</span></div>
                        </div>
                    </div>

                    {/* Package Info */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Pakiet i cena
                        </h2>
                        <div className="space-y-3">
                            <div><span className="text-zinc-400">Pakiet:</span> <span className="text-white ml-2 font-semibold">{challenge.package.name}</span></div>
                            <div>
                                <span className="text-zinc-400">Cena po rabacie:</span>
                                <span className="text-gold-400 ml-2 font-bold text-lg">{challenge.package.challenge_price} zł</span>
                                <span className="text-zinc-500 line-through ml-2 text-sm">{challenge.package.base_price} zł</span>
                            </div>
                            <div>
                                <span className="text-zinc-400">Oszczędność:</span>
                                <span className="text-green-400 ml-2 font-semibold">{challenge.discount_amount} zł ({challenge.discount_percentage}%)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Session Date */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Termin sesji
                        </h2>
                        <input
                            type="datetime-local"
                            value={sessionDate}
                            onChange={e => setSessionDate(e.target.value)}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                        />
                        {preferredDates.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                                <p className="text-sm text-zinc-400 mb-2">Preferowane terminy:</p>
                                <div className="space-y-1">
                                    {preferredDates.map((date: string, i: number) => (
                                        <div key={i} className="text-sm text-white">
                                            {i + 1}. {new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Lokalizacja
                        </h2>
                        <div className="text-white">
                            {challenge.location ? challenge.location.name : challenge.custom_location || 'Nie podano'}
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Notatki admina</h2>
                        <textarea
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            rows={6}
                            placeholder="Dodaj notatki dotyczące tego wyzwania..."
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white resize-none"
                        />
                    </div>

                    {/* Timeline */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Historia zdarzeń</h2>
                        <div className="space-y-3">
                            {challenge.timeline.map((event) => (
                                <div key={event.id} className="flex gap-3 text-sm">
                                    <div className="text-zinc-500 whitespace-nowrap">
                                        {new Date(event.created_at).toLocaleString('pl-PL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-zinc-300">
                                        {event.event_description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
