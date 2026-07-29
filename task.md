# Aktualny plan prac

## Pakiet: pełny audyt, newsletter, CRM i SEO — 2026-07-29

### Zaimplementowane w gałęzi

- [x] Pełny audyt kodu, produkcji, raportu Ahrefs, SEO, CRM, wydajności, bezpieczeństwa i UX.
- [x] `ARCHITECTURE.md` i `FUNCTIONAL_SPECIFICATION.md` jako obowiązkowe wejście/wyjście.
- [x] Raport `docs/AUDIT_2026-07-29.md` i checklista PR.
- [x] Zgoda newsletterowa we wszystkich głównych formularzach, rejestracji, checkout i koncie.
- [x] Dowód zgody, token/czas rezygnacji, synchronizacja CRM i konto.
- [x] Informacja newsletterowa w polityce prywatności.
- [x] Serwerowy blog, jeden H1, JSON-LD i zoptymalizowane obrazy.
- [x] Kodowanie sitemap i wykluczenie duplikatów B2B.
- [x] Prisma schema validate/generate.
- [x] Produkcyjny build (kod 0; z atrapą bazy, wcześniejsze ostrzeżenia zapisane w audycie).

### Blokery przed merge/deploy

- [ ] Przejrzeć i wykonać migrację `20260729193000_add_newsletter_consent_evidence`.
- [ ] Deploy Preview i test na telefonie.
- [ ] Smoke: formularz bez/z newsletterem, CRM, konto, wypis, checkout, blog, sitemap.
- [ ] Po wdrożeniu sprawdzić logi, 5xx i zapisy w bazie.
- [ ] Dopisać wynik oraz commit/deploy do historii.

### Następny pakiet P1

- [ ] Publiczny cache i TTFB bez cachowania danych prywatnych.
- [ ] Aktualizacja 18 podatnych zależności z testami.
- [ ] Zielony TypeScript/ESLint i usunięcie flag ignorowania.
- [ ] Cookie-only auth zamiast `localStorage`.
- [ ] Public/admin blog API oraz przekierowania starych slugów.
- [ ] Pełna atrybucja lead → zamówienie → przychód.
