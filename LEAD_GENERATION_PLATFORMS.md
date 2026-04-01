# Integracja z Platformami Lead Generation

## Przegląd Platform

### 1. **OLX** (ogłoszenia lokalne)
- **API**: Ograniczone, wymaga konta biznesowego OLX PRO
- **Możliwości**:
  - ✅ Ręczne publikowanie ogłoszeń z linkiem do aeroanaliza.pl
  - ✅ Tracking leadów przez UTM parameters (np. `?utm_source=olx&utm_campaign=termo_grudziadz`)
  - ⚠️ Automatyzacja: Tylko przez scraping (niezalecane, może łamać regulamin)
- **Zalecane podejście**: 
  - Publikuj ogłoszenia ręcznie co tydzień
  - Link: `https://aeroanaliza.pl/grudziadz?utm_source=olx`
  - Kategorie: Usługi > Budowlane, Usługi > Rolnictwo

### 2. **Oferteo.pl** (platforma zleceń B2B)
- **API**: Brak publicznego API
- **Możliwości**:
  - ✅ Profil firmy z portfolio i cenami
  - ✅ Otrzymywanie zapytań ofertowych (paid model)
  - ✅ Link do aeroanaliza.pl w profilu
  - ❌ Brak automatycznej synchronizacji
- **Zalecane podejście**:
  - Zarejestruj konto PRO na Oferteo
  - Uzupełnij profil z linkiem do aeroanaliza.pl
  - Odbieraj powiadomienia o zapytaniach SMS/email
  - **Kategorie**: Domy i budynki > Inspekcje, Energia > Fotowoltaika

### 3. **Sprzedajemy.pl** (ogłoszenia)
- **API**: Brak
- **Możliwości**: Podobne do OLX

### 4. **Fixly.pl** (platforma usług domowych)
- **API**: Brak publicznego
- **Model**: Płatne leady (kilkanaście zł za kontakt)
- **Kategorie**: Inspekcje budowlane, Fotowoltaika

## Rekomendowane Rozwiązanie

### ✅ **TRACKING LEADÓW** (implementacja teraz)

Dodaj UTM tracking do wszystkich formularzy:

\`\`\`typescript
// src/components/B2BContactForm.tsx
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Detect lead source from URL
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('utm_source') || 'direct';
    const campaign = urlParams.get('utm_campaign') || 'none';
    
    const payload = {
        ...formData,
        lead_source: source, // 'olx', 'oferteo', 'direct'
        lead_campaign: campaign,
        timestamp: new Date().toISOString()
    };
    
    // Send to your API + optional webhook to external CRM
    await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
};
\`\`\`

### ✅ **LEAD WEBHOOK** (opcjonalna zaawansowana integracja)

Jeśli chcesz przesyłać leady do zewnętrznego CRM (np. HubSpot, Pipedrive):

\`\`\`typescript
// src/app/api/contact/route.ts
export async function POST(req: Request) {
    const data = await req.json();
    
    // Save to your DB
    await prisma.lead.create({ data });
    
    // Optional: Forward to external CRM
    if (process.env.WEBHOOK_URL) {
        await fetch(process.env.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: data.lead_source,
                name: data.name,
                email: data.email,
                phone: data.phone,
                message: data.message
            })
        });
    }
    
    return Response.json({ success: true });
}
\`\`\`

### ✅ **ZAPIER/MAKE INTEGRATION**

Najprostsze rozwiązanie do wysyłania leadów:

1. **Webhook w Make.com** (darmowe do 1000 operacji/miesiąc):
   - Stwórz scenariusz: Webhook → Filtr → Email/Slack/Google Sheets
   - URL webhook: `https://hook.eu1.make.com/twoje_id`
   - Dodaj do `.env`: `LEAD_WEBHOOK_URL=https://hook.eu1.make.com/...`

2. **Automatyzacja**:
   - Lead z aeroanaliza.pl → Make → Email do Ciebie
   - Lead z OLX (UTM=olx) → Make → Tag "OLX" → Google Sheets

## Strategia Publikacji

### **Miesięczny Plan**:

1. **Tydzień 1**: Publikuj 2 ogłoszenia na OLX
   - Termowizja budynków Toruń
   - Inspekcje farm PV kujawsko-pomorskie

2. **Tydzień 2**: Uzupełnij profil Oferteo
   - Dodaj portfolio (zdjęcia termowizyjne)
   - Ustaw cennik startowy

3. **Tydzień 3**: Publikuj 2 ogłoszenia na OLX
   - Monitoring budowy dronem
   - Inspekcje dachów

4. **Tydzień 4**: Odświeź ogłoszenia (bump)

### **Przykładowy tytuł ogłoszenia OLX**:
```
Termowizja Dronem Mavic 3 Thermal - Audyt Budynku | Grudziądz
```

### **Opis**:
```
Profesjonalne inspekcje termowizyjne dronem DJI Mavic 3 Thermal.

✓ Rozdzielczość 640×512 px, dokładność ±2°C
✓ Certyfikat ITC Level 1
✓ Raport PDF w 48h
✓ Obsługujemy Grudziądz i okolice (dojazd 35 km)

Sprawdź pełną ofertę: https://aeroanaliza.pl/grudziadz?utm_source=olx

Tel: 530 788 694
Email: biuro@wlasniewski.pl
```

## Tracking ROI

Stwórz prosty dashboard:

| Źródło | Leady | Konwersja | Koszt |
|--------|-------|-----------|-------|
| OLX    | ?     | ?         | 0 zł  |
| Oferteo| ?     | ?         | 49 zł/mies |
| Direct | ?     | ?         | 0 zł  |
| Google | ?     | ?         | 0 zł  |

## Podsumowanie

**Teraz implementuję**:
1. ✅ UTM tracking w formularzu kontaktowym
2. ✅ Lead source w bazie danych

**Do zrobienia ręcznie (Ty)**:
1. Załóż konto OLX (darmowe)
2. Załóż konto Oferteo PRO (49 zł/mies)
3. Publikuj ogłoszenia z linkami + UTM
4. Obserwuj które źródło daje najlepsze leady

**Opcjonalnie (zaawansowane)**:
1. Webhook do Make.com dla automatyzacji
2. Integracja z Google Sheets dla raportowania
3. Email notifications o nowych leadach
