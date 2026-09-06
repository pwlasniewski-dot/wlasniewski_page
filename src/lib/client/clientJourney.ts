export const CLIENT_JOURNEY_STAGE_ORDER = [
    'offer',
    'contract',
    'deposit',
    'preparation',
    'session',
    'gallery',
    'order',
    'completed',
] as const;

export type ClientJourneyStageId = typeof CLIENT_JOURNEY_STAGE_ORDER[number];

export type ClientJourneyStageState = 'completed' | 'current' | 'upcoming';

export type ClientPortalTab =
    | 'overview'
    | 'sessions'
    | 'bookings'
    | 'documents'
    | 'preparation';

export type ClientOfferState =
    | 'missing'
    | 'draft'
    | 'sent'
    | 'pending'
    | 'negotiating'
    | 'unlock_requested'
    | 'accepted'
    | 'rejected';

export type ClientContractState =
    | 'missing'
    | 'pending'
    | 'sent'
    | 'signed'
    | 'rejected';

export type ClientDepositState =
    | 'not_required'
    | 'pending'
    | 'overdue'
    | 'paid';

export type ClientSessionState =
    | 'not_scheduled'
    | 'scheduled'
    | 'completed'
    | 'cancelled';

export type ClientGalleryState =
    | 'not_available'
    | 'available'
    | 'selection_required'
    | 'selection_complete';

export type ClientOrderState =
    | 'none'
    | 'payment_required'
    | 'paid'
    | 'processing'
    | 'ready';

export interface ClientJourneySnapshot {
    offer: ClientOfferState;
    contract: ClientContractState;
    deposit: ClientDepositState;
    preparationAvailable: boolean;
    session: ClientSessionState;
    gallery: ClientGalleryState;
    order: ClientOrderState;
}

export interface ClientJourneyAction {
    id:
        | 'open_offer'
        | 'sign_contract'
        | 'pay_deposit'
        | 'open_preparation'
        | 'view_session'
        | 'open_gallery'
        | 'finish_selection'
        | 'pay_order'
        | 'download_delivery'
        | 'contact_photographer';
    label: string;
    targetTab: ClientPortalTab;
}

export interface ClientJourneyTimelineItem {
    id: ClientJourneyStageId;
    label: string;
    state: ClientJourneyStageState;
}

export interface ClientJourneyResolution {
    currentStage: ClientJourneyStageId;
    eyebrow: string;
    title: string;
    description: string;
    action: ClientJourneyAction | null;
    timeline: ClientJourneyTimelineItem[];
}

const STAGE_LABELS: Record<ClientJourneyStageId, string> = {
    offer: 'Oferta',
    contract: 'Umowa',
    deposit: 'Zaliczka',
    preparation: 'Przygotowanie',
    session: 'Sesja',
    gallery: 'Galeria',
    order: 'Zamówienie',
    completed: 'Gotowe',
};

const OFFER_REQUIRES_ACTION: ClientOfferState[] = [
    'draft',
    'sent',
    'pending',
    'negotiating',
    'unlock_requested',
];

const CONTRACT_REQUIRES_ACTION: ClientContractState[] = ['pending', 'sent'];

function withTimeline(
    currentStage: ClientJourneyStageId,
    details: Omit<ClientJourneyResolution, 'currentStage' | 'timeline'>
): ClientJourneyResolution {
    const currentIndex = CLIENT_JOURNEY_STAGE_ORDER.indexOf(currentStage);

    return {
        currentStage,
        ...details,
        timeline: CLIENT_JOURNEY_STAGE_ORDER.map((id, index) => ({
            id,
            label: STAGE_LABELS[id],
            state: index < currentIndex
                ? 'completed'
                : index === currentIndex
                    ? 'current'
                    : 'upcoming',
        })),
    };
}

