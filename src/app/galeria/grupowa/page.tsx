'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Check, Lock, User, Info, Heart } from 'lucide-react';

interface Photo {
  id: number;
  file_url: string;
  thumbnail_url: string | null;
}

interface GalleryInfo {
  gallery_id: number;
  gallery_name: string;
  max_photos_for_print: number;
}

interface ParticipantInfo {
  participant_id: number;
  parent_identifier: string;
  max_selections: number;
}

export default function GroupGalleryPage() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code');
  const passwordParam = searchParams.get('password');

  // Auth state
  const [code, setCode] = useState(codeParam || '');
  const [password, setPassword] = useState(passwordParam || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [galleryInfo, setGalleryInfo] = useState<GalleryInfo | null>(null);

  // Registration state
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo | null>(null);

  // Photos state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Consent state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentScope, setConsentScope] = useState<'ALL' | 'SELECTED'>('SELECTED');

  // Load participant from localStorage
  useEffect(() => {
    if (isAuthenticated && galleryInfo) {
      const stored = localStorage.getItem(`group_participant_${galleryInfo.gallery_id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setParticipantInfo(parsed);
          loadPhotos(galleryInfo.gallery_id);
          loadSelections(parsed.participant_id);
        } catch (e) {
          console.error('Failed to parse stored participant:', e);
        }
      } else {
        setShowRegistrationModal(true);
      }
    }
  }, [isAuthenticated, galleryInfo]);

  // Auto-authenticate if code in URL
  useEffect(() => {
    if (codeParam && !isAuthenticated && !loading) {
      handleAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuth = async () => {
    if (!code.trim()) {
      toast.error('Wpisz kod dostępu');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/galleries/group/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_code: code.trim(),
          password: password.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Nieprawidłowy kod dostępu');
        return;
      }

      setGalleryInfo(data);
      setIsAuthenticated(true);
      toast.success(`Witaj w galerii: ${data.gallery_name}`);

    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Wystąpił błąd podczas logowania');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async () => {
    if (!parentName.trim()) {
      toast.error('Podaj imię i nazwisko');
      return;
    }

    if (!galleryInfo) return;

    setLoading(true);
    try {
      const response = await fetch('/api/galleries/group/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery_id: galleryInfo.gallery_id,
          parent_name: parentName.trim(),
          parent_email: parentEmail.trim() || undefined,
          parent_phone: parentPhone.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Nie udało się zarejestrować');
        return;
      }

      setParticipantInfo(data);
      localStorage.setItem(
        `group_participant_${galleryInfo.gallery_id}`,
        JSON.stringify(data)
      );
      setShowRegistrationModal(false);
      toast.success(`Witaj! Twój identyfikator: ${data.parent_identifier}`);

      // Load photos and selections
      loadPhotos(galleryInfo.gallery_id);
      loadSelections(data.participant_id);

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Wystąpił błąd podczas rejestracji');
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async (galleryId: number) => {
    try {
      const response = await fetch(`/api/galleries/group/${galleryId}/photos`);
      const data = await response.json();

      if (response.ok) {
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error('Load photos error:', error);
    }
  };

  const loadSelections = async (participantId: number) => {
    try {
      const response = await fetch(`/api/galleries/group/participant/${participantId}/select`);
      const data = await response.json();

      if (response.ok) {
        setSelectedPhotos(data.selected_photos.map((p: any) => p.photo_id));
        setConsentGiven(data.publication_consent || false);
        setConsentScope(data.consent_scope || 'SELECTED');
      }
    } catch (error) {
      console.error('Load selections error:', error);
    }
  };

  const handlePhotoClick = async (photoId: number) => {
    if (!participantInfo) return;

    try {
      const response = await fetch(`/api/galleries/group/participant/${participantInfo.participant_id}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Nie udało się zapisać wyboru');
        return;
      }

      if (data.action === 'added') {
        setSelectedPhotos([...selectedPhotos, photoId]);
        toast.success(`Wybrano ${data.selected_count}/${data.max_selections}`);
      } else {
        setSelectedPhotos(selectedPhotos.filter(id => id !== photoId));
        toast.success(`Odznaczono (${data.selected_count}/${data.max_selections})`);
      }

    } catch (error) {
      console.error('Select photo error:', error);
      toast.error('Wystąpił błąd');
    }
  };

  const handleConsentSubmit = async () => {
    if (!participantInfo) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/galleries/group/participant/${participantInfo.participant_id}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          scope: consentScope,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Nie udało się zapisać zgody');
        return;
      }

      setConsentGiven(true);
      setShowConsentModal(false);
      toast.success('Zgoda została zapisana');

    } catch (error) {
      console.error('Consent error:', error);
      toast.error('Wystąpił błąd podczas zapisywania zgody');
    } finally {
      setLoading(false);
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gold-500/10 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Galeria Grupowa</h1>
              <p className="text-sm text-zinc-400">Wpisz kod dostępu</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Kod dostępu <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="np. KOMUNIA2026"
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none uppercase"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Hasło <span className="text-zinc-500">(jeśli wymagane)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••"
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-gold-500 text-black font-bold py-4 rounded-lg hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Registration modal
  if (showRegistrationModal) {
    return (
      <div className="min-h-screen bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gold-500/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Twoje dane</h2>
              <p className="text-sm text-zinc-400">Wymagane do identyfikacji</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleRegistration(); }} className="space-y-4 mb-6">
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
                autoFocus
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
          </form>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">
                Twoje dane są przechowywane bezpiecznie. Otrzymasz unikalny identyfikator (inicjały + cyfry) widoczny dla organizatora.
              </p>
            </div>
          </div>

          <button
            onClick={handleRegistration}
            disabled={loading || !parentName.trim()}
            className="w-full bg-gold-500 text-black font-bold py-4 rounded-lg hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Rejestracja...' : 'Zapisz i kontynuuj'}
          </button>
        </div>
      </div>
    );
  }

  // Main gallery view
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{galleryInfo?.gallery_name}</h1>
              {participantInfo && (
                <p className="text-sm text-zinc-400">
                  Twój identyfikator: <span className="text-gold-500 font-mono">{participantInfo.parent_identifier}</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400">
                Wybrano: <span className="text-white font-bold">{selectedPhotos.length}/{participantInfo?.max_selections}</span>
              </p>
              {consentGiven && (
                <p className="text-xs text-green-400">✓ Zgoda wyrażona ({consentScope === 'ALL' ? 'wszystkie' : 'wybrane'})</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400">Brak zdjęć w galerii</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => {
              const isSelected = selectedPhotos.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => handlePhotoClick(photo.id)}
                  className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden group ${
                    isSelected ? 'ring-4 ring-gold-500' : 'ring-1 ring-zinc-800'
                  }`}
                >
                  <Image
                    src={photo.thumbnail_url || photo.file_url}
                    alt="Zdjęcie z galerii"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-gold-500/20 flex items-center justify-center">
                      <div className="w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-black" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {selectedPhotos.length > 0 && !consentGiven && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <button
              onClick={() => setShowConsentModal(true)}
              className="bg-gold-500 text-black font-bold px-8 py-4 rounded-full shadow-2xl hover:bg-gold-400 transition-all flex items-center gap-2"
            >
              <Heart className="w-5 h-5" />
              Wyślij zgodę na publikację
            </button>
          </div>
        )}
      </div>

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Zgoda na publikację wizerunku</h2>
            
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 mb-6 space-y-4">
              <p className="text-zinc-300 text-sm">
                Wyrażam zgodę na nieodpłatne wykorzystanie wizerunku uwiecznionego na wybranych fotografiach, w szczególności na:
              </p>
              
              <ul className="list-disc list-inside space-y-2 pl-4 text-sm text-zinc-300">
                <li>publikację na stronie internetowej fotografa (wlasniewski.pl)</li>
                <li>publikację w mediach społecznościowych fotografa</li>
                <li>wykorzystanie w materiałach promocyjnych</li>
                <li>prezentację w portfolio fotografa</li>
              </ul>

              <div className="border-t border-zinc-700 pt-4 mt-4">
                <p className="text-xs text-zinc-400 mb-4">
                  <strong>Zakres zgody:</strong>
                </p>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="consent_scope"
                      value="SELECTED"
                      checked={consentScope === 'SELECTED'}
                      onChange={() => setConsentScope('SELECTED')}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-white font-medium">Tylko wybrane zdjęcia ({selectedPhotos.length})</p>
                      <p className="text-xs text-zinc-400">Zgoda dotyczy wyłącznie zdjęć, które zaznaczyłem/am</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="consent_scope"
                      value="ALL"
                      checked={consentScope === 'ALL'}
                      onChange={() => setConsentScope('ALL')}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-white font-medium">Wszystkie zdjęcia z galerii ({photos.length})</p>
                      <p className="text-xs text-zinc-400">Zgoda dotyczy wszystkich zdjęć w tej galerii</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">
                  Zgoda jest dobrowolna i możesz ją cofnąć w dowolnym momencie kontaktując się z fotografem.
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
                disabled={loading}
                className="flex-1 bg-gold-500 text-black font-bold py-4 rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {loading ? 'Zapisywanie...' : 'Wyrażam zgodę'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
