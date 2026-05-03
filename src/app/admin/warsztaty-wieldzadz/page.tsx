import Image from 'next/image';
import PrintPlanButton from './PrintPlanButton';

export default function WarsztatyWieldzadzPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4 text-amber-900">Warsztaty Fotograficzne – Wielgie/Wieldządz</h1>
      <p className="mb-6 text-lg text-zinc-700">Pełny harmonogram i materiały dla uczestników. Prowadzący: Przemysław Właśniewski</p>

      <PrintPlanButton />

      <div className="mb-8 p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
        <h2 className="text-xl font-bold text-amber-800 mb-2">Plan warsztatów (3 dni, łącznie 9 godzin)</h2>
        <ol className="list-decimal ml-6 text-zinc-800">
          <li className="mb-2">
            <b>Dzień 1 (sala):</b> <br/>
            <ul className="list-disc ml-6">
              <li>Wprowadzenie, zasady bezpieczeństwa, omówienie programu</li>
              <li>Podstawy fotografii: <b>trójkąt ekspozycji</b> (przysłona, migawka, ISO)</li>
              <li>Manualne ustawienia aparatu – ćwiczenia praktyczne</li>
              <li>Quiz fotograficzny, pytania i odpowiedzi</li>
            </ul>
          </li>
          <li className="mb-2">
            <b>Dzień 2 (plener):</b> <br/>
            <ul className="list-disc ml-6">
              <li>Wyjście w teren – zadania indywidualne i grupowe</li>
              <li>Fotografowanie ruchu, portretu, krajobrazu</li>
              <li>Praca z naturalnym światłem</li>
              <li>Omówienie zdjęć na bieżąco, wskazówki praktyczne</li>
            </ul>
          </li>
          <li>
            <b>Dzień 3 (sala):</b> <br/>
            <ul className="list-disc ml-6">
              <li>Podsumowanie, przegląd i ocena zdjęć</li>
              <li>Portret w sali – praca z modelką/modelami</li>
              <li>Wskazówki na przyszłość, wręczenie dyplomów</li>
            </ul>
          </li>
        </ol>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-amber-800 mb-2">Podstawy fotografii – Trójkąt ekspozycji</h2>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <Image src="/warsztaty/ekspozycja1.png" alt="Ekspozycja – przysłona, migawka, ISO" width={500} height={250} className="rounded shadow" />
          </div>
          <div className="flex-1">
            <Image src="/warsztaty/ekspozycja2.png" alt="Trójkąt ekspozycji" width={400} height={300} className="rounded shadow" />
          </div>
        </div>
        <ul className="mt-6 list-disc ml-6 text-zinc-700">
          <li><b>Przysłona</b> – kontroluje ilość światła i głębię ostrości (f/1.4 – f/32)</li>
          <li><b>Migawka</b> – czas naświetlania, wpływa na zamrożenie ruchu (1/1000s – 1/2s)</li>
          <li><b>ISO</b> – czułość matrycy, im wyższe tym więcej szumu</li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-amber-800 mb-2">Materiały edukacyjne i ćwiczenia</h2>
        <ul className="list-disc ml-6 text-zinc-700">
          <li>Quiz: rozpoznaj wpływ przysłony, migawki i ISO na zdjęcie</li>
          <li>Ćwiczenie: ustaw tryb manualny i zrób 3 zdjęcia z różnymi parametrami</li>
          <li>Ćwiczenie: portret z rozmytym tłem (mała przysłona)</li>
          <li>Ćwiczenie: zamrożenie ruchu (krótka migawka)</li>
          <li>Ćwiczenie: zdjęcie w ciemnym pomieszczeniu (wysokie ISO)</li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-amber-800 mb-2">Wskazówki dla uczestników</h2>
        <ul className="list-disc ml-6 text-zinc-700">
          <li>Nie bój się eksperymentować z ustawieniami aparatu</li>
          <li>Patrz na światło – szukaj ciekawych kadrów</li>
          <li>Dbaj o bezpieczeństwo swoje i sprzętu</li>
          <li>Szanuj innych uczestników i ich pomysły</li>
        </ul>
      </div>

      <div className="text-xs text-zinc-400 mt-12">Materiały i grafiki: Niezłe Aparaty, opracowanie własne. Strona warsztatowa – Przemysław Właśniewski 2026</div>
    </div>
  );
}
