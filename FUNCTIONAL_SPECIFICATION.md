# System Specyfikacji Funkcjonalnej (v2.1) - wlasniewski.pl

Ten dokument stanowi kompleksowy opis funkcjonalności oraz logiki biznesowej platformy **FOTO-DRON Przemysław Właśniewski**. Dokumentacja została opracowana na podstawie audytu technicznego przeprowadzonego w grudniu 2025 r. Szczegóły techniczne dotyczące infrastruktury i wzorców projektowych znajdują się w dokumencie [ARCHITECTURE.md](file:///c:/Strona-fotografa/ARCHITECTURE.md).

## Aktualizacja 2026-08-21 — lejek i CMS Aero Analiza

- Kanoniczne strony publiczne to `/`, `/termowizja`, `/inspekcja-fotowoltaiki-dronem`, `/inspekcja-dachu-dronem`, `/monitoring` i `/kujawsko-pomorskie`. Pozostałe historyczne adresy są przekierowaniami, nie osobnymi landingami.
- Każda strona ma jedno główne CTA do formularza RFQ, automatycznie wybraną usługę, lokalizację, rodzaj obiektu, termin, cel i preferowany kontakt. Lead jest zapisany w `Inquiry` przed opcjonalnym powiadomieniem e-mail.
- Treści startowe są bezpiecznym fallbackiem. Akcja „Przygotuj strony v2 w CMS” najpierw pokazuje plan; stare rekordy `page_type=b2b` są konwertowane dopiero po potwierdzeniu i pełnym snapshotcie, a istniejące rekordy v2 nie są nadpisywane. Teksty, SEO, media, CTA oraz kolejność sekcji pozostają edytowalne w Pages.
- Strony używają jasnego, niezależnego systemu wizualnego Aero Analiza. Zmiana wyglądu nie przenosi tekstów ani zdjęć do kodu: hero, karty usług, blok zdjęcie/tekst, proces, realizacje, porównania termiczne i RFQ nadal renderują dane zapisane w Pages CMS.
- Para RGB/termowizja ma status zgodności. `registered` pozwala na nakładany suwak, a `side_by_side_only` i `pending` wymuszają uczciwą prezentację obok siebie.
- Serwis nie deklaruje diagnozy automatycznej ani zgodności z AI Act jako odznaki. Niezweryfikowane LUC/UAVO/SLA/„inżynier”, sztuczne statystyki i atrapowe parametry pomiaru nie należą do treści startowej.

## Aktualizacja 2026-08-09 — reguły odbioru galerii i raportów

- Akceptacja oferty jest jednorazowa. Nazwa, cena i rozbicie pakietu powstają z danych zapisanych na serwerze; dane opisowe wysłane przez klienta nie są źródłem umowy.
- Tworząc galerię indywidualną administrator może wskazać zaakceptowaną ofertę. System przenosi liczbę zdjęć i cenę dodatku do wersjonowanego snapshotu, łączy ofertę/umowę z galerią i blokuje zmianę tych warunków.
- Zmiana limitu galerii grupowej aktualizuje istniejących uczestników. Interfejs pokazuje rzeczywisty limit zamiast stałego `5/5`.
- Wpływy od wdrożenia są zapisywane w `PaymentLedger`; raport opisuje starszą historię jako częściową. „Dochód” nie jest wyliczany bez kosztów.
- Stan SEO on-page nie jest pozycją Google. Panel nie generuje zakresów TOP; ranking pojawi się dopiero z realnych danych Search Console.
- Cena zaakceptowanej oferty jest wyliczana na serwerze z zapisanych pozycji, pakietu i dodatków; wartość przesłana przez przeglądarkę nie jest źródłem rozliczenia.
- Indywidualna galeria, zamówienie i każde pobranie korzystają z jednego kontraktu dostępu: właściciel/admin albo krótkotrwała sesja uzyskana po poprawnym haśle galerii.
- Galeria nie może zostać aktywowana ani wysłana klientowi, jeżeli nie ma zdjęć, źródeł JPG pełnej jakości albo liczba zdjęć w pakiecie nie zgadza się z konfiguracją.
- Analytics zapisuje dane dopiero po zgodzie. Prywatne trasy, parametry URL, tokeny, adresy e-mail, tekst klikniętego elementu i pełny href nie należą do kontraktu zdarzenia.
- Raport rozdziela: wartość utworzonych rezerwacji, otrzymane wpłaty brutto, zwroty i wpłaty netto. Przychód księgowy oraz dochód pozostają oznaczone jako brak danych, dopóki system nie ma księgi przychodów i kompletnej ewidencji kosztów.
- Raport podaje osobno średnie zarejestrowane wpływy netto oraz średnią wartość nowych rezerwacji z sześciu pełnych miesięcy; bieżący niepełny miesiąc nie wchodzi do średniej.

## Aktualizacja 2026-08-04 — kadrowanie fotografii strony usługi

- Edytor Hero ma pola „Kadrowanie zdjęcia”, „Kadrowanie na telefonie” oraz „Sposób wypełnienia”. `Cover` wypełnia hero, `Contain` pokazuje całe zdjęcie bez przycinania.
- Blok „Zdjęcie i tekst” otrzymał te same niezależne kadry oraz wybór tła: jasny papier, piaskowy papier albo ciemny atrament. Dzięki temu administrator dobiera widoczny motyw zdjęcia bez ingerencji w plik źródłowy.
- Szablon sesji rodzinnej domyślnie korzysta z jasnego języka redakcyjnego zgodnego ze stroną główną.

## Aktualizacja 2026-08-04 — szablon strony sesji rodzinnej

- W Pages każda zwykła strona B2C ma panel „Szybki start: strona usługi fotograficznej” z szablonem „Sesja rodzinna — Toruń”.
- Szablon jest punktem wyjścia, a nie automatyczną publikacją: zapisuje komplet sekcji dopiero po potwierdzeniu administratora. Zdjęcia, teksty, kolejność bloków i CTA pozostają edytowalne.
- Układ obejmuje hero, opis sposobu pracy, przygotowanie do sesji, galerię, lokalny tekst informacyjny oraz rezerwację. Hero jest oznaczony jako widoczny H1.

## Aktualizacja 2026-08-04 — rozdzielenie marek w wyszukiwarce

- Wlasniewski.pl jest domeną fotografii. Historyczne wejścia `/dron`, `/termowizja`, `/monitoring` oraz `/b2b/*` są przekierowywane trwale na Aeroanaliza.pl.
- Foto-Match i Historia nie są materiałami pozyskującymi ruch fotograficzny; pozostają dostępne operacyjnie, lecz ich metadane i nagłówki HTTP wskazują `noindex, nofollow`.
- W mapie strony Wlasniewski.pl pozostają wyłącznie publiczne strony fotograficzne przeznaczone do indeksowania.

## Aktualizacja 2026-08-03 — wybieralny wygląd Portfolio

- Panel `/admin/portfolio` udostępnia dwa globalne wyglądy strony głównej Portfolio: „Edytorskie rozdziały” i „Kontakt filmowy”. Aktywny wariant jest jednoznacznie oznaczony, a zmiana działa jednym kliknięciem.
- Oba warianty używają tej samej listy opublikowanych sesji, okładek i plików S3. Przełączenie wyglądu nie duplikuje ani nie usuwa zdjęć.
- Sesja publiczna jest dostępna tylko po opublikowaniu i pod własną kategorią. Tytuł oraz opis SEO sesji korzystają z pól `meta_title` i `meta_description`.
- Karty usług strony głównej mają osobne wejście do zdjęć Portfolio oraz zachowany link do pakietów i rezerwacji.

## Aktualizacja 2026-08-03 — artystyczna strona główna

- Teksty produkcyjne pozostają rozdzielone na edytowalne bloki: wstęp i historia w `magazine_layout`, komunia w `narrative_text`, reportaże w `stories_grid`, opinie w osobnym module oraz cytat fotograficzny w `parallax`.
- Dane zapisane przez panel są źródłem nadrzędnym. Kopia awaryjna jest wyświetlana wyłącznie wtedy, gdy CMS/baza nie zwraca żadnej sekcji, dzięki czemu podgląd bez bazy jest kompletny, ale nigdy nie nadpisuje pracy administratora.
- Hero zajmuje cały ekran, zachowuje rotację zdjęć i konfigurację shaderów z panelu oraz ma pełnowartościowy wariant awaryjny bez CMS.
- Kategorie Sesja rodzinna, Ślub i Urodziny są prezentowane jako fotograficzne karty redakcyjne prowadzące do istniejącej rezerwacji i aktualnych cen.
- Dynamiczne moduły administratora nadal renderują treści i media zapisane w CMS, ale na stronie głównej otrzymują spójne tło, typografię, obramowania i rytm pionowy.
- Menu, linki SEO, poradnik, karta podarunkowa, formularz kontaktowy oraz publiczne ścieżki sprzedażowe pozostają funkcjonalnie niezmienione.
- Trzy kafle oferty obsługują niezależny obraz desktopowy i mobilny, tekst oraz punkt kadrowania zapisane w `home_sections.service_cards`.
- Treść Hero z CMS nie jest automatycznie nadpisywana; fallback uzupełnia tylko brakujące pola.
- Każdy kafel usługi ma w panelu obraz desktopowy, obraz mobilny, kadr, tytuł, etykietę, opis, kategorię ceny oraz link docelowy.
- Puste sekcje i pusta lista opinii są respektowane jako świadoma decyzja administratora; treść awaryjna nie pojawia się bez błędu CMS.

## Aktualizacja 2026-08-02 — profesjonalna promocja poradnika na stronie głównej

- Promocja poradnika jest jasnym modułem redakcyjnym, a nie kolejną czarną kartą sprzedażową.
- Dedykowana fotografia pokazuje efekt koordynowania ubrań; nie zawiera tekstu ani plakatu osadzonego w obrazie.
- Moduł znajduje się po treściach dynamicznych i przed kartą podarunkową, dzięki czemu nie konkuruje z pierwszym wyborem usługi.
- Zachowano dotychczasowy tekst, czysty adres `/jak-sie-ubrac`, klikalny obraz i tytuł oraz widoczny fokus klawiatury.
- Strona główna utrzymuje jeden stabilny H1, a tytuły rotujących slajdów używają H2.

## Aktualizacja 2026-08-02 — publikacja poradnika z Pages

- W Pages widoczne są dwie jednoznaczne karty: publiczny poradnik i prywatne przygotowanie klienta.
- Publiczny edytor umożliwia podmianę każdego używanego obrazu z Media oraz edycję ALT, podpisu i opisu widocznego pod zdjęciem.
- Zakładka publikacji obejmuje widoczność strony, widoczność i nazwę w menu, kolejność, tytuł SEO, opis SEO i frazy.
- Publiczny poradnik jest promowany profesjonalnym kaflem na stronie głównej; jego obraz pochodzi z tego samego źródła CMS.
- Prywatne 30 instrukcji nie jest kopiowane do publicznego rekordu ani publicznego API.

## Aktualizacja 2026-08-02 — wizualne inspiracje i odporność publicznych stron

- Poradnik zawiera 10 rozwijanych inspiracji ustawień rodzinnych z obrazem, nagłówkiem i tekstowym opisem dostępnym dla użytkownika oraz wyszukiwarki.
- Pierwszych sześć kart jest widocznych od razu, cztery kolejne rozwija użytkownik, dzięki czemu strona pozostaje czytelna na telefonie.
- Nieważny token konta nie przekierowuje już automatycznie z publicznej strony do logowania.
- Brak menu z CMS, ustawień analityki lub ustawienia hero uruchamia wbudowane wartości domyślne bez widocznej nakładki błędu.

## Aktualizacja 2026-08-01 — odporna i sprzedażowa strona główna

- Pierwszy ekran zawiera indeksowalny H1, opis oraz CTA do aktualnego procesu rezerwacji jeszcze przed hydratacją.
- Przy braku slajdów lub CMS wyświetla się bezpieczny wariant domyślny, bez wymyślania oferty i ceny.
- Hero zajmuje 68svh, dzięki czemu mobilny użytkownik szybciej widzi wybór istniejących kategorii przez duże karty z widocznym fokusem.
- Karty nie utrwalają kwot w komponencie; aktualne ceny użytkownik sprawdza w istniejącym procesie rezerwacji.
- Autoodtwarzanie hero wyłącza się dla użytkowników preferujących ograniczony ruch.

## Aktualizacja 2026-08-01 — publiczny poradnik przygotowania

- `/jak-sie-ubrac` jest publicznym, indeksowalnym poradnikiem pozyskującym ruch na frazy związane z ubiorem i pozowaniem do zdjęć.
- Artykuł zawiera pełną bezpłatną wartość: skrót, siedem rozdziałów, trzy scenariusze, checklistę, FAQ, autora i datę aktualizacji.
- CTA prowadzą do `/rezerwacja`, `/kontakt` i uczciwej zapowiedzi rozszerzonego poradnika.
- `/sklep/poradnik-jak-sie-ubrac-i-pozowac` nie umożliwia zakupu, dopóki nie istnieją gotowy produkt, cena i checkout.
- Edytor prywatnej sekcji klienta pozostaje dostępny pod `/admin/pages/przygotowanie-klienta`; skrót znajduje się w globalnym menu admina.
- Publiczny artykuł nie korzysta z prywatnego API i nie publikuje pełnych danych CMS kategorii `pose`.

## Aktualizacja 2026-08-01 — edytor przygotowania w Pages

- Lista `/admin/pages` zawiera systemową pozycję „Przygotowanie do sesji”.
- Edytor ma pięć czytelnych zakładek: „Jak się ubrać”, „Palety kolorów”, „Checklisty”, „FAQ” i „Pozy”.
- Można zmienić wszystkie teksty, opisy alternatywne obrazów, podpisy palet, kolory oraz obrazy wybrane z Media.
- Przy każdym obrazie dostępna jest operacja „Usuń obraz”.
- Zapis wymaga administratora i odrzuca puste pola, błędne kody kolorów, nieprawidłowe adresy obrazów, niepełny katalog oraz powtórzone identyfikatory.
- Niezalogowany użytkownik nie otrzymuje treści poradnika; klient otrzymuje zapis CMS dopiero po weryfikacji aktywnej sesji.

## Aktualizacja 2026-08-01 — mobilna strefa klienta i język poradnika

- Kafelki nawigacji w `/konto` zawsze pokazują ikonę i pełną nazwę sekcji także na telefonie.
- Każdy kafelek ma duży obszar dotykowy, czytelny kontrast oraz jednoznaczny stan aktywny.
- Karty pozowania zawierają kroki, krótką wskazówkę, „Inny pomysł” i „Możesz też”; usunięto sekcję o napięciu.
- Wszystkie teksty pozowania używają codziennego języka bez technicznego i medycznego żargonu.

## Aktualizacja 2026-07-29 — zapytania sprzedażowe

- Formularze B2C, lokalne i B2B zapisują dane w tabeli `Inquiry`.
- Wymagane są imię, wiadomość oraz telefon albo e-mail.
- Awaria SMTP nie anuluje trwałego zapisu leada.
- Źródło, kampania, typ usługi i kontekst B2B trafiają do analityki.
- Administrator może zmieniać status leada na mobilnej liście zapytań.

---

## Aktualizacja 2026-07-31 — Panel Klienta „Przygotowanie”

- Ekran `/konto` udostępnia osobną zakładkę „Przygotowanie” oraz skrót na głównym widoku klienta.
- Moduł ma dwa obszary: „Jak się ubrać” i „Pozy”.
- Część garderobiana obejmuje zasady, palety kolorów, checklisty, FAQ i 15 ilustrowanych kart, w tym przygotowanie do sesji miejskiej.
- Dane garderobiane z CMS są łączone z kuratorowanymi materiałami: brakujące ilustracje i palety są uzupełniane, a osobna karta miejska obejmuje cegłę, beton, szkło, stal, zieleń i neony.
- Każda paleta pokazuje obraz kompletnej stylizacji, podpis efektu, opis zastosowania oraz czytelne próbki z nazwami i kodami kolorów.
- Zakładki, opisy i próbki zachowują czytelność przy szerokości 320 px oraz powiększeniu 200%.
- Część pozowania obejmuje 30 ilustrowanych ustawień z instrukcją, wariantem, błędem do skorygowania i wersją dostępną.
- Dane są personalizowane kontekstem oferty i miejsca sesji. Dostęp do poradnika pozy wymaga aktywnej sesji klienta oraz prawa do wskazanej oferty.
- Publiczne endpointy poradnika stylu wykluczają prywatną kategorię `pose`.

## 1. Architektura Systemu i Stack Techniczny

System został zaprojektowany jako nowoczesna aplikacja webowa typu Fullstack, kładąca nacisk na szybkość ładowania, SEO oraz interaktywny panel administracyjny.

- **Frontend**: Next.js (App Router) – zapewnia rendering po stronie serwera (SSR) i optymalizację obrazów.
- **Stylizacja**: Tailwind CSS – system utility-first zapewniający spójność wizualną.
- **Baza Danych**: PostgreSQL (Neon.tech) obsługiwana przez Prisma ORM.
- **Autentykacja**: System oparty na JWT (JSON Web Tokens) z tokenami przechowywanymi w `localStorage`.
- **Architektura Domenowa**: Twin-Engine (Multi-Domain Monorepo) – obsługa B2B i B2C z jednej instancji (separacja przez Middleware).
- **Integracje**: Przelewy24, PayU, AWS S3 (Media), Google Analytics, Meta Pixel.

---

## 2. Zarządzanie Treścią (CMS)

### 2.1. Page Builder System (Globalny Edytor Treści)
Najbardziej złożony moduł panelu, pozwalający na dynamiczne budowanie dowolnej podstrony (nie tylko Home).
- **Zasięg**: `strona-glowna`, `o-mnie`, `rezerwacja`, `karta-podarunkowa` oraz strony dynamiczne CMS.
- **Integracja**: Komponent `PageRenderer` dynamicznie renderuje sekcje w zależności od sluga strony.

- **Thermal Hero Slider**: Premium moduł termowizyjny z obsługą wideo/obrazu, tekstów i dedykowaną nawigacją.
    - **Nawigacja "Filmstrip"**: Interaktywne miniatury slajdów na dole ekranu dla łatwego przełączania.
    - **CTA Buttons**: Konfigurowalne przyciski (tekst, link, styl: Gold/White/Transparent) dla każdego slajdu.
    - **Interwał**: Możliwość ustawienia czasu autoprzewijania (sekundy) w panelu admina.
    - **Efekty**: Pulsujące ramki strzałek nawigacyjnych dla lepszego UX.
- **Hero Video Slider**: Pełnoekranowy slider wideo z tekstami i przyciskami.
- **Parallax Video**: Efekt paralaksy wideo reagujący na scrollowanie.
- **Logo Transition**: Dynamiczne przełączanie logotypu w zależności od kontekstu (B2C/B2B).
- **Before/After Image Slider**: Interaktywny moduł porównawczy (suwak) dla prezentacji efektów "Przed i Po" (np. postępy budowy).
    - **Obsługa**: Drag & Drop handle, fallback dla urządzeń dotykowych.
    - **Konfiguracja**: Checkbox "Tryb Przed i Po" w Page Builderze + dedykowany wybór drugiego zdjęcia.

#### B. Dynamiczne Sekcje
Strona składa się z modułów, które można dowolnie sortować (Drag & Drop), włączać/wyłączać oraz usuwać.
- **About Editor**: Sekcja wizerunkowa. Możliwość wyboru kształtu zdjęcia (Rounded, Circle, Squircle), pozycji (Lewa/Prawa) oraz bogaty opis.
- **Features Editor**: Lista atutów w formie kafli z ikonami, dynamicznymi przyciskami (CTA), opcją wyboru układu (Grid/Centered) oraz rozmiaru.
- **Parallax Editor**: Sekcja z efektem paralaksy. 
    - Parametry: Szybkość przewijania, kontrola wysokości, kolor tekstu, opasłość nakładki.
    - Dodatek: "Floating Image" – obraz lewitujący nad tłem paralaksy.
    - **Optymalizacja**: Zastosowano bezpośrednie mapowanie scrolla (bez sprężynowania) dla wyeliminowania drgań (stuttering).
- **Info Band Editor**: Bloki informacyjne (np. "Dlaczego fotografia dronowa?"). Wsparcie dla różnych układów graficznych oraz **konfigurowalne linki** ("Szczegóły operacyjne"), które wyświetlają się tylko po podaniu adresu URL.
- **Testimonials**: Integracja z modułem opinii klientów.
- **Mini Gallery**: Zaawansowany moduł galerii "Pro" z obsługą gridu (2-6 kolumn), lightboxa i formatowania tekstu (RTF). Pozwala na precyzyjne sterowanie wyglądem (zaokrąglenia, tło) i układem treści (różne warianty położenia opisów).

#### C. Challenge Banner (Visual Content Engine)
Moduł odpowiedzialny za marketing wizualny, obsługujący dwa tryby:
- **Simple Mode**: Galerie typu Carousel, Masonry, Puzzle, Orbiting 3D.
- **Advanced Mode**: Zaawansowany slider zintegrowany z wyzwaniami fotograficznymi, obsługujący animowane przejścia i precyzyjne pozycjonowanie treści.

### 2.10. Chronological Gallery (Timeline)
- **Cel:** Prezentacja zdjęć w układzie narracyjnym (Chronologicznym).
- **Funkcje:**
  - Sortowanie zdjęć (A-Z).
  - Układ Grid (Siatka) lub List (Lista).
  - Lightbox z nawigacją.
  - **Refinement:** Subtelna typografia (Italic Serif), jasne tło.
- **Zarządzanie:** Page Builder (Dodawanie itemów, wybór układu).

### 2.11. Floating Navigation Button (Nawigacja Pływająca) [NEW: 2026-01-19]
- **Cel:** Zapewnienie szybkiego dostępu do kluczowych akcji (np. Powrót do Home, Kontakt) niezależnie od przewinięcia strony.
- **Funkcje:**
    - **Sticky Position**: Przycisk "przyklejony" do krawędzi ekranu (Fixed).
    - **Konfiguracja**:
        - Tekst przycisku (np. "Wróć").
        - Link docelowy.
        - Pozycja (Lewy/Prawy Dół, Lewa/Prawa Góra).
        - Ikona (Wybór z zestawu lucide-react).
    - **Responsywność**: Dostosowany wygląd na mobile i desktop.
    - **Zarządzanie**: Dedykowana sekcja `floating_button` w Page Builderze.

### 2.2. Moduł Stories (Wasze Historie) [NEW: 2026-01-18]
Nowy moduł służący do budowania narracji i prezentowania reportaży w sposób wizualnie angażujący.
- **Stories Grid**: Siatka kafelkowa prezentująca okładki historii.
    - **UI**: Jasny motyw (Light Theme), cienie, hover effects.
    - **Funkcje**: Tytuł, podtytuł (kategoria), zdjęcie, link.

---

## 3. Moduł Biznesowy: Rezerwacje i Sprzedaż

### 3.1. System Rezerwacji (Bookings)
Zarządza pełnym cyklem życia zamówienia usługi fotograficznej.

#### Logika Statusów:
1. **Pending (Oczekująca)**: Nowe zgłoszenie od klienta. System blokuje wstępnie termin (jeśli wybrano).
2. **Confirmed (Potwierdzona)**: Administrator zatwierdził sesję (np. po wpłacie zadatku). Wysyłane jest automatyczne powiadomienie.
3. **Completed (Ukończona)**: Sesja się odbyła, zdjęcia są w obróbce lub zostały oddane.
4. **Cancelled (Anulowana)**: Usunięcie rezerwacji z kalendarza, zwolnienie terminu.

#### Dane Rezerwacji:
- **Usługa**: Sesja, Ślub, Dron, Przyjęcie, Urodziny.
- **Pakiet**: Wybrany wariant cenowy (liczba zdjęć, czas trwania).
- **Lokalizacja**: Miasto, miejsce sesji, notatki dojazdu.
- **Finanse**: Cena bazowa, zastosowane kody rabatowe, użyte karty podarunkowe.
- **Challenge ID**: Powiązanie z wiralowym wyzwaniem (jeśli dotyczy).

### 3.2. Moduł B2B i Oferta Dronowa (Twin-Engine)
System pozwala na obsługę klientów biznesowych (B2B) w ramach tej samej instancji aplikacji, stosując architekturę **Twin-Engine**.

- **Kontekstowy Routing**: Automatyczne wykrywanie domen/ścieżek biznesowych (np. `wlasniewski.pl/b2b`).
- **Strict B2B Separation**: Treści biznesowe są dostępne wyłącznie pod prefiksem `/b2b` (lub stosowną subdomeną). System blokuje wyświetlanie treści konsumenckich na ścieżkach biznesowych.
- **Dynamiczne Menu B2B**: Osobna struktura nawigacji zarządzana w panelu admina (tab "B2B"), która aktywuje się automatycznie po wykryciu kontekstu biznesowego.
- **Formularz RFQ (Request for Quote)**: Dedykowany moduł kontaktu B2B (`B2BContactForm.tsx`) zbierający dane firmowe i szczegóły zlecenia, zintegrowany z systemem powiadomień.
- **Branding B2B**: Automatyczne przełączanie na "Premium Dark Mode" oraz priorytetyzacja logotypu o oznaczeniu "B2B / Alternatywne".

### 3.3. Moduł Kliencki (CRM) & Compliance [UPDATED: 2026-02-18]
System został rozbudowany o dedykowany moduł zarządzania relacjami z klientem, zastępujący prostą listę użytkowników.

- **Client 360 View**: Dashboard prezentujący pełny profil klienta w jednym modalnym oknie:
    - **Finanse**: LTV (Lifetime Value), historia zakupów (karty podarunkowe), statusy płatności.
    - **Operacje**: Historia rezerwacji, statusy sesji, notatki.
    - **Aktywa**: Przypisane galerie zdjęć i koszyki zakupowe.
- **GDPR Safe Anonymization**: Protokół bezpiecznego usuwania danych osobowych zgodnie z RODO.
    - Zamiast kasować rekordy (co niszczy integralność finansową), system dokonuje **anonimizacji**.
    - Dane wrażliwe (Imię, Email, Telefon) są nadpisywane pseudonimami (np. `deleted-uuid@deleted.local`).
    - Historia transakcji i statystyki pozostają nienaruszone dla celów księgowych.
    - Konto użytkownika zostaje trwale dezaktywowane.
- **Separacja Uprawnień**: Wyraźny podział w nawigacji admina na "Klienci (CRM)" (biznes) i "Administratorzy" (zespół).

### 3.4. Generator Ofert i Portal Klienta (v3.0) [IMPLEMENTED: 2026-02-19]
System wprowadzony w v3.0 zapewnia kompleksowy przepływ pracy nad ofertą i umową:
- **Offer Generator**: Narzędzie dla fotografa do tworzenia spersonalizowanych ofert B2B/B2C.
- **Standalone Contracts**: Możliwość generowania umów niezależnych od ofert (`offer_id` is Optional). Pozwala to na obsługę klientów, którzy nie przechodzą przez standardowy proces ofertowania.
- **Server-Side Placeholder System**: Nowatorski system automatycznego wstrzykiwania danych. Tagi takie jak `{{contractNumber}}`, `{{clientName}}`, `{{currentDate}}`, `{{clientEmail}}` są zamieniane na realne dane z bazy przy zapisie (`POST /api/admin/contracts`) oraz przy pobieraniu dokumentu przez klienta.
- **Mandatory Keyboard Signature**: Wbudowany system wymuszający czytelny podpis administratora (wykonawcy) przed zapisaniem dokumentu. Podpis jest renderowany na PDF w eleganckim stylu kursywnym.
- **Client Portal**: Dedykowana strefa (`/konto`), gdzie klient po zalogowaniu może:
    - Przeglądać aktywne oferty i umowy.
    - Monitorować status sesji i galerii (Hero Status Boxes z zabezpieczeniem przed crashami przy braku dokumentów).
    - Akceptować oferty i podpisywać umowy cyfrowo.
- **Conditional Email Logic**: Automatyczne powiadomienia e-mail dostosowują treść do stanu dokumentu (np. brak wzmianki o załączniku PDF, jeśli plik nie został wygenerowany).
- **Vercel PDF Optimization**: Przekierowywanie żądań PDF bezpośrednio do S3, eliminując problemy z generowaniem plików w środowisku serverless.

---

## 4. E-commerce i Promocje

### 4.1. Karty Podarunkowe (Gift Cards)
Pełny system sprzedaży voucherów z personalizacją wizualną.

- **Motywy Sezonowe**: 
    `Christmas`, `Valentine's`, `Easter`, `Mother's Day`, `Wedding`, `Birthday`.
- **Dystrybucja**:
    - **E-mail**: Integracja z SMTP, wysyłka PDF bezpośrednio do odbiorcy.
    - **Druk**: System generujący sformatowany widok do druku fizycznego vouchera.
    - **Social**: Generowanie gotowych tekstów do udostępnienia na Instagram/Facebook/WhatsApp.
- **Zniżki Globalne**: Możliwość narzucenia zniżki (np. -20%) na wszystkie kupowane karty bezpośrednio z panelu.

### 4.2. Kody Rabatowe (Promo Codes)
- Typy: Procentowe (%) lub Kwotowe (PLN).
- Ograniczenia: Data ważności (Od-Do), limit użyć (Max Usage), status aktywności.

---

## 5. Moduł Wiralowy: Foto Wyzwania (Challenges)

Unikatowy system budowania zasięgu poprzez mechanizm zaproszeń.

- **Flow**: Klient otrzymuje/kupuje pakiet wyzwania -> Wysyła zaproszenie (podając e-mail swój i zapraszanego - oba pola są obowiązkowe) -> Akceptuje Regulamin, RODO i Politykę Prywatności -> Proponuje termin sesji za pomocą `BookingCalendar` -> System tworzy tymczasową rezerwację `challenge_pending` -> Zaproszony otrzymuje unikalny link (wysyłany dopiero po opłaceniu wyzwania) -> Zaproszony wchodzi na stronę i może:
    1. Zaakceptować zaproponowany termin (status zmienia się na `accepted`, rezerwacja na `confirmed`).
    2. Wybrać inny termin (Counter-Proposal) -> system aktualizuje rezerwację i informuje zapraszającego.
- **HQ & Dystans**: System posiada zdefiniowaną centralę (HQ) za pomocą współrzędnych geograficznych (Lat/Lng). Wyzwania mają konfigurowalny promień działania (domyślnie 60km). Jeśli klient wybierze "Własną lokalizację", system przelicza odległość (Haversine Formula) i blokuje możliwość przejścia dalej, jeśli dystans przekracza limit.
- **Statusy Wyzwania**: `sent`, `viewed`, `accepted`, `scheduled`, `completed`, `expired`, `rejected`.
- **Statusy Rezerwacji (Integracja)**: 
    - `challenge_pending`: Blokuje termin w kalendarzu, widoczne podczas negocjacji.
    - `confirmed`: Wyzwanie zaakceptowane, termin ostatecznie zajęty.
    - `cancelled`: Wyzwanie odrzucone, termin zwolniony.
- **Mechanizmy FOMO**: Liczniki czasu na zaakceptowanie wyzwania, limity miesięczne.

---

## 6. Zarządzanie Mediami i Portfolio

### 6.1. Portfolio Publiczne
- Sesje grupowane w kategorie (Rodzinne, Ślubne itp.).
- Funkcja **Category Hero**: Wybrane zdjęcie, które najlepiej reprezentuje daną kategorię w widoku głównym.
- Sortowanie sesji po dacie i znaczeniu.

### 6.2. Prywatne Galerie Klientów
- Zabezpieczone unikalnym kodem dostępu.
- Podział na zdjęcia "Standardowe" (w cenie pakietu) oraz "Premium" (płatne dodatkowo).
- System rozliczeń: Automatyczne przeliczanie przychodu z dodatkowych ujęć na podstawie `price_per_premium`.
- Daty wygasania galerii z automatyczną blokadą dostępu.

### 6.3. Zarządzanie Dokumentami PDF (Raporty Techniczne)
System obsługuje pełny cykl życia raportów technicznych dla segmentu B2B:
- **Upload**: Wsparcie dla plików `application/pdf` w `MediaPicker`.
- **Bypass Compression**: Pliki PDF nie są kompresowane, co gwarantuje 100% czytelności wykresów i danych.
- **Web Preview**: Raporty otwierają się w nowej karcie przeglądarki (podgląd PDF) zamiast wymuszania pobrania, co jest standardem w profesjonalnych analizach.
- **Admin Feedback**: Natychmiastowy status wybrania pliku PDF w edytorze `thermal_report`.

---

## 7. System i Administracja

### 7.1. Globalne Ustawienia (Settings Hub)
Centrum zarządzania tożsamością i infrastrukturą:
- **Payments**: Konfiguracja Merchant ID, API Keys dla P24 i PayU. Tryb testowy (Sandbox) vs Produkcja.
- **SMTP**: Pełne dane serwera pocztowego do wysyłki powiadomień i voucherów.
- **Identity**: Zarządzanie Faviconą, Logotypami (Light/Dark mode) i Typografią nawigacji.
- **Analytics**: Integracja z zewnętrznymi skryptami śledzącymi (Google Analytics, GTM, FB Pixel). System obsługuje **Instant Synchronization** – każda zmiana ID w panelu wymusza natychmiastową aktualizację kodu na stronie publicznej poprzez unieważnienie pamięci podręcznej (ISR Cache Revalidation).
- **Zero Loss Backup**: System wykonywania pełnych kopii zapasowych bazy danych (`scripts/backup-full.ts`) oraz ich przywracania (`scripts/restore-full.ts`) w formacie JSON, niezależny od dostawcy chmury.

### 7.2. Bezpieczeństwo i Diagnostyka
- **System Logs**: Rejestracja zdarzeń systemowych (INFO, WARN, ERROR) z podziałem na moduły.
- **Error Notebook**: Specjalistyczny dziennik błędów technicznych, umożliwiający szybką diagnozę problemów bazodanowych oraz przechowywanie instrukcji naprawczych (SQL).
- **SEO Manager**: Edycja Meta-tytułów, opisów oraz tagów OpenGraph dla każdej podstrony serwisu.

### 7.3. Nawigacja (Menu & Footer Builder)
- **Menu Builder**: System Drag & Drop do zarządzania strukturą nawigacyjną. Wsparcie dla stron CMS, linków systemowych oraz linków zewnętrznych.
- **Footer Builder**: Podział na sekcje (Oferta, Lokalnie, Inne) z pełną kontrolą nad treścią i linkami.

---

## 8. Logika Biznesowa (Business Rules)

- **Zasada "Zero Flower"**: System nigdy nie wyświetla pustych sekcji. Jeśli dane nie są skonfigurowane, system korzysta z fallbacków (domyślnych obrazów/tekstów) lub całkowicie ukrywa sekcję, aby zachować premium wygląd strony.
- **Dynamiczne Ceny**: Ceny rezerwacji are przeliczane w locie uwzględniając: bazę pakietu + dodatki + kody rabatowe - wartość karty podarunkowej.
- **Seasonal UI**: System pozwala na błyskawiczne włączenie efektów (np. spadający śnieg na Boże Narodzenie) bez zmian w CSS i HTML.
- **SEO Automation**: Slugi (adresy URL) are automatycznie generowane z tytułów stron/postów z zachowaniem unikalności.

---

---

## 9. Dokumentacja API (Szczegółowa)

W tej sekcji opisano szczegółową strukturę endpointów, wymagane nagłówki oraz przykładowe dane wejściowe i wyjściowe.

### 9.1. Nagłówki Wspólne
Wszystkie endpointy administracyjne wymagają nagłówka autoryzacyjnego:
- `Authorization: Bearer [admin_token]`
- `Content-Type: application/json`

---

### 9.2. Moduł Ustawień (`/api/settings`)

#### GET
Pobiera aktualną konfigurację.
- **Odpowiedź (200 OK)**:
```json
{
  "success": true,
  "settings": {
    "logo_url": "https://...",
    "p24_merchant_id": "12345",
    "navbar_sticky": "true",
    "portfolio_categories": "[\"Ślub\", \"Sesja\"]"
  }
}
```

#### POST
Aktualizuje wybrane pola ustawień.
- **Body**:
```json
{
  "logo_url": "https://nowy-link.pl/logo.png",
  "urgency_slots_remaining": 3
}
```

---

### 9.3. Moduł Rezerwacji (`/api/bookings`)

#### POST (Publiczny - Nowa Rezerwacja)
- **Body**:
```json
{
  "service": "Sesja Fotograficzna",
  "package": "Premium",
  "client_name": "Jan Kowalski",
  "email": "jan@przyklad.pl",
  "phone": "123456789",
  "date": "2025-01-20",
  "notes": "Prośba o sesję w plenerze."
}
```
Last Updated: 2026-01-18

#### PATCH (Admin - Zmiana Statusu)
- **Body**:
```json
{
  "id": 105,
  "status": "confirmed"
}
```

---

### 9.4. Moduł Kart Podarunkowych (`/api/gift-cards`)

#### POST (Tworzenie karty)
- **Body**:
```json
{
  "code": "GIFT-2025-UX",
  "value": 500,
  "theme": "wedding",
  "recipient_name": "Anna Nowak",
  "recipient_email": "anna@test.pl",
  "sender_name": "Marek",
  "message": "Wszystkiego najlepszego!"
}
```

#### GET (Lista kart)
- **Odpowiedź**: Zwraca tablicę obiektów `GiftCard`.

---

### 9.5. Moduł Wyzwań (`/api/photo-challenge`)

#### POST (`/create`)
Inicjuje proces wyzwania.
- **Body**:
```json
{
  "inviter_name": "Przemysław",
  "invitee_name": "Marek",
  "package_id": 1,
  "acceptance_deadline": "2025-12-31"
}
```

---

### 9.6. Moduł Media (`/api/media`)

#### GET
Pobiera listę plików z biblioteki mediów.
- **Odpowiedź**: Tablica obiektów zawierających `id`, `url`, `file_name`, `created_at`.

#### POST (Upload)
Wymaga `FormData` z polem `file`.

---

## 10. Architektura Danych i Relacje

System wykorzystuje Prisma ORM do definiowania schematu, co zapewnia typowanie statyczne na poziomie backendu.

### 10.1. Schemat Bazy Danych (Prisma)

#### Moduł Portfolio
```prisma
model PortfolioSession {
  id               Int      @id @default(autoincrement())
  title            String
  category         String
  session_date     DateTime @default(now())
  is_published     Boolean  @default(false)
  is_category_hero Boolean? @default(false)
  media_ids        String?  // JSON array of strings
}
```

#### Moduł Kart Podarunkowych
```prisma
model GiftCard {
  id              Int      @id @default(autoincrement())
  code            String   @unique
  value           Float
  theme           String
  recipient_name  String?
  recipient_email String?
  sender_name     String?
  message         Text?
  status          String   @default("active")
  created_at      DateTime @default(now())
}
```

#### Moduł SEO
```prisma
model SeoData {
  id              Int      @id @default(autoincrement())
  page_path       String   @unique
  title           String?
  description     String?
  og_image        String?
  keywords        String?
}
```

---

## 10. Przewodnik Integracji Multimediów

### 10.1. Centralny MediaPicker
System korzysta z autorskiego komponentu `MediaPicker`, który:
1. Nawiązuje połączenie z API mediów.
2. Obsługuje przesyłanie plików z walidacją formatów (JPG, PNG, WEBP, MP4).
3. Pozwala na tagowanie i filtrowanie zasobów (zastosowano **memoizację filtrowania** dla maksymalnej płynności).
4. **Architektura Centralna**: W panelu `PageBuilder` wykorzystywana jest jedna, globalna instancja komponentu. Eliminuje to opóźnienia w edycji (input lag) i optymalizuje zużycie pamięci przeglądarki.

### 10.2. Obsługa Wideo i S3 Compliance
- **S3 CORS**: Dla poprawnego ładowania i przesyłania mediów wymagana jest konfiguracja S3 Bucket CORS (AllowedOrigins: *, AllowedMethods: GET, PUT, POST, DELETE, HEAD).
- **Formaty Video**: .mp4, .webm (z kodekiem H.264/H.265).
- **Parametry**: `muted`, `loop`, `playsInline`.
- **Fallback**: System wymaga miniatury obrazu wyświetlanej przed załadowaniem wideo.

---

## 11. Bezpieczeństwo i Uprawnienia

### 11.1. Middleware Administracyjne
Dostęp do ścieżek `/admin/*` jest chroniony na poziomie Next.js Middleware:
- Sprawdzany jest nagłówek `Authorization`.
- Tokeny wygasają po ustalonym czasie (domyślnie 24h).
- Nieautoryzowane próby są logowane w module `Logs`.

---

## 12. Dokumentacja Rozwojowa (Wskazówki dla Deweloperów)

1. **Dodawanie nowych efektów w HeroSlider**:
    - Należy dodać nazwę animacji do tablicy `ANIMATION_OPTIONS` w `src/app/admin/pages/strona-glowna/page.tsx`.
    - Zaimplementować logikę CSS/Framer Motion w `src/components/HeroSlider.tsx`.
2. **Nowe typy galerii**:
    - Edytować model `ChallengeBanner` w bazie danych i dodać odpowiedni renderer w komponencie frontendowym.
3. **Modyfikacja layoutu stopki**:
    - Edycja modelu `FooterSettings` w `/admin/footer/page.tsx` oraz synchronizacja z głównym komponentem `Footer.tsx`.

---

## 13. Słownik Danych (Data Dictionary)

Poniższa tabela zawiera szczegółowy opis kluczy konfiguracyjnych używanych w systemie (tabela `settings`).

| Klucz | Typ | Opis |
| :--- | :--- | :--- |
| `p24_merchant_id` | String | ID sprzedawcy w systemie Przelewy24. |
| `p24_pos_id` | String | ID punktu sprzedaży dla P24. |
| `p24_crc_key` | String | Klucz CRC do weryfikacji sum kontrolnych transakcji. |
| `p24_api_key` | String | Klucz API do komunikacji z REST API P24. |
| `p24_test_mode` | Boolean | Czy używać środowiska sandbox P24. |
| `p24_method_blik` | Boolean | Aktywacja płatności BLIK. |
| `p24_method_card` | Boolean | Aktywacja płatności kartą. |
| `p24_method_transfer`| Boolean | Aktywacja szybkich przelewów online. |
| `payu_client_id` | String | Client ID z panelu integracyjnego PayU. |
| `payu_client_secret` | String | Tajny klucz klienta PayU. |
| `payu_pos_id` | String | POS ID dla konfiguracji PayU. |
| `payu_md5_key` | String | Klucz MD5 do podpisywania zapytań PayU. |
| `payu_test_mode` | Boolean | Czy używać środowiska sandbox PayU. |
| `google_analytics_id` | String | Kod śledzenia GA4 (np. G-XXXXXXXX). |
| `google_tag_manager_id` | String | Kod kontenera GTM. |
| `facebook_pixel_id` | String | ID Pixela do śledzenia konwersji FB. |
| `meta_verification_google` | String | Tagi weryfikacyjne dla Google Search Console. |
| `meta_verification_facebook` | String | Tagi weryfikacyjne dla Meta Business Suite. |
| `smtp_host` | String | Adres serwera poczty wychodzącej. |
| `smtp_port` | String | Port SMTP (np. 465 dla SSL, 587 dla TLS). |
| `smtp_user` | String | Nazwa użytkownika konta e-mail. |
| `smtp_password` | String | Hasło do konta e-mail (szyfrowane w DB). |
| `smtp_from` | String | Adres e-mail nadawcy (pole "Od"). |
| `logo_url` | String | Główny logotyp (wersja jasna). |
| `logo_dark_url` | String | Logotyp dla motywu ciemnego. |
| `logo_size` | Number | Wysokość logotypu w pikselach (zakres 40-300). |
| `favicon_url` | String | URL do pliku ikonki witryny. |
| `navbar_layout` | String | Układ menu: `logo_left_menu_right`, `logo_center_menu_split`, `logo_right_menu_left`, `logo_center_menu_bottom`. |
| `navbar_sticky` | Boolean | Czy nawigacja ma podążać za przewijaniem. |
| `navbar_transparent` | Boolean | Przezroczyste tło menu na stronie głównej. |
| `navbar_font_family` | String | Rodzina czcionek nawigacji (Montserrat, Playfair Display, Lato, Great Vibes, Cinzel). |
| `navbar_font_size` | Number | Rozmiar tekstu w menu (domyślnie 16px). |
| `seasonal_effect` | String | Aktywny efekt (`none`, `snow`, `lights`, `hearts`, `halloween`, `easter`). |
| `gift_card_promo_enabled` | Boolean | Widoczność paska promocyjnego kart podarunkowych. |
| `gift_card_promo_title` | String | Nagłówek paska promocyjnego. |
| `gift_card_promo_description` | String | Opis wyświetlany w module promocyjnym kart. |
| `gift_card_promo_rotation_interval` | Number | Czas rotacji elementów promocyjnych (w sekundach). |
| `gift_card_hero_image` | String | Grafika promocyjna w tle modułu kart. |
| `portfolio_categories` | JSON | Lista kategorii dostępnych w portfolio (serializowana do JSON). |
| `portfolio_layout` | String | Styl galerii: `slider` (pełny ekran) lub `column` (scroll). |
| `urgency_enabled` | Boolean | Czy wyświetlać licznik wolnych miejsc. |
| `urgency_slots_remaining` | Int | Liczba wolnych miejsc wyświetlana w liczniku. |
| `urgency_month` | String | Miesiąc, którego dotyczy licznik wolnych miejsc. |
| `social_proof_enabled` | Boolean | Czy pasek społeczny jest aktywny. |
| `social_proof_total_clients` | Int | Całkowita liczba sesji do wyliczeń statystycznych. |
| `promo_code_discount_enabled` | Boolean | Czy globalny kod rabatowy jest aktywny. |
| `promo_code_discount_amount` | Number | Wartość globalnego rabatu. |
| `promo_code_discount_type` | String | Typ rabatu: `percentage` (%) lub `fixed` (PLN). |
| `booking_require_payment` | Boolean | Czy płatność jest wymagana do utworzenia rezerwacji. |
| `booking_min_days_ahead` | Number | Minimalne wyprzedzenie sesji w dniach. |

### 13.1. Ustawienia Wyzwań (Challenge Settings)

| Klucz | Typ | Opis |
| :--- | :--- | :--- |
| `module_enabled` | Boolean | Czy moduł wyzwań jest aktywny publicznie. |
| `public_gallery_enabled` | Boolean | Czy galeria par wyzwań jest dostępna. |
| `landing_headline` | String | Nagłówek na stronie lądowania wyzwań. |
| `landing_subtitle` | String | Podtytuł na stronie lądowania wyzwań. |
| `cta_button_text` | String | Tekst przycisku akcji na stronie lądowania. |
| `enable_carousels` | Boolean | Czy używać efektu 3D Orbiting w wyzwaniach. |
| `enable_parallax` | Boolean | Czy używać efektu paralaksy w sekcjach wyzwań. |
| `fomo_countdown_hours` | Number | Czas na akceptację wyzwania przed wygaśnięciem linku. |
| `monthly_challenge_limit` | Number | Maksymalna liczba wyzwań generowanych w miesiącu. |
| `hq_latitude` | Float | Szerokość geograficzna centrali (HQ). |
| `hq_longitude` | Float | Długość geograficzna centrali (HQ). |
| `max_radius_km` | Number | Maksymalny promień od HQ w kilometrach (walidacja lokalizacji). |

---

## 14. Moduł Diagnostyczny: Error Notebook

System posiada dedykowany moduł do monitorowania błędów, który pozwala na szybką reakcję deweloperską.

### 14.1. Definicje Priorytetów (Severity)
1. **CRITICAL**: Błędy uniemożliwiające działanie krytycznych funkcji (płatności, rezerwacje). Wymagana natychmiastowa interwencja.
2. **HIGH**: Błędy funkcjonalne na ważnych stronach (portfolio, formularz kontaktu).
3. **MEDIUM**: Drobne błędy UI, błędy w mniej uczęszczanych sekcjach admina.
4. **LOW**: Sugestie zmian, błędy typograficzne, logi informacyjne o nietypowym zachowaniu.

### 14.2. Statusy Błędów
- **OPEN**: Błąd zgłoszony, czeka na analizę.
- **RESOLVED**: Problem rozwiązany, system zapisał datę naprawy.
- **IGNORED**: Błąd uznany za nieistotny lub niemożliwy do odtworzenia.

---

## 15. Infrastruktura i Procesy Operacyjne

### 15.1. Procedura Deploymentu (CI/CD)
1. **Build**: `npm run build` - generowanie zoptymalizowanych paczek JS i CSS.
2. **Migration**: `npx prisma migrate deploy` - aktualizacja schematu bazy danych na produkcji.
3. **Optimizing**: System automatycznie generuje statyczne strony (ISR) dla zwiększenia wydajności.

### 15.2. Zarządzanie Sesjami Administratorów
- Tokeny `admin_token` są weryfikowane przy każdej operacji zapisu (`handleSave`).
- Powrót do strony logowania następuje automatycznie przy statusie 401 (Unauthorized).
- Wszystkie akcje administracyjne są rejestrowane w tabeli `system_logs`.

---

## 16. Frontend Design System

System wizualny opiera się na palecie barw "Premium Dark & Gold".

- **Kolor Główny**: `#EAB308` (Gold 500) - używany dla akcji (CTA), przycisków i akcentów.
- **Tło**: `#000000` (Zestrojone z motywem Noir).
- **Typografia**:
    - **Montserrat**: Czcionka bezszeryfowa dla czytelności (interfejsy).
    - **Playfair Display**: Czcionka szeryfowa dla nagłówków (elegancja).

---

## 11. Specyfikacja Danych: Homepage Editor (JSON Schema)

Strona główna jest przechowywana jako zbiór bloków w formacie JSON. Poniżej opisano strukturę kluczowych obiektów.

### 11.1. Obiekt `HeroSlide`
Używany w sliderze nagłówkowym.
```json
{
  "id": 1,
  "title": "Chwile warte zapamiętania",
  "subtitle": "Fotografia ślubna i sesje rodzinne",
  "description": " <p>Tworzę pamiątki, które zostaną z Tobą na lata.</p>",
  "mediaType": "image",
  "image": "https://...",
  "mobileImage": "https://...",
  "buttonText": "Rezerwuj sesję",
  "buttonLink": "/rezerwacja",
  "textAnimation": "fade-up",
  "overlayOpacity": 0.4
}
```

### 11.2. Obiekt `ParallaxSection`
Sekcja wizualna z efektem głębi.
```json
{
  "type": "parallax",
  "title": "Moja Pasja",
  "backgroundImage": "https://...",
  "floatingImage": "https://...",
  "speed": 0.5,
  "height": "600px",
  "textColor": "#ffffff",
  "overlayOpacity": 0.3
}
```

### 11.3. Obiekt `ChallengeBanner` (Advanced)
```json
{
  "type": "advanced_banner",
  "layout": "orbiting3d",
  "items": [
    { "type": "image", "url": "https://..." },
    { "type": "challenge", "challengeId": 45 }
  ]
}
```

---

## 12. Mapa Systemu: Struktura Katalogów i Komponentów

Poniższa mapa ułatwia nawigację deweloperom po nowym systemie.

| Katalog | Funkcja | Kluczowe Pliki |
| :--- | :--- | :--- |
| `src/app/admin` | Core Panelu Admina | `dashboard/page.tsx`, `settings/page.tsx` |
| `src/app/api` | Warstwa API (Backend) | `bookings/route.ts`, `auth/route.ts` |
| `src/components` | Wspólne komponenty UI | `HeroSlider.tsx`, `MediaPicker.tsx`, `Footer.tsx` |
| `src/lib` | Narzędzia i Konfiguracja | `prisma.ts` (DB), `api-config.ts` |
| `prisma` | Schemat Bazy Danych | `schema.prisma` |
| `public` | Zasoby Statyczne | `favicon.ico`, `logo.png` |

---

## 13. Teoria Projektowa i Triggery Behawioralne

System **wlasniewski.pl** nie jest tylko stroną informacyjną, ale maszyną do konwersji wykorzystującą zasady psychologii sprzedaży.

### 13.1. Zasada Niedostępności (Scarcity)
Moduł `UrgencyBanner` wykorzystuje mechanizm odliczania wolnych miejsc (`slots_remaining`). Ograniczenie liczby terminów w miesiącu podświadomie zmusza klienta do szybszej decyzji.

### 13.2. Dowód Społeczny (Social Proof)
Pasek `SocialProofBanner` wyświetla realne statystyki (np. "1268 wykonanych zdjęć w tym miesiącu"). Zwiększa to zaufanie poprzez pokazanie aktywności fotografa.

### 13.3. Błąd Kotwicy (Anchoring)
W modules `Promo Codes`, cena bazowa jest zawsze wyświetlana obok ceny promocyjnej, co sprawia, że rabat wydaje się bardziej wartościowy.

### 13.4. Flow "Wyzwania" (Challenges)
Mechanizm zaproszeń wykorzystuje ciekawość i zaangażowanie emocjonalne ("Ktoś Cię wyzwał!"). To najsilniejszy kanał wiralowy w systemie.

---

## 14. Procedury Bezpieczeństwa (Security Policy)

### 14.1. Ochrona Danych Osobowych
- Wszystkie dane klientów w rezerwacjach są przesyłane przez HTTPS.
- Hasła administratorów są hashowane przy użyciu `bcrypt` przed zapisem w DB.

### 14.2. Walidacja Wejścia
- System blokuje próby SQL Injection dzięki użyciu Prisma ORM (parametrized queries).
- Pliki w MediaPicker są skanowane pod kątem rozszerzeń i rozmiaru.

---

## 15. Roadmap Rozwoju Systemu (V3.0 Planning)

1. **Integracja AI**: Naprawa opisów blogów i alt-tagów na podstawie analizy obrazów.
2. **System Płatności Ratalnych**: Wdrożenie PayPo oraz rat PayU.
```
{{ ... }}
3. **Aplikacja Mobilna dla Klienta**: Dostęp do prywatnych galerii w formie natywnej aplikacji PWA.
4. **Moduł Automatycznego Newsleterra**: Integracja z Mailchimp/MailerLite.

---

## 16. Kompletna Dokumentacja Modeli Danych (Prisma Full Reference)

Poniżej znajduje się szczegółowy opis wszystkich tabel w systemie, ich typów danych oraz relacji.

### 16.1. Zarządzanie Administratorami i Sesjami

#### `AdminUser`
Model przechowujący dane dostępowe dla panelu administracyjnego.
- `id`: Int (PK)
- `email`: String (Unique) - Login administratora.
- `password_hash`: String - Hash hasła (Bcrypt).
- `name`: String (Optional) - Nazwa wyświetlana.
- `role`: String (Default: "ADMIN") - Rola w systemie.
- `last_login`: DateTime? - Data ostatniego zalogowania.

#### `Setting`
Centralna tabela przechowująca konfigurację asynchroniczną.
- `setting_key`: String (Unique) - Nazwa ustawienia (np. `logo_url`).
- `setting_value`: String? - Wartość (często JSON lub URL).
- `updated_at`: DateTime - Systemowy znacznik czasu aktualizacji.

---

### 16.2. Treści Marketingowe i CMS

#### `BlogPost`
Zarządzanie artykułami na blogu.
- `id`: Int (PK)
- `title`: String - Tytuł postu.
- `slug`: String (Unique) - Przyjazny adres URL.
- `excerpt`: String? - Krótki wstęp.
- `content`: Text - Pełna treść (HTML/RichText).
- `featured_image_id`: Int? - Powiązanie z biblioteką mediów.
- `status`: String (Default: "draft") - Status publikacji.

#### `MediaLibrary`
Centralny magazyn zasobów wizualnych.
- `file_name`: String - Nazwa pliku na serwerze.
- `file_path`: String - Ścieżka dostępu.
- `file_size`: BigInt - Wielkość w bajtach.
- `mime_type`: String - Typ pliku (image/webp, video/mp4).
- `webp_path`: String? - Zoptymalizowana wersja WebP.
- `thumbnail_path`: String? - Miniatura dla panelu admina.

#### `HeroSlide`
Slajdy karuzeli głównej.
- `title`: String?
- `subtitle`: String?
- `button_text`: String?
- `image_id`: Int - Klucz obcy do `MediaLibrary`.
- `display_order`: Int - Kolejność wyświetlania.

---

### 16.3. System Wyzwań (Photo Challenges)

#### `PhotoChallenge`
Główny model wiralowego silnika zaproszeń.
- `unique_link`: String (Unique) - Unikalny kod zaproszenia.
- `inviter_name`: String - Kto zaprasza.
- `inviter_contact`: String - Telefon zapraszającego.
- `inviter_email`: String - E-mail zapraszającego (obowiązkowy, służy do powiadomień i logowania do panelu).
- `invitee_name`: String - Kto jest zaproszony.
- `invitee_contact`: String - E-mail zaproszonego.
- `status`: String (sent, accepted, rejected, completed).
- `package_id`: Int - Wybrany pakiet wyzwania.
- `session_date`: DateTime? - Wybrany/wynegocjowany termin.
- `acceptance_deadline`: DateTime? - FOMO limit czasowy.

#### `ChallengePackage`
Dedykowane pakiety cenowe dla wyzwań.
- `base_price`: Int - Cena standardowa.
- `challenge_price`: Int - Cena obniżona dla wyzwania.
- `accent_color`: String? - Kolorystyka karty pakietu.

---

### 16.4. Rezerwacje i Sprzedaż

#### `Booking`
Cykl życia sesji fotograficznej.
- `service`: String - Nazwa usługi.
- `package`: String - Nazwa pakietu.
- `price`: Int - Cena w groszach (PLN * 100).
- `date`: DateTime - Termin sesji.
- `status`: String (pending, confirmed, cancelled).

#### `GiftCard`
Struktura voucherów.
- `code`: String (Unique) - Kod rabatowy karty.
- `value`: Int - Wartość nominalna.
- `theme`: String - Wybrany motyw graficzny.
- `is_active`: Boolean - Czy karta jest gotowa do użycia.

---

### 16.5. Diagnostyka i Logi

#### `SystemLog`
Ślad audytowy wszystkich działań.
- `level`: String (INFO, WARN, ERROR).
- `module`: String - Miejsce wystąpienia (np. "PAYMENTS").
- `message`: Text - Opis zdarzenia.

#### `ErrorNote`
Specjalistyczne notatki deweloperskie.
- `sql_query`: Text? - Instrukcja naprawcza SQL.
- `severity`: String (CRITICAL to LOW).

---

## 17. Kompletny Katalog Endpointów API

### 17.1. Administracja (Wymagana Autoryzacja)
- `GET /api/admin/logs` - Pobiera logi systemowe.
- `GET /api/admin/seo-report` - Generuje raport metadanych.
- `POST /api/admin/test-email` - Testuje konfigurację SMTP.
- `GET /api/admin/users/manage` - Zarządzanie kontami adminów.

### 17.2. Sprzedaż i Płatności
- `POST /api/payments/p24/create` - Inicjuje transakcję Przelewy24.
- `POST /api/payments/payu/notify` - Webhook dla PayU.
- `POST /api/promo-codes/validate` - Walidacja kodu przed zakupem.

### 17.3. CMS i Budowanie Stron
- `GET /api/pages` - Pobiera listę stron.
- `PUT /api/menu/items` - Aktualizuje strukturę nawigacji.
- `POST /api/media/upload` - Przesyła nowe zdjęcie do biblioteki.

---

## 18. Dokumentacja Operacyjna (SRE)

### 18.1. Przechowywanie Danych
System korzysta z relacyjnej bazy danych PostgreSQL. Wszystkie klucze obce są indeksowane dla maksymalnej wydajności zapytań `JOIN`.

### 18.2. Obsługa Mediów
Zdjęcia są przechowywane na systemie plików (folder `storage` lub S3), a ich metadane w tabeli `media_library`. System automatycznie generuje formaty WebP i AVIF w celu poprawy wyników Google PageSpeed Insights.

### 18.3. Backup i Retencja
Zaleca się codzienne wykonywanie dumpu bazy danych (`pg_dump`). Logi systemowe są przechowywane bezterminowo, chyba że administrator zainicjuje czyszczenie bazy.

---

## 19. Architektura Komponentów Frontendowych

W tej sekcji opisano kluczowe komponenty interfejsu użytkownika, ich odpowiedzialności oraz parametry konfiguracyjne.

### 19.1. Komponent `HeroSlider` (`src/components/HeroSlider.tsx`)
Główny element wizualny strony głównej, odpowiedzialny za pierwsze wrażenie (First Meaningful Paint).
- **Logika**: Wykorzystuje `framer-motion` do animacji tekstu i przejść między slajdami.
- **Parametry**:
    - `slides`: Tablica obiektów `HeroSlide`.
    - `autoPlay`: Czy slider ma się automatycznie przewijać.
    - `interval`: Czas wyświetlania jednego slajdu (domyślnie 5s).
- **Obsługa Mediów**: Wybiera źródło wideo lub obrazu na podstawie `mediaType`. Implementuje mechanizm `priority` dla obrazów typu LCP.

### 19.2. Komponent `MediaPicker` (`src/components/admin/MediaPicker.tsx`)
Zaawansowany modal służący do zarządzania i wybierania mediów w panelu admina.
- **Funkcjonalność**: 
    - Widok siatki (Grid) z leniwym ładowaniem (Lazy Loading).
    - Wyszukiwarka po nazwie i tagach.
    - Integracja z API `/api/media`.
- **Zasada Działania**: Po kliknięciu w obrazek, wysyła wybrane URL do funkcji callback `onSelect`.

### 19.3. Komponent `ChallengeBanner` (`src/components/ChallengeBanner.tsx`)
Moduł odpowiedzialny za wiralowe wyzwania fotograficzne.
- **Tryby wizualne**:
    - **Orbiting 3D**: Karuzela zdjęć obracająca się w przestrzeni 3D.
    - **Masonry Grid**: Dynamiczna siatka zdjęć o różnych proporcjach.
    - **Puzzle Layout**: Układanka zdjęć zintegrowana z interaktywnymi przyciskami.

### 19.4. Komponent `Navbar` (`src/components/Navbar.tsx`)
Główna nawigacja witryny, synchronizowana z bazą danych przez `MenuItem`.
- **Adaptacyjność**: Posiada oddzielne widoki dla `desktop` i `mobile`.
- **Efekt Scrolal**: Zmienia przezroczystość i wysokość podczas przewijania strony (Scroll Listener).
- **Integracja**: Pobiera strukturę menu z `/api/menu/items`.

### 19.5. Komponent `Footer` (`src/components/Footer.tsx`)
Stopka zintegrowana z systemem CMS.
- **Logika Fallbacków**: Jeśli w bazie brakuje danych dla danej sekcji, wyświetla predefiniowane "linki bezpieczeństwa".

### 19.6. Komponent `MiniGallery` (`src/components/PageRenderer.tsx`)
Moduł galerii o wysokiej konfigurowalności, renderowany dynamicznie.
- **Parametry**: `columns` (2-6), `gap` (sm-xl), `aspectRatio`, `textPosition`, `containerWidth` (Full/Wide/Narrow), `mobileColumns` (1/2).
- **Funkcje**:
    - **Lightbox**: Własna implementacja z obsługą nawigacji (Next/Prev) i swipe na mobile.
    - **Rich Text**: Renderowanie HTML z `DOMPurify` dla bezpieczeństwa.
    - **Performance**: Wykorzystuje `Next/Image` z automatycznym doborem rozmiarów (`sizes` prop) w zależności od układu kolumn.

---

## 20. Przewodnik Stylistyczny Codebase (Code Conventions)

Aby zachować czystość i skalowalność projektu, deweloperzy powinni przestrzegać poniższych zasad.

### 20.1. Naming Conventions
- **Komponenty**: PascalCase (np. `BookingCalendar.tsx`).
- **Funkcje API**: camelCase (np. `validatePromoCode`).
- **Tabele DB**: snake_case (np. `service_types`).

### 20.2. Obsługa Błędów we Frontendzie
Każda operacja asynchroniczna powinna być opakowana w `try-catch` z powiadomieniem dla użytkownika przez `react-hot-toast`.
```typescript
try {
  await fetchAPI();
  toast.success('Sukces!');
} catch (error) {
  toast.error('Coś poszło nie tak...');
}
```

### 20.3. Optymalizacja Performance
- Wszystkie ikony importowane z `lucide-react` powinny być używane jako `tree-shaked` komponenty.
- Obrazy spoza galerii powinny być dostarczane w formacie WebP (preferowane) lub zoptymalizowanym PNG.

---

## 21. Bezpieczeństwo i Compliance

### 21.1. Autoryzacja Admina
Panel administratora `/admin` posiada globalną ochronę:
1. Sprawdzenie obecności `admin_token` w pamięci lokalnej.
2. Weryfikacja tokena po stronie serwera przez middleware.
3. Automatyczna deaktywacja sesji przy bezczynności lub próbie dostępu z nieznanego IP (opcjonalnie w logach).

### 21.2. Przechowywanie haseł
System **nigdy** nie przechowuje haseł w formie tekstu jawnego. Używany jest silny algorytm hashowania z solą (Bcrypt).

---

## 22. Konserwacja i Rozwiązywanie Problemów (Maintenance)

System został zaprojektowany z myślą o minimalnej obsłudze, jednak w określonych sytuacjach wymagana może być interwencja administratora.

### 22.1. Problemy z Bazy Danych
W przypadku błędów typu "Database Connection Error":
1. Sprawdź status usługi PostgreSQL/MySQL u dostawcy hostingu.
2. Zweryfikuj zmienną `DATABASE_URL` w pliku `.env`.
3. Skorzystaj z modułu `Error Notebook` w panelu admina, aby sprawdzić historię błędów.

### 22.2. Problemy z Wysyłką Email
Jeśli karty podarunkowe nie docierają do klientów:
1. Przetestuj połączenie w `Ustawienia > Email (SMTP)`.
2. Upewnij się, że port SMTP (np. 465) nie jest blokowany przez zapory ogniowe serwera.
3. Sprawdź, czy hasło do konta e-mail nie wygasło.

### 22.3. Odświeżanie Cache (ISR)
Strony statyczne są odświeżane automatycznie co określony czas. Jeśli zmiana nie jest widoczna natychmiast:
- Skorzystaj z mechanizmu rewalidacji po stronie serwera (jeśli zaimplementowano endpoint `/api/revalidate`).
- Wykonaj twarde odświeżenie przeglądarki (`Ctrl + F5`).

---

## 23. Słownik Pojęć (Glossary)

- **LCP (Largest Contentful Paint)**: Metryka szybkości ładowania największego elementu na stronie (zwykle HeroSlider).
- **SSR (Server-Side Rendering)**: Generowanie treści strony na serwerze, co poprawia SEO i szybkość pierwszego wyświetlenia.
- **ISR (Incremental Static Regeneration)**: Mechanizm Next.js pozwalający na aktualizację statycznych stron bez ponownego buildowania całego projektu.
- **FOMO (Fear Of Missing Out)**: Technika psychologiczna polegająca na wywołaniu u klienta lęku przed przegapieniem okazji (np. przez licznik terminów).
- **CTA (Call To Action)**: Wezwanie do działania, zwykle w formie przycisku (np. "Rezerwuj teraz").
- **Webhook**: Automatyczne powiadomienie wysyłane przez system zewnętrzny (np. PayU) do naszej aplikacji po wystąpieniu zdarzenia (np. opłaceniu zamówienia).
- **Slug**: Przyjazna dla oka i robotów wyszukiwarek część adresu URL (np. `sesja-slubna-w-gorach`).
- **MediaPicker**: Autorski moduł do zarządzania zasobami wizualnymi.

---

## 24. Indeks Tabel i Narzędzi Administracyjnych

| Sekcja | Tematyka | Kluczowe Narzędzie |
| :--- | :--- | :--- |
| **2.1** | Strona Główna | `Homepage Editor` |
| **3.1** | Rezerwacje | `Status Workflow` |
| **7.1** | Ustawienia | `Settings Hub` |
| **9.0** | Techniczne | `API Reference` |
| **13.0** | Sklep | `Gift Card Generator` |
| **16.0** | Dane | `Prisma Full Schema` |

---

## 25. Optymalizacja SEO: Praktyczny Checklist

System automatyzuje wiele procesów SEO, jednak administrator powinien przestrzegać poniższych wytycznych.

### 25.1. Tytuły i Opisy Meta
- **Strona Główna**: Musi zawierać słowa kluczowe: *fotograf ślubny*, *sesja zdjęciowa*, *fotografia dronowa*.
- **Podstrony**: Każda podstrona powinna mieć unikalny `meta_title` (max 60 znaków) oraz `meta_description` (max 160 znaków).

### 25.2. Obsługa Obrazów
- Zawsze używaj pola `alt_text` w bibliotece mediów. System wykorzystuje go do generowania atrybutów `alt` w tagach `<img>`.
- Staraj się, aby obrazy nie przekraczały 500 KB przed wgraniem (system i tak je zoptymalizuje, ale oszczędza to transfer serwera).

### 25.3. Wydajność Core Web Vitals
- Unikaj dodawania zbyt wielu zewnętrznych skryptów w `Ustawienia > Analityka`, ponieważ mogą one obniżyć wynik "Time to Interactive".
- System domyślnie priorytetyzuje ładowanie pierwszego slajdu HeroSlider (`LCP`).

---

## 26. Logika Linków Social Media w Wyzwaniach

Moduł `Photo Challenges` generuje dedykowane linki do udostępniania na platformach społecznościowych.

### 26.1. Integracja z OpenGraph
Gdy unikalny link wyzwania (`/foto-wyzwanie/[unique_link]`) jest udostępniany na Facebooku lub Instagramie:
- **Tytuł**: "Zostałeś wyzwany na sesję zdjęciową!"
- **Opis**: spersonalizowana wiadomość od zapraszającego.
- **Obraz**: dynamicznie generowana grafika z logotypem i motywem wyzwania.

### 26.2. Automatyzacja Messenger/WhatsApp
Przycisk "Udostępnij Wyzwanie" korzysta z API Web Share:
- System przygotowuje tekst: "Hej [Imię], wyzywam Cię na profesjonalną sesję u Przemysława Właśniewskiego! Sprawdź szczegóły tutaj: [link]"

---

## 27. Porównanie Bramek Płatności (P24 vs PayU)

| Cecha | Przelewy24 | PayU |
| :--- | :--- | :--- |
| **BLIK** | Tak (Native) | Tak (Native) |
| **Karty** | Tak | Tak |
| **Sandbox** | Tak | Tak |
| **Webhooki** | Rest API (CRC) | OAuth 2.0 (MD5) |
| **Konfiguracja** | Prostsza (4 klucze) | Bardziej złożona (5 kluczy) |

---

## 29. Zgodność Techniczna i Licencje

System wykorzystuje szereg bibliotek open-source, które muszą być utrzymywane w aktualnych wersjach w celu zapewnienia bezpieczeństwa.

### 29.1. Główne Zależności
- **Next.js**: MIT License. Pozwala na komercyjne wykorzystanie i modyfikację.
- **Prisma**: Apache License 2.0. Bezpieczny ORM dla aplikacji krytycznych.
- **Tailwind CSS**: MIT License. System stylizacji.
- **Lucide React**: ISC License. Zestaw ikon.

### 29.2. Standardy Bezpieczeństwa (GDPR/RODO)
System jest przygotowany do obsługi przepisów RODO:
- Formularze kontaktu i rezerwacji wymagają akceptacji polityki prywatności.
- Dane klientów są przechowywane w szyfrowanej bazie danych.
- Administrator może usunąć dane klienta na jego prośbę bezpośrednio z panelu (Moduł Bookings).

---

## 30. Historia i Wersjonowanie Projektu

| Wersja | Data | Opis zmian |
| :--- | :--- | :--- |
| **1.0** | 2024-06 | Inicjalna wersja systemu rezerwacji. |
| **2.0** | 2025-12 | Pełny audyt, optymalizacja SEO, wdrożenie Photo Challenges. |
| **2.1** | 2025-12 | Rozbudowa dokumentacji technicznej do 700+ linii. |
| **2.2** | 2025-12-25 | Konsolidacja konfiguracji wyzwań, system HQ/Radius, integracja MediaPicker. |

---

## 31. Oświadczenie o Zgodności i Utrzymaniu

Niniejsza specyfikacja techniczna odzwierciedla stan faktyczny systemu na dzień 24 grudnia 2025 r. Wszelkie modyfikacje bazy danych lub logiki biznesowej powinny zostać odnotowane w niniejszym dokumencie w celu zachowania spójności dokumentacji technicznej.

---

*Dokumentacja sporządzona przez system Antigravity dla Przemysława Właśniewskiego.*

```
