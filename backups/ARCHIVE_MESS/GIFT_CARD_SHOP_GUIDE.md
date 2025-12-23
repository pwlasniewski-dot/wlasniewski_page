# 📚 Jak Dodawać Karty Podarunkowe do Sklepu?

## 🔐 Login do Admina

1. Przejdź na `/admin/login`
2. Zaloguj się email: `pwlasniewski@gmail.com` i hasłem z pliku `.env`
3. Kliknij na **"🛍️ Karty w Sklepie"** lub otwórz bezpośrednio `/admin/gift-cards/sklep`

## ➕ Dodawanie Nowej Karty

### Krok 1: Kliknij "Dodaj Nową Kartę"
Przycisk znajduje się na górze strony z ikoną **➕**.

### Krok 2: Wypełnij Formularz

#### **Kod Karty** (wymagane)
- Unikalny identyfikator karty
- Np. `XMAS2024001`, `WALENTYNKI2025`
- Możesz wygenerować losowy kod klikając **🎲**

#### **Wartość (PLN)** (wymagane)
- Wartość karty podarunkowej w złotych
- Np. `500`, `1000`
- To będzie cena wyświetlana klientom

#### **Temat** (wymagane)
Wybierz z listy 9 dostępnych tematów:
- 🎄 Boże Narodzenie
- ❤️ WOŚP
- 💝 Walentynki
- 🐰 Wielkanoc
- 👻 Halloween
- 💐 Dzień Matki
- 🎈 Dzień Dziecka
- 💒 Ślub
- 🎂 Urodziny

#### **Tytuł Karty** (wymagane)
- Główny tekst na karcie
- Np. `KARTA PODARUNKOWA`, `VOUCHER NA SESJĘ`
- Wyświetlane duże na karcie

#### **Opis Karty** (wymagane)
- Krótki opis/szczegóły karty
- Np. `Specjalny upominek na święta`, `Rabat na sesję fotograficzną`
- Wyświetlane mniejszą czcionką pod tytułem

#### **Status**
- ✅ **Aktywna** - karta będzie widoczna w sklepie
- ❌ **Nieaktywna** - karta będzie ukryta (ale nie usunięta)

### Krok 3: Kliknij "Dodaj Kartę"
Karta pojawi się na liście i będzie dostępna w sklepie.

## ✏️ Edycja Karty

1. Kliknij przycisk **✏️ (Edit)** przy karcie
2. Zmień dane
3. Kliknij **"Zaktualizuj"**

## 🗑️ Usuwanie Karty

1. Kliknij przycisk **🗑️ (Trash)** przy karcie
2. Potwierdź usunięcie w popup'ie
3. Karta zostanie usunięta (nie będzie do odzyskania)

## 📊 Statystyki

Poniżej listy kart zobaczysz 3 liczniki:
- **Razem Kart** - ile kart jest w bazie
- **Aktywne** - ile kart jest dostępnych w sklepie
- **Łączna Wartość** - suma wszystkich wartości kart

## 🔍 Gdzie Widać Karty Klientów?

### Na Stronie Głównej
- Top strony: pasek promocyjny (GiftCardPromoBar) z rotacją tematów
- Kliknięcie na promocję przenosi do sklepu

### W Sklepie Kart
- URL: `/karta-podarunkowa`
- Wyświetlane są **tylko AKTYWNE karty**
- Karty można filtrować po tematach
- Kliknięcie "Kup teraz" przenosi do checkout

## 💡 Porady

### Generowanie Kodów
- Kliknij przycisk 🎲 żeby wygenerować losowy kod
- Lub wpisz ręcznie własny kod

### Aktywne vs Nieaktywne
- Ustaw kartę na **Nieaktywna** jeśli czasowo chcesz ją ukryć
- Nie będzie wymagała usuwania i ponownego dodawania

### Promptna Weryfikacja
Po dodaniu karty:
1. Przejdź na `/karta-podarunkowa` (shop)
2. Sprawdź czy karta się pojawia
3. Filtruj po temacie żeby upewnić się

## ❓ Co Jeśli Coś Nie Działa?

### Karta Nie Pojawia się w Sklepie
- Sprawdź czy status to "✅ Aktywna"
- Odśwież stronę (`F5`)
- Sprawdź czy temat został wybrany

### Nie Mogę się Zalogować
- Sprawdź email: `pwlasniewski@gmail.com`
- Sprawdź hasło w `.env` pliku
- Wyczyść cookies i spróbuj ponownie

### Błąd przy Dodawaniu
- Sprawdź czy wszystkie pola są wypełnione
- Kod musi być unikalny (niepowtarzalny)
- Wartość musi być liczbą > 0

## 📞 Support

Jeśli dalej coś nie działa, sprawdź:
1. Browser console (`F12` → Console)
2. Serwer logs
3. Database records w bazie

---

**Teraz możesz zarządzać kartami podarunkowymi! 🎁**
