# Weryfikacja multimediów produktów — 2026-09-14

1. Admin: edytuj film MP4 i rozkładówki, zapisz produkt, odśwież.
2. Podgląd klienta: film pojawia się dopiero po wyborze, bez autoplay; po przejściu na zdjęcia znika.
3. Wnętrze: granice poprzednia/następna, podpis przykładowej realizacji, gest poziomy.
4. Testy: npm run test:gallery-shop. Zapis API sprawdza uprawnienia i błędne adresy.
5. Publiczna oferta i galerie korzystają z identycznych pól bez zmiany koszyka i cen.

Na produkcji zweryfikowano zapis zdjęć Lite i Canvas; wdrożenie kodu pozostaje do potwierdzenia.

Media: tworzenie folderu używa pola tekstowego w panelu zamiast systemowego prompt; folder zostaje utrwalony po dodaniu plików.
