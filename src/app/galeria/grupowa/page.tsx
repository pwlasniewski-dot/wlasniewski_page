'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  allow_extra_photo_purchase?: boolean;
  price_per_premium?: number;
  group_print_price_10x15?: number;
  group_print_price_15x21?: number;
}

interface ParticipantInfo {
  participant_id: number;
  parent_identifier: string;
  parent_name?: string;
  avatar: string;
  max_selections: number;
  allow_extra_photo_purchase?: boolean;
  token: string;
}

interface AvatarOption {
  emoji: string;
  available: boolean;
}

interface OrderConfirmationLine {
  photo_id: number;
  print_size: string | null;
  print_size_label: string | null;
  quantity: number;
  unit_amount: number | null;
  line_total: number | null;
  thumbnail_url: string | null;
  frame_number: number | null;
}

interface OrderConfirmation {
  id: number;
  payment_status: string;
  photo_count: number;
  total_amount: number;
  created_at: string;
  paid_at: string | null;
  kind: string | null;
  lines: OrderConfirmationLine[];
}

const INCLUDED_PRINT_SIZE = '15x21';
const GROUP_EXTRA_PRINT_SIZES = [
  { code: '10x15', label: '10x15 cm' },
  { code: '15x21', label: '15x21 cm' },
] as const;

type GroupExtraPrintSize = (typeof GROUP_EXTRA_PRINT_SIZES)[number]['code'];
// Jedno zdjęcie = jeden rozmiar odbitki (uproszczony model koszyka)
type ExtraCartByPhoto = Record<number, GroupExtraPrintSize>;

