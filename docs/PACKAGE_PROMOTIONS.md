# Promocje konkretnych pakietów

## Cel biznesowy

Promocja jest przypisana do jednego pakietu, np. `Sesja / Rodzinny Start`, i automatycznie obowiązuje w całym lejku: kafelek strony głównej, rezerwacja, koszyk, zapis rezerwacji oraz PayU.

Nie jest to kod rabatowy. Klient nie wpisuje kodu, a serwer nie ufa cenie przesłanej przez przeglądarkę.

## Jedno źródło ceny

1. `Package.price` pozostaje zwykłą ceną pakietu.
2. Aktywna `PackagePromotion` przechowuje migawkę zwykłej ceny, cenę promocyjną oraz najniższą cenę z 30 dni przed rozpoczęciem obniżki.
3. Serwer ustala aktywną promocję na podstawie dat i ponownie weryfikuje ją w checkout.
4. `Booking.booking_snapshot` zapisuje pełną migawkę promocji wykorzystanej w zamówieniu.

## Informacja dla klienta

Przy aktywnej promocji wszędzie należy pokazać:

- cenę promocyjną,
- zwykłą cenę przekreśloną,
- tekst: `Najniższa cena z 30 dni przed obniżką: …`,
- termin zakończenia, jeżeli został ustawiony,
- procent obniżki liczony względem ceny referencyjnej z 30 dni, a nie dowolnej ceny katalogowej.

## Pierwsze 30 dni działania systemu

Dawna aplikacja nie zapisywała historii cen. Migracja tworzy punkt startowy oznaczony jako niezweryfikowany. Dopóki system nie ma pełnego 30-dniowego okna, administrator musi ręcznie potwierdzić rzeczywistą najniższą cenę. Po zebraniu pełnego okna wartość jest wyliczana automatycznie z historii zwykłych cen oraz wcześniejszych promocji.

## Łączenie rabatów

Promocja pakietu domyślnie nie łączy się z kodami rabatowymi. Wyjątek wymaga świadomego włączenia przy konkretnej promocji. Karty podarunkowe pozostają środkiem płatniczym i mogą obniżyć kwotę do zapłaty.

## Zakończenie i anulowanie

- przyszłą, jeszcze nieuruchomioną promocję można wyłączyć;
- rozpoczętej promocji nie usuwa się z historii — kończy się ją, ustawiając czas zakończenia;
- historyczne dane są potrzebne do późniejszego wyliczania najniższej ceny z 30 dni.

## Pomiar

Minimalne zdarzenia:

- `promotion_view`,
- `promotion_package_selected`,
- `booking_start`,
- `checkout_started`,
- płatność potwierdzona.

Raport porównuje pakiet promowany z jego wynikiem sprzed promocji oraz kontroluje średnią wartość zamówienia.
