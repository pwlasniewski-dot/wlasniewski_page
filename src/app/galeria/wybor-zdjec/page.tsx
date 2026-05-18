'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, Download, Check, X, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface Photo {
    id: number;
    file_url: string;
    thumbnail_url: string | null;
    width: number | null;
    height: number | null;
    is_selected: boolean;
}

interface Participant {
    name: string;
    max_selections: number;
    selected_count: number;
    publication_consent: boolean;
}

interface Gallery {
    name: string;
    description: string | null;
}

export default function ParticipantGalleryPage() {
    const [code, setCode] = useState('');
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [participant, setParticipant] = useState<Participant | null>(null);
    const [gallery, setGallery] = useState<Gallery | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    
    const [consent, setConsent] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        try {
            const res = await fetch('/api/galleries/participant/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim().toUpperCase() })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || 'Nieprawidłowy kod');
                return;
            }

            toast.success(`Witaj, ${data.participant.name}!`);
            setAuthenticated(true);
            fetchPhotos(code.trim().toUpperCase());

        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setLoading(false);
        }
    };

    const fetchPhotos = async (accessCode: string) => {
        try {
            const res = await fetch(`/api/galleries/participant/${accessCode}/photos`);
            const data = await res.json();

            if (res.ok) {
                setParticipant(data.participant);
                setGallery(data.gallery);
                setPhotos(data.photos);
                setConsent(data.participant.publication_consent);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Błąd ładowania zdjęć');
        }
    };

    const toggleSelection = async (photoId: number, currentlySelected: boolean) => {
        const action = currentlySelected ? 'deselect' : 'select';

        try {
            const res = await fetch(`/api/galleries/participant/${code.trim().toUpperCase()}/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo_id: photoId, action })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error);
                return;
            }

            // Update local state
            setPhotos(photos.map(p => 
                p.id === photoId ? { ...p, is_selected: !currentlySelected } : p
            ));

            if (participant) {
                setParticipant({
                    ...participant,
                    selected_count: data.selected_count
                });
            }

            toast.success(data.message);

        } catch (error) {
            toast.error('Błąd');
        }
    };

    const handleConsentSubmit = async () => {
        try {
            const res = await fetch(`/api/galleries/participant/${code.trim().toUpperCase()}/consent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consent: true })
            });

            const data = await res.json();

            if (res.ok) {
                setConsent(true);
                setShowConsentModal(false);
                if (participant) {
                    setParticipant({ ...participant, publication_consent: true });
                }
                toast.success('Zgoda zapisana');
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Błąd');
        }
    };

    const selectedPhotos = photos.filter(p => p.is_selected);

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-8 h-8 text-gold-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Wybór Zdjęć</h1>
                        <p className="text-zinc-400">Wprowadź swój kod dostępu</p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Kod Dostępu
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                placeholder="np. A3F7B2E9"
                                maxLength={8}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-center text-xl tracking-widest font-mono focus:border-gold-500 focus:outline-none transition-colors uppercase"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !code.trim()}
                            className="w-full bg-gold-500 text-black font-bold py-4 rounded-lg hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Weryfikacja...' : 'Zaloguj się'}
                        </button>
                    </form>

                    <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-300">
                                Kod dostępu otrzymałeś/aś od fotografa. Jeśli masz problem z logowaniem, skontaktuj się z fotografem.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white">{participant?.name}</h1>
                            <p className="text-sm text-zinc-400">{gallery?.name}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-gold-500">
                                {participant?.selected_count} / {participant?.max_selections}
                            </div>
                            <p className="text-xs text-zinc-400">Wybrane zdjęcia</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="container mx-auto px-4 py-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <Info className="w-6 h-6 text-gold-500 flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-bold text-white mb-2">Jak to działa?</h3>
                            <ul className="text-sm text-zinc-300 space-y-1">
                                <li>• Możesz <strong>pobrać wszystkie</strong> zdjęcia ze swojej galerii</li>
                                <li>• Musisz <strong>zaznaczyć {participant?.max_selections} zdjęć</strong>, które zostaną wywołane jako odbitki</li>
                                <li>• Kliknij serduszko 💛 aby zaznaczyć zdjęcie do wydruku</li>
                                <li>• Po wyborze zdjęć wyraź zgodę na publikację</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Photos Grid */}
            <div className="container mx-auto px-4 pb-20">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {photos.map(photo => (
                        <div 
                            key={photo.id}
                            className={`relative aspect-square bg-zinc-900 rounded-lg overflow-hidden group cursor-pointer transition-all ${
                                photo.is_selected ? 'ring-4 ring-gold-500' : ''
                            }`}
                            onClick={() => toggleSelection(photo.id, photo.is_selected)}
                        >
                            <Image
                                src={photo.thumbnail_url || photo.file_url}
                                alt="Zdjęcie"
                                fill
                                className="object-cover"
                            />
                            
                            {/* Selection indicator */}
                            <div className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                photo.is_selected 
                                    ? 'bg-gold-500' 
                                    : 'bg-black/50 group-hover:bg-gold-500/50'
                            }`}>
                                {photo.is_selected ? (
                                    <Heart className="w-6 h-6 text-black fill-black" />
                                ) : (
                                    <Heart className="w-6 h-6 text-white" />
                                )}
                            </div>

                            {/* Download button */}
                            <a
                                href={photo.file_url}
                                download
                                onClick={e => e.stopPropagation()}
                                className="absolute bottom-2 right-2 w-8 h-8 bg-black/70 hover:bg-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Download className="w-4 h-4 text-white" />
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Action Bar */}
            {participant && participant.selected_count === participant.max_selections && !consent && (
                <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-zinc-900 to-transparent border-t border-zinc-800 p-4">
                    <div className="container mx-auto">
                        <button
                            onClick={() => setShowConsentModal(true)}
                            className="w-full bg-gold-500 text-black font-bold py-4 rounded-xl hover:bg-gold-400 transition-all flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            Wyraź zgodę na publikację
                        </button>
                    </div>
                </div>
            )}

            {consent && (
                <div className="fixed bottom-4 left-4 right-4 bg-green-500/10 border-2 border-green-500 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Check className="w-6 h-6 text-green-500" />
                        <p className="text-green-300 font-medium">Dziękujemy! Twój wybór został zapisany.</p>
                    </div>
                </div>
            )}

            {/* Consent Modal */}
            {showConsentModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-white mb-4">Zgoda na publikację</h2>
                        <p className="text-zinc-300 mb-6">
                            Wyrażam zgodę na publikację wybranych {participant?.max_selections} zdjęć 
                            na stronie internetowej fotografa oraz w mediach społecznościowych w celach promocyjnych.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConsentModal(false)}
                                className="flex-1 bg-zinc-800 text-white py-3 rounded-lg hover:bg-zinc-700 transition-colors"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleConsentSubmit}
                                className="flex-1 bg-gold-500 text-black font-bold py-3 rounded-lg hover:bg-gold-400 transition-colors"
                            >
                                Zgadzam się
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
