"""Append a three-page release-gate QA annex to the 95-page v8 PDF.
Usage: python append_prodigi_v9.py INPUT OUTPUT
"""
import sys
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, PageBreak, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter

source, target = map(Path, sys.argv[1:3])
base = PdfReader(source)
assert len(base.pages) == 95, 'Expected v8, 95 pages'
for name, font in [('D', 'DejaVuSans.ttf'), ('DB', 'DejaVuSans-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name, '/usr/share/fonts/truetype/dejavu/' + font))
pdfmetrics.registerFontFamily('D', normal='D', bold='DB', italic='D', boldItalic='DB')
navy = colors.HexColor('#18364A')
styles = {name: ParagraphStyle(name, fontName='DB' if name == 'title' else 'D',
    fontSize=size, leading=leading, textColor=navy, spaceAfter=10)
    for name, size, leading in [('title', 21, 26), ('body', 10, 14), ('small', 8.5, 12)]}
story = []
def p(text, style='body'): return Paragraph(text, styles[style])
def table(rows):
    result = Table([[p(a, 'small'), p(b, 'small')] for a,b in rows], colWidths=[135,376])
    result.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),
        ('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#EFF5F7')),
        ('GRID',(0,0),(-1,-1),.4,colors.HexColor('#C4D5DC')),
        ('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),
        ('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
    return result
def page(title, *items):
    if story: story.append(PageBreak())
    story.extend([p(title,'title'), p('ANEKS v9 / 24.09.2026 / LOGIKA REALIZACJI I DOWODY QA','small')])
    for item in items: story.append(p(item) if isinstance(item,str) else item)

page('Pierwszy etap kodu bramki druku',
 '<b>Wykonano:</b> czysty moduł kontroli gotowości produktu do przyszłego przekazania do Prodigi. Kod sprawdza dane i zwraca przyczyny blokady. Nie tworzy zamówienia, nie pobiera pieniędzy ani nie zmienia istniejącego eksportu ZIP.',
 table([
 ('Nowy kod','src/lib/fulfillment/prodigi-release-gate.ts. Kontrola danych w czasie wykonania, odciski SHA-256 wersji pozycji i specyfikacji wyceny.'),
 ('Płatność i bufor','Oczekiwanie na sesję, niedopłata, refund powodujący niedopłatę lub spór płatniczy blokują gotowość. Samo opłacenie zamówienia nie wystarcza.'),
 ('Zdjęcie i proof','Finalny plik musi należeć do wskazanego zamówienia i klienta, mieć zaliczoną kontrolę jakości oraz akceptację konkretnej specyfikacji. Podgląd nie jest plikiem produkcyjnym.'),
 ('Zmiana po akceptacji','Zmiana SKU, wariantu, ilości, ceny pozycji, kadru albo wersji pliku unieważnia zgodność proof. Adres lub usługa dostawy wymagają ponownej wyceny.'),
 ('Ponowienie','Stany submitting, submitted i unknown blokują gotowość. To kontrola wejściowego stanu, NIE dowód zabezpieczenia równoległych żądań w bazie.'),
 ('Produkty i usługi','Z wyniku wychodzą tylko identyfikatory pozycji drukowanych. Sesja, spacer i montaż nie trafiają do laboratorium. Zgoda na publikację nie zastępuje proof.'),
 ]), Spacer(1,12),
 '<b>Granica:</b> funkcja nie jest jeszcze podłączona do API ani bazy. ordersEnabled:false pozostaje bez zmian. Pozytywny wynik lokalny nie oznacza działającej sprzedaży Prodigi ani ochrony istniejącego procesu na produkcji.',
 p('B2B-02: częściowa realizacja logiki, zgłoszenie pozostaje OPEN do czasu trwałego zapisu proof, adaptera danych, integracji i testów ścieżki klienta.','small'))

page('Testy i pętla kontroli jakości',
 '<b>33 testy lokalne PASS:</b> 20 grup autora POD-R01-R20 oraz 13 niezależnych przypadków POD-QA-00-POD-QA-12. Końcowy zestaw uruchomiono trzy razy: w każdej rundzie 33 PASS, 0 FAIL. Powtórzeń nie liczymy jako 99 różnych testów.',
 table([
 ('POD-R01-R06','Prawidłowe zlecenie mieszane, sesja oczekująca, anulowanie, niepewny submit, publikacja zamiast proof, plik przykładowy i cudzy plik.'),
 ('POD-R07-R11','Zmiany produktu, ceny, zdjęcia i kadru; skopiowana akceptacja; zmiana adresu/usługi; brak lub wygaśnięcie wyceny; daty z przyszłości.'),
 ('POD-R12-R16','Niedopłata i refund, porównanie pełnej wartości, błędne typy i waluty, przepełnienie arytmetyki, duplikaty pozycji i koszyk samych usług.'),
 ('POD-R17-R20','Akceptacja każdej z wielu pozycji, stabilny hash przy zmianie kolejności pól, brak modyfikacji danych wejściowych, limity kadru i ilości.'),
 ('Niezależny QA','Pozytywny punkt odniesienia i 12 prób negatywnych: m.in. powtórne użycie proof obcego zamówienia, zwrot 1 gr, granica ważności wyceny i preview zamiast finalnego pliku.'),
 ('Regresja','Ponownie PASS wcześniejszy zestaw 83 testów/grup diagnostyki Prodigi i analityki oraz npm run test:gallery-shop. Dane/transport w tych testach są kontrolowane, nie produkcyjne.'),
 ('Kontrola typów','Ścisły tsc nowego modułu i obu plików testów: PASS. Nie oznacza PASS całego repozytorium; wcześniejsze błędy globalne nie zostały w tej rundzie naprawione.'),
 ]), Spacer(1,10),
 '<b>POD-QA-F01:</b> niejednoznaczna nazwa kwoty pozycji. Doprecyzowano kontrakt: amountGrosze to pełna wartość wiersza z ilością i uzgodnionym rabatem, a nie cena jednostkowa. Retest: PASS.',
 p('Dowody: tests/unit/prodigi-release-gate*.test.ts, docs/qa/prodigi-release-round-1.log do -3.log, docs/qa/prodigi-release-gate-review.md. Polecenie: npm run test:prodigi-release. Środowisko Node 24.19.0; repo oczekuje Node 22. To nie testy po wdrożeniu.','small'))

page('Co musi powstać przed uruchomieniem',
 '<b>Zakres obecnej reguły:</b> PLN, dodatnio wyceniony produkt z jednym polem druku oraz pełne opłacenie sumy wszystkich pozycji i dostawy. Płatności etapowe B2B, kredyt kupiecki, darmowe próbki i wielostronicowe albumy wymagają osobnego rozszerzenia; nie są obsługiwane przez ten moduł.',
 table([
 ('1. Trwałe rekordy','Relacje projektu/oferty/rezerwacji, wersja specyfikacji i dowód akceptacji osoby uprawnionej. Hash nie jest podpisem, uprawnieniem ani zgodą klienta.'),
 ('2. Adapter danych','Odczyt zaufanych zapisów serwera. Klient nie może przesłać własnego paid, preflight:passed ani samodzielnie wygenerowanego proof jako dowodu uprawnienia.'),
 ('3. Warunki dostawcy','Potwierdzone SKU, wariant, wymiary, jakość pliku i adres/usługa. Czas ważności wyceny w module jest polityką sklepu, nie obietnicą gwarantowanej ceny Prodigi.'),
 ('4. Atomowe przekazanie','Kontrola rewizji i jedno zadanie outbox w transakcji. Worker z trwałą idempotencją i uzgodnieniem statusu po timeout. Ponowna kontrola stanu przed skutkiem zewnętrznym.'),
 ('5. Jeden admin','Szczegóły w Rezerwacje → Zamówienia. Akceptacja oferty, proof druku i publikacji spaceru pozostają osobnymi zdarzeniami; bez dodatkowego rejestru commerce.'),
 ('6. Odbiór E2E','Zapis i odczyt klient/admin, odmowa dostępu, dwa równoległe żądania, sandbox dostawcy, telefon i komputer, dokumenty, paczki, anulowanie, refund i reklamacja.'),
 ]), Spacer(1,12),
 '<b>Niewykonane teraz:</b> migracje, zmiany produkcyjnego panelu, prawdziwe połączenie z sandbox, zlecenie druku, płatność, faktura i wysyłka. Nie wysłano zdjęć ani danych klientów do dostawcy.',
 p('Kod na gałęzi roboczej feat/prodigi-sandbox-economics, draft PR #91, bez scalenia. Źródłem aktualnego zakresu jest docs/PRODIGI_RELEASE_GATE.md. Zachowano pierwsze 95 stron dokumentacji; te strony opisują kolejny lokalny etap, nie odbiór wdrożenia.','small'))

target.parent.mkdir(parents=True,exist_ok=True)
annex=target.parent/'prodigi-v9-annex.pdf'
def footer(canvas, doc):
    canvas.setFont('D',8);canvas.setFillColor(navy)
    canvas.drawString(42,28,'v9 / 24.09.2026 / lokalne testy logiki, bez wdrożenia produkcyjnego')
    canvas.drawRightString(553,28,str(95+doc.page))
SimpleDocTemplate(str(annex),pagesize=(595.28,841.89),leftMargin=42,rightMargin=42,
    topMargin=38,bottomMargin=48).build(story,onFirstPage=footer,onLaterPages=footer)
addition=PdfReader(annex)
assert len(addition.pages)==3, len(addition.pages)
writer=PdfWriter();writer.append(base);writer.append(addition)
writer.add_metadata({'/Title':'Plan integracji Prodigi Wlasniewski - v9 QA bramki druku'})
writer.add_outline_item('v9 - kod bramki druku i QA',95)
with target.open('wb') as handle: writer.write(handle)
result=PdfReader(target)
assert len(result.pages)==98
assert all(result.pages[i].extract_text()==base.pages[i].extract_text() for i in range(95))
print('PASS: 98 pages; original 95 page texts preserved; annex 96-98.')
