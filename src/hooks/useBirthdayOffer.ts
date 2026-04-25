import { useState, useCallback } from 'react';
import { BirthdayOffer, CreateOfferPayload } from '@/types/birthday-offer';

interface UseBirthdayOfferState {
  offers: BirthdayOffer[];
  selectedOffer: BirthdayOffer | null;
  loading: boolean;
  error: string | null;
}

interface UseBirthdayOfferActions {
  createOffer: (data: CreateOfferPayload) => Promise<BirthdayOffer>;
  getOffer: (id: string) => Promise<BirthdayOffer>;
  listOffers: (clientId?: number) => Promise<BirthdayOffer[]>;
  updateOffer: (id: string, data: Partial<CreateOfferPayload>) => Promise<BirthdayOffer>;
  deleteOffer: (id: string) => Promise<void>;
  sendOffer: (id: string, email: string) => Promise<void>;
  selectOffer: (offer: BirthdayOffer | null) => void;
  clearError: () => void;
}

export function useBirthdayOffer(): UseBirthdayOfferState & UseBirthdayOfferActions {
  const [state, setState] = useState<UseBirthdayOfferState>({
    offers: [],
    selectedOffer: null,
    loading: false,
    error: null,
  });

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const createOffer = useCallback(
    async (data: CreateOfferPayload): Promise<BirthdayOffer> => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch('/api/admin/offers/birthday/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Błąd tworzenia oferty');
        }

        const offer = await response.json();
        setState(prev => ({
          ...prev,
          offers: [...prev.offers, offer],
        }));
        return offer;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Błąd tworzenia oferty';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getOffer = useCallback(
    async (id: string): Promise<BirthdayOffer> => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/admin/offers/birthday/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Oferta nie znaleziona');
        }

        const offer = await response.json();
        setState(prev => ({
          ...prev,
          selectedOffer: offer,
        }));
        return offer;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Błąd pobierania oferty';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const listOffers = useCallback(
    async (clientId?: number): Promise<BirthdayOffer[]> => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('admin_token');
        const url = clientId
          ? `/api/admin/offers/birthday/list?clientId=${clientId}`
          : '/api/admin/offers/birthday/list';

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Błąd pobierania listy ofert');
        }

        const offers = await response.json();
        setState(prev => ({
          ...prev,
          offers,
        }));
        return offers;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Błąd pobierania ofert';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateOffer = useCallback(
    async (id: string, data: Partial<CreateOfferPayload>): Promise<BirthdayOffer> => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/admin/offers/birthday/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Błąd aktualizacji oferty');
        }

        const updatedOffer = await response.json();
        setState(prev => ({
          ...prev,
          offers: prev.offers.map(o => (o.id === id ? updatedOffer : o)),
          selectedOffer: prev.selectedOffer?.id === id ? updatedOffer : prev.selectedOffer,
        }));
        return updatedOffer;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Błąd aktualizacji oferty';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteOffer = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/admin/offers/birthday/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Błąd usuwania oferty');
        }

        setState(prev => ({
          ...prev,
          offers: prev.offers.filter(o => o.id !== id),
          selectedOffer: prev.selectedOffer?.id === id ? null : prev.selectedOffer,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Błąd usuwania oferty';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const sendOffer = useCallback(
    async (id: string, email: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/admin/offers/birthday/${id}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          throw new Error('Błąd wysyłania oferty');
        }

        const updatedOffer = await response.json();
        setState(prev => ({
          ...prev,
          offers: prev.offers.map(o => (o.id === id ? updatedOffer : o)),
          selectedOffer: prev.selectedOffer?.id === id ? updatedOffer : prev.selectedOffer,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Błąd wysyłania oferty';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const selectOffer = useCallback((offer: BirthdayOffer | null) => {
    setState(prev => ({
      ...prev,
      selectedOffer: offer,
    }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    ...state,
    createOffer,
    getOffer,
    listOffers,
    updateOffer,
    deleteOffer,
    sendOffer,
    selectOffer,
    clearError,
  };
}
