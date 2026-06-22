'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, Download, Check, X, Info, User } from 'lucide-react';
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
    needs_parent_data: boolean;
    parent_name: string | null;
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
    
    const [showParentDataModal, setShowParentDataModal] = useState(false);
    const [parentName, setParentName] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [parentPhone, setParentPhone] = useState('');
    
    const [consent, setConsent] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);

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

            // Check if parent data is needed
            if (data.participant.needs_parent_data) {
                setShowParentDataModal(true);
            } else {
                fetchPhotos(code.trim().toUpperCase());
            }

        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setLoading(false);
        }
    };

    const handleParentDataSubmit = async () => {
        if (!parentName.trim()) {
            toast.error('Imię i nazwisko jest wymagane');
            return;
        }

        try {
            const res = await fetch('/api/galleries/participant/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code: code.trim().toUpperCase(),
                    parent_name: parentName.trim(),
                    parent_email: parentEmail.trim() || null,
                    parent_phone: parentPhone.trim() || null,
                })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error);
                return;
            }

            toast.success('Dane zapisane');
            setShowParentDataModal(false);
            fetchPhotos(code.trim().toUpperCase());

        } catch (error) {
            toast.error('Błąd zapisywania danych');
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
            setPhotos(prev => prev.map(p =>
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
    const visiblePhotos = showSelectedOnly ? selectedPhotos : photos;

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
                                <li>• W sekcji poniżej masz podgląd miniatur już wybranych zdjęć i możesz je tam szybko usunąć</li>
                                <li>• Po wyborze zdjęć wyraź zgodę na publikację</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Twoje wybrane do druku</h3>
                            <p className="text-xs text-zinc-400">
                                Wybrano {selectedPhotos.length} z {participant?.max_selections || 0}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowSelectedOnly(v => !v)}
                            className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${showSelectedOnly
                                ? 'bg-gold-500 text-black border-gold-500'
                                : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:border-zinc-600'
                                }`}
                        >
                            {showSelectedOnly ? 'Pokaz wszystkie zdjecia' : 'Pokaz tylko wybrane'}
                        </button>
                    </div>

                    {selectedPhotos.length === 0 ? (
                        <p className="text-sm text-zinc-500">Nie masz jeszcze wybranych zdjęć do druku.</p>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {selectedPhotos.map((photo, idx) => (
                                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-gold-500/50 bg-zinc-950">
                                    <Image
                                        src={photo.thumbnail_url || photo.file_url}
                                        alt={`Wybrane zdjęcie ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                    <span className="absolute top-1 left-1 bg-gold-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded">
                                        {idx + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => toggleSelection(photo.id, true)}
                                        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                                        title="Usuń z wybranych"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Photos Grid */}
            <div className="container mx-auto px-4 pb-20">
                {showSelectedOnly && selectedPhotos.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                        <p className="text-zinc-400">Brak wybranych zdjęć do podglądu.</p>
                    </div>
                ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {visiblePhotos.map(photo => (
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
                )}
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

            {/* Parent Data Modal (first login) */}
            {showParentDataModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gold-500/10 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-gold-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Twoje dane</h2>
                                <p className="text-sm text-zinc-400">Wymagane do wyrażenia zgody</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Imię i nazwisko <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={parentName}
                                    onChange={e => setParentName(e.target.value)}
                                    placeholder="Jan Kowalski"
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Email <span className="text-zinc-500">(opcjonalnie)</span>
                                </label>
                                <input
                                    type="email"
                                    value={parentEmail}
                                    onChange={e => setParentEmail(e.target.value)}
                                    placeholder="jan.kowalski@example.com"
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Telefon <span className="text-zinc-500">(opcjonalnie)</span>
                                </label>
                                <input
                                    type="tel"
                                    value={parentPhone}
                                    onChange={e => setParentPhone(e.target.value)}
                                    placeholder="123-456-789"
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-300">
                                    Twoje dane są przechowywane bezpiecznie i wykorzystywane wyłącznie do realizacji zgody na publikację zdjęć. Podanie emaila i telefonu jest dobrowolne.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleParentDataSubmit}
                            disabled={!parentName.trim()}
                            className="w-full bg-gold-500 text-black font-bold py-4 rounded-lg hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Zapisz i kontynuuj
                        </button>
                    </div>
                </div>
            )}

            {/* Consent Modal */}
            {showConsentModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">Oświadczenie o wyrażeniu zgody na publikację wizerunku</h2>
                        
                        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 mb-6 space-y-4 text-sm text-zinc-300">
                            <p>
                                Ja, <strong className="text-white">{participant?.parent_name}</strong>, wyrażam zgodę na nieodpłatne wykorzystanie wizerunku 
                                dziecka <strong className="text-white">{participant?.name}</strong> uwiecznionego na wybranych {participant?.max_selections} fotografiach, 
                                w szczególności na:
                            </p>
                            
                            <ul className="list-disc list-inside space-y-2 pl-4">
                                <li>publikację na stronie internetowej fotografa (wlasniewski.pl)</li>
                                <li>publikację w mediach społecznościowych fotografa (Facebook, Instagram)</li>
                                <li>wykorzystanie w materiałach promocyjnych i reklamowych</li>
                                <li>prezentację w portfolio fotografa</li>
                            </ul>

                            <p>
                                Zgoda jest udzielana na czas nieokreślony. Oświadczam, że zostałem/am poinformowany/a o prawie do cofnięcia zgody 
                                w dowolnym momencie poprzez kontakt z fotografem.
                            </p>

                            <div className="border-t border-zinc-700 pt-4 mt-4">
                                <p className="text-xs text-zinc-400">
                                    <strong>Data i godzina wyrażenia zgody:</strong> {new Date().toLocaleString('pl-PL')}
                                </p>
                                <p className="text-xs text-zinc-400">
                                    <strong>Wyrażona przez:</strong> {participant?.parent_name}
                                </p>
                                <p className="text-xs text-zinc-400">
                                    <strong>Forma zgody:</strong> Elektroniczna (zgodnie z art. 78 ust. 1 Kodeksu Cywilnego)
                                </p>
                            </div>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-200">
                                    Wyrażenie zgody jest dobrowolne. Zdjęcia zostaną wywołane niezależnie od wyrażenia zgody na publikację.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConsentModal(false)}
                                className="flex-1 bg-zinc-800 text-white py-4 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleConsentSubmit}
                                className="flex-1 bg-gold-500 text-black font-bold py-4 rounded-lg hover:bg-gold-400 transition-colors"
                            >
                                Wyrażam zgodę
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
