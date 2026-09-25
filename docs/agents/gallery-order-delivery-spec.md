# Galeria, zamówienie i dostawa — specyfikacja sprzedażowa

**Data:** 2026-08-02  
**Agent odpowiedzialny:** Agent Sprzedaży i Rozwoju Biznesu  
**Zadanie:** #20  
**Gałąź:** `agent/gallery-order-delivery`

## 1. Decyzja zarządcza

Galeria nie może być wyłącznie miejscem oglądania zdjęć. To ostatni etap doświadczenia klienta i najlepszy moment na sprzedaż dodatkowych ujęć, pełnej galerii, odbitek, albumu oraz kolejnej sesji.

Obecny moduł zawiera wiele wartościowych funkcji, ale administrator zarządza ustawieniami, zdjęciami, produktami, wyborem, pobieraniem i trybami galerii w jednym dużym komponencie. Klient nie powinien znać złożoności technicznej. Powinien widzieć limit, wybór, cenę, status i jedną następną czynność.

## 2. Cel mierzalny

Mierniki:

- odsetek klientów otwierających galerię,
- czas do pierwszego wyboru,
- odsetek galerii z przekroczonym limitem pakietu,
- średnia dopłata za dodatkowe zdjęcia,
- udział galerii z zakupem albumu lub odbitek,
- liczba porzuconych koszyków,
- czas od płatności do dostawy,
- liczba błędów uploadu, ZIP i pobierania,
- liczba ręcznych wiadomości potrzebnych do zamknięcia galerii.

## 3. Proces docelowy

1. **Galeria przygotowywana** — administrator dodaje zdjęcia i ustawia zasady.
2. **Galeria gotowa** — kontrola kompletności i podglądu.
3. **Zaproszenie wysłane** — klient otrzymuje bezpieczny link.
4. **Galeria otwarta** — zapis pierwszego wejścia.
5. **Wybór rozpoczęty** — klient oznacza fotografie.
6. **Wybór gotowy** — liczba i cena są podsumowane.
7. **Koszyk** — zdjęcia dodatkowe i produkty fizyczne.
8. **Płatność** — zamówienie oczekuje, opłacone albo wymaga ponowienia.
9. **Realizacja** — pliki, albumy lub odbitki są przygotowywane.
10. **Dostawa** — pobranie lub przesyłka.
11. **Zakończenie** — potwierdzenie, opinia, voucher lub kolejna sesja.

## 4. Statusy

### 4.1. Galeria

- `DRAFT`,
- `READY`,
- `INVITED`,
- `OPENED`,
- `SELECTING`,
- `SELECTION_COMPLETE`,
- `EXPIRED`,
- `ARCHIVED`.

### 4.2. Zamówienie

- `CART`,
- `PAYMENT_PENDING`,
- `PAID`,
- `PREPARING`,
- `READY_FOR_DELIVERY`,
- `DELIVERED`,
- `CANCELLED`,
- `REFUNDED`,
- `PAYMENT_FAILED`.

W pierwszym etapie należy sprawdzić zgodność z istniejącymi statusami i zastosować mapowanie. Nie wolno dodawać nowych enumów do produkcji bez migracji oraz planu zgodności wstecznej.

## 5. Zasady wyboru zdjęć

Klient zawsze widzi:

- liczbę zdjęć zawartych w pakiecie,
- liczbę aktualnie wybranych,
- liczbę dodatkowych zdjęć,
- cenę jednostkową albo cenę pełnej galerii,
- aktualną wartość dopłaty,
- informację, czy wybór można jeszcze zmienić.

Reguły:

- do limitu pakietu cena dopłaty wynosi 0,
- po przekroczeniu limitu kwota aktualizuje się od razu,
- pełna galeria może pojawić się jako alternatywa, jeżeli jest korzystniejsza lub prostsza,
- finalizacja wyboru wymaga wyraźnego potwierdzenia,
- klient może wrócić i złożyć osobne zamówienie uzupełniające do czasu wygaśnięcia galerii,
- każde zamówienie uzupełniające ma osobną płatność, status i historię,
- nie wolno nadpisywać wcześniej opłaconego zamówienia.

## 6. Oferta dodatkowa

Kolejność rekomendacji:

1. dodatkowe pojedyncze zdjęcia,
2. pełna galeria,
3. odbitki najczęściej wybieranych formatów,
4. album dopasowany do typu sesji,
5. voucher lub kolejna sesja po zakończeniu dostawy.

Zasady:

- bez sztucznych liczników i fałszywego braku dostępności,
- cena, format, liczba stron/odbitek i termin muszą być widoczne przed dodaniem,
- produkt ma zdjęcie, krótki opis i konkretne parametry,
- administrator może przypisać rekomendację do typu sesji lub konkretnej galerii,
- ceny produkcyjne nie są zmieniane przez agenta ani AI bez zgody właściciela.

## 7. Widok klienta

### 7.1. Nagłówek galerii

- nazwa sesji,
- termin ważności,
- postęp wyboru,
- aktualna kwota,
- jedno główne CTA.

### 7.2. Siatka zdjęć

- duże, responsywne miniatury,
- jasny stan wybrane / niewybrane,
- pełny podgląd,
- działanie dotykowe minimum 44 × 44 px,
- brak przypadkowego zaznaczenia podczas przewijania,
- informacja o zdjęciu standardowym i dodatkowym bez mylącego żargonu.

### 7.3. Pasek podsumowania

Na telefonie przyklejony bez zasłaniania zdjęć:

