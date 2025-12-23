# 🔧 ACTION PLAN - Naprawy Priorytetowe

## ⚡ QUICK FIX LIST (co trzeba naprawić teraz)

### 1. GiftCardPromoBar - Fixed (TOP PRIORITY ❌)
**Problem**: Pasek promocyjny kartach nie widoczny  
**Przyczyna**: `fixed` positioning wewnątrz `position: relative` parenta  
**Rozwiązanie**: Przenieś z `page.tsx` do `AppShell.tsx`

**File**: `src/components/AppShell.tsx`
```tsx
// DODAJ na początku komponentu (przed UrgencyBanner):
{!isAdmin && <GiftCardPromoBar />}
```

**File**: `src/app/page.tsx`
```tsx
// USUŃ z komponentu Home:
<GiftCardPromoBar /> // ← DELETE THIS LINE (line ~571)
```

**File**: `src/app/page.tsx`
```tsx
// USUŃ import:
import GiftCardPromoBar from '@/components/GiftCardPromoBar'; // ← DELETE
```

**Wynik**: Bar pojawi się po lewej stronie jako floating element  
**Czas**: 5 minut

---

### 2. Urgency Banner Settings - Brakujące pola (TOP PRIORITY 🔴)
**Problem**: User nie może edytować urgency_enabled, urgency_month, urgency_slots_remaining  
**Lokalizacja**: `src/app/admin/settings/page.tsx`

**Dodaj nową sekcję (przed Photo Challenge Settings, ok. linia 750):**

```tsx
{/* Urgency & Social Proof Settings */}
<div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
    <h2 className="text-lg font-medium text-white mb-4">Urgency Banner & Social Proof</h2>
    <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
                <label className="text-sm font-medium text-zinc-400">Włącz Urgency Banner</label>
                <p className="text-xs text-zinc-500">Pokaż pasek z informacją o wolnych terminach</p>
            </div>
            <button
                onClick={() => setSettings(s => ({ ...s, urgency_enabled: String(s.urgency_enabled) === 'true' ? 'false' : 'true' }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${String(settings.urgency_enabled) === 'true' ? 'bg-gold-500' : 'bg-zinc-700'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${String(settings.urgency_enabled) === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>

        {String(settings.urgency_enabled) === 'true' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Miesiąc</label>
                    <select
                        value={settings.urgency_month || 'Styczeń'}
                        onChange={e => setSettings(s => ({ ...s, urgency_month: e.target.value }))}
                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                    >
                        {['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'].map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Ilość wolnych terminów</label>
                    <input
                        type="number"
                        min="0"
                        value={settings.urgency_slots_remaining || 5}
                        onChange={e => setSettings(s => ({ ...s, urgency_slots_remaining: e.target.value }))}
                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                    />
                </div>
            </div>
        )}

        <div className="border-t border-zinc-800 pt-4">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Social Proof - Liczba klientów</label>
            <input
                type="number"
                min="0"
                value={settings.social_proof_total_clients || 100}
                onChange={e => setSettings(s => ({ ...s, social_proof_total_clients: e.target.value }))}
                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
            />
            <p className="mt-1 text-xs text-zinc-500">Liczba zadowolonych klientów (używana w komponencie social proof jeśli istnieje)</p>
        </div>
    </div>
</div>
```

**Wynik**: User będzie mógł zarządzać urgent bannerem  
**Czas**: 30 minut

---

### 3. Promo Code Fields (ŚREDNI 🟡)
**Problem**: Brakuje inputów dla `promo_code` i `promo_code_expiry`  
**Lokalizacja**: `src/app/admin/settings/page.tsx` - sekcja "Kody Rabatowe"

**Modyfikacja - rozszerz sekcję "Promo Code Settings":**

