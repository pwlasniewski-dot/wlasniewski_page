'use client';

import { useMemo, useState } from 'react';
import { Calculator, Download, RotateCcw, Save } from 'lucide-react';
import {
  calculatePodScenario, decodePodScenario, DEFAULT_POD_SCENARIO, encodePodScenario,
  POD_FIELD_RULES, POD_SCENARIO_STORAGE_KEY, podDraftToScenario, podScenarioErrors,
  podScenarioToDraft, type PodNumericField,
} from '@/lib/analytics/pod-simulator';

const money = (amount: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 2 }).format(amount);
const number = (value: number, decimals = 0) => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: decimals }).format(value);
const groups: Array<{ title: string; note: string; fields: PodNumericField[] }> = [
  { title: 'Sprzedaż', note: 'Ruch obejmuje wszystkie źródła. Koszyk zawiera również dostawę pobraną od klienta.', fields: ['monthlyVisits', 'conversionPercent', 'averageOrderValue'] },
  { title: 'Koszt zamówienia', note: 'Wpisz pełny koszt produkcji, dostawy i pozostałych obciążeń dostawcy, po przeliczeniu na PLN. To średnia dla całego zamówienia, nie jednego produktu. Stawki poniżej są przykładowe, nie pochodzą z cennika Prodigi.', fields: ['supplierAndShippingCost', 'paymentFeePercent', 'paymentFeeFixed', 'claimsReservePercent'] },
  { title: 'Obsługa i stałe wydatki', note: 'Budżet reklamy odliczamy tylko raz. Stałe koszty mogą zawierać oprogramowanie, księgowość i wycenę pracy niezależnej od liczby zamówień.', fields: ['monthlyAdvertisingCost', 'monthlyFixedCost', 'minutesPerOrder', 'hourlyWorkValue'] },
  { title: 'Inwestycja i cel', note: 'Koszt startowy to jednorazowy wydatek oraz wycena czasu wdrożenia. Cel dotyczy wyniku po kosztach i wycenie obsługi, przed PIT i ZUS.', fields: ['startupCost', 'horizonMonths', 'targetMonthlyProfit'] },
];

