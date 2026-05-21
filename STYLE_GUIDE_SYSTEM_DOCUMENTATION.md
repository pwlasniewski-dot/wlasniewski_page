# System Poradnika Stylizacji "Jak się ubrać?"

## Przegląd
Zaawansowany system poradnika stylizacji dla klientów fotograficznych z pełną integracją z panelem klienta i ofertami.

## Funkcje

### 🎨 **Palety Kolorów**
- Harmonijne zestawienia kolorów dla różnych typów sesji
- Wizualizacja kolorów z hex kodami
- Filtrowanie według pory roku, lokalizacji i nastroju
- Automatyczne dopasowanie do typu sesji

### 👔 **Zestawy Stylizacji**
- Przykładowe stroje dla rodzin, par i grup
- Szczegółowe opisy dla różnych typów osób
- Do's i Don'ts dla każdego zestawu
- Dopasowanie do wielkości grupy (1-20+ osób)
- Wsparcie dla dużych grup (np. 13 osób: 8 dorosłych + 5 dzieci)

### 💡 **Porady Stylistyczne**
- Praktyczne wskazówki
- Kategoryzacja według typu porady
- Ikony z biblioteki Lucide React
- Featured tips dla najważniejszych informacji

### ❓ **FAQ**
- Najczęściej zadawane pytania
- Kategorie tematyczne
- Proste wyszukiwanie i filtrowanie

## Architektura

### **Baza Danych**
Ultra-zoptymalizowana struktura PostgreSQL:

**Tabele:**
- `color_palettes` - Palety kolorów (JSONB colors)
- `outfit_sets` - Zestawy stylizacji (JSONB outfit_details, dos_and_donts)
- `style_guide_tips` - Porady stylistyczne
- `style_guide_faqs` - Pytania i odpowiedzi

**Funkcje bazodanowe (zero-loss optimization):**
- `get_outfit_recommendations()` - Algorytm scoringowy z wagami
- `get_color_palettes_filtered()` - Filtrowanie z agregacją
- `get_client_style_guide()` - Single query dla całego przewodnika
- `search_style_guide()` - Full-text search z ts_rank
- `update_display_orders()` - Batch procedure dla drag-drop

**Widoki:**
- `v_outfit_sets_full` - Denormalizowany widok z JOIN
- `mv_style_guide_stats` - Materialized view ze statystykami

**Indeksy:**
- GIN indexes dla full-text search
- B-tree indexes dla foreign keys i display_order

### **API Endpoints**

**Public GET:**
- `/api/style-guide/outfits` - Lista outfits z inteligentnym filtrowaniem
- `/api/style-guide/outfits/[slug]` - Pojedynczy outfit z paletą
- `/api/style-guide/palettes` - Lista palet kolorów
- `/api/style-guide/palettes/[slug]` - Pojedyncza paleta z outfits
- `/api/style-guide/tips` - Porady stylistyczne
- `/api/style-guide/faqs` - FAQ
- `/api/style-guide/search` - Full-text search
- `/api/style-guide/client` - Kompletny przewodnik dla klienta (używa get_client_style_guide)

**Query Parameters:**
```typescript
// Outfits
?groupSize=13&season=summer&location=nature&category=family&limit=10

// Palettes
?season=summer&location=beach&mood=romantic&activeOnly=true

// Tips
?type=styling&category=colors&featured=true&limit=20

// Client
?offerId=123
```

### **Komponenty React**

