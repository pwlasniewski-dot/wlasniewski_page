"""Append the dated implementation/QA annex, preserving the original 76 pages.
Usage: python append_prodigi_v7.py ORIGINAL OUTPUT COMMIT
"""
import sys
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT
from pypdf import PdfReader, PdfWriter

source, target, commit = sys.argv[1:4]
out=Path(target);out.parent.mkdir(parents=True,exist_ok=True)
for name,file in [('DV','DejaVuSans.ttf'),('DVB','DejaVuSans-Bold.ttf')]:
 pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
pdfmetrics.registerFontFamily('DV',normal='DV',bold='DVB',italic='DV',boldItalic='DVB')
navy=colors.HexColor('#18364A');teal=colors.HexColor('#067A82');gray=colors.HexColor('#526371')
styles={
 'body':ParagraphStyle('body',fontName='DV',fontSize=10,leading=14.4,textColor=navy,spaceAfter=10),
 'small':ParagraphStyle('small',fontName='DV',fontSize=8.5,leading=12,textColor=gray,spaceAfter=8),
 'title':ParagraphStyle('title',fontName='DVB',fontSize=22,leading=27,textColor=navy,spaceAfter=9),
 'kicker':ParagraphStyle('kicker',fontName='DVB',fontSize=9,leading=13,textColor=teal,spaceAfter=17),
 'cell':ParagraphStyle('cell',fontName='DV',fontSize=9,leading=12.5,textColor=navy),
 'head':ParagraphStyle('head',fontName='DVB',fontSize=9,leading=12.5,textColor=colors.white),
}
def p(s,kind='body'):return Paragraph(s,styles[kind])
def table(headers,rows,widths=[125,386]):
 data=[[p(escape(s),'head') for s in headers]]+[[p(s,'cell') for s in r] for r in rows]
 t=Table(data,colWidths=widths,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),navy),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#F1F6F7'),colors.white]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LINEBELOW',(0,0),(-1,-1),.4,colors.HexColor('#D6E1E5'))]))
 return t
story=[]
def page(title,kicker,*items):
 if story:story.append(PageBreak())
 story.extend([p(title,'title'),p(kicker,'kicker')])
 for item in items:story.append(p(item) if isinstance(item,str) else item)
class Process(Flowable):
 def __init__(self):super().__init__();self.width=511;self.height=288
 def draw(self):
  c=self.canv
  def box(x,y,w,h,label,fill='#EEF5F6'):
   c.setStrokeColor(colors.HexColor('#9CBAC4'));c.setFillColor(colors.HexColor(fill));c.roundRect(x,y,w,h,6,stroke=1,fill=1)
   lines=label.split('\n');c.setFillColor(navy);c.setFont('DV',9)
   for j,line in enumerate(lines):c.drawCentredString(x+w/2,y+h/2+4*(len(lines)-1)-12*j-3,line)
  def arrow(x1,y1,x2,y2):
   c.setStrokeColor(teal);c.setLineWidth(1);c.line(x1,y1,x2,y2);c.line(x2,y2,x2-3,y2+5);c.line(x2,y2,x2+3,y2+5)
  box(5,244,158,38,'Własne zdjęcie\n+ podgląd')
  box(177,244,158,38,'Zdjęcie z przypisanej\nprywatnej galerii')
  box(349,244,158,38,'Przykład → sesja\nz produktem lub bez')
  for x in [84,256,428]: c.setStrokeColor(teal);c.line(x,244,x,232);c.line(x,232,256,232)
  arrow(256,232,256,220);box(126,184,260,36,'Wspólny koszyk → płatność')
  arrow(256,184,256,172);box(126,124,260,48,'BUFOr SKLEPU\nCzeka na sesję i finalne zdjęcie'.replace('BUFOr','BUFOR'),'#FFF4DF')
  arrow(256,124,256,112);box(76,66,360,46,'Akceptacja zdjęcia, kadru i wariantu\nRozliczenie, adres, usługa, świeży koszt')
  arrow(256,66,256,54);box(76,7,360,47,'Bramka realizacji → jedno zlecenie Prodigi\nProdukcja → paczki → potwierdzone statusy')

