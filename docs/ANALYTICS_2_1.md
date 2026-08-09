# Analytics 2.1 — lejek i diagnostyka

Raport dzienny jest wysyłany na adres z `ANALYTICS_REPORT_RECIPIENTS`. Jeśli zmienna nie jest ustawiona, jawnym odbiorcą awaryjnym jest `pwlasniewski@gmail.com`.

Lejek: rezerwacja → usługa → pakiet i cena → data → godzina → formularz/koszyk → checkout → zlecenie płatności → przekierowanie PayU.

Tracker zapisuje wyłącznie identyfikatory sesji/użytkownika Analytics, bez imienia, e-maila, telefonu, treści formularza, wybranej daty lub pełnej ceny. Kwota jest grupowana w przedziały. Błędy zawierają jedynie obszar, kategorię, status HTTP i bezpieczny kod przyczyny — nigdy komunikat wyjątku.

Reguły diagnozy:

- błąd techniczny z trackera ma wysoką pewność;
- wolne LCP ma średnią pewność przy małej próbie i wysoką od 3 sesji;
- odpływ jest raportowany od 2 sesji i co najmniej 30%;
- odpływ po wyborze pakietu może wskazywać na cenę lub ofertę, ale zawsze pozostaje hipotezą o niskiej pewności bez ankiety albo testu wariantów;
- przy zerowych danych raport podaje instrukcję testu trackera, zamiast tworzyć sztuczne wnioski.

## Znane ograniczenie

Ta iteracja mierzy poprawne utworzenie checkoutu i przekierowanie do PayU. Nie zapisuje jeszcze kanonicznego `payment_result` z serwerowego webhooka PayU do Analytics, ponieważ webhook nie ma bezpiecznego powiązania z anonimowym identyfikatorem sesji. Ostateczny wynik płatności nadal należy potwierdzać w rejestrze płatności; nie wolno wyciągać go wyłącznie z klientowego lejka.