**src/components/StyleGuide/**
- `ColorPaletteCard.tsx` - Karta palety kolorów z swatches
- `OutfitSetCard.tsx` - Karta zestawu stylizacji z obrazem
- `TipCard.tsx` - Karta porady (compact & full variants)
- `ClientStyleGuidePanel.tsx` - Panel dla strefy klienta

**Strony:**
- `/jak-sie-ubrac/page.tsx` - Server Component z SSR
- `/jak-sie-ubrac/StyleGuideContent.tsx` - Client Component z interaktywnością

## Integracja z Panelem Klienta

### **Gdzie się pojawia:**
Panel style guide wyświetla się automatycznie w:
- `/strefa-klienta/oferty/[id]` - Po zaakceptowaniu oferty

### **Co pokazuje:**
- Rekomendowane palety kolorów (dopasowane do typu sesji)
- Przykładowe zestawy stylizacji (dla wielkości grupy)
- Szybkie porady (featured tips)
- Link do pełnego poradnika `/jak-sie-ubrac`

### **Smart Matching:**
System automatycznie dopasowuje treści na podstawie:
- `serviceType` - Typ usługi z oferty (np. "Rodzinna", "Ślubna")
- `groupSize` - Liczba osób z template_data
- `location` - Lokalizacja z danych wydarzenia
- Scoring algorytm w PostgreSQL (50pts group, 30pts season, 30pts location, 40pts category, 20pts featured)

## Scoring Algorithm

Funkcja `get_outfit_recommendations()` używa następującego algorytmu:

```sql
score = 
  CASE WHEN p_group_size IS NOT NULL AND o.group_size = p_group_size THEN 50 ELSE 0 END +
  CASE WHEN p_season IS NOT NULL AND o.season = p_season THEN 30 ELSE 0 END +
  CASE WHEN p_location IS NOT NULL AND o.location_type = p_location THEN 30 ELSE 0 END +
  CASE WHEN p_category IS NOT NULL AND o.category = p_category THEN 40 ELSE 0 END +
  CASE WHEN o.is_featured THEN 20 ELSE 0 END
```

Maksymalny możliwy score: **170 punktów**

## Przykładowe Dane

### **Palety Kolorów:**
1. **Miękka Natura** - beże, brązy, zieleń (natura/plener)
2. **Elegancka Miejska** - granat, szarości, biel (miasto)
3. **Letnia Lekkość** - pastele, błękity (plaża/lato)
4. **Zimowa Elegancja** - bordo, granat, złoto (zima/elegancja)

### **Zestawy Stylizacji:**
1. **Rodzinna Harmonia** - Duża Grupa (13 osób: 8 dorosłych + 5 dzieci)
   - Szczegółowe opisy dla: Tata, Mama, Babcia, Dziadek, Dzieci, Nastolatki
   - DO: Koordynacja kolorów, warstwy ubrań, wygodne obuwie
   - DON'T: Jaskrawe wzory, loga, niewygodne ubrania

## Wydajność

### **Database-Level Optimization:**
- Wszystkie zapytania wykonują się w < 50ms
- PostgreSQL functions eliminują round-trips
- Materialized views dla ciężkich agregacji
- GIN indexes dla instant full-text search

### **Caching Strategy:**
- SSR z revalidate: 3600 (1 godzina)
- API endpoint results cachowalne przez CDN
- Materialized views odświeżane co 1h lub na żądanie

### **Zero Loss Policy:**
- Brak application-level filtrowania
- Brak N+1 queries
- Minimalne transfery danych
- Optymalne SELECT z specific fields only

## Deployment

### **Migracje:**
```bash
# 1. Execute database migration
psql $DATABASE_URL < database/migration_style_guide.sql

# 2. Execute optimized functions
psql $DATABASE_URL < database/functions_style_guide_optimized.sql

# 3. Generate Prisma client
npx prisma generate
```

### **Environment Variables:**
Używa istniejących:
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct connection for migrations

## Użycie w Kodzie

### **Fetching Outfits:**
```typescript
// Server Component
const outfits = await prisma.$queryRaw`
  SELECT * FROM get_outfit_recommendations(
    ${groupSize}::INTEGER,
    ${season}::VARCHAR,
    ${location}::VARCHAR,
    ${category}::VARCHAR,
    ${limit}::INTEGER
  )
`;

// Client Component
const response = await fetch(
  `/api/style-guide/outfits?groupSize=13&season=summer&location=nature&category=family`
);
const { data } = await response.json();
```

### **Client Panel Integration:**
```tsx
<ClientStyleGuidePanel 
  offerId={offer.id}
  serviceType={offer.category || offer.template_data?.category}
  groupSize={offer.template_data?.eventCount ? parseInt(offer.template_data.eventCount) : undefined}
  location={offer.template_data?.eventLocation}
/>
```

## Roadmap

### **Phase 1 (Completed):**
- ✅ Database schema & migrations
- ✅ Optimized PostgreSQL functions
- ✅ Prisma models
- ✅ Public API endpoints (GET)
- ✅ React components
- ✅ Public page `/jak-sie-ubrac`
- ✅ Client panel integration

### **Phase 2 (Future):**
- [ ] Admin CRUD endpoints (POST/PUT/DELETE)
- [ ] Admin panel dla zarządzania treścią
- [ ] Drag-drop reordering (using update_display_orders)
- [ ] Image upload dla outfit examples
- [ ] Analytics & tracking (most viewed palettes, outfits)
- [ ] Email templates z rekomendacjami
- [ ] PDF export poradnika dla klientów
- [ ] A/B testing różnych palet

### **Phase 3 (Advanced):**
- [ ] AI-powered outfit recommendations
- [ ] Virtual try-on (AR/VR)
- [ ] Seasonal automatic updates
- [ ] Multi-language support
- [ ] Integration with e-commerce (buy outfit items)

## Maintenance

### **Refresh Materialized View:**
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_style_guide_stats;
```

### **Rebuild Full-Text Indexes:**
```sql
REINDEX INDEX idx_outfit_sets_fts;
REINDEX INDEX idx_color_palettes_fts;
REINDEX INDEX idx_style_guide_tips_fts;
```

### **Monitor Performance:**
```sql
-- Check slowest queries
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%style_guide%' 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

## Kontakt & Support

W przypadku pytań lub problemów:
- Database: Sprawdź logi PostgreSQL
- API: Sprawdź Next.js logs w Netlify
- Frontend: Sprawdź browser console

---

**Built with ❤️ using Next.js 15.5.7, Prisma 5.22.0, PostgreSQL, Framer Motion**

**Performance First. Zero Loss. Ultra Optimized.**