page('Aktualizacja decyzji i stanu wdrożenia','ANEKS v7 • 24.09.2026 • strony 1–76 pozostają historią',
 '<b>Prodigi: kandydat do pilotażu, nie potwierdzony najbardziej opłacalny dostawca.</b> Wcześniejsze kategoryczne rekomendowanie go jako najlepszego było zbyt stanowcze. Brakuje porównania identycznych produktów z pełną dostawą do Polski, cen rzeczywistego konta oraz próbek.',
 table(['Obszar','Stan na koniec tego etapu'],[
 ['Kod przygotowany','Diagnostyka produktów i wycen wyłącznie sandbox; panel w istniejącej ofercie; rzeczywiste zapisy wpłat i zwrotów; oddzielny symulator rentowności.'],
 ['QA lokalny','Końcowy zestaw 83 testów/grup PASS. Regresja koszyka galerii PASS. Testy używają syntetycznych danych i kontrolowanych zależności.'],
 ['Nieuruchomione','Publiczny upload i podgląd Prodigi, zakup w koszyku, bufor po sesji, produkcja, dokumenty, KSeF, mBank, reklamacje i pełna obsługa wysyłek.'],
 ['Produkcja','Nie wdrożono tej integracji sprzedażowej. Zmiany zapisano w draft PR #91. Nie uruchomiono płatnych zleceń ani migracji produkcyjnych.'],
 ['Dostęp do admina','Przeglądarka audytowa otrzymała 502. Niezależny anonimowy odczyt /admin zwrócił HTTP 200; hosting pokazał aktywne wdrożenie. Przyczyna różnicy nieustalona.'],
 ]),Spacer(1,14),
 p('W tej aktualizacji wyniki historyczne i dzisiejsze są oddzielone. „PASS lokalny” nie oznacza odbioru po wdrożeniu, potwierdzonej marży ani gotowości do przyjmowania zamówień.','small'),
 p('Kod: draft PR https://github.com/pwlasniewski-dot/wlasniewski_page/pull/91<br/>Wersja: '+escape(commit),'small'))

page('Czy warto inwestować czas?','DECYZJA BIZNESOWA • najpierw koszt i popyt, potem większa automatyzacja',
 'Rekomendacja pozostaje ograniczona: przeprowadzić mały pilot 2–3 produktów, równolegle pozyskując klientów na sesje. Przy małej liczbie zleceń sama integracja nie zapewni sprzedaży. Najłatwiejszą pierwszą próbą jest dobrowolna oferta wydruku dla klientów posiadających już galerię.',
 table(['Warunek wyboru','Co musi być porównane lub zmierzone'],[
 ['Produkt identyczny','Ten sam format, papier/płótno, wykończenie, rama, liczba sztuk i docelowy adres. Cen „od” nie traktować jako porównania.'],
 ['Pełny koszt','Produkcja, opakowanie, każda paczka, podatki/import, przewalutowanie, płatność, reklama, szkody oraz praca właściciela.'],
 ['Porównanie dostawców','Prodigi i dwie alternatywy; osobna kolumna na cenę konta, termin, śledzenie, reklamacje i reprint. Dzisiaj brak zwycięzcy kosztowego.'],
 ['Próbka fizyczna','Kolor skóry, kadr, rozmiar, materiał, rama, opakowanie i rzeczywista dostawa. Dobry podgląd nie dowodzi jakości druku.'],
 ['Decyzja o skali','Dodatni wkład po pełnych kosztach oraz wykonalna liczba godzin. Koszt reklamy rośnie według pomiaru, nie automatycznej obietnicy symulatora.'],
 ]),Spacer(1,13),
 '<b>Nie ma jeszcze potwierdzonej marży Prodigi dla tego sklepu.</b> API umożliwia wycenę bez zamówienia, lecz kwoty sandbox mogą różnić się od live. Stawki testowe nie powinny automatycznie zmieniać publicznych cen.',
 p('Przy niewielkim popycie pierwsze znaczenie mają oferta, zaufanie i pozyskiwanie klientów. Czas wdrożenia jest kosztem inwestycji, również gdy prace wykonuje się z pomocą GPT.','small'))

