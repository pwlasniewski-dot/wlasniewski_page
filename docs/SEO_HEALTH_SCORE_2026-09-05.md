# SEO — poprawki po raporcie Ahrefs z 5 września 2026

## Cel i status

Usunąć potwierdzone usterki utrudniające odczyt treści oraz przejście z oferty do portfolio. Status: **draft do podglądu i walidacji CMS**, nie potwierdzenie wdrożenia ani wyniku 100/100.

Ahrefs: 105 URL, Health Score 94, Errors 10, Warnings 43, Notices 65. Szczegółowy panel zatrzymał przeglądarkę na weryfikacji Cloudflare. Mail zawiera podsumowanie i zmiany, bez pełnej listy błędów. Własny audyt obejmuje 44 adresy aktualnej mapy, 10 dodatkowych ścieżek i 19 zasobów graficznych. Nie jest kopią skanu 105 URL.

## Potwierdzone ustalenia i poprawki

| Obszar | Stan publiczny przed zmianą | Przygotowana poprawka |
| --- | --- | --- |
| 44 adresy sitemap | HTTP 200, prawidłowe canonicale | Bez zmiany mapy i indeksacji tych stron |
| Cztery artykuły bloga | Brak artykułu i H1 w SSR; tylko ładowanie | Render treści, H1 i zdjęcia na serwerze; filtr publikacji wspólny dla treści i metadanych |
| Rezerwacja | Brak H1 przed pobraniem usług | Nagłówek z istniejącej konfiguracji formularza również podczas ładowania; krótki metaopis |
| O mnie | Trzy H1 | Rozpoznanie H1 z treści CMS; usunięcie dodatkowego H1 strony głównej ze slidera |
| PKP Płużnica | Dwa H1 | Slider osadzony w stronie nie dodaje nagłówka strony głównej |
| Grafika OG | `/og-image.jpg` zwraca HTML strony nieznalezionej | Odwołania wskazują istniejący obraz `/assets/slider/fotografia-rodzinna-grudziadz-01.webp` — potwierdzone HTTP 200 i image/webp |
| Oferta rodzinna | Odnośnik `/portfolio/family` prowadzi do nieistniejącej kategorii | Stałe przekierowanie do `/portfolio/Sesja%20Rodzinna`; nowy szablon CMS używa adresu docelowego |
| Foto Wyzwanie | Zbyt długi opis | Krótki opis SEO, OG i Twitter bez liczbowych obietnic cen, rabatów i gwarancji |
| Pięć opisów CMS | Zbyt długie opisy | Gotowy plan danych i narzędzie aktualizacji; **jeszcze niezastosowane** |

Artykuły objęte naprawą SSR:

- `/blog/komunia`
- `/blog/m-yn-wiedzy-w-toruniu-tym-razem-dach-budynki`
- `/blog/po-co-zbudowa-em-t-stron`
- `/blog/kadry-czasu-stacja-kolejowa-w-pluznicy`

## Opisy CMS

Dokładne poprzednie opisy i pięć propozycji znajdują się w `scripts/seo-descriptions-2026-09-05.json`. Dotyczą `/o-mnie`, `/portfolio` oraz trzech artykułów. Pola `meta_description` pozostają edytowalne w obecnym CMS; nie wprowadzamy nadpisywania ich przez kod aplikacji ani automatycznego obcinania zdań.

`node --import tsx scripts/update-seo-descriptions.ts` wyświetla plan offline bez połączenia z bazą. `--check` odczytuje bieżące wartości i sprawdza ich zgodność z audytem. `--apply --backup=/absolute/path/to/new-file.json` wymaga nowego pliku kopii, sprawdza publikację, aktualizuje tylko wskazane opisy w jednej transakcji i przerywa przy zmianie poprzednich wartości. Najpierw sprawdzić na izolowanej gałęzi bazy. W tej sesji wykonano wyłącznie plan offline.

Po zastosowaniu danych trzeba odświeżyć cache stron i sprawdzić końcowy HTML. Cofnięcie aktualizacji polega na przywróceniu `previousMetaDescription` z kopii po upewnieniu się, że dany rekord nadal ma opis z tej aktualizacji.

## Weryfikacja

- 5/5 testów renderowania bloga, metadanych, publikacji i nagłówków: PASS; niezależny agent QA powtórzył testy.
- Kontrakt zapisu/odczytu konfiguracji formularza i testy lejka: 17/18 PASS. Jedyny błąd oczekuje tekstu `pg_advisory_xact_lock` w niezmienionym checkout, który już w HEAD używa osobnego helpera. To nie regresja tego diff.
- Konfiguracja przekierowania: PASS; adres docelowy publicznie ma HTTP 200, index/follow i H1 portfolio rodzinnego.
- Nowy zasób OG: HTTP 200, image/webp; niezależnie potwierdzone przez QA.
- Plan pięciu opisów: działa offline; każdy opis poniżej 160 znaków.
- `git diff --check`: PASS.
- Pełny typecheck repozytorium nie jest zielony; występują diagnostyki wcześniejszych modułów. Nie deklarujemy pełnego PASS ani ukończenia builda.
- Nie wykonano pełnego produkcyjnego builda, testu podglądu mobilnego ani rzeczywistego zapisu w adminie. Testy CMS używają kontrolowanych danych, nie produkcji.

## Warunki wdrożenia i domknięcia

1. Podgląd Netlify: blog, O mnie, PKP Płużnica, rezerwacja i odnośnik do rodzinnego portfolio; brak regresji wyglądu oraz formularza.
2. Test edycji istniejącej treści CMS, ponownego odczytu oraz SSR na środowisku testowym zgodnie z AGENTS.md.
3. Weryfikacja i zastosowanie pięciu opisów CMS z kopią wartości; odświeżenie cache i odczyt publicznych metaopisów.
4. Po wdrożeniu ponowny test HTTP/HTML i crawl Ahrefs przy tych samych ustawieniach. Pełny eksport All issues z adresami jest konieczny, aby rozliczyć dokładnie 10 Errors oraz pozostałe strony spoza mapy.

Bez wyłączania reguł lub ukrywania prawidłowych stron w celu podniesienia wyniku. Według [Ahrefs](https://help.ahrefs.com/en/articles/1424673-what-is-health-score-and-how-is-it-calculated-in-ahrefs-site-audit) domyślnie tylko czerwone Errors obniżają Health Score. H1 i długie opisy ze screena są Notices. Nie wolno utożsamiać ich naprawy z osiągnięciem 100/100.

Koszt: bez nowych płatnych usług. Ryzyko: umiarkowane dla zmiany renderowania bloga, małe dla pozostałych korekt; ograniczane testami i podglądem. Oczekiwany efekt: czytelny HTML artykułów dla wyszukiwarek, poprawne podglądy linków i działające przejście do portfolio. Przychodu ani ROI nie da się wiarygodnie wyliczyć bez pomiaru zapytań i rezerwacji.