export default function PodRevenueSimulator() {
  const [draft, setDraft] = useState(() => podScenarioToDraft(DEFAULT_POD_SCENARIO));
  const [storageMessage, setStorageMessage] = useState('Wczytano przykładowe założenia. Nie są prognozą sprzedaży.');
  const scenario = useMemo(() => podDraftToScenario(draft), [draft]);
  const errors = useMemo(() => podScenarioErrors(scenario), [scenario]);
  const invalid = Object.keys(errors).length > 0;
  const result = useMemo(() => invalid ? null : calculatePodScenario(scenario), [scenario, invalid]);
  const alternatives = useMemo(() => invalid ? [] : [
    { title: 'Połowa konwersji', conversion: scenario.conversionPercent / 2 },
    { title: 'Twoje założenia', conversion: scenario.conversionPercent },
    { title: 'Konwersja × 1,5', conversion: Math.min(100, scenario.conversionPercent * 1.5) },
  ].map(row => ({ ...row, value: calculatePodScenario({ ...scenario, conversionPercent: row.conversion }) })), [scenario, invalid]);

  const save = () => {
    if (invalid) return;
    try {
      localStorage.setItem(POD_SCENARIO_STORAGE_KEY, encodePodScenario(scenario));
      setStorageMessage('Zapisano scenariusz w tej przeglądarce na tym urządzeniu.');
    } catch { setStorageMessage('Nie udało się zapisać scenariusza. Pamięć przeglądarki może być niedostępna.'); }
  };
  const load = () => {
    try {
      const raw = localStorage.getItem(POD_SCENARIO_STORAGE_KEY);
      const saved = decodePodScenario(raw);
      if (!saved) { setStorageMessage(raw ? 'Zapis jest nieprawidłowy lub ma nieobsługiwaną wersję. Obecne pola pozostają bez zmian.' : 'Na tym urządzeniu nie ma zapisanego scenariusza.'); return; }
      setDraft(podScenarioToDraft(saved.scenario));
      setStorageMessage(`Wczytano lokalny zapis z ${new Date(saved.savedAt).toLocaleString('pl-PL')}.`);
    } catch { setStorageMessage('Nie udało się odczytać pamięci przeglądarki. Obecne pola pozostają bez zmian.'); }
  };
  const reset = () => {
    setDraft(podScenarioToDraft(DEFAULT_POD_SCENARIO));
    try { localStorage.removeItem(POD_SCENARIO_STORAGE_KEY); setStorageMessage('Przywrócono przykład i usunięto lokalny zapis scenariusza.'); }
    catch { setStorageMessage('Przywrócono przykład. Nie udało się usunąć zapisu z pamięci przeglądarki.'); }
  };
  const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-50';

  return <section data-testid="pod-simulator" aria-labelledby="pod-simulator-title" className="min-w-0 space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h2 id="pod-simulator-title" className="flex items-center gap-2 text-xl font-semibold"><Calculator aria-hidden="true" size={22} className="shrink-0 text-emerald-400"/>Symulator rentowności POD</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">Sprawdź, ile musiałby sprzedawać sklep z produkcją na zamówienie. Zmień koszty i ruch, a zobaczysz miesięczny wynik oraz skalę potrzebną do osiągnięcia celu.</p></div>
      <span className="rounded-full border border-amber-700/70 bg-amber-950/30 px-3 py-1 text-xs font-semibold text-amber-200">SCENARIUSZ · NIE DANE SPRZEDAŻOWE</span>
    </header>

    <div className="rounded-xl border border-zinc-700 bg-zinc-950/60 p-3">
      <label htmlFor="pod-amountBasis" className="block text-sm font-medium">Baza wszystkich kwot</label>
      <select id="pod-amountBasis" value={draft.amountBasis} onChange={event => setDraft(previous => ({ ...previous, amountBasis: event.target.value as 'cash' | 'net' }))} className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base sm:max-w-lg">
        <option value="cash">Bez VAT: pełne wpływy i poniesione koszty</option><option value="net">VAT czynny: jednolita baza netto</option>
      </select>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{draft.amountBasis === 'cash' ? 'Wpisuj kwoty rzeczywiście otrzymane od klienta i pełne poniesione koszty, również nieodliczalne obciążenia zawarte w koszcie dostawcy.' : 'Wpisuj samodzielnie przeliczone, porównywalne kwoty netto. Opłatę płatniczą wpisz jako efektywny procent koszyka netto; procent operatora od kwoty brutto może być inny. Przełączenie nie przelicza ani nie zmienia liczb.'} Model nie oblicza podatków. Wynik jest przed PIT i ZUS.</p>
    </div>

    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      {groups.map(group => <fieldset key={group.title} className="min-w-0 rounded-xl border border-zinc-800 p-3 sm:p-4">
        <legend className="px-1 text-sm font-semibold text-zinc-100">{group.title}</legend>
        <p className="mb-4 text-sm leading-relaxed text-zinc-400">{group.note}</p>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">{group.fields.map(key => <div key={key} className="min-w-0">
          <label htmlFor={`pod-${key}`} className="block text-sm text-zinc-300">{POD_FIELD_RULES[key].label}</label>
          <input id={`pod-${key}`} type="text" inputMode={POD_FIELD_RULES[key].integer ? 'numeric' : 'decimal'} value={draft[key]} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `pod-error-${key}` : undefined} onChange={event => setDraft(previous => ({ ...previous, [key]: event.target.value }))} className={`mt-2 min-h-11 w-full min-w-0 rounded-lg border bg-zinc-950 px-3 py-2 text-base text-zinc-100 outline-none focus:border-emerald-400 ${errors[key] ? 'border-rose-500' : 'border-zinc-700'}`}/>
          {errors[key] && <p id={`pod-error-${key}`} className="mt-1 text-sm text-rose-300">{errors[key]}</p>}
        </div>)}</div>
      </fieldset>)}
    </div>

    <div className="space-y-2">
      <div className="flex flex-wrap gap-2"><button type="button" onClick={save} disabled={invalid} className={buttonClass}><Save aria-hidden="true" size={16}/>Zapisz na urządzeniu</button><button type="button" onClick={load} className={buttonClass}><Download aria-hidden="true" size={16}/>Wczytaj zapis</button><button type="button" onClick={reset} className={buttonClass}><RotateCcw aria-hidden="true" size={16}/>Resetuj przykład i zapis</button></div>
      <p role="status" className="text-sm text-zinc-300">{storageMessage}</p>
      <p className="text-xs leading-relaxed text-zinc-400">Zapis lokalny zastępuje poprzedni scenariusz. Nie trafia na serwer i nie synchronizuje się z telefonem lub innym komputerem. Przycisk resetu usuwa ten zapis.</p>
    </div>

    {!result ? <p role="alert" className="rounded-xl border border-rose-800 bg-rose-950/30 p-4 text-sm text-rose-200">Popraw zaznaczone pola. Wyniki są wstrzymane, aby nie pokazywać obliczeń dla niepełnych danych.</p> : <div className="min-w-0 space-y-5" data-testid="pod-results">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Przychód / miesiąc', value: money(result.monthlyRevenue), note: `${number(result.expectedOrders, 2)} zamówień — średnia modelowa` },
          { title: 'Nadwyżka przed wyceną pracy', value: money(result.monthlyCashSurplus), note: 'Po dostawcy, płatnościach, rezerwie, reklamie i kosztach stałych' },
          { title: 'Wynik po wycenie pracy', value: money(result.monthlyProfit), note: `${number(result.monthlyWorkHours, 1)} godz. obsługi / miesiąc · przed PIT i ZUS`, emphasis: true },
          { title: 'Marża kwotowa / zamówienie', value: money(result.contributionPerOrder), note: 'Po kosztach zmiennych i pracy, przed reklamą i kosztami stałymi' },
        ].map(card => <div key={card.title} className={`min-w-0 rounded-xl border p-4 ${card.emphasis ? result.monthlyProfit > 0 ? 'border-emerald-700 bg-emerald-950/30' : 'border-amber-700 bg-amber-950/20' : 'border-zinc-800 bg-zinc-950/60'}`}><p className="text-sm text-zinc-300">{card.title}</p><p className="mt-2 break-words text-2xl font-semibold tabular-nums" data-testid={card.emphasis ? 'pod-monthly-profit' : undefined}>{card.value}</p><p className="mt-2 text-xs leading-relaxed text-zinc-400">{card.note}</p></div>)}
      </div>
      {result.contributionPerOrder <= 0 && <p role="alert" className="rounded-xl border border-amber-700/70 bg-amber-950/30 p-4 text-sm text-amber-200">Marża po obsłudze wynosi {money(result.contributionPerOrder)}. Dodatkowe zamówienia nie poprawiają wyniku. Najpierw zmień cenę lub koszty.</p>}
      {scenario.conversionPercent === 0 && <p className="rounded-xl border border-zinc-700 p-3 text-sm text-zinc-300">Konwersja wynosi 0%. Żaden wzrost ruchu nie zapewni dodatniej liczby zamówień przy tym założeniu.</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 p-4"><h3 className="font-semibold">Ile sprzedaży potrzeba?</h3><dl className="mt-4 space-y-3 text-sm">
          <Metric label="Próg rentowności / miesiąc" value={result.breakEvenOrders === null ? 'Nieosiągalny przy tej marży' : `${number(result.breakEvenOrders)} zamówień`}/>
          <Metric label="Ruch na próg rentowności" value={result.breakEvenVisits === null ? 'Nieosiągalny przy tych założeniach' : `${number(result.breakEvenVisits)} wizyt / miesiąc`}/>
          <Metric label={`Cel: ${money(scenario.targetMonthlyProfit)} / miesiąc`} value={result.targetOrders === null ? 'Nieosiągalny przy tej marży' : `${number(result.targetOrders)} zamówień`}/>
          <Metric label="Ruch potrzebny do celu" value={result.targetVisits === null ? 'Nieosiągalny przy tych założeniach' : `${number(result.targetVisits)} wizyt / miesiąc`}/>
          <Metric label="Obsługa przy docelowej sprzedaży" value={result.targetWorkHours === null ? 'Brak dodatniej marży' : `${number(result.targetWorkHours, 1)} godz. / miesiąc`}/>
        </dl><p className="mt-4 text-xs leading-relaxed text-zinc-400">Progi zaokrąglamy w górę do pełnych zamówień. Zakładamy niezmienny koszyk, koszt jednostkowy, konwersję i budżet reklamy. Pozyskanie większego ruchu może wymagać większego budżetu — wtedy zwiększ go w polach.</p></div>
        <div className="rounded-xl border border-zinc-800 p-4"><h3 className="font-semibold">Zwrot inwestycji · {scenario.horizonMonths} mies.</h3><dl className="mt-4 space-y-3 text-sm">
          <Metric label="Koszt startowy" value={money(scenario.startupCost)}/>
          <Metric label="Wynik okresu po koszcie startowym" value={money(result.periodProfitAfterInvestment)}/>
          <Metric label="ROI po odjęciu inwestycji" value={result.roiPercent === null ? 'Nie dotyczy: koszt startowy 0 zł' : `${number(result.roiPercent, 1)}%`}/>
          <Metric label="Prosty czas zwrotu" value={result.paybackMonths === null ? 'Brak zwrotu przy wyniku ≤ 0' : scenario.startupCost === 0 ? 'Bez kosztu startowego' : `${number(result.paybackMonths, 1)} mies.`}/>
        </dl><p className="mt-4 text-xs leading-relaxed text-zinc-400">Stały miesięczny wynik przez cały okres, bez wzrostu i sezonowości. Prosty zwrot jest po wycenie pracy, bez dyskontowania. W horyzoncie uwzględnij wyłącznie miesiące, w których ponosisz wpisane koszty i osiągasz wpisaną sprzedaż.</p></div>
      </div>

      <div className="min-w-0"><h3 className="font-semibold">Wrażliwość na konwersję</h3><p className="mt-1 text-sm text-zinc-400">Ten sam ruch i budżet; zmienia się wyłącznie konwersja. To warianty obliczeń, nie prognozy. Limit konwersji: 100%.</p>
        <div className="mt-3 grid min-w-0 gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]">{alternatives.map(row => <article key={row.title} className={`min-w-0 rounded-xl border p-4 ${row.title === 'Twoje założenia' ? 'border-emerald-800 bg-emerald-950/20' : 'border-zinc-800 bg-zinc-950/50'}`}><h4 className="text-sm font-semibold">{row.title}</h4><p className="mt-1 text-sm text-zinc-400">Konwersja {number(row.conversion, 3)}% · {number(row.value.expectedOrders, 2)} zamówień</p><p className={`mt-3 break-words text-xl font-semibold tabular-nums [overflow-wrap:anywhere] ${row.value.monthlyProfit > 0 ? 'text-emerald-300' : 'text-amber-200'}`}>{money(row.value.monthlyProfit)}</p><p className="mt-1 text-xs text-zinc-400">miesięcznie po wycenie pracy</p></article>)}</div>
      </div>

      <details className="rounded-xl border border-zinc-800 bg-zinc-950/50"><summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-medium">Pokaż miesięczne koszty i wzory</summary><div className="space-y-4 border-t border-zinc-800 p-4 text-sm"><dl className="space-y-3">
        <Metric label="Dostawca i dostawa" value={money(result.monthlySupplierCost)}/><Metric label="Opłaty płatnicze" value={money(result.monthlyPaymentFees)}/><Metric label="Rezerwa reklamacji i zwrotów" value={money(result.monthlyClaimsReserve)}/><Metric label="Reklama" value={money(scenario.monthlyAdvertisingCost)}/><Metric label="Pozostałe stałe koszty" value={money(scenario.monthlyFixedCost)}/><Metric label="Wycena własnej obsługi" value={money(result.monthlyWorkCost)}/><Metric label="Reklama / zamówienie (informacyjnie)" value={result.advertisingPerOrder === null ? 'Brak zamówień' : money(result.advertisingPerOrder)}/>
      </dl><p className="text-zinc-400">Reklama / zamówienie to iloraz całego budżetu i wszystkich zamówień, również organicznych. Nie jest zmierzonym CAC płatnej kampanii i nie odejmujemy go ponownie.</p><ul className="list-disc space-y-2 pl-5 text-zinc-300"><li>Zamówienia = wizyty × konwersja / 100.</li><li>Marża kwotowa = koszyk − dostawca z dostawą − opłaty płatnicze − rezerwa − wycena obsługi.</li><li>Wynik miesięczny = zamówienia × marża kwotowa − reklama − pozostałe stałe koszty.</li><li>Zamówienia do celu = (cel + reklama + stałe koszty) / dodatnia marża kwotowa, zaokrąglone w górę.</li><li>ROI = (wynik miesięczny × liczba miesięcy − koszt startowy) / koszt startowy × 100%.</li></ul><p className="text-zinc-400">Zamówienia w symulacji mogą być ułamkowe jako średnia w dłuższym okresie. Model nie obejmuje przychodów z sesji, których sprzedaż trzeba sprawdzić osobno. Wyniki nie są gwarancją zarobku ani rozliczeniem księgowym.</p></div></details>
    </div>}
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1"><dt className="text-zinc-400">{label}</dt><dd className="min-w-0 break-words font-medium text-zinc-100">{value}</dd></div>;
}