page('Utrzymany proces klienta i bufor','REGUŁA NADRZĘDNA • płatność nie uruchamia przedwczesnego druku',
 Process(),Spacer(1,10),
 'To docelowy proces, a nie zakres uruchomiony w tej rundzie. Gotowe własne zdjęcie może pominąć oczekiwanie na sesję, ale nadal wymaga kontroli pliku, uprawnienia i akceptacji.',
 table(['Reguła','Wymaganie implementacji'],[
 ['Przykład a finalny plik','Zdjęcie użyte do inspiracji nie może zostać wysłane do druku. Akceptacja wskazuje konkretną wersję pliku, kadru i opcji.'],
 ['Zmiana po płatności','Kolor ramki/format ustalany po sesji; zmiana kosztu wymaga jawnego rozliczenia. Nie nadpisujemy historycznej ceny klienta.'],
 ['Galeria i konto','Nowe konto samo w sobie nie ma galerii. Otwieramy wyłącznie galerię przypisaną do klienta; własny plik jest odrębną drogą.'],
 ['Zachęta do sesji','Rzeczywiste portfolio i dobrowolne CTA. Zakup własnego wydruku pozostaje możliwy bez sesji. Podgląd nie gwarantuje przyszłego efektu zdjęcia.'],
 ]))

page('Gdzie obsługiwać integrację w adminie','MAPA UMIEJSCOWIENIA • jeden rejestr zamówień',
 table(['Zadanie','Miejsce i odpowiedzialność'],[
 ['Oferta wspólna','Oferta galerii → /admin/gallery-shop. Ceny, widoczność, formaty i dotychczasowe produkty. Przyszły katalog Prodigi ma rozszerzyć ten proces.'],
 ['Test Prodigi','Osobny zwijany blok przy nagłówku wspólnej oferty, ze skrótem „Test Prodigi”. Usunięto go z sekcji wysyłki Foto-Dron/InPost.'],
 ['Galeria klienta','Galerie → konkretna galeria → oferta/wyjątki. Link do zamówień tej galerii; konfiguracja wspólna dziedziczona bez kopiowania.'],
 ['Zamówienie i paczki','Rezerwacje → Zamówienia → szczegóły. Tu docelowo płatności, bufor, produkcja, statusy paczek, dokumenty i sprawy; bez nowego centrum /commerce.'],
 ['Wpłaty i rentowność','Analityka → Wyniki sprzedaży. Dane rzeczywiste i dotychczasowe KPI najpierw, symulator rozwijany poniżej. Skrót: /admin/analytics?view=sales.'],
 ['InPost obecnego sklepu','Konfiguracja dostawy i mapa mają istniejące funkcje. Potwierdzenie ich działania nie kwalifikuje dostawy Prodigi do Paczkomatu.'],
 ]),Spacer(1,14),
 '<b>Audyt produkcyjnego panelu nie został wykonany.</b> Próby /admin i /admin/login kończyły się 502 w przeglądarce audytowej, przed logowaniem. Nie użyto danych logowania ani nie zmieniono hostingu.',
 p('Ustalenia mapy pochodzą z aktualnego repozytorium i niezależnego przeglądu kodu. Liczba kliknięć i faktyczny układ na ekranie produkcyjnym wymagają osobnego potwierdzenia.','small'))

page('QA admina: poprawki i otwarte utrudnienia','R5 • wykrycie → poprawka → retest',
 table(['Zgłoszenie','Wynik i granica odbioru'],[
 ['UX-001 / zamknięte lokalnie','Przełączanie zakładek gubiło szkic symulacji. Panel zachowuje komponent i wpisane wartości. Test zmiany zakładki i powrotu PASS.'],
 ['UX-002 / zamknięte lokalnie','Finanse były poza panelem wskazanym przez zakładkę. Jeden panel sales obejmuje całość i pozostaje dostępny przy awarii analytics v3.'],
 ['UX-003 / zamknięte lokalnie','Długi symulator przesuwał bieżące wyniki. Jest domyślnie zwinięty, poniżej faktów i istniejących lejków.'],
 ['UX-004–006 / lokalnie','Oddzielono test Prodigi od wysyłek Foto-Dron, dodano skróty, doprecyzowano odświeżanie. Kafel zamówień opisuje wartość PLN, nie przychód po zwrotach.'],
 ['UX-007 / częściowo','Siatki kart dopasowują się do dostępnej szerokości; SKU przechodzi w dwie kolumny dopiero na dużym ekranie; długie ciągi mogą się łamać. Pomiar wizualny NOT RUN.'],
 ['OPEN / istniejący admin','Siedmiokolumnowa tabela zamówień utrudnia dostęp do akcji na telefonie. Potrzebne mobilne karty; nie przebudowano tego widoku w tej rundzie.'],
 ['OPEN / istniejący admin','Menu schowane transformacją wymaga zarządzania fokusem, Escape i celów dotykowych 44 px. Stare katalogi i powrót z galerii wymagają uporządkowania.'],
 ]),Spacer(1,10),
 p('Restrykcyjny odbiór: nie zaliczamy responsywności całego admina na podstawie klas CSS. Wymagane ekrany 320, 390, 768 i 1440 px, długie dane, zoom 200%, klawiatura, dotyk, błędy i stan pusty.','small'))

