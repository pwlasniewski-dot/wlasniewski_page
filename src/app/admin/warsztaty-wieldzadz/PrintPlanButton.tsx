import { useRef } from 'react';

export default function PrintPlanButton() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (window && printRef.current) {
      const printContents = printRef.current.innerHTML;
      const win = window.open('', '', 'height=800,width=600');
      if (win) {
        win.document.write('<html><head><title>Plan warsztatów</title>');
        win.document.write('<style>body{font-family:sans-serif;padding:2em;}h1{color:#b45309;}ol{margin-left:2em;}li{margin-bottom:1em;}</style>');
        win.document.write('</head><body>');
        win.document.write(printContents);
        win.document.write('</body></html>');
        win.document.close();
        win.print();
      }
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={handlePrint}
        className="px-4 py-2 bg-amber-600 text-white rounded font-semibold shadow hover:bg-amber-700 transition"
      >
        Drukuj plan warsztatów
      </button>
      {/* Ukryty kontener do druku (kopiowany z głównej strony warsztatów) */}
      <div ref={printRef} style={{ display: 'none' }}>
        <h1>Plan warsztatów fotograficznych</h1>
        <ol>
          <li><b>Dzień 1 (sala):</b> Wprowadzenie, trójkąt ekspozycji, manualne ustawienia aparatu, quiz</li>
          <li><b>Dzień 2 (plener):</b> Fotografowanie w terenie, zadania praktyczne, światło naturalne</li>
          <li><b>Dzień 3 (sala):</b> Przegląd zdjęć, portret, podsumowanie, dyplomy</li>
        </ol>
      </div>
    </div>
  );
}
