'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Check, Lock, User, Info, Heart, LogOut, X, ZoomIn, ChevronLeft, ChevronRight, Download, Package, CheckSquare, Square, Share2, Copy, CheckCheck } from 'lucide-react';
import PremiumGalleryHero, { PremiumGalleryStory } from '@/components/galleries/PremiumGalleryHero';
import PostGalleryUpsell, { TopReviewNudge } from '@/components/galleries/PostGalleryUpsell';

interface Photo {
  id: number;
  file_url: string;
  thumbnail_url: string | null;
  width?: number;
  height?: number;
}

interface GalleryInfo {
  gallery_id: number;
  gallery_name: string;
  max_photos_for_print: number;
}

interface ParticipantInfo {
  participant_id: number;
  parent_identifier: string;
  parent_name?: string;
  avatar: string;
  max_selections: number;
  token: string;
}

interface AvatarOption {
  emoji: string;
  available: boolean;
}

export default function GroupGalleryPage() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code');
  // SECURITY: We no longer accept password in URL params

  // Auth state
  const [code, setCode] = useState(codeParam || '');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [galleryInfo, setGalleryInfo] = useState<GalleryInfo | null>(null);

  // Registration state
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [existingEmail, setExistingEmail] = useState('');
  const [availableAvatars, setAvailableAvatars] = useState<AvatarOption[]>([]);
  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Photos state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  // PRO Hero + view mode
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'story'>('story');

  // Consent state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentScope, setConsentScope] = useState<'ALL' | 'SELECTED'>('SELECTED');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Always show registration modal when authenticated - each parent registers separately (not from localStorage)
  // This allows multiple family members to create their own profiles under the same gallery code
  useEffect(() => {
    if (isAuthenticated && galleryInfo && !participantInfo) {
      setShowRegistrationModal(true);
      loadAvailableAvatars(galleryInfo.gallery_id);
    }
  }, [isAuthenticated, galleryInfo, participantInfo]);

  // Load list of available avatars for the gallery
  const loadAvailableAvatars = async (galleryId: number) => {
    try {
      const response = await fetch(`/api/galleries/group/${galleryId}/avatars`);
      const data = await response.json();
      if (response.ok) {
        setAvailableAvatars(data.avatars || []);
      }
    } catch (error) {
      console.error('Load avatars error:', error);
    }
  };

  // Intentionally do not auto-auth on load.
  // Some group galleries require password, so auto-calling auth with only ?code would produce 401 noise.

  // Handle logout - clear all data
  const handleLogout = () => {
    if (!confirm('Czy na pewno chcesz się wylogować? Twój postęp jest zapisany.')) return;
    
    // Usuń token dla tego konkretnego uczestnika
    if (participantInfo) {
      localStorage.removeItem(`group_participant_${participantInfo.participant_id}`);
    }
    
    setIsAuthenticated(false);
    setGalleryInfo(null);
    setParticipantInfo(null);
    setAuthToken(null);
    setSelectedPhotos([]);
    setPhotos([]);
    setCode('');
    setPassword('');
    setParentName('');
    setParentEmail('');
    setParentPhone('');
    setSelectedAvatar('');
    setConsentGiven(false);
    toast.success('Wylogowano pomyślnie');
  };

  // RODO: parent self-deletes their account
  const handleDeleteAccount = async () => {
    if (!participantInfo || !authToken) return;
    if (!confirm(
      'Czy na pewno chcesz usunąć swoje konto i wszystkie dane?\n\nZostanie usunięte:\n• Twój profil i identyfikator\n• Wybrane zdjęcia\n• Wyrażone zgody\n\nTej operacji NIE można cofnąć.'
    )) return;

    try {
      const res = await fetch(`/api/galleries/group/participant/${participantInfo.participant_id}/delete-account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Clear local storage
        localStorage.removeItem(`group_participant_${participantInfo.participant_id}`);
        // Reset all state
        setIsAuthenticated(false);
        setGalleryInfo(null);
        setParticipantInfo(null);
        setAuthToken(null);
        setSelectedPhotos([]);
        setPhotos([]);
        setCode('');
        setPassword('');
        setParentName('');
        setParentEmail('');
        setParentPhone('');
        setSelectedAvatar('');
        setConsentGiven(false);
        toast.success('Twoje dane zostały usunięte (RODO)');
      } else {
        toast.error(data.error || 'Nie udało się usunąć danych');
      }
    } catch (err) {
      toast.error('Błąd połączenia');
    }
  };

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

      // ZAWSZE pokazuj registration modal - nie przywracaj z localStorage
      // Każdy członek rodziny loguje się niezależnie na tym samym kodzie
      setShowRegistrationModal(true);
      loadAvailableAvatars(data.gallery_id);

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

    if (!selectedAvatar) {
      toast.error('Wybierz swój awatar');
      return;
    }

    if (!parentEmail.trim()) {
      toast.error('Podaj email - jest wymagany do odzyskania dostępu');
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
          access_code: code.trim(),
          parent_name: parentName.trim(),
          avatar: selectedAvatar,
          parent_email: parentEmail.trim() || undefined,
          parent_phone: parentPhone.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Nie udało się zarejestrować');
        // Refresh avatars list if avatar was taken (race condition)
        if (response.status === 409) {
          loadAvailableAvatars(galleryInfo.gallery_id);
          setSelectedAvatar('');
        }
        return;
      }

      setParticipantInfo(data);
      setAuthToken(data.token);
      // Zapisz token dla każdego uczestnika indywidualnie (nie per galerię!)
      // Każdy rodzic ma swój participant_id i własny klucz w localStorage
      localStorage.setItem(
        `group_participant_${data.participant_id}`,
        JSON.stringify(data)
      );
      setShowRegistrationModal(false);
      toast.success(`Witaj! Twój awatar: ${data.avatar}`);

      // Load photos and selections
      loadPhotos(galleryInfo.gallery_id, data.token);
      loadSelections(data.participant_id, data.token);

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Wystąpił błąd podczas rejestracji');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!galleryInfo) return;
    if (!existingEmail.trim()) {
      toast.error('Podaj email użyty przy rejestracji');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/galleries/group/login-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery_id: galleryInfo.gallery_id,
          access_code: code.trim(),
          parent_email: existingEmail.trim().toLowerCase(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Nie udało się zalogować po emailu');
        return;
      }

      setParticipantInfo(data);
      setAuthToken(data.token);
      localStorage.setItem(
        `group_participant_${data.participant_id}`,
        JSON.stringify(data)
      );
      setShowRegistrationModal(false);
      toast.success(`Witaj ponownie, ${data.parent_name || 'Rodzicu'}!`);

      loadPhotos(galleryInfo.gallery_id, data.token);
      loadSelections(data.participant_id, data.token);
    } catch (error) {
      console.error('Existing parent email login error:', error);
      toast.error('Wystąpił błąd podczas logowania');
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async (galleryId: number, token: string) => {
    try {
      const response = await fetch(`/api/galleries/group/${galleryId}/photos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setPhotos(data.photos || []);
      } else if (response.status === 401) {
        toast.error('Sesja wygasła. Zaloguj się ponownie.');
        setIsAuthenticated(false);
        setAuthToken(null);
        setParticipantInfo(null);
      }
    } catch (error) {
      console.error('Load photos error:', error);
    }
  };

  const loadSelections = async (participantId: number, token: string) => {
    try {
      const response = await fetch(`/api/galleries/group/participant/${participantId}/select`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setSelectedPhotos(data.selected_photos.map((p: any) => p.photo_id));
        setConsentGiven(data.publication_consent || false);
        setConsentScope(data.consent_scope || 'SELECTED');
        // Hydrate parent_name for existing participants whose localStorage was saved before this field
        if (data.parent_name) {
          setParticipantInfo(prev => {
            if (!prev) return prev;
            if (prev.parent_name === data.parent_name) return prev;
            const next = { ...prev, parent_name: data.parent_name };
                try {
                  localStorage.setItem(
                    `group_participant_${next.participant_id}`,
                    JSON.stringify(next)
                  );
                } catch {}
            return next;
          });
        }
      } else if (response.status === 401) {
        toast.error('Sesja wygasła. Zaloguj się ponownie.');
        setIsAuthenticated(false);
        setAuthToken(null);
        setParticipantInfo(null);
      }
    } catch (error) {
      console.error('Load selections error:', error);
    }
  };

  const handlePhotoClick = async (photoId: number) => {
    if (!participantInfo || !authToken) return;

    try {
      const response = await fetch(`/api/galleries/group/participant/${participantInfo.participant_id}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ photo_id: photoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sesja wygasła. Zaloguj się ponownie.');
          setIsAuthenticated(false);
          setAuthToken(null);
          setParticipantInfo(null);
        } else {
          toast.error(data.error || 'Nie udało się zapisać wyboru');
        }
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
    if (!participantInfo || !authToken) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/galleries/group/participant/${participantInfo.participant_id}/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          consent: true,
          scope: consentScope,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sesja wygasła. Zaloguj się ponownie.');
          setIsAuthenticated(false);
          setAuthToken(null);
          setParticipantInfo(null);
        } else {
          toast.error(data.error || 'Nie udało się zapisać zgody');
        }
        return;
      }

      setConsentGiven(true);
      setShowConsentModal(false);
      setShowSuccessModal(true);
      toast.success('Zgoda została zapisana');

    } catch (error) {
      console.error('Consent error:', error);
      toast.error('Wystąpił błąd podczas zapisywania zgody');
    } finally {
      setLoading(false);
    }
  };

  // PRO: pobieranie pliku z autoryzacją (z S3 → blob → trigger download)
  const downloadWithAuth = useCallback(async (url: string, fallbackName: string) => {
    if (!authToken) return;
    const tid = toast.loading('Pobieranie...');
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });
      if (!res.ok) {
        toast.error('Nie udało się pobrać pliku', { id: tid });
        return;
      }
      const cd = res.headers.get('Content-Disposition') || '';
      const m = cd.match(/filename="([^"]+)"/);
      const name = m?.[1] || fallbackName;
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      toast.success('Pobrano', { id: tid });
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Błąd pobierania', { id: tid });
    }
  }, [authToken]);

  const handleDownloadSingle = (photoId: number) => {
    if (!galleryInfo) return;
    downloadWithAuth(
      `/api/galleries/group/${galleryInfo.gallery_id}/download/${photoId}`,
      `zdjecie-${photoId}.jpg`
    );
  };

  const handleDownloadSelected = async () => {
    if (selectedPhotos.length === 0) {
      toast.error('Nie zaznaczono żadnych zdjęć');
      return;
    }
    if (!galleryInfo) return;
    const tid = toast.loading(`Pobieranie ${selectedPhotos.length} zdjęć...`);
    for (let i = 0; i < selectedPhotos.length; i++) {
      await downloadWithAuth(
        `/api/galleries/group/${galleryInfo.gallery_id}/download/${selectedPhotos[i]}`,
        `zdjecie-${String(i + 1).padStart(3, '0')}.jpg`
      );
      // short delay so the browser doesn't block multiple simultaneous downloads
      if (i < selectedPhotos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }
    toast.dismiss(tid);
  };

  const handleDownloadAll = () => {
    if (!galleryInfo) return;
    if (photos.length === 0) {
      toast.error('Brak zdjęć do pobrania');
      return;
    }
    toast('Generowanie ZIP może chwilę potrwać...', { icon: '⏳' });
    downloadWithAuth(
      `/api/galleries/group/${galleryInfo.gallery_id}/download-all`,
      `galeria.zip`
    );
  };

  // PRO: nawigacja po zdjęciach w lightboxie
  const navigateLightbox = useCallback((dir: 1 | -1) => {
    if (!lightboxPhoto || photos.length === 0) return;
    const idx = photos.findIndex(p => p.id === lightboxPhoto.id);
    if (idx === -1) return;
    const nextIdx = (idx + dir + photos.length) % photos.length;
    setLightboxPhoto(photos[nextIdx]);
  }, [lightboxPhoto, photos]);

  // PRO: obsługa klawiatury w lightboxie (←, →, Esc)
  useEffect(() => {
    if (!lightboxPhoto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      else if (e.key === 'ArrowRight') navigateLightbox(1);
      else if (e.key === 'Escape') setLightboxPhoto(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxPhoto, navigateLightbox]);

  // PRO: toggle wyboru z grida (bez otwierania lightboxa)
  const handleSelectToggle = async (photoId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!participantInfo) return;
    const isSelected = selectedPhotos.includes(photoId);
    const limitReached = !isSelected && selectedPhotos.length >= participantInfo.max_selections;
    if (limitReached) {
      toast.error(`Limit: maksymalnie ${participantInfo.max_selections} zdjęć do druku`);
      return;
    }
    await handlePhotoClick(photoId);
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
    // Check if there's a saved participant from this device in this gallery
    const getSavedParticipant = () => {
      try {
        const participants: (ParticipantInfo & { participant_id: number })[] = [];
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('group_participant_')) {
            const saved = JSON.parse(localStorage.getItem(key) || '');
            if (saved.gallery_id === galleryInfo?.gallery_id) {
              participants.push(saved);
            }
          }
        });
        return participants.length > 0 ? participants[0] : null;
      } catch (e) {
        return null;
      }
    };

    const savedParticipant = getSavedParticipant();

    return (
      <div className="min-h-screen bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full">
          {/* Alert: Restore saved profile */}
          {savedParticipant && (
            <div className="bg-gold-500/20 border border-gold-500/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white mb-2">
                    Witaj ponownie, <span className="text-gold-300">{savedParticipant.parent_name}</span>!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setParticipantInfo(savedParticipant);
                      setAuthToken(savedParticipant.token);
                      setShowRegistrationModal(false);
                      loadPhotos(galleryInfo?.gallery_id || 0, savedParticipant.token);
                      loadSelections(savedParticipant.participant_id, savedParticipant.token);
                    }}
                    className="w-full bg-gold-500 text-black text-xs font-bold py-2 rounded hover:bg-gold-400 transition-all"
                  >
                    Przywróć mój profil
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-zinc-800/40 border border-zinc-700 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-white mb-1">Masz już profil rodzica?</h3>
            <p className="text-xs text-zinc-400 mb-3">Wpisz email z rejestracji i od razu wejdziesz do galerii.</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={existingEmail}
                onChange={e => setExistingEmail(e.target.value)}
                placeholder="Email z rejestracji"
                className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && existingEmail.trim() && !loading) {
                    e.preventDefault();
                    handleEmailLogin();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleEmailLogin}
                disabled={loading || !existingEmail.trim()}
                className="px-3 py-2 bg-gold-500 text-black text-xs font-bold rounded-lg hover:bg-gold-400 transition-all disabled:opacity-50"
              >
                Wejdź
              </button>
            </div>
          </div>

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

            {/* AWATAR - wybór unikalnej ikonki */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Wybierz swój awatar <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-zinc-500 mb-3">
                Awatar pomoże szybko rozpoznać Twoje zdjęcia. Każdy rodzic ma swój unikalny.
              </p>
              <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 bg-black/50 border border-zinc-800 rounded-lg">
                {availableAvatars.map((av) => (
                  <button
                    key={av.emoji}
                    type="button"
                    disabled={!av.available}
                    onClick={() => setSelectedAvatar(av.emoji)}
                    className={`
                      aspect-square flex items-center justify-center text-2xl rounded-lg transition-all
                      ${selectedAvatar === av.emoji
                        ? 'bg-gold-500 ring-2 ring-gold-400 scale-110'
                        : av.available
                          ? 'bg-zinc-800 hover:bg-zinc-700 hover:scale-105'
                          : 'bg-zinc-900 opacity-30 cursor-not-allowed grayscale'
                      }
                    `}
                    title={av.available ? 'Wybierz' : 'Zajęty przez innego rodzica'}
                  >
                    {av.emoji}
                  </button>
                ))}
              </div>
              {selectedAvatar && (
                <p className="text-xs text-gold-400 mt-2">
                  Wybrany awatar: <span className="text-2xl">{selectedAvatar}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={parentEmail}
                onChange={e => setParentEmail(e.target.value)}
                placeholder="jan.kowalski@example.com"
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none"
                required
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
            disabled={loading || !parentName.trim() || !selectedAvatar || !parentEmail.trim()}
            className="w-full bg-gold-500 text-black font-bold py-4 rounded-lg hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            {loading ? 'Rejestracja...' : 'Zapisz i kontynuuj'}
          </button>

          {/* Przycisk dla innego rodzica - zmiana konta */}
          <button
            onClick={() => {
              setParticipantInfo(null);
              setAuthToken(null);
              setParentName('');
              setParentEmail('');
              setParentPhone('');
              setSelectedAvatar('');
              // Czyszcz też localStorage, żeby registration modal pozwolił się zarejestrować od nowa
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('group_participant_')) {
                  localStorage.removeItem(key);
                }
              });
              loadAvailableAvatars(galleryInfo?.gallery_id || 0);
            }}
            className="w-full bg-zinc-800 text-white font-semibold py-3 rounded-lg hover:bg-zinc-700 transition-all text-sm"
          >
            Zaloguj się jako inny rodzic
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
            <div className="flex items-center gap-3">
              {participantInfo?.avatar && (
                <div className="w-12 h-12 bg-gold-500/10 border-2 border-gold-500/30 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
                  {participantInfo.avatar}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  {participantInfo?.parent_name || galleryInfo?.gallery_name}
                </h1>
                {participantInfo && (
                  <p className="text-sm text-zinc-400">
                    {galleryInfo?.gallery_name && (
                      <span className="text-zinc-500">{galleryInfo.gallery_name} • </span>
                    )}
                    ID: <span className="text-gold-500 font-mono">{participantInfo.parent_identifier}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-zinc-400">
                  Wybrano: <span className="text-white font-bold">{selectedPhotos.length}/{participantInfo?.max_selections}</span>
                </p>
                {consentGiven && (
                  <p className="text-xs text-green-400">✓ Zgoda wyrażona ({consentScope === 'ALL' ? 'wszystkie' : 'wybrane'})</p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Wyloguj się"
                aria-label="Wyloguj"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 text-zinc-400 hover:text-gold-400 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Udostępnij galerię rodzinie"
                aria-label="Udostępnij galerię"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDeleteAccount}
                className="p-2 text-zinc-600 hover:text-red-500 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Usuń moje dane (RODO)"
                aria-label="Usuń konto RODO"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Udostępnij galerię rodzinie</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-zinc-400 mb-6">
              Aby rodzina mogła wejść do tej galerii, przekaż im poniższe dane. Każdy może założyć własny profil i samodzielnie zaznaczyć ulubione zdjęcia.
            </p>

            {/* Gallery link */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Link do galerii</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gold-400 font-mono truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}/galeria/grupowa?code=${code}` : `/galeria/grupowa?code=${code}`}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== 'undefined'
                      ? `${window.location.origin}/galeria/grupowa?code=${code}`
                      : `/galeria/grupowa?code=${code}`;
                    navigator.clipboard.writeText(url).then(() => {
                      setCopiedShare(true);
                      setTimeout(() => setCopiedShare(false), 2500);
                    });
                  }}
                  className="flex-shrink-0 p-2.5 bg-gold-500 text-black rounded-lg hover:bg-gold-400 transition-colors"
                  title="Kopiuj link"
                >
                  {copiedShare ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Gallery code */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Kod dostępu</label>
              <div className="bg-black border border-zinc-700 rounded-lg px-3 py-2.5">
                <span className="text-white font-mono font-bold tracking-wider">{code}</span>
              </div>
            </div>

            {/* Password note */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200">
                  Jeśli galeria jest chroniona hasłem — podaj je rodzinie ustnie lub przez SMS. <strong>Nie umieszczaj hasła w żadnym linku.</strong>
                </p>
              </div>
            </div>

            {/* Parent identifier */}
            {participantInfo && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 mb-6">
                <p className="text-xs text-zinc-400 mb-1">Twój identyfikator rodzica:</p>
                <p className="text-lg font-mono font-bold text-gold-400">{participantInfo.parent_identifier}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Rodzina może zalogować się własnym emailem lub założyć nowy profil w tej samej galerii.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-zinc-800 text-white font-semibold py-3 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      {/* HERO SLIDER — wow-factor */
      {photos.length > 0 && (
        <PremiumGalleryHero
          photos={photos}
          title={participantInfo?.parent_name ? `Witaj, ${participantInfo.parent_name}` : (galleryInfo?.gallery_name || 'Twoja galeria')}
          subtitle={galleryInfo?.gallery_name ? `${galleryInfo.gallery_name} — wybierz zdjęcia do druku odbitek` : undefined}
          badge="Twoja prywatna galeria"
          showModeToggle
          mode={viewMode}
          onModeChange={setViewMode}
          onPhotoClick={(p) => setLightboxPhoto(p as Photo)}
        />
      )}

      {photos.length > 0 && (
        <TopReviewNudge
          discountCode="KOMUNIA15"
          theme="dark"
        />
      )}

      {/* Consent info banner — widoczny jeśli zgoda nie jest jeszcze wyrażona */}
      {!consentGiven && photos.length > 0 && (
        <div className="bg-amber-500/10 border-y border-amber-500/30">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-start gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-200 mb-1">Zgoda na publikację wizerunku</p>
                <p className="text-xs text-amber-300/80">
                  Fotograf może poprosić o zgodę na nieodpłatne publikowanie wybranych zdjęć na swojej stronie internetowej i w mediach społecznościowych w celach promocyjnych.
                  Wyrażenie zgody jest <strong>dobrowolne</strong> — możesz ją cofnąć w każdej chwili.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowConsentModal(true)}
              disabled={selectedPhotos.length === 0}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Heart className="w-4 h-4" />
              {selectedPhotos.length === 0 ? 'Zaznacz zdjęcia, aby wyrazić zgodę' : 'Wyraź zgodę RODO'}
            </button>
          </div>
        </div>
      )}

      {/* Action Bar pod headerem */}
      <div className="border-b border-zinc-800 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Info className="w-4 h-4 text-gold-500" />
            <span>
              Kliknij zdjęcie, aby je powiększyć. Zaznacz <strong className="text-white">do {participantInfo?.max_selections || 5}</strong> zdjęć do druku odbitek.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedPhotos.length > 0 && (
              <button
                onClick={handleDownloadSelected}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black text-sm font-bold rounded-lg transition-colors"
                title={`Pobierz zaznaczone ${selectedPhotos.length} zdjęcia jako JPG`}
              >
                <Download className="w-4 h-4" />
                Pobierz zaznaczone ({selectedPhotos.length})
              </button>
            )}
            <button
              onClick={handleDownloadAll}
              disabled={photos.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              title="Pobierz wszystkie zdjęcia w pełnej rozdzielczości jako ZIP"
            >
              <Package className="w-4 h-4" />
              Pobierz całą galerię (ZIP)
            </button>
          </div>
        </div>
      </div>

      {/* Galeria — Siatka lub Opowieść */}
      <div className={viewMode === 'story' ? 'pb-32' : 'max-w-7xl mx-auto px-4 py-8 pb-32'}>
        {photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400">Brak zdjęć w galerii</p>
          </div>
        ) : viewMode === 'story' ? (
          <PremiumGalleryStory
            photos={photos}
            onPhotoClick={(p) => setLightboxPhoto(p as Photo)}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => {
              const isSelected = selectedPhotos.includes(photo.id);
              const selectionIdx = isSelected ? selectedPhotos.indexOf(photo.id) + 1 : null;
              return (
                <div
                  key={photo.id}
                  onClick={() => setLightboxPhoto(photo)}
                  className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden group transition-all ${
                    isSelected ? 'ring-4 ring-gold-500 shadow-lg shadow-gold-500/20' : 'ring-1 ring-zinc-800 hover:ring-zinc-600'
                  }`}
                >
                  <Image
                    src={photo.thumbnail_url || photo.file_url}
                    alt="Zdjęcie z galerii"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  {/* Hover overlay - zoom hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                    <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>

                  {/* Checkbox "Do druku" — top-left */}
                  <button
                    type="button"
                    onClick={(e) => handleSelectToggle(photo.id, e)}
                    className={`absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all ${
                      isSelected
                        ? 'bg-gold-500 text-black'
                        : 'bg-black/75 text-white hover:bg-black/90 opacity-100'
                    }`}
                    title={isSelected ? 'Kliknij, aby odznaczyć' : 'Zaznacz do druku'}
                  >
                    {isSelected ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        {selectionIdx}/{participantInfo?.max_selections}
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        Do druku
                      </>
                    )}
                  </button>

                  {/* Download single button — top-right (na hover) */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDownloadSingle(photo.id); }}
                    className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-gold-500 hover:text-black text-white rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                    title="Pobierz to zdjęcie"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPSELL + PROŚBA O OPINIĘ — boost SEO */}
      {photos.length > 0 && (
        <PostGalleryUpsell
          clientName={participantInfo?.parent_name}
          discountCode="KOMUNIA15"
          theme="dark"
        />
      )}

      {/* PRO Sticky Bottom Bar — zawsze widoczny gdy są zdjęcia */}
      {photos.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex flex-col gap-1 flex-1 max-w-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Zaznaczone do druku</span>
                    <span className="text-white font-bold">
                      {selectedPhotos.length}/{participantInfo?.max_selections || 5}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all"
                      style={{
                        width: `${Math.min(100, (selectedPhotos.length / (participantInfo?.max_selections || 5)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
                {consentGiven && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-400 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <Check className="w-3.5 h-3.5" />
                    Zgoda RODO: {consentScope === 'ALL' ? 'wszystkie' : 'wybrane'}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowConsentModal(true)}
                disabled={selectedPhotos.length === 0 && !consentGiven}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg ${
                  consentGiven
                    ? 'bg-zinc-700 text-white hover:bg-zinc-600'
                    : selectedPhotos.length > 0
                      ? 'bg-gold-500 text-black hover:bg-gold-400 hover:scale-105'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Heart className="w-4 h-4" />
                {consentGiven ? 'Zaktualizuj zgodę RODO' : 'Zatwierdź wybory + zgoda RODO'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* LIGHTBOX PRO — nawigacja, licznik, akcje */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[220]"
          onClick={() => setLightboxPhoto(null)}
        >
          {/* Top bar: licznik + zamknij */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              {(() => {
                const idx = photos.findIndex(p => p.id === lightboxPhoto.id);
                const isSelected = selectedPhotos.includes(lightboxPhoto.id);
                return (
                  <>
                    <span className="text-white text-sm font-mono bg-black/50 px-3 py-1.5 rounded-full">
                      {idx + 1} / {photos.length}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1.5 text-black font-bold text-xs bg-gold-500 px-3 py-1.5 rounded-full">
                        <CheckSquare className="w-3.5 h-3.5" />
                        Wybrane do druku ({selectedPhotos.indexOf(lightboxPhoto.id) + 1}/{participantInfo?.max_selections})
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxPhoto(null); }}
              className="w-12 h-12 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full flex items-center justify-center"
              aria-label="Zamknij podgląd"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Strzałka w lewo */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-zinc-900/80 hover:bg-gold-500 hover:text-black text-white rounded-full flex items-center justify-center z-10 transition-colors shadow-lg"
              aria-label="Poprzednie zdjęcie"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Strzałka w prawo */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-zinc-900/80 hover:bg-gold-500 hover:text-black text-white rounded-full flex items-center justify-center z-10 transition-colors shadow-lg"
              aria-label="Następne zdjęcie"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <div
            className="relative max-w-6xl w-full px-20 py-20 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxPhoto.file_url}
              alt="Podgląd zdjęcia"
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Bottom action bar */}
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              {(() => {
                const isSelected = selectedPhotos.includes(lightboxPhoto.id);
                const limitReached = !isSelected && participantInfo
                  && selectedPhotos.length >= participantInfo.max_selections;
                return (
                  <>
                    <button
                      onClick={async () => {
                        if (limitReached) {
                          toast.error(`Możesz wybrać maksymalnie ${participantInfo?.max_selections} zdjęć`);
                          return;
                        }
                        await handlePhotoClick(lightboxPhoto.id);
                      }}
                      disabled={!!limitReached}
                      className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg ${
                        isSelected
                          ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                          : limitReached
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-gold-500 text-black hover:bg-gold-400'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <X className="w-5 h-5" />
                          Odznacz (zdjęcie do druku)
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-5 h-5" />
                          {limitReached ? 'Limit osiągnięty' : 'Zaznacz do druku'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadSingle(lightboxPhoto.id)}
                      className="px-6 py-3 rounded-full font-bold flex items-center gap-2 bg-zinc-800 text-white hover:bg-zinc-700 transition-all shadow-lg"
                      title="Pobierz to zdjęcie w pełnej rozdzielczości"
                    >
                      <Download className="w-5 h-5" />
                      Pobierz zdjęcie
                    </button>
                  </>
                );
              })()}
            </div>

            <p className="mt-4 text-xs text-zinc-500 text-center">
              Użyj strzałek ← → na klawiaturze, aby przeglądać. ESC zamyka.
            </p>

            <button
              onClick={() => setLightboxPhoto(null)}
              className="mt-3 px-5 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200"
            >
              Zamknij podgląd
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL - po wyrażeniu zgody */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Dziękujemy!</h2>
            <p className="text-zinc-300 mb-2">
              Twoje wybory i zgoda zostały zapisane.
            </p>
            {participantInfo?.avatar && (
              <p className="text-zinc-400 text-sm mb-6">
                Twój awatar: <span className="text-3xl">{participantInfo.avatar}</span>
                <br />
                ID: <span className="font-mono text-gold-500">{participantInfo.parent_identifier}</span>
              </p>
            )}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-blue-300">
                Możesz bezpiecznie zamknąć tę stronę. Możesz też wrócić później i zmienić wybory aż do zakończenia galerii.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-gold-500 text-black font-bold py-3 rounded-lg hover:bg-gold-400 transition-colors"
            >
              Wróć do galerii
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