page('Adapter i diagnostyka piaskownicy','IMPLEMENTACJA • tylko produkty i wyceny, bez zamówień',
 table(['Element','Kontrakt bieżącego etapu'],[
 ['Dostęp','Administrator; POST z tym samym Origin, JSON, limit 16 KiB i limit zapytań. GET pokazuje obecność konfiguracji, nie udaje potwierdzonego połączenia.'],
 ['Sekret i adres','PRODIGI_SANDBOX_API_KEY wyłącznie na serwerze. Stały host api.sandbox.prodigi.com; brak pola dowolnego URL i brak przełącznika live.'],
 ['Dozwolone operacje','GET produktu /v4.0/products/{sku}, POST /v4.0/quotes. Brak endpointów tworzenia zamówienia, drukowania, refundu i tworzenia przesyłki.'],
 ['Zakres wyceny','PL/PLN; GLOBAL-CAN-10X10 oraz GLOBAL-FAP-10X10, jedno pole default, bez wkładek i dodatków. API 1–10 pozycji; interfejs sprawdza jeden SKU z ilością.'],
 ['Kontrola odpowiedzi','Komplet kosztów PLN, przewidywane przesyłki i dodatni koszt produktu. Ostrzeżenia, brak kosztu i puste przesyłki nie stają się poprawną wyceną.'],
 ['Błędy i czas','12 s do dostawcy, 20 s dla przeglądarki. Kontrolowany komunikat i ponowienie; brak automatycznego retry. Limit odpowiedzi 1 MiB, redirecty zablokowane.'],
 ['Ograniczenie','Inne SKU tylko informacyjnie. Albumy/pageCount, dodatkowe pola i branding potrzebują odrębnej kwalifikacji. Dane klienta i zdjęcia nie są wysyłane.'],
 ]),Spacer(1,12),
 '<b>NOT RUN: rzeczywiste połączenie z kontem Prodigi.</b> W dostępnym środowisku nie było klucza sandbox. Testy kontraktu i błędów wykonano na kontrolowanych odpowiedziach, bez fizycznej realizacji.',
 p('Wyświetlony przewoźnik i kraj z wyceny są przewidywane. Kwoty API nie potwierdzają pełnego kosztu podatkowego, trasy, śledzenia ani dostępności Paczkomatu.','small'))

page('Finanse: zapisane fakty i ich ograniczenia','DANE RZECZYWISTE • saldo wpłat nie jest zyskiem',
 'Nowy raport pobiera wpłaty i zwroty w PLN według dat zdarzeń. Pokazuje część pochodzącą z rejestru płatności oraz starszych zapisów. Odczyt finansów działa niezależnie od raportu ruchu.',
 table(['Zgłoszenie','Poprawka i odbiór'],[
 ['FIN-001 / waluty','PLN odrębnie; waluty obce nie są sumowane jako złotówki. Komunikat o wykluczonych zapisach.'],
 ['FIN-002–003 / dedup','Powiązania ledger i starszych płatności, również poza okresem; ograniczenie podwójnego liczenia refundu. Odczyt w spójnym snapshotcie.'],
 ['FIN-004–006 / odczyt','Auth administratora, no-store, daty Warszawa/DST, limit 366 dni. Błąd źródła daje brak danych, a zmiana zakresu usuwa stare kwoty.'],
 ['FIN-007 / odporność','Niepełna odpowiedź mogła przewrócić render. Walidacja zakresu, sum, listy uwag i dat. Test 17 wadliwych payloadów: kontrolowana odmowa, bez crasha.'],
 ['FIN-008 / timeout','Limit 20 s, odblokowanie ponowienia; spóźniona odpowiedź po anulowaniu nie pokazuje sukcesu.'],
 ]),Spacer(1,14),
 '<b>Otwarte ograniczenia:</b> brak uzgodnienia z mBank, niepełne historyczne wpłaty i historia wielu częściowych zwrotów. Obecny model refundu nie zapisuje kompletnej osi zdarzeń. Nie zastępuje to rachunkowości ani wyciągu bankowego.',
 'Koszty, przychód księgowy i zysk pozostają oznaczone jako niedostępne. Wpłata za niewykonaną sesję lub wydruk nie jest wolnym zyskiem. Automatyczne faktury/KSeF i korekty nadal wymagają implementacji i testów.',
 p('Kafel w Zamówieniach zmieniono na „Wartość opłaconych zamówień · PLN”. Opisuje wszystkie wczytane zamówienia, bez filtrów i bez rozliczenia zwrotów, z linkiem do właściwych finansów.','small'))