export function resolveClientJourney(
    snapshot: ClientJourneySnapshot
): ClientJourneyResolution {
    if (OFFER_REQUIRES_ACTION.includes(snapshot.offer)) {
        return withTimeline('offer', {
            eyebrow: 'Następny krok',
            title: 'Sprawdź swoją ofertę',
            description: 'Przejrzyj zakres, termin i warunki. Po akceptacji przejdziesz do umowy.',
            action: {
                id: 'open_offer',
                label: 'Sprawdź ofertę',
                targetTab: 'documents',
            },
        });
    }

    if (snapshot.offer === 'rejected') {
        return withTimeline('offer', {
            eyebrow: 'Oferta wymaga wyjaśnienia',
            title: 'Ustalmy dalszy zakres',
            description: 'Oferta została odrzucona. Skontaktuj się, aby ustalić nową wersję albo zamknąć temat.',
            action: {
                id: 'contact_photographer',
                label: 'Przejdź do kontaktu',
                targetTab: 'overview',
            },
        });
    }

    if (CONTRACT_REQUIRES_ACTION.includes(snapshot.contract)) {
        return withTimeline('contract', {
            eyebrow: 'Następny krok',
            title: 'Podpisz umowę',
            description: 'Umowa czeka w panelu. Po podpisaniu sprawdzisz płatność i przygotowanie do sesji.',
            action: {
                id: 'sign_contract',
                label: 'Przejdź do umowy',
                targetTab: 'documents',
            },
        });
    }

    if (snapshot.contract === 'rejected') {
        return withTimeline('contract', {
            eyebrow: 'Umowa wymaga wyjaśnienia',
            title: 'Skontaktuj się przed kolejnym krokiem',
            description: 'Umowa została odrzucona. Przed płatnością i rezerwacją potrzebne jest ponowne ustalenie warunków.',
            action: {
                id: 'contact_photographer',
                label: 'Przejdź do kontaktu',
                targetTab: 'overview',
            },
        });
    }

    if (snapshot.deposit === 'pending' || snapshot.deposit === 'overdue') {
        const overdue = snapshot.deposit === 'overdue';
        return withTimeline('deposit', {
            eyebrow: overdue ? 'Płatność po terminie' : 'Następny krok',
            title: overdue ? 'Opłać zaległą zaliczkę' : 'Opłać zaliczkę',
            description: overdue
                ? 'Termin płatności minął. Opłać zaliczkę albo skontaktuj się przed dalszą realizacją.'
                : 'Zaliczka potwierdza termin i uruchamia dalsze przygotowanie do sesji.',
            action: {
                id: 'pay_deposit',
                label: overdue ? 'Opłać teraz' : 'Opłać zaliczkę',
                targetTab: 'bookings',
            },
        });
    }

    if (snapshot.session === 'scheduled' && snapshot.preparationAvailable) {
        return withTimeline('preparation', {
            eyebrow: 'Przed sesją',
            title: 'Przygotuj się spokojnie do sesji',
            description: 'Sprawdź ubrania, kolory, checklistę oraz proste ustawienia. Na sesji nadal prowadzę Cię krok po kroku.',
            action: {
                id: 'open_preparation',
                label: 'Otwórz poradnik',
                targetTab: 'preparation',
            },
        });
    }

    if (snapshot.session === 'scheduled') {
        return withTimeline('session', {
            eyebrow: 'Termin potwierdzony',
            title: 'Sprawdź szczegóły sesji',
            description: 'Zobacz datę, miejsce i najważniejsze informacje organizacyjne.',
            action: {
                id: 'view_session',
                label: 'Zobacz szczegóły',
                targetTab: 'bookings',
            },
        });
    }

    if (snapshot.session === 'completed' && snapshot.gallery === 'not_available') {
        return withTimeline('session', {
            eyebrow: 'Sesja zakończona',
            title: 'Przygotowuję Twoją galerię',
            description: 'Po selekcji i obróbce galeria pojawi się w panelu. Nie musisz wykonywać teraz żadnej czynności.',
            action: null,
        });
    }

    if (snapshot.gallery === 'selection_required') {
        return withTimeline('gallery', {
            eyebrow: 'Galeria jest gotowa',
            title: 'Wybierz swoje zdjęcia',
            description: 'Otwórz galerię, zaznacz ujęcia z pakietu i sprawdź dostępne dodatki.',
            action: {
                id: 'finish_selection',
                label: 'Wybierz zdjęcia',
                targetTab: 'sessions',
            },
        });
    }

    if (snapshot.gallery === 'available') {
        return withTimeline('gallery', {
            eyebrow: 'Galeria jest gotowa',
            title: 'Obejrzyj swoje zdjęcia',
            description: 'Galeria jest dostępna w panelu. Możesz obejrzeć zdjęcia i sprawdzić dalsze opcje.',
            action: {
                id: 'open_gallery',
                label: 'Otwórz galerię',
                targetTab: 'sessions',
            },
        });
    }

    if (snapshot.order === 'payment_required') {
        return withTimeline('order', {
            eyebrow: 'Zamówienie czeka na płatność',
            title: 'Opłać wybrane dodatki',
            description: 'Po zaksięgowaniu płatności rozpocznę realizację dodatkowych zdjęć lub produktów.',
            action: {
                id: 'pay_order',
                label: 'Przejdź do płatności',
                targetTab: 'sessions',
            },
        });
    }

    if (snapshot.order === 'paid' || snapshot.order === 'processing') {
        return withTimeline('order', {
            eyebrow: 'Zamówienie w realizacji',
            title: 'Przygotowuję Twoje zamówienie',
            description: 'Płatność została przyjęta. Gotowe materiały lub informacja o dostawie pojawią się w panelu.',
            action: null,
        });
    }

    if (snapshot.order === 'ready') {
        return withTimeline('completed', {
            eyebrow: 'Realizacja zakończona',
            title: 'Twoje materiały są gotowe',
            description: 'Pobierz zdjęcia i zachowaj dostęp do galerii oraz dokumentów w swoim panelu.',
            action: {
                id: 'download_delivery',
                label: 'Pobierz materiały',
                targetTab: 'sessions',
            },
        });
    }

    if (snapshot.gallery === 'selection_complete') {
        return withTimeline('order', {
            eyebrow: 'Wybór zapisany',
            title: 'Sprawdź status zamówienia',
            description: 'Wybór zdjęć został zapisany. W panelu zobaczysz płatność, realizację i gotowe materiały.',
            action: {
                id: 'open_gallery',
                label: 'Sprawdź zamówienie',
                targetTab: 'sessions',
            },
        });
    }

    if (snapshot.session === 'cancelled') {
        return withTimeline('session', {
            eyebrow: 'Sesja odwołana',
            title: 'Ustalmy nowy termin',
            description: 'Skontaktuj się, aby wybrać nowy termin albo ustalić dalsze rozliczenie.',
            action: {
                id: 'contact_photographer',
                label: 'Przejdź do kontaktu',
                targetTab: 'overview',
            },
        });
    }

    return withTimeline('offer', {
        eyebrow: 'Twoja obsługa',
        title: 'Wkrótce pojawi się kolejny krok',
        description: 'Gdy oferta, termin lub galeria będą gotowe, zobaczysz tutaj jedną najważniejszą czynność.',
        action: null,
    });
}
