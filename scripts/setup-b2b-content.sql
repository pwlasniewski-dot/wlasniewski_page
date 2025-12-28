-- ============================================
-- B2B Menu & Content Setup - Mavic 3 Thermal
-- ============================================

-- 1. Clean existing B2B menu
DELETE FROM menu_items WHERE menu_type = 'b2b';

-- 2. Create B2B Menu Structure (5 items)
INSERT INTO menu_items (title, url, page_id, parent_id, "order", is_active, menu_type, created_at)
VALUES
    ('Start', '/b2b', NULL, NULL, 1, true, 'b2b', NOW()),
    ('Termowizja', '/b2b/termowizja', NULL, NULL, 2, true, 'b2b', NOW()),
    ('Inspekcje', '/b2b/inspekcje', NULL, NULL, 3, true, 'b2b', NOW()),
    ('Monitoring', '/b2b/monitoring', NULL, NULL, 4, true, 'b2b', NOW()),
    ('Kontakt', '/b2b/kontakt', NULL, NULL, 5, true, 'b2b', NOW());

-- 3. Create B2B Pages with Full Content

-- Page 1: Termowizja
INSERT INTO pages (title, slug, content, seo_title, seo_description, is_published, is_in_menu, menu_order, domain, created_at, updated_at)
VALUES (
    'Termowizja Dronem - Profesjonalne Usługi',
    'termowizja',
    E'<h1>Termowizja Dronem Mavic 3 Thermal</h1>

<p>Wykorzystujemy najnowocześniejszy dron <strong>DJI Mavic 3 Thermal</strong> wyposażony w podwójny system obrazowania – kamerę termowizyjną FLIR oraz optyczną z matrycą 4/3 CMOS. To połączenie pozwala na precyzyjne wykrywanie anomalii termicznych z rozdzielczością 640×512 pikseli i czułością <0.04°C.</p>

<h2>Inspekcje Dachów i Budynków</h2>
<p>Termowizja z powietrza ujawnia nieszczelności, mostki termiczne oraz miejsca utraty energii niewidoczne gołym okiem. Analizujemy instalacje fotowoltaiczne, wykrywając wadliwe panele i połączenia. Dokumentujemy stan izolacji przed i po termomodernizacji, dostarczając raporty z dokładnymi mapami temperatur.</p>

<h2>Zastosowania Przemysłowe</h2>
<p>Monitorujemy instalacje przemysłowe, wykrywając przegrzania transformatorów, linii przesyłowych oraz urządzeń technologicznych. Inspekcje rurociągów i zbiorników pozwalają na wczesne wykrycie wycieków i uszkodzeń. Wszystkie dane zapisujemy w formacie termogramów z pełną metadanymi temperatury.</p>

<h2>Bezpieczeństwo i Certyfikacja</h2>
<p>Posiadamy uprawnienia UAVO oraz pełne ubezpieczenie OC. Operacje prowadzimy zgodnie z przepisami EASA, zapewniając bezpieczeństwo i dyskrecję. Raporty dostarczamy w ciągu 48 godzin od wykonania misji, w formatach PDF, JPG oraz natywnych plikach termicznych do dalszej analizy.</p>',
    'Termowizja Dronem | Mavic 3 Thermal | Inspekcje Termiczne',
    'Profesjonalne usługi termowizji dronem Mavic 3 Thermal. Inspekcje dachów, budynków, instalacji przemysłowych. Raporty w 48h. Certyfikowane UAVO.',
    true,
    false,
    2,
    'b2b',
    NOW(),
    NOW()
);

-- Page 2: Inspekcje
INSERT INTO pages (title, slug, content, seo_title, seo_description, is_published, is_in_menu, menu_order, domain, created_at, updated_at)
VALUES (
    'Inspekcje Infrastruktury - Mosty, Drogi, Budowle',
    'inspekcje',
    E'<h1>Inspekcje Infrastruktury z Drona</h1>

<p>Specjalizujemy się w <strong>profesjonalnych inspekcjach mostów, wiaduktów, dróg oraz konstrukcji budowlanych</strong> z wykorzystaniem technologii Mavic 3 Thermal. Łączymy obrazowanie termiczne z wysokiej jakości dokumentacją wizualną, tworząc kompleksowe raporty stanu technicznego obiektów.</p>

<h2>Mosty i Wiadukty</h2>
<p>Wykonujemy szczegółowe przeglądy konstrukcji betonowych i stalowych, wykrywając pęknięcia, korozję oraz miejsca infiltracji wody. Termowizja ujawnia zmiany strukturalne niewidoczne podczas tradycyjnych oględzin. Dokumentujemy stan przyczółków, podpór oraz nawierzchni jezdni, minimalizując potrzebę wyłączeń z ruchu.</p>

<h2>Drogi i Nawierzchnie</h2>
<p>Analizujemy stan asfaltowych i betonowych nawierzchni, wykrywając puste podpowierzchniowe przestrzenie, ubytki oraz miejsca przyszłych uszkodzeń. Mapy termiczne pokazują strefy nadmiernego nagrzewania się materiału, co pozwala planować remonty przed poważnymi awariami.</p>

<h2>Bezpieczeństwo Prac</h2>
<p>Inspekcje z powietrza eliminują ryzyko związane z pracami na wysokości i w trudno dostępnych miejscach. Operujemy również w warunkach ograniczonej widoczności i w nocy dzięki kamerom termicznym. Każdy lot dokumentujemy zgodnie z normami BIM, dostarczając dane gotowe do integracji z systemami zarządzania infrastrukturą.</p>

<h2>Raportowanie</h2>
<p>Raporty zawierają ortofotomapy, modele 3D punktów kontrolnych, termogramy oraz szczegółowe opisy wykrytych nieprawidłowości. Format dostosowujemy do wymagań inwestora – od prostych zestawień po zaawansowane analizy zgodne z normami branżowymi PN-EN.</p>',
    'Inspekcje Mostów i Infrastruktury Dronem | Profesjonalne Przeglądy',
    'Inspekcje dronem: mosty, wiadukty, drogi. Termowizja + dokumentacja 4K. Raporty zgodne z normami. Bezpieczne, szybkie, precyzyjne.',
    true,
    false,
    3,
    'b2b',
    NOW(),
    NOW()
);