page('Symulator rentowności i skali sprzedaży','MODEL HIPOTETYCZNY • żadna kwota nie jest ofertą Prodigi',
 'Edytowalne założenia: wizyty, konwersja, koszyk z dostawą, pełny koszt dostawcy, prowizja, rezerwa, reklama, koszty stałe, czas obsługi, stawka pracy, nakład, cel i horyzont. Scenariusz zapisuje się wyłącznie na danym urządzeniu; nie jest synchronizowany.',
 table(['Przykład domyślny','Wartość przyjęta do demonstracji'],[
 ['Popyt i koszyk','1000 wizyt/mies., konwersja 1%, koszyk 199 zł → 10 zamówień i 1990 zł wpływów modelowych.'],
 ['Koszty jednostkowe','Dostawca z dostawą 110 zł; płatność 2% + 0,30 zł; rezerwa 2%; obsługa 10 min przy stawce 60 zł/h.'],
 ['Koszty okresu','Reklama 300 zł, pozostałe koszty stałe 100 zł miesięcznie. Stałą pracę marketingową i administracyjną należy dopisać do kosztów stałych.'],
 ['Wynik','307,40 zł miesięcznie po wycenie obsługi; przed PIT i ZUS. To rachunek założeń, nie prognoza sprzedaży.'],
 ['Cel 20 tys. / 40 tys.','289 / 572 zamówienia, czyli 28 900 / 57 200 wizyt przy konwersji 1% i tych samych kosztach. Większy ruch może wymagać wyższego budżetu.'],
 ]),Spacer(1,13),
 '<b>Wzór:</b> wynik = zamówienia × (koszyk − dostawca − płatności − rezerwa − obsługa) − reklama − stałe koszty. Reklama jest odjęta raz.',
 '<b>ROI:</b> (wynik miesięczny × miesiące − nakład startowy) / nakład startowy. Przy stracie brak dodatniego czasu zwrotu. Brak nakładu oznacza nieadekwatność procentowego ROI.',
 p('Baza: pełne wpływy i koszty dla wariantu bez odliczenia VAT lub samodzielnie ujednolicone netto. Przełącznik nie przelicza podatków. Koszt własnego czasu wdrożenia należy ująć w nakładzie.','small'))

page('Rejestr wykonanych testów','KOŃCOWY ZESTAW • 83 przypadki/grupy, bez dodawania powtórek',
 table(['Seria','Zakres i rzeczywisty wynik'],[
 ['POD-S01–13','13 testów domeny/adaptera. Stały host, brak klucza, walidacja, wiele pozycji wyceny, błędy transportu, limit danych, ostrzeżenia, waluty, allowlista. PASS.'],
 ['POD-A / POD-U','13 grup API i React DOM. Auth przed odczytem, Origin/JSON, limit, konfiguracja, wariant/ilość, reset wyceny, brak wymaganych pól i timeout. PASS.'],
 ['Symulator','13 testów matematycznych i 8 grup DOM: puste/złe wartości, zerowa konwersja, strata, ROI, zapis i trzy odmienne pętle zapis/odczyt. PASS.'],
 ['Finanse','22 testy aktualnego zestawu: domena, rzeczywisty handler z kontrolowaną bazą/JWT, React, odmowy, zakresy, błędne odpowiedzi i timer. PASS.'],
 ['Układ analityki','12 grup DOM, w tym dotychczasowa regresja, stały panel sprzedaży, zachowanie szkicu i otwarcie przez skrót. PASS.'],
 ['Kafel zamówień','2 nowe grupy: kwoty wyłącznie PLN, zakres bez filtrów i link do finansów. PASS.'],
 ['Koszyk istniejący','npm run test:gallery-shop po zmianach rozmieszczenia: PASS. Operatorzy i baza są symulowani.'],
 ]),Spacer(1,11),
 p('Dowody: docs/qa/prodigi-2026-09-24/ i testy wskazane w docs/PRODIGI_STAGE_2026_09_24.md. Polecenie zbiorcze: npm run test:prodigi-foundation. Numery są identyfikatorami dokumentacji, nie automatycznie utworzonymi zgłoszeniami w zewnętrznym trackerze.','small'),
 p('Nie wykonano rzeczywistego zakupu, wydruku, faktury, zwrotu środków, dostawy i reklamacji. Historyczne wyniki wcześniejszych aneksów nie powiększają dzisiejszej liczby testów.','small'))