- `Wybrano X z Y`,
- `Dodatkowe: Z`,
- `Do zapłaty: N PLN`,
- CTA zależne od stanu.

### 7.4. Koszyk

- zdjęcia i produkty w osobnych sekcjach,
- ilość sztuk przy odbitkach,
- pełne podsumowanie,
- termin realizacji,
- dane dostawy, jeśli wymagane,
- regulamin i zgody,
- możliwość bezpiecznego powrotu do galerii.

## 8. Kolejka administratora

Widoki:

- galerie nieotwarte,
- wybór rozpoczęty,
- wybór zakończony bez płatności,
- płatność przyjęta,
- pliki do przygotowania,
- albumy i odbitki do zamówienia,
- gotowe do dostawy,
- galerie wygasające w 7 dni,
- błędy wymagające działania.

Karta pokazuje:

- klienta i galerię,
- wartość koszyka,
- etap,
- datę ostatniej aktywności,
- termin,
- rodzaj produktu,
- jedną główną czynność.

## 9. Podział `GalleryAdmin`

Docelowe moduły:

- `GalleryOverview`,
- `GallerySettings`,
- `GalleryPhotoManager`,
- `GallerySelectionRules`,
- `GalleryProducts`,
- `GalleryOrders`,
- `GalleryDelivery`,
- `GalleryParticipants`,
- `GalleryActivityLog`.

Obecne sortowanie, operacje grupowe, podmiana podglądu i pliku źródłowego, tryb indywidualny i grupowy pozostają. Refaktoryzacja musi najpierw otrzymać testy regresji.

## 10. Płatność i idempotencja

Każda próba płatności posiada:

- wewnętrzny identyfikator zamówienia,
- klucz idempotencji,
- kwotę wyliczoną po stronie serwera,
- wersję koszyka,
- historię callbacków,
- stan płatności.

Serwer musi:

- odrzucić cenę przesłaną przez klienta jako źródło prawdy,
- zweryfikować limit pakietu i ceny produktów,
- uznać powtórzony callback za bezpieczne powtórzenie, nie nowe zamówienie,
- nie udostępnić płatnych plików przed potwierdzeniem płatności,
- obsłużyć powrót z przerwanej płatności.

## 11. Upload i dostawa

### 11.1. Upload

- kolejka plików z osobnym statusem,
- ponowienie pojedynczego błędu,
- zachowanie już przesłanych plików,
- walidacja typu, rozmiaru i wymiarów,
- brak wielokrotnego przesłania po ponownym kliknięciu,
- ostrzeżenie przed opuszczeniem strony w trakcie uploadu.

### 11.2. Pobieranie

- podpisane, czasowe adresy,
- osobny plik źródłowy i miniatura,
- paczka ZIP tworzona lub buforowana w sposób zgodny z limitami hostingu,
- możliwość ponowienia po błędzie,
- brak ujawniania plików innego klienta,
- zapis zdarzenia pobrania,
- jasna informacja o czasie ważności linku.

## 12. Automatyzacje

- zaproszenie po oznaczeniu galerii jako gotowej,
- przypomnienie, jeśli klient nie otworzył galerii,
- przypomnienie o niedokończonym wyborze,
- przypomnienie o nieopłaconym koszyku,
- informacja o gotowych plikach lub przesyłce,
- ostrzeżenie przed wygaśnięciem,
- prośba o opinię po dostawie.

Automatyzacje korzystają z mechanizmu i logów z zadania #19. Nie powstaje drugi niezależny scheduler.

## 13. Analityka

Zdarzenia:

- `gallery_invite_sent`,
- `gallery_opened`,
- `photo_selected_first`,
- `included_limit_reached`,
- `extra_photo_selected`,
- `full_gallery_viewed`,
- `product_added`,
- `checkout_started`,
- `payment_completed`,
- `selection_completed`,
- `download_started`,
- `delivery_completed`.

Każde zdarzenie powinno mieć identyfikator galerii, anonimowy identyfikator klienta, typ sesji i wartość — bez przesyłania danych osobowych do narzędzi analitycznych.

## 14. Testy odbiorowe

Obowiązkowe scenariusze:

- pakiet 10 zdjęć i wybór 8, 10, 11 oraz 30,
- zakup pełnej galerii,
- zakup odbitek w kilku ilościach,
- zakup albumu,
- drugie zamówienie uzupełniające,
- dwa identyczne callbacki płatności,
- nieudana i ponowiona płatność,
- zerwany upload jednego z wielu plików,
- ZIP i pojedynczy plik na Safari iOS,
- wygasła galeria i kontrolowane wznowienie,
- galeria 100–300 zdjęć,
- tryb grupowy i indywidualny.

## 15. Rollout

1. mapa statusów i testy regresji,
2. czytelny widok klienta bez zmiany płatności,
3. kolejka administratora,
4. bezpieczny koszyk i idempotencja,
5. produkty dodatkowe,
6. automatyzacje,
7. analityka i optymalizacja.

## 16. Bramka przekazania do Codex

Codex może rozpocząć implementację po zatwierdzeniu:

- procesu 11 etapów,
- zasad limitu i zamówień uzupełniających,
- miejsc sprzedaży dodatkowej,
- słownika statusów,
- wymagań płatności i dostawy,
- podziału `GalleryAdmin`,
- listy testów odbiorowych.

Pierwsza zmiana techniczna nie może jednocześnie modyfikować całego systemu galerii, płatności, S3 i produktów. Każdy etap ma osobny test, rollout i rollback.