-- Page 3: Monitoring
INSERT INTO pages (title, slug, content, seo_title, seo_description, is_published, is_in_menu, menu_order, domain, created_at, updated_at)
VALUES (
    'Monitoring i Timelapsy - Ciągły Nadzór z Powietrza',
    'monitoring',
    E'<h1>Monitoring Dronem i Timelapsy Budowlane</h1>

<p>Oferujemy <strong>usługi ciągłego monitoringu terenu oraz profesjonalne timelapsy budowlane</strong> wykorzystując drony DJI Mavic 3 Thermal. Nasze rozwiązania łączą dokumentację wizualną z możliwościami termowizji, zapewniając kompleksowy nadzór nad inwestycjami i obiektami.</p>

<h2>Monitoring Budów i Inwestycji</h2>
<p>Regularne przeloty dokumentacyjne pozwalają śledzić postęp prac budowlanych, porównywać stan faktyczny z harmonogramem oraz szybko wykrywać odstępstwa od projektu. Dostarczamy ortofotomapy z dokładnością centymetrową, umożliwiające pomiary kubatur i weryfikację wykonanych robót. Każdy lot archiwizujemy, tworząc pełną historię budowy.</p>

<h2>Timelapsy Marketingowe</h2>
<p>Tworzymy spektakularne filmy poklatkowe dokumentujące przekształcenia terenu – od wyburzenia po oddanie inwestycji. Materiały w rozdzielczości 4K idealnie nadają się do prezentacji dla inwestorów, promocji w mediach społecznościowych oraz dokumentacji przetargowej. Oferujemy również nocne ujęcia z podświetleniem budowy.</p>

<h2>Monitoring Bezpieczeństwa</h2>
<p>Termowizja nocna pozwala na dozór obiektów 24/7 bez dodatkowego oświetlenia. Wykrywamy osoby i pojazdy w terenie, identyfikujemy anomalie termiczne mogące wskazywać na zagrożenia pożarowe. System może być zintegrowany z platformami ochrony obiektu, wysyłając alerty w czasie rzeczywistym.</p>

<h2>Monitoring Środowiskowy</h2>
<p>Śledzimy zmiany w środowisku naturalnym – poziomy wód, zagęszczenie roślinności, ruchy zwierząt. Termowizja ujawnia źródła zanieczyszczeń termicznych rzek oraz nielegalne wysypiska. Dla łowieckich kół wykonujemy liczenia populacji zwierząt, minimalizując ich niepokojenie.</p>',
    'Monitoring Dronem | Timelapsy Budowlane | Nadzór 24/7',
    'Monitoring budów z drona. Timelapsy 4K. Termowizja nocna. Ortofotomapy. Dokumentacja inwestycji. Ciągły nadzór terenu.',
    true,
    false,
    4,
    'b2b',
    NOW(),
    NOW()
);

-- Page 4: Kontakt (B2B)
INSERT INTO pages (title, slug, content, seo_title, seo_description, is_published, is_in_menu, menu_order, domain, created_at, updated_at)
VALUES (
    'Kontakt - Wycena Usług Dronowych',
    'kontakt',
    E'<h1>Zapytanie o Wycenę</h1>

<p>Skontaktuj się z nami, aby otrzymać szczegółową ofertę dopasowaną do Twojego projektu. Gwarantujemy odpowiedź w ciągu 24 godzin roboczych.</p>

<h2>Dane Kontaktowe</h2>
<p><strong>FotoDron Właśniewski</strong><br>
Email: <a href="mailto:kontakt@wlasniewski.pl">kontakt@wlasniewski.pl</a><br>
Tel: +48 XXX XXX XXX<br>
NIP: XXXXXXXXXX</p>

<h2>Obszar Działania</h2>
<p>Działamy na terenie całej Polski. Dla projektów wymagających wielodniowej obecności oferujemy preferencyjne stawki. Posiadamy pełne ubezpieczenie OC oraz certyfikaty UAVO.</p>

<h2>Czas Realizacji</h2>
<p>Standardowy raport dostarczamy w ciągu 48-72 godzin od wykonania misji. Dla pilnych zleceń oferujemy tryb ekspresowy (24h) za dodatkową opłatą.</p>

<!-- B2B Contact Form Component will be rendered here by PageRenderer -->',
    'Kontakt | Wycena Usług Dronowych | FotoDron',
    'Skontaktuj się w sprawie usług dronowych. Termowizja, inspekcje, monitoring. Odpowiedź w 24h. Działamy w całej Polsce.',
    true,
    false,
    5,
    'b2b',
    NOW(),
    NOW()
);

-- ============================================
-- Summary
-- ============================================
-- Created:
-- - 5 menu items (Start, Termowizja, Inspekcje, Monitoring, Kontakt)
-- - 4 content pages with 200-300 words each
-- All with B2B domain/context