page('Pętle poprawek, środowisko i blokady','QA • zachowany zapis niepowodzeń',
 table(['Runda / zgłoszenie','Przebieg i rezultat'],[
 ['R1 → R2 / POD-001–003','Pierwsze 11 unit PASS; niezależny review ujawnił niepełną logistykę wyceny, produkty z dodatkowymi polami i pomijanie required. Dodano walidację i testy S12/S13/U05. PASS.'],
 ['R2 / POD-004','Wiszący POST mógł blokować panel. Dodano timeout; niezależny test z przyspieszonym zegarem potwierdził komunikat i ponowienie.'],
 ['R3 / POD-005','Regresja starego zapisu galerii: automatyczny GET diagnostyki dodawał niepowiązany alert. Zmieniono na panel otwierany na żądanie. Regresja PASS.'],
 ['R4 / POD-006','Brak timeout początkowego GET. Dodano 20 s i test U06. PASS.'],
 ['R5 / FIN i UX','Niepełny kontrakt finansów, utrata szkicu, zła kolejność informacji i umiejscowienie Prodigi. Poprawiono i rozszerzono zestaw z 67 do 83 przypadków/grup.'],
 ['Prisma / typy','Prisma generate PASS. Domyślna kontrola typów przerwana OOM przy 2 GB. Ponowienie przy 4 GB zakończone; baza i końcowa wersja po R5: po 103 diagnostyki, 56 różnych, bez nowych. Cały projekt nadal FAIL.'],
 ['Browser / produkcja','Brak lokalnej przeglądarki; jej pobranie nieudane. Cloud browser otrzymał 502 dla panelu. Lokalny podgląd file został odrzucony przez politykę przeglądarki. Nie stosowano obejścia.'],
 ]),Spacer(1,10),
 p('Środowisko wykonania: Node 24.19.0 i Prisma 5.22. Repo deklaruje Node 22. Odbiór końcowy wymaga wspieranego runtime, pełnego build/typecheck oraz rzeczywistej przeglądarki. Testy DOM nie dowodzą prawidłowego układu pikselowego.','small'))

page('Braki do odzyskania i następny etap','RECOVERY-01 • istotne dla porównania z wydrukiem',
 'Ostatni wcześniejszy aneks opisywał kod lokalnej gałęzi feature/prodigi-catalog-pricing, bez wysłania do zdalnego repozytorium. Dzisiejsze main i dostępne gałęzie nie zawierają tamtych plików bufora/katalogu. Nie udało się ich odzyskać z dostępnych materiałów.',
 '<b>Nie oznaczamy tego kodu jako wdrożonego ani nadal dostępnego.</b> PDF pozostaje specyfikacją i historycznym dowodem testów. Wymagane odzyskanie checkpointu albo odtworzenie zgodnej implementacji i nowy odbiór na aktualnym modelu zamówień.',
 table(['Kolejność','Warunek ukończenia'],[
 ['1. Konto i opłacalność','Klucz sandbox w środowisku podglądu; realne wyceny PL; ceny live bez zamówienia; porównanie dostawców i próbki.'],
 ['2. Katalog i marże','Odzyskany/odtworzony silnik globalna → grupa → produkt → wariant → cena stała; nowe ceny tylko dla nowych ofert. Potwierdzone koszty i kwalifikacja wariantu.'],
 ['3. Klient i koszyk','Prywatny upload, profesjonalny podgląd i CMS zachęty; produkt, sesja lub oba; wspólne zamówienie i dokładna cena.'],
 ['4. Bufor i realizacja','Płatność, sesja, finalna akceptacja, jawne dopłaty, adres i usługa, atomic claim/outbox, stały klucz idempotencji oraz uzgodnienie nieznanego wyniku.'],
 ['5. Obsługa po zakupie','Paczki i tracking, anulowanie, reklamacja, historia refundów, faktura/korekta/KSeF i rozliczenia bankowe. InPost dla Prodigi osobno kwalifikowany.'],
 ['6. Pilot','Build, izolowana baza, browser/mobile, sandbox, fizyczny test oraz zamknięte ryzyka krytyczne; dopiero ograniczona sprzedaż klientom.'],
 ]))