export default function GroupGalleryPage() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code');
  const guestParam = searchParams.get('guest'); // ?guest=1 triggers auto guest mode
  const participantParam = searchParams.get('participant'); // PayU return: restore session
  const orderParam = searchParams.get('order'); // PayU return: order to confirm
  // SECURITY: We no longer accept password in URL params

  // Auth state
  const [code, setCode] = useState(codeParam || '');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorKind, setAuthErrorKind] = useState<'password' | 'code' | 'generic' | null>(null);
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
  const [paidExtraPhotoIds, setPaidExtraPhotoIds] = useState<number[]>([]);
  const [extraCartByPhoto, setExtraCartByPhoto] = useState<ExtraCartByPhoto>({});
  // Download selection mode — separate from print selection (no limit, only for ZIP download)
  const [downloadMode, setDownloadMode] = useState(false);
  const [downloadSelection, setDownloadSelection] = useState<Set<number>>(new Set());
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  // PRO Hero + view mode
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'story'>('story');
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncViewportMode = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileViewport(mobile);
      setViewMode(mobile ? 'grid' : 'story');
    };

    syncViewportMode();
    window.addEventListener('resize', syncViewportMode);
    return () => window.removeEventListener('resize', syncViewportMode);
  }, []);

  // Consent state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentScope, setConsentScope] = useState<'ALL' | 'SELECTED'>('ALL');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [purchasingExtras, setPurchasingExtras] = useState(false);
  const [extraDraftSizeByPhoto, setExtraDraftSizeByPhoto] = useState<ExtraCartByPhoto>({});
  const [extraSizeConfirmed, setExtraSizeConfirmed] = useState(false);
  // Order confirmation (after PayU return)
  const [confirmOrder, setConfirmOrder] = useState<OrderConfirmation | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [participantOrders, setParticipantOrders] = useState<OrderConfirmation[]>([]);
  const sessionRestoredRef = useRef(false);
  // Guest (anonymous) mode — view only, no account
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Always show registration modal when authenticated - each parent registers separately (not from localStorage)
  // This allows multiple family members to create their own profiles under the same gallery code
  useEffect(() => {
    if (isAuthenticated && galleryInfo && !participantInfo) {
      // Auto-enter guest mode when ?guest=1 is in URL
      if (guestParam === '1') {
        handleGuestAccess();
      } else {
        setShowRegistrationModal(true);
        loadAvailableAvatars(galleryInfo.gallery_id);
      }
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
    setExtraCartByPhoto({});
    setPaidExtraPhotoIds([]);
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

  // Guest access — view gallery without creating an account
  const handleGuestAccess = async () => {
    if (!galleryInfo) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/galleries/group/${galleryInfo.gallery_id}/guest-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_code: code.trim(), password: password.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Nie udało się uzyskać dostępu');
        return;
      }
      setAuthToken(data.token);
      setIsGuestMode(true);
      setShowRegistrationModal(false);
      loadPhotos(galleryInfo.gallery_id, data.token);
      window.scrollTo({ top: 0, behavior: 'instant' });
      toast.success('Przeglądasz galerię jako gość');
    } catch {
      toast.error('Błąd połączenia');
    } finally {
      setLoading(false);
    }
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
      setAuthError('Wpisz kod dostępu');
      setAuthErrorKind('code');
      toast.error('Wpisz kod dostępu');
      return;
    }

    setAuthError(null);
    setAuthErrorKind(null);
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

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const apiError = typeof data?.error === 'string' ? data.error : '';
        const isBadPassword = response.status === 401 && /hasło|haslo/i.test(apiError);
        const message = isBadPassword
          ? 'Niepoprawne hasło'
          : (apiError || (response.status === 404 ? 'Nieprawidłowy kod dostępu' : 'Nie udało się zalogować'));

        setAuthError(message);
        setAuthErrorKind(isBadPassword ? 'password' : (response.status === 404 ? 'code' : 'generic'));
        toast.error(message);
        return;
      }

      setAuthError(null);
      setAuthErrorKind(null);
      setGalleryInfo(data);
      setIsAuthenticated(true);
      try { localStorage.setItem(`group_gallery_${data.gallery_id}`, JSON.stringify(data)); } catch {}
      toast.success('Witaj w galerii');

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
      setPaidExtraPhotoIds(data.paid_extra_photo_ids || []);
      setAuthToken(data.token);
      // Zapisz token dla każdego uczestnika indywidualnie (nie per galerię!)
      // Każdy rodzic ma swój participant_id i własny klucz w localStorage
      persistParticipant(data, galleryInfo);
      setShowRegistrationModal(false);
      toast.success(`Witaj! Twój awatar: ${data.avatar}`);

      // Load photos and selections
      loadPhotos(galleryInfo.gallery_id, data.token);
      loadSelections(data.participant_id, data.token);
      loadOrders(data.participant_id, data.token);

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
      setPaidExtraPhotoIds(data.paid_extra_photo_ids || []);
      setAuthToken(data.token);
      persistParticipant(data, galleryInfo);
      setShowRegistrationModal(false);
      toast.success(`Witaj ponownie, ${data.parent_name || 'Rodzicu'}!`);

      loadPhotos(galleryInfo.gallery_id, data.token);
      loadSelections(data.participant_id, data.token);
      loadOrders(data.participant_id, data.token);
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

  // Zapis sesji rodzica do localStorage z gwarancją obecności gallery_id (potrzebne do
  // automatycznego przywrócenia sesji po powrocie z PayU — bez ponownego logowania).
  const persistParticipant = (data: any, gallery?: GalleryInfo | null) => {
    if (typeof window === 'undefined' || !data?.participant_id) return;
    const g = gallery || galleryInfo;
    const enriched = {
      ...data,
      gallery_id: data.gallery_id ?? g?.gallery_id,
      gallery_name: data.gallery_name ?? g?.gallery_name,
      allow_extra_photo_purchase: data.allow_extra_photo_purchase ?? g?.allow_extra_photo_purchase,
    };
    try {
      localStorage.setItem(
        `group_participant_${data.participant_id}`,
        JSON.stringify(enriched)
      );
    } catch {}
  };

  // Pobranie historii zamówień rodzica (lista) — do sekcji "Twoje zamówienia".
  const loadOrders = async (participantId: number, token: string) => {
    try {
      const res = await fetch(
        `/api/galleries/group/participant/${participantId}/orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.orders)) {
        setParticipantOrders(data.orders);
      }
    } catch (e) {
      console.error('Load orders error', e);
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
        setPaidExtraPhotoIds(data.paid_extra_photo_ids || []);
        setConsentGiven(data.publication_consent || false);
        setConsentScope(data.consent_scope || 'ALL');
        loadOrders(participantId, token);
        if (typeof data.allow_extra_photo_purchase === 'boolean') {
          setParticipantInfo(prev => prev ? { ...prev, allow_extra_photo_purchase: data.allow_extra_photo_purchase } : prev);
        }
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

  // Pobranie pojedynczego zamówienia do ekranu potwierdzenia (po powrocie z PayU).
  // Jeśli płatność jeszcze nie potwierdzona przez webhook — odpytujemy kilkukrotnie.
  const fetchOrderConfirmation = useCallback(async (
    orderId: number,
    participantId: number,
    token: string,
    attempt = 0
  ) => {
    try {
      if (attempt === 0) setOrderLoading(true);
      const res = await fetch(
        `/api/galleries/group/participant/${participantId}/orders?order_id=${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok && data.order) {
        setConfirmOrder(data.order);
        setShowOrderModal(true);
        if (data.order.payment_status === 'paid') {
          setExtraCartByPhoto({});
          loadSelections(participantId, token);
          loadOrders(participantId, token);
        } else if (attempt < 8) {
          // webhook PayU może mieć opóźnienie — spróbuj ponownie
          setTimeout(() => fetchOrderConfirmation(orderId, participantId, token, attempt + 1), 3000);
        }
      }
    } catch (e) {
      console.error('Order confirmation fetch error', e);
    } finally {
      if (attempt === 0) setOrderLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore sesji po powrocie z PayU (?participant=&order=) — bez ponownego logowania.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionRestoredRef.current) return;
    if (isAuthenticated) return;
    if (!participantParam) return;

    const pid = Number(participantParam);
    if (!Number.isInteger(pid) || pid <= 0) return;

    try {
      const rawP = localStorage.getItem(`group_participant_${pid}`);
      if (!rawP) return; // brak zapisanej sesji w tej przeglądarce — zwykłe logowanie
      const pdata = JSON.parse(rawP);
      if (!pdata?.token) return;

      // gallery_id mógł nie zostać zapisany w starszych rekordach — spróbuj go odtworzyć
      // z zapisanego obiektu galerii (group_gallery_*), aby restore nie wymagał logowania.
      let resolvedGalleryId: number | undefined = pdata.gallery_id;
      if (!resolvedGalleryId) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('group_gallery_')) {
            const parsed = Number(key.replace('group_gallery_', ''));
            if (Number.isInteger(parsed) && parsed > 0) {
              resolvedGalleryId = parsed;
              break;
            }
          }
        }
      }
      if (!resolvedGalleryId) return;
      pdata.gallery_id = resolvedGalleryId;

      sessionRestoredRef.current = true;

      let gi: GalleryInfo | null = null;
      const rawG = localStorage.getItem(`group_gallery_${pdata.gallery_id}`);
      if (rawG) {
        try { gi = JSON.parse(rawG); } catch { gi = null; }
      }
      if (!gi) {
        gi = {
          gallery_id: pdata.gallery_id,
          gallery_name: pdata.gallery_name || 'Galeria',
          max_photos_for_print: pdata.max_selections || 5,
          allow_extra_photo_purchase: pdata.allow_extra_photo_purchase,
        };
      }

      setGalleryInfo(gi);
      setParticipantInfo(pdata);
      setPaidExtraPhotoIds(pdata.paid_extra_photo_ids || []);
      setAuthToken(pdata.token);
      setIsAuthenticated(true);
      setShowRegistrationModal(false);

      // Zaktualizuj zapis sesji o gallery_id (gdy starszy rekord go nie miał)
      persistParticipant(pdata, gi);

      loadPhotos(pdata.gallery_id, pdata.token);
      loadSelections(pdata.participant_id, pdata.token);
      loadOrders(pdata.participant_id, pdata.token);

      if (orderParam) {
        const oid = Number(orderParam);
        if (Number.isInteger(oid) && oid > 0) {
          fetchOrderConfirmation(oid, pdata.participant_id, pdata.token);
        }
      }

      // Wyczyść parametry z URL, aby nie powtarzać restore przy odświeżeniu
      const url = new URL(window.location.href);
      url.searchParams.delete('participant');
      url.searchParams.delete('order');
      url.searchParams.delete('payu');
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.error('Restore session error', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantParam, orderParam]);

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

  // PRO: pobieranie pliku z autoryzacją (fetch → blob → trigger download)
  // Używamy fetch (nie natywnego <a download>), aby móc pokazać PRAWDZIWY błąd z serwera
  // (np. 409 "brak pełnej jakości") zamiast cichej "witryna niedostępna" w historii przeglądarki.
  const downloadWithAuth = useCallback(async (url: string, fallbackName: string) => {
    if (!authToken) {
      toast.error('Brak autoryzacji — zaloguj się ponownie');
      return;
    }
    const tid = toast.loading('Przygotowywanie pobierania...');
    try {
      const separator = url.includes('?') ? '&' : '?';
      const fetchUrl = `${url}${separator}_ts=${Date.now()}`;
      const res = await fetch(fetchUrl, {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store',
      });

      if (!res.ok) {
        let message = `Nie udało się pobrać (HTTP ${res.status})`;
        try {
          const parsed = await res.json();
          if (parsed?.error && typeof parsed.error === 'string') {
            message = parsed.error;
          }
        } catch {
          // odpowiedź nie jest JSON-em — zostaw domyślny komunikat
        }
        toast.error(message, { id: tid, duration: 6000 });
        return;
      }

      const cd = res.headers.get('Content-Disposition') || '';
      const utf8Match = cd.match(/filename\*=UTF-8''([^;]+)/i);
      const plainMatch = cd.match(/filename="([^"]+)"/i);
      const name = utf8Match?.[1]
        ? decodeURIComponent(utf8Match[1])
        : plainMatch?.[1] || fallbackName;

      const blob = await res.blob();
      if (!blob || blob.size === 0) {
        toast.error('Pobrany plik jest pusty. Spróbuj ponownie za chwilę.', { id: tid });
        return;
      }

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
      toast.error('Błąd pobierania — sprawdź połączenie i spróbuj ponownie', { id: tid });
    }
  }, [authToken]);

  const handleDownloadSingle = (photoId: number) => {
    if (!galleryInfo) return;
    downloadWithAuth(
      `/api/galleries/group/${galleryInfo.gallery_id}/download/${photoId}`,
      `zdjecie-${photoId}.jpg`
    );
  };

  const handleDownloadAll = async () => {
    if (!galleryInfo || !authToken) return;
    if (photos.length === 0) {
      toast.error('Brak zdjęć do pobrania');
      return;
    }
    await downloadWithAuth(
      `/api/galleries/group/${galleryInfo.gallery_id}/download-all`,
      'galeria.zip'
    );
  };

  // Download selection mode (separate from print selection)
  const [prevViewMode, setPrevViewMode] = useState<'grid' | 'story' | null>(null);
  const toggleDownloadMode = () => {
    setDownloadMode((v) => {
      const next = !v;
      if (!next) {
        setDownloadSelection(new Set());
        // przywróć poprzedni widok (np. story)
        if (prevViewMode) {
          setViewMode(prevViewMode);
          setPrevViewMode(null);
        }
      } else {
        // zapamiętaj aktualny widok i przełącz na siatkę
        setPrevViewMode(viewMode);
        setViewMode('grid');
      }
      return next;
    });
  };

  const toggleDownloadPick = (photoId: number) => {
    setDownloadSelection((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const selectAllForDownload = () => {
    setDownloadSelection(new Set(photos.map((p) => p.id)));
  };

  const handleConfirmDownloadSelection = async () => {
    if (downloadSelection.size === 0) {
      toast.error('Zaznacz przynajmniej jedno zdjęcie');
      return;
    }
    const list = photos.filter((p) => downloadSelection.has(p.id));
    if (list.length === 1) {
      await handleDownloadSingle(list[0].id);
    } else {
      const photoIds = list.map((photo) => photo.id).join(',');
      await downloadWithAuth(
        `/api/galleries/group/${galleryInfo!.gallery_id}/download-all?photo_ids=${encodeURIComponent(photoIds)}`,
        `zdjecia-wybrane-${list.length}.zip`
      );
    }
    // exit mode after download starts
    setDownloadMode(false);
    setDownloadSelection(new Set());
    if (prevViewMode) {
      setViewMode(prevViewMode);
      setPrevViewMode(null);
    }
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

  const selectedPhotoItems = photos.filter((p) => selectedPhotos.includes(p.id));
  const extraPurchaseEnabled = !!participantInfo && !!galleryInfo && !isGuestMode && (participantInfo.allow_extra_photo_purchase || galleryInfo.allow_extra_photo_purchase);
  const globalPrice10x15 = galleryInfo?.group_print_price_10x15 || 150;
  const globalPrice15x21 = galleryInfo?.group_print_price_15x21 || 250;
  const DEFAULT_EXTRA_SIZE: GroupExtraPrintSize = '10x15';
  const priceForSize = (size: GroupExtraPrintSize) => (size === '15x21' ? globalPrice15x21 : globalPrice10x15);
  const isInExtraCart = (photoId: number) => Object.prototype.hasOwnProperty.call(extraCartByPhoto, photoId);
  const getExtraSize = (photoId: number): GroupExtraPrintSize | null => extraCartByPhoto[photoId] ?? null;
  const selectedExtraPhotos = Object.keys(extraCartByPhoto).map((photoId) => Number(photoId));
  const extraCartLines = selectedExtraPhotos.map((photoId) => ({
    photo_id: photoId,
    print_size: extraCartByPhoto[photoId],
    quantity: 1,
  }));
  const extraCartQty10x15 = extraCartLines.filter((line) => line.print_size === '10x15').length;
  const extraCartQty15x21 = extraCartLines.filter((line) => line.print_size === '15x21').length;
  const extraCartTotalUnits = selectedExtraPhotos.length;
  const extraCartTotal = extraCartLines.reduce((sum, line) => sum + priceForSize(line.print_size), 0);
  const availableExtraPhotos = photos;
  const allSelectedIds = new Set([...selectedPhotos, ...selectedExtraPhotos, ...paidExtraPhotoIds]);
  const visiblePhotos = showSelectedOnly ? photos.filter(p => allSelectedIds.has(p.id)) : photos;

  const setExtraSize = (photoId: number, size: GroupExtraPrintSize) => {
    setExtraCartByPhoto((prev) => (Object.prototype.hasOwnProperty.call(prev, photoId)
      ? { ...prev, [photoId]: size }
      : prev));
  };

  const getPendingExtraSize = (photoId: number): GroupExtraPrintSize => (
    extraDraftSizeByPhoto[photoId] || DEFAULT_EXTRA_SIZE
  );

  const setPendingExtraSize = (photoId: number, size: GroupExtraPrintSize) => {
    setExtraDraftSizeByPhoto((prev) => ({ ...prev, [photoId]: size }));
  };

  const removeExtraFromCart = (photoId: number) => {
    setExtraCartByPhoto((prev) => {
      const { [photoId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  // Dodanie do koszyka z rozmiarem wybranym na kaflu.
  // Opłacone wcześniej zdjęcia NIE są blokowane; pokazujemy tylko informację.
  const quickAddExtraToCart = (photoId: number, size: GroupExtraPrintSize) => {
    if (isInExtraCart(photoId)) return;
    setExtraCartByPhoto((prev) => ({ ...prev, [photoId]: size }));
    if (paidExtraPhotoIds.includes(photoId)) {
      toast('To zdjęcie kupiłeś już wcześniej — możesz zamówić je ponownie.', { icon: 'ℹ️' });
    } else {
      toast.success('Dodano do koszyka');
    }
  };

  const toggleExtraInCart = (photoId: number) => {
    if (isInExtraCart(photoId)) {
      removeExtraFromCart(photoId);
      toast.success('Usunięto z koszyka');
      return;
    }
    quickAddExtraToCart(photoId, getPendingExtraSize(photoId));
  };

  const handlePurchaseExtras = async () => {
    if (!participantInfo || !authToken) return;
    if (extraCartLines.length === 0) {
      toast.error('Ustaw ilości odbitek do zamówienia');
      return;
    }
    if (!extraSizeConfirmed) {
      toast.error('Zaznacz duży checkbox potwierdzenia rozmiarów odbitek przed przejściem do płatności');
      return;
    }

    setPurchasingExtras(true);
    try {
      const response = await fetch(`/api/galleries/group/participant/${participantInfo.participant_id}/purchase-extras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          order_lines: extraCartLines,
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
          toast.error(data.error || 'Nie udało się utworzyć zamówienia');
        }
        return;
      }

      if (data.paymentUrl) {
        toast.success('Przekierowuję do płatności PayU...');
        window.location.href = data.paymentUrl;
      } else {
        toast.success(data.message || 'Zamówienie utworzone');
        setExtraCartByPhoto({});
        setExtraSizeConfirmed(false);
      }
    } catch (error) {
      console.error('Purchase extras error:', error);
      toast.error('Nie udało się utworzyć zamówienia');
    } finally {
      setPurchasingExtras(false);
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
                onChange={e => {
                  setCode(e.target.value.toUpperCase());
                  if (authErrorKind === 'code' || authErrorKind === 'generic') {
                    setAuthError(null);
                    setAuthErrorKind(null);
                  }
                }}
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
                onChange={e => {
                  setPassword(e.target.value);
                  if (authErrorKind === 'password' || authErrorKind === 'generic') {
                    setAuthError(null);
                    setAuthErrorKind(null);
                  }
                }}
                placeholder="••••"
                className={`w-full bg-black border rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none ${authErrorKind === 'password' ? 'border-red-500' : 'border-zinc-700'}`}
              />
              {authErrorKind === 'password' && authError && (
                <p className="mt-2 text-sm text-red-400">{authError}</p>
              )}
            </div>

            {authErrorKind !== 'password' && authError && (
              <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                {authError}
              </div>
            )}

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
                      loadOrders(savedParticipant.participant_id, savedParticipant.token);
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
            <p className="text-xs text-zinc-400 mb-3">Wpisz swój email lub identyfikator (np. <span className="font-mono text-gold-400">PW-7475</span>) i od razu wejdziesz do galerii.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={existingEmail}
                onChange={e => setExistingEmail(e.target.value)}
                placeholder="Email lub identyfikator (np. PW-7475)"
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-zinc-700" />
            <span className="text-xs text-zinc-500">lub</span>
            <div className="flex-1 h-px bg-zinc-700" />
          </div>

          <button
            onClick={handleGuestAccess}
            disabled={loading}
            className="w-full bg-zinc-800 text-zinc-300 font-semibold py-3 rounded-lg hover:bg-zinc-700 transition-all text-sm disabled:opacity-50 mb-3"
          >
            Przeglądaj jako gość (bez konta)
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
              <div>
                <h1 className="text-2xl font-bold">
                  {isGuestMode ? 'Witaj, Gościu' : (participantInfo?.parent_name ? `Witaj, ${participantInfo.parent_name}` : 'Galeria')}
                </h1>
                {!isGuestMode && participantInfo && (
                  <p className="text-sm text-zinc-400">
                    ID: <span className="text-gold-500 font-mono">{participantInfo.parent_identifier}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-zinc-400">
                  Wybrano: <span className="text-white font-bold">{selectedPhotos.length}/{participantInfo?.max_selections}</span> <span className="text-zinc-500">(odbitki {INCLUDED_PRINT_SIZE})</span>
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
              Skopiuj poniższe dane i wyślij je rodzinie przez SMS lub WhatsApp. Każdy może założyć własny profil i samodzielnie zaznaczyć ulubione zdjęcia.
            </p>

            {/* Guest link */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Link dla gości (tylko podgląd)</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-400 font-mono truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}/galeria/grupowa?code=${code}&guest=1` : `/galeria/grupowa?code=${code}&guest=1`}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== 'undefined'
                      ? `${window.location.origin}/galeria/grupowa?code=${code}&guest=1`
                      : `/galeria/grupowa?code=${code}&guest=1`;
                    navigator.clipboard.writeText(url).then(() => {
                      setCopiedShare(true);
                      setTimeout(() => setCopiedShare(false), 2500);
                    });
                  }}
                  className="flex-shrink-0 p-2.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                  title="Kopiuj link dla gości"
                >
                  {copiedShare ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Gość widzi zdjęcia, ale nie może pobierać ani zaznaczać do druku.</p>
            </div>

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

            {/* Password — show if entered during login */}
            {password && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Hasło do galerii</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono">
                    {password}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(password).then(() => {
                        setCopiedShare(true);
                        setTimeout(() => setCopiedShare(false), 2500);
                      });
                    }}
                    className="flex-shrink-0 p-2.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                    title="Kopiuj hasło"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Full share text — copy everything at once (guest link for friends) */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Gotowa wiadomość dla znajomych (link gościa)</label>
              <div className="flex items-start gap-2">
                <div className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-300 whitespace-pre-wrap">
                  {`Zobacz zdjęcia z uroczystości:
${typeof window !== 'undefined' ? `${window.location.origin}/galeria/grupowa?code=${code}&guest=1` : `/galeria/grupowa?code=${code}&guest=1`}${password ? `

Hasło: ${password}` : ''}`}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const msg = `Zobacz zdjęcia z uroczystości:\n${typeof window !== 'undefined' ? `${window.location.origin}/galeria/grupowa?code=${code}&guest=1` : `/galeria/grupowa?code=${code}&guest=1`}${password ? `\n\nHasło: ${password}` : ''}`;
                    navigator.clipboard.writeText(msg).then(() => {
                      setCopiedShare(true);
                      setTimeout(() => setCopiedShare(false), 2500);
                    });
                  }}
                  className="flex-shrink-0 p-2.5 bg-gold-500 text-black rounded-lg hover:bg-gold-400 transition-colors mt-0"
                  title="Kopiuj całą wiadomość"
                >
                  {copiedShare ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
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

      {/* HERO SLIDER — wow-factor */}
      {photos.length > 0 && (
        <PremiumGalleryHero
          photos={photos}
          title={isGuestMode ? 'Witaj, Gościu' : (participantInfo?.parent_name ? `Witaj, ${participantInfo.parent_name}` : 'Galeria')}
          subtitle={isGuestMode ? undefined : 'Wybierz zdjęcia do druku odbitek'}
          badge={isGuestMode ? undefined : 'Twoja prywatna galeria'}
          showModeToggle={isMobileViewport}
          mode={viewMode}
          onModeChange={(mode) => setViewMode(isMobileViewport ? mode : 'story')}
          onPhotoClick={(p) => setLightboxPhoto(p as Photo)}
          selectedPhotoIds={isGuestMode ? undefined : new Set(selectedPhotos)}
          onToggleSelect={isGuestMode ? undefined : (p) => handleSelectToggle(p.id)}
          limitReached={!isGuestMode && selectedPhotos.length >= (participantInfo?.max_selections || 5)}
          onLimitReached={!isGuestMode && extraPurchaseEnabled ? (photoId: number) => toggleExtraInCart(photoId) : undefined}
          extraSelectedPhotoIds={isGuestMode ? undefined : new Set(selectedExtraPhotos)}
          paidExtraPhotoIds={isGuestMode ? undefined : new Set(paidExtraPhotoIds)}
        />
      )}

      {!isGuestMode && photos.length > 0 && (
        <TopReviewNudge
          discountCode="KOMUNIA15"
          theme="dark"
        />
      )}

      {/* Consent info banner — widoczny jeśli zgoda nie jest jeszcze wyrażona, ukryty dla gości */}
      {!isGuestMode && !consentGiven && photos.length > 0 && (
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
            <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => { setConsentScope('ALL'); setShowConsentModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-lg transition-colors"
              >
                <Heart className="w-4 h-4" />
                Zgoda na wszystkie zdjęcia
              </button>
              {selectedPhotos.length > 0 && (
                <button
                  onClick={() => { setConsentScope('SELECTED'); setShowConsentModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  Zgoda na zaznaczone ({selectedPhotos.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Bar pod headerem — only for registered parents, hidden for guests */}
      {!isGuestMode && (
      <div className="border-b border-zinc-800 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {downloadMode ? (
            <>
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Download className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span>
                  Kliknij zdjęcia, które chcesz <strong className="text-white">pobrać</strong> — następnie wciśnij „Pobierz".
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={selectAllForDownload}
                  className="text-xs text-zinc-400 hover:text-white underline underline-offset-4 transition-colors"
                >
                  Zaznacz wszystkie ({photos.length})
                </button>
                <button
                  onClick={toggleDownloadMode}
                  className="px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleConfirmDownloadSelection}
                  disabled={downloadSelection.size === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-black text-sm font-bold rounded-lg transition-all shadow-lg shadow-gold-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Download className="w-4 h-4" />
                  Pobierz wybrane ({downloadSelection.size})
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Info className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span>
                  Zaznacz <strong className="text-white">do {participantInfo?.max_selections || 5}</strong> ulubionych — fotograf wydrukuje je jako odbitki <strong className="text-white">{INCLUDED_PRINT_SIZE} cm</strong>.
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {selectedPhotos.length > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gold-400 font-medium">
                    <CheckSquare className="w-3.5 h-3.5" />
                    {selectedPhotos.length}/{participantInfo?.max_selections || 5} do druku
                  </span>
                )}
                <button
                  onClick={() => setShowSelectedOnly((v) => !v)}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${showSelectedOnly
                    ? 'bg-gold-500 text-black border-gold-500'
                    : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:border-zinc-600'
                    }`}
                  title="Filtruj widok do wybranych zdjęć (bezpłatne + płatne + opłacone)"
                >
                  {showSelectedOnly ? 'Pokaż wszystkie' : 'Pokaż tylko wybrane'}
                </button>
                <button
                  onClick={toggleDownloadMode}
                  disabled={photos.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Wejdź w tryb wybierania zdjęć do pobrania"
                >
                  <Download className="w-4 h-4" />
                  Pobierz zdjęcia
                </button>
                <button
                  onClick={handleDownloadAll}
                  disabled={photos.length === 0}
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Pobierz wszystkie zdjęcia z galerii w pełnej rozdzielczości jako ZIP (większy plik)"
                >
                  lub pobierz całą galerię
                </button>
                {extraPurchaseEnabled && extraCartTotalUnits > 0 && (
                  <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-emerald-900/40 border border-emerald-500/60 rounded-xl">
                    <div className="flex flex-col min-w-[140px]">
                      <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Koszyk</span>
                      <span className="text-lg font-black text-emerald-200 leading-tight">{(extraCartTotal / 100).toFixed(2)} zł</span>
                      <span className="text-[10px] text-emerald-400">10x15: {extraCartQty10x15} szt. • 15x21: {extraCartQty15x21} szt.</span>
                    </div>
                    <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border max-w-[420px] transition-all ${extraSizeConfirmed ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-100' : 'border-amber-500 bg-amber-500/15 text-amber-100 animate-pulse shadow-lg shadow-amber-500/20'}`}>
                      <input
                        type="checkbox"
                        checked={extraSizeConfirmed}
                        onChange={(e) => setExtraSizeConfirmed(e.target.checked)}
                        className="h-5 w-5 rounded border-amber-400 bg-black/40 text-gold-500 focus:ring-gold-500"
                      />
                      <span className="text-sm md:text-base font-black leading-tight">
                        Potwierdzam, że rozmiary odbitek w koszyku się zgadzają.
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePurchaseExtras()}
                      disabled={purchasingExtras}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-black rounded-lg transition-all disabled:opacity-50 whitespace-nowrap shadow-lg shadow-emerald-500/30"
                    >
                      <Package className="w-4 h-4" />
                      {purchasingExtras ? 'Ładowanie...' : 'Przejdź do płatności'}
                    </button>
                  </div>
                )}
                {extraPurchaseEnabled && extraCartTotalUnits === 0 && (
                  <div className="px-4 py-2 text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                    Wybierz dodatkowe odbitki bezpośrednio w sekcji poniżej.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Podgląd wybranych do druku (miniatury) — tylko dla rodzica */}
      {!isGuestMode && photos.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-5">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-white">Twoje wybrane do druku</h3>
                <p className="text-xs text-zinc-400">Wybrane: {selectedPhotoItems.length}/{participantInfo?.max_selections || 5}{extraCartTotalUnits > 0 ? ` + ${extraCartTotalUnits} odbitek w koszyku` : paidExtraPhotoIds.length > 0 ? ` + ${paidExtraPhotoIds.length} opłaconych zdjęć` : ''}</p>
                <p className="text-xs text-zinc-500 mt-1">Pakiet podstawowy: odbitki {INCLUDED_PRINT_SIZE} cm.</p>
              </div>
              <p className="text-xs font-semibold text-zinc-300">📸 Fotograf widzi Twoje wybrane zdjęcia w panelu administratora.</p>
            </div>
            {selectedPhotoItems.length === 0 ? (
              <p className="text-sm text-zinc-500">Nie masz jeszcze wybranych zdjęć do druku.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {selectedPhotoItems.map((photo, idx) => (
                  <div key={`selected-${photo.id}`} className="relative aspect-square rounded-lg overflow-hidden border border-gold-500/40 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumbnail_url || photo.file_url}
                      alt={`Wybrane zdjęcie ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 left-1 bg-gold-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleSelectToggle(photo.id, e)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
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
      )}

      {/* Dodatkowe odbitki do druku — sekcja płatnych zdjęć poza limitem */}
      {!isGuestMode && extraPurchaseEnabled && photos.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="bg-emerald-900/20 border border-emerald-600/40 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-emerald-300">Dodatkowe odbitki do druku — płatne</h3>
                <p className="text-xs text-emerald-200/70">Zdjęć w koszyku: <span className="font-bold">{extraCartTotalUnits}</span> • Razem: <span className="font-bold">{(extraCartTotal / 100).toFixed(2)} zł</span></p>
              </div>
            </div>
            {extraCartTotalUnits === 0 ? (
              <p className="text-sm text-emerald-200/50">Zaznacz poniżej interesujące Cię zdjęcia, aby rozszerzyć liczbę odbitek poza limit 5 odbitek. Rozmiar odbitki wybierzesz tutaj, w koszyku.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {selectedExtraPhotos.map((photoId, idx) => {
                  const photo = photos.find((item) => item.id === photoId);
                  if (!photo) return null;
                  const size = getExtraSize(photo.id) || DEFAULT_EXTRA_SIZE;
                  const wasPaid = paidExtraPhotoIds.includes(photo.id);
                  return (
                  <div key={`extra-${photo.id}`} className="w-32 rounded-lg overflow-hidden border border-emerald-500/60 bg-zinc-950">
                    <div className="relative aspect-square bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.thumbnail_url || photo.file_url}
                        alt={`Dodatkowa odbitka do druku ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {wasPaid && (
                        <span className="absolute top-1 left-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded">
                          Kupione wcześniej
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeExtraFromCart(photo.id);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                        title="Usuń to zdjęcie z koszyka"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-2 space-y-1.5">
                      <label className="block text-[10px] text-emerald-300/80 font-semibold">Rozmiar odbitki</label>
                      <select
                        value={size}
                        onChange={(e) => setExtraSize(photo.id, e.target.value as GroupExtraPrintSize)}
                        className="w-full bg-zinc-900 border border-emerald-700/60 text-white text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-emerald-400"
                      >
                        {GROUP_EXTRA_PRINT_SIZES.map((opt) => (
                          <option key={opt.code} value={opt.code}>{opt.label}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-emerald-200/70 font-bold">{(priceForSize(size) / 100).toFixed(2)} zł</p>
                    </div>
                  </div>
                )})}
              </div>
            )}

            {participantOrders.length > 0 && (
              <div className="mt-5 pt-4 border-t border-emerald-700/40">
                <h4 className="text-sm font-bold text-emerald-200 mb-3">Twoje zamówienia</h4>
                <div className="space-y-3">
                  {participantOrders.map((order) => {
                    const isPaid = order.payment_status === 'paid';
                    return (
                      <div key={`order-${order.id}`} className="bg-zinc-950/60 border border-emerald-700/40 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-black text-white">Zamówienie #{order.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-500 text-black' : 'bg-amber-500/90 text-black'}`}>
                            {isPaid ? 'Opłacone' : 'Oczekuje na płatność'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {order.lines.map((line, i) => (
                            <div key={`order-${order.id}-line-${i}`} className="w-20 rounded-md overflow-hidden border border-emerald-600/40 bg-black">
                              <div className="relative aspect-square">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={line.thumbnail_url || ''}
                                  alt={line.frame_number ? `Kadr ${line.frame_number}` : `Zdjęcie ${line.photo_id}`}
                                  className="w-full h-full object-cover"
                                />
                                {line.frame_number != null && (
                                  <span className="absolute top-0.5 left-0.5 bg-black/80 text-white text-[9px] font-black px-1 rounded">
                                    Kadr {line.frame_number}
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-emerald-200/80 text-center py-0.5">{line.print_size_label || line.print_size}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-emerald-200/80">
                          Zdjęć: <span className="font-bold">{order.photo_count}</span> • Kwota: <span className="font-bold">{(order.total_amount / 100).toFixed(2)} zł</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Galeria — Siatka lub Opowieść */}
      <div className={viewMode === 'story' ? 'pb-32' : 'max-w-7xl mx-auto px-4 py-8 pb-32'}>
        {photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400">Brak zdjęć w galerii</p>
          </div>
        ) : showSelectedOnly && allSelectedIds.size === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400">Brak wybranych zdjęć do podglądu.</p>
          </div>
        ) : viewMode === 'story' ? (
          <PremiumGalleryStory
            photos={visiblePhotos}
            selectedPhotoIds={isGuestMode ? undefined : new Set(selectedPhotos)}
            onToggleSelect={isGuestMode ? undefined : (p) => handleSelectToggle(p.id)}
            onPhotoClick={(p) => setLightboxPhoto(p as Photo)}
            limitReached={!isGuestMode && selectedPhotos.length >= (participantInfo?.max_selections || 5)}
            onLimitReached={!isGuestMode && extraPurchaseEnabled ? (photoId: number) => toggleExtraInCart(photoId) : undefined}
            extraSelectedPhotoIds={isGuestMode ? undefined : new Set(selectedExtraPhotos)}
            paidExtraPhotoIds={isGuestMode ? undefined : new Set(paidExtraPhotoIds)}
          />
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {visiblePhotos.map(photo => {
              const isSelected = selectedPhotos.includes(photo.id);
              const selectionIdx = isSelected ? selectedPhotos.indexOf(photo.id) + 1 : null;
              const isPickedForDownload = downloadSelection.has(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => {
                    if (downloadMode) {
                      toggleDownloadPick(photo.id);
                    } else {
                      setLightboxPhoto(photo);
                    }
                  }}
                  className={`relative break-inside-avoid mb-4 cursor-pointer rounded-lg overflow-hidden group transition-all ${
                    downloadMode && isPickedForDownload
                      ? 'ring-4 ring-blue-400 shadow-lg shadow-blue-400/30'
                      : isSelected
                        ? 'ring-4 ring-gold-500 shadow-lg shadow-gold-500/20'
                        : 'ring-1 ring-zinc-800 hover:ring-zinc-600'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbnail_url || photo.file_url}
                    alt="Zdjęcie z galerii"
                    loading="lazy"
                    className={`w-full h-auto block transition-transform ${downloadMode ? '' : 'group-hover:scale-[1.02]'}`}
                  />

                  {/* Download-mode overlay: big checkbox */}
                  {downloadMode && (
                    <>
                      <div className={`absolute inset-0 transition-colors ${isPickedForDownload ? 'bg-blue-500/20' : 'bg-black/40 group-hover:bg-black/20'}`} />
                      <div className={`absolute top-3 right-3 w-9 h-9 rounded-md flex items-center justify-center shadow-lg transition-all ${
                        isPickedForDownload
                          ? 'bg-blue-500 text-white scale-110'
                          : 'bg-white/90 text-zinc-700'
                      }`}>
                        {isPickedForDownload ? (
                          <CheckSquare className="w-6 h-6" />
                        ) : (
                          <Square className="w-6 h-6" />
                        )}
                      </div>
                    </>
                  )}

                  {/* Hover overlay - zoom hint (only outside download mode) */}
                  {!downloadMode && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      {selectedPhotos.length >= (participantInfo?.max_selections || 5) && !isSelected && extraPurchaseEnabled ? (
                        <div className="flex flex-col items-center gap-1 text-center">
                          <Lock className="w-6 h-6 text-red-400" />
                          <span className="text-white font-bold text-xs">Limit 5/5</span>
                          <span className="text-emerald-300 text-[10px]">💰 Kup extras</span>
                        </div>
                      ) : (
                        <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
                      )}
                    </div>
                  )}

                  {/* Checkbox "Do druku" — top-left (only for registered parents, not in download mode) */}
                  {!isGuestMode && !downloadMode && (
                  <button
                    type="button"
                    onClick={(e) => handleSelectToggle(photo.id, e)}
                    disabled={selectedPhotos.length >= (participantInfo?.max_selections || 5) && !isSelected}
                    className={`absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all ${
                      isSelected
                        ? 'bg-gold-500 text-black'
                        : selectedPhotos.length >= (participantInfo?.max_selections || 5)
                          ? 'bg-red-600/80 text-white cursor-not-allowed opacity-90'
                          : 'bg-black/75 text-white hover:bg-black/90 opacity-100'
                    }`}
                    title={isSelected ? 'Kliknij, aby odznaczyć' : selectedPhotos.length >= (participantInfo?.max_selections || 5) ? `Limit osiągnięty! Kup dodatkowe odbitki aby wybrać więcej.` : 'Zaznacz do druku'}
                  >
                    {isSelected ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        {selectionIdx}/{participantInfo?.max_selections}
                      </>
                    ) : selectedPhotos.length >= (participantInfo?.max_selections || 5) ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Limit 5/5
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        Do druku
                      </>
                    )}
                  </button>
                  )}

                  {/* Download single button — top-right (na hover), only for registered parents, not in download mode */}
                  {!isGuestMode && !downloadMode && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDownloadSingle(photo.id); }}
                    className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-gold-500 hover:text-black text-white rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                    title="Pobierz to zdjęcie"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  )}

                  {/* Extra purchase button — bottom-right, only if enabled */}
                  {!isGuestMode && !downloadMode && extraPurchaseEnabled && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleExtraInCart(photo.id); }}
                    className={`absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all ${
                      selectedExtraPhotos.includes(photo.id)
                        ? 'bg-emerald-500 text-black'
                        : 'bg-black/75 text-emerald-400 hover:bg-black/90'
                    }`}
                    title={selectedExtraPhotos.includes(photo.id) ? 'Kliknij, aby usunąć z koszyka' : 'Dodaj to zdjęcie do koszyka (rozmiar wybierzesz w koszyku)'}
                  >
                    {selectedExtraPhotos.includes(photo.id) ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        W koszyku
                      </>
                    ) : (
                      <>
                        <Package className="w-3.5 h-3.5" />
                        Dodaj do koszyka
                      </>
                    )}
                  </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPSELL + PROŚBA O OPINIĘ — boost SEO, only for registered parents */}
      {!isGuestMode && photos.length > 0 && (
        <PostGalleryUpsell
          clientName={participantInfo?.parent_name}
          discountCode="KOMUNIA15"
          theme="dark"
        />
      )}

      {/* PRO Sticky Bottom Bar — only for registered parents with selections */}
      {!isGuestMode && photos.length > 0 && (
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
      {/* MODAL POTWIERDZENIA ZAMÓWIENIA — po powrocie z PayU */}
      {showOrderModal && confirmOrder && (
        <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white">Zamówienie #{confirmOrder.id}</h3>
                <div className="mt-2">
                  {confirmOrder.payment_status === 'paid' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                      <Check className="w-3.5 h-3.5" /> Opłacone
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold border border-amber-500/40">
                      <Info className="w-3.5 h-3.5" /> {orderLoading ? 'Sprawdzam status płatności…' : 'Oczekuje na potwierdzenie płatności…'}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              <p className="text-xs text-zinc-400">
                Dziękujemy! Oto podsumowanie Twojego zamówienia dodatkowych odbitek.
                {confirmOrder.payment_status !== 'paid' && ' Potwierdzenie płatności może zająć chwilę — ten ekran zaktualizuje się automatycznie.'}
              </p>
              <div className="space-y-2">
                {confirmOrder.lines.map((line, idx) => (
                  <div key={`order-line-${line.photo_id}-${idx}`} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                    <div className="w-14 h-14 rounded-md overflow-hidden bg-black flex-shrink-0">
                      {line.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.thumbnail_url} alt={`Zamówione zdjęcie ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {line.frame_number != null ? `Kadr ${line.frame_number} — ` : ''}Odbitka {line.print_size_label || ''}
                      </p>
                      <p className="text-xs text-zinc-400">Ilość: {line.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-300 whitespace-nowrap">
                      {line.line_total != null ? `${(line.line_total / 100).toFixed(2)} zł` : ''}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <span className="text-sm text-zinc-300 font-semibold">Razem ({confirmOrder.photo_count} szt.)</span>
                <span className="text-lg font-black text-emerald-300">{(confirmOrder.total_amount / 100).toFixed(2)} zł</span>
              </div>
            </div>
            <div className="p-5 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="w-full px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-black text-sm font-black"
              >
                Wróć do galerii
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

            {/* Bottom action bar — hidden for guests */}
            {!isGuestMode && (
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
            )}

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