```tsx
{/* Promo Code Settings */}
<div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
    <h2 className="text-lg font-medium text-white mb-4">Kody Rabatowe (Globalne)</h2>
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-400">Włącz rabat dla wszystkich</label>
            <button
                onClick={() => setSettings(s => ({ ...s, promo_code_discount_enabled: s.promo_code_discount_enabled === 'true' ? 'false' : 'true' }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 ${settings.promo_code_discount_enabled === 'true' ? 'bg-gold-500' : 'bg-zinc-700'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.promo_code_discount_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>

        {settings.promo_code_discount_enabled === 'true' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Kod Promocyjny</label>
                    <input
                        type="text"
                        value={settings.promo_code || ''}
                        onChange={e => setSettings(s => ({ ...s, promo_code: e.target.value.toUpperCase() }))}
                        placeholder="np. WELCOME, RABAT10"
                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                    />
                    <p className="mt-1 text-xs text-zinc-500">Kod który muszą wpisać użytkownicy</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Wartość rabatu</label>
                    <input
                        type="number"
                        value={settings.promo_code_discount_amount}
                        onChange={e => setSettings(s => ({ ...s, promo_code_discount_amount: e.target.value }))}
                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Typ rabatu</label>
                    <select
                        value={settings.promo_code_discount_type}
                        onChange={e => setSettings(s => ({ ...s, promo_code_discount_type: e.target.value }))}
                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                    >
                        <option value="percentage">% (Procentowy)</option>
                        <option value="fixed">PLN (Kwotowy)</option>
                    </select>
                </div>
            </div>
        )}

        {settings.promo_code_discount_enabled === 'true' && (
            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Data wygaśnięcia kodu</label>
                <input
                    type="datetime-local"
                    value={settings.promo_code_expiry || ''}
                    onChange={e => setSettings(s => ({ ...s, promo_code_expiry: e.target.value }))}
                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                />
                <p className="mt-1 text-xs text-zinc-500">Kod nie będzie działać po tej dacie</p>
            </div>
        )}
    </div>
</div>
```

**Wynik**: User może ustawić kod, jego wartość i datę wygaśnięcia  
**Czas**: 20 minut

---

### 4. Halloween Effect - DECYZJA (TOP ❌ lub ✅)

**OPCJA A: Wyrzuć (jeśli nie jest potrzebne)**
```
1. Usuń 'halloween' case z SeasonalEffects.tsx
2. Usuń HalloweenEffect() funkcję
3. Usuń 'halloween' opcję z admin settings select
4. Usuń { id: 'halloween', label: '👻 Halloween', icon: '👻' } z button array
```

**OPCJA B: Napraw (jeśli ma być używane)**
```tsx
// Przepisz HalloweenEffect aby rzeczywiście renderować elementy:

function HalloweenEffect() {
    return (
        <div className="pointer-events-none fixed inset-0 z-[9998]">
            {/* Ghosts */}
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={`ghost-${i}`}
                    className="absolute text-6xl"
                    animate={{
                        y: [0, -20, 0],
                        x: [0, 10, -10, 0],
                        opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{
                        duration: 4 + Math.random() * 3,
                        repeat: Infinity,
                        delay: i * 0.5
                    }}
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`
                    }}
                >
                    👻
                </motion.div>
            ))}
            
            {/* Pumpkins */}
            {[...Array(5)].map((_, i) => (
                <div
                    key={`pumpkin-${i}`}
                    className="absolute text-5xl animate-bounce"
                    style={{
                        left: `${Math.random() * 100}%`,
                        bottom: `${Math.random() * 50}%`,
                        animation: `bounce ${2 + Math.random() * 2}s infinite`,
                        animationDelay: `${i * 0.3}s`
                    }}
                >
                    🎃
                </div>
            ))}
        </div>
    );
}
```

**Czas**: 
- Opcja A (usuń): 10 minut
- Opcja B (napraw): 30 minut

---

## 📋 ZMIANA CHECKLIST

### Przed push:
- [ ] GiftCardPromoBar przeniesiony z page.tsx do AppShell.tsx
- [ ] Import usunięty z page.tsx
- [ ] Urgency settings sekcja dodana w admin
- [ ] Promo code fields dodane w admin
- [ ] Halloween effect - zdecydowane (wyrzucone lub naprawione)
- [ ] Build bez błędów: `npm run build`
- [ ] Testy ręczne na localhost:3000

### Po push:
- [ ] Sprawdź GiftCardPromoBar widoczny po lewej stronie
- [ ] Sprawdź Urgency Banner możliwy do edycji w admin
- [ ] Sprawdź Promo Code settings w admin
- [ ] Sprawdź czy layout bez errorsów

---

## ⏱️ ŁĄCZNY CZAS PRACY

| Zadanie | Czas |
|---------|------|
| 1. GiftCardPromoBar fix | 5 min |
| 2. Urgency settings sekcja | 30 min |
| 3. Promo code fields | 20 min |
| 4. Halloween - decyzja & wdrożenie | 10-30 min |
| 5. Test & build | 10 min |
| **RAZEM** | **75-95 minut** |

---

## 🚀 KOLEJNOŚĆ WYKONANIA

1. **Najpierw**: GiftCardPromoBar (najszybsze, najważniejsze)
2. **Potem**: Urgency settings (ważne, trochę kodu)
3. **Potem**: Promo code fields (średnie importance)
4. **Na koniec**: Halloween (zależy od decyzji)
5. **Finalnie**: Build + test + push

---

**Plan stworzony**: 12 grudnia 2025
