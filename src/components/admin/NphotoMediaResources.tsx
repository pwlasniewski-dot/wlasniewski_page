/** Official resources for preparing offer media, not production print templates. */
export default function NphotoMediaResources() {
  const resources = [
    ['Harmonijka', 'https://info.nphoto.com/hubfs/Mockups/Accordion%20Mini%20Book/nPhoto%20Harmonijka%20Mockupy.zip'],
    ['Fotoalbum PRO', 'https://download.nphoto.com/files/pl/makiety/fotoalbum.zip'],
    ['Lite Album', 'https://download.nphoto.com/files/pl/makiety/lite_album.zip'],
    ['Wall Decor', 'https://download.nphoto.com/files/pl/makiety/wall_decor.zip'],
  ];
  return <details className="rounded-2xl border border-white/10 p-4">
    <summary className="min-h-11 cursor-pointer font-semibold text-amber-200">Materiały nPhoto — makiety i prezentacja produktów</summary>
    <p className="mt-3 text-sm text-zinc-300">Pobierz makietę, wstaw własne fotografie w pliku PSD, a gotowy podgląd wyeksportuj do JPG lub WebP. W edycji produktu wybierz „Dodaj ujęcia z biblioteki” albo „Dodaj rozkładówki z biblioteki”. Zapisz i sprawdź podgląd klienta.</p>
    <div className="mt-4 flex flex-wrap gap-3">{resources.map(([label,href])=><a key={href} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 py-2 text-sm underline">{label} — makiety ZIP ↗</a>)}</div>
    <p className="mt-4 text-sm text-zinc-400">Makiety marketingowe pokazują wygląd produktu. Nie zastępują szablonów produkcyjnych dopasowanych do formatu, liczby stron i oprawy. PSD i ZIP przygotowujesz poza sklepem; klient ogląda gotowe zdjęcia.</p>
    <div className="mt-3 flex flex-wrap gap-4 text-sm text-amber-200 underline">
      <a href="https://nphoto.com/pl/strefa-klienta/zdjecia-do-pobrania" target="_blank" rel="noopener noreferrer">Pełna lista materiałów ↗</a>
      <a href="https://nphoto.com/pl/aktualnosci/oferta-na-swieta-2026" target="_blank" rel="noopener noreferrer">Materiały świąteczne 2026 ↗</a>
      <a href="https://nphoto.com/pl/jak-projektowac" target="_blank" rel="noopener noreferrer">Szablony do druku i nDesigner ↗</a>
    </div>
    <p className="mt-3 text-xs text-zinc-500">Przed publikacją sprawdź warunki użycia materiałów i zgodność makiety z oferowanym wariantem. Dodanie materiałów nie zmienia ceny ani widoczności produktu.</p>
  </details>;
}