page('Odbiór po wdrożeniu i ślad wersji','PLAN DALSZYCH DOWODÓW • testy niewykonane pozostają NOT RUN',
 table(['Przebieg odbioru','Dowód wymagany przed PASS'],[
 ['Kilka produktów','Dwie fotografie, różne warianty i ilości; cena w ofercie/koszyku/płatności taka sama. Wersja snapshotu i identyfikator zamówienia.'],
 ['Sesja z produktem','Płatność przed sesją, brak przekazania zdjęcia przykładowego; finalna galeria, opcje, akceptacja i pojedyncza realizacja.'],
 ['Dokument i wysyłka','Właściwy dokument według ustalonego obowiązku; poprawny odbiorca, zawartość paczek, potwierdzony tracking. Status Complete nie oznacza doręczenia.'],
 ['Anulowanie / reklamacja','Przed i w trakcie przekazania; potwierdzony skutek dostawcy; jedna sprawa klienta, częściowy refund i korekta bez dublowania.'],
 ['Admin na urządzeniach','320/390/768/1440 px, zoom 200%, klawiatura, długie etykiety i kwoty; dostęp do akcji zamówienia bez szukania na końcu szerokiej tabeli.'],
 ['Pętla zgłoszenia','Numer → reprodukcja → dowód → poprawka → wersja → retest → werdykt. Brak dowodu nie może zostać zastąpiony deklaracją gotowości.'],
 ]),Spacer(1,14),
 p('<b>Źródła sprawdzone 24.09.2026:</b><br/>Prodigi API: https://www.prodigi.com/print-api/docs/reference/<br/>Sandbox: https://www.prodigi.com/faq/print-api/<br/>Ceny: https://www.prodigi.com/faq/payments-and-pricing/<br/>Wysyłka: https://www.prodigi.com/faq/shipping/','small'),
 p('Źródła projektu: oryginalny PDF v6 (76 stron), AGENTS.md, main 9c10ac6, draft PR #91. Aktualny szczegółowy rejestr: docs/PRODIGI_STAGE_2026_09_24.md. Allegro pozostaje poza zakresem.','small'),
 p('<b>Werdykt v7:</b> lokalny fundament i poprawki admina sprawdzone w opisanym zakresie. Integracja sprzedażowa oraz pełna responsywność produkcyjnego panelu nie mają jeszcze odbioru.','small'))

def footer(c,doc):
 c.saveState();c.setStrokeColor(colors.HexColor('#D2E0E4'));c.line(42,40,553,40)
 c.setFont('DV',8);c.setFillColor(gray);c.drawString(42,25,'24.09.2026 • v7 • etap diagnostyczny, bez odbioru produkcyjnego');c.drawRightString(553,25,str(76+doc.page));c.restoreState()
annex=out.with_name('_prodigi_v7_annex.pdf')
doc=SimpleDocTemplate(str(annex),pagesize=(595.28,841.89),leftMargin=42,rightMargin=42,topMargin=42,bottomMargin=55,title='Prodigi — aneks wdrożeniowy v7',author='Foto-Dron / dokumentacja wdrożenia')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
old=PdfReader(source);new=PdfReader(annex)
if len(old.pages)!=76:raise ValueError('Expected original 76 pages; do not overwrite another version')
writer=PdfWriter(clone_from=source);writer.append(annex,import_outline=False);writer.add_outline_item('Aneks v7 — 24.09.2026: diagnostyka, rentowność i QA admina',76)
writer.add_metadata({'/Title':'Plan integracji Prodigi — Właśniewski, v7','/Subject':'Stan wdrożenia i QA 24.09.2026; historia stron 1–76 zachowana'})
with out.open('wb') as f:writer.write(f)
result=PdfReader(out)
assert len(result.pages)==76+len(new.pages)
for i in range(76):
 assert old.pages[i].extract_text()==result.pages[i].extract_text(),f'Historical text changed page {i+1}'
 assert old.pages[i].get_contents().get_data()==result.pages[i].get_contents().get_data(),f'Historical content changed page {i+1}'
print('Saved',out,'pages',len(result.pages),'annex',len(new.pages),'history preserved:76/76')
