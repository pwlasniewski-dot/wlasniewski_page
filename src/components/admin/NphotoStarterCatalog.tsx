'use client';

import {useState} from 'react';
import {NPHOTO_MEDIA_SOURCE,nphotoLaunchKeys,nphotoStarters,NphotoStarter} from '@/lib/nphoto/starter-catalog';

type Props={onImported:()=>Promise<void>;onBusyChange?:(busy:boolean)=>void;disabled?:boolean};
const launch=nphotoLaunchKeys.map(key=>nphotoStarters.find(item=>item.key===key)!);
const additional=nphotoStarters.filter(item=>!nphotoLaunchKeys.some(key=>key===item.key));

export default function NphotoStarterCatalog({onImported,onBusyChange,disabled=false}:Props) {
 const [busy,setBusy]=useState('');
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [mediaRightsConfirmed,setMediaRightsConfirmed]=useState(false);
 const blocked=disabled||!!busy;

 async function add(key:string) {
  if(blocked)return;
  setBusy(key);onBusyChange?.(true);setError('');setNotice('');
  try {
   const token=localStorage.getItem('admin_token');
   const response=await fetch('/api/admin/gallery-shop/nphoto-import',{
    method:'POST',credentials:'include',
    headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
    body:JSON.stringify({key,mediaRightsConfirmed}),
   });
   const data=await response.json();
   if(!response.ok||!data.success)throw new Error(data.error||'Nie udało się przygotować oferty.');
   await onImported();
   setNotice(data.created===0
    ?'Te propozycje są już w ofercie. Zachowano Twoje ceny, opisy, zdjęcia i widoczność. Aby dodać zdjęcia do istniejącego szkicu, użyj karty produktu.'
    :`Przygotowano ${data.created} nowych szkiców${data.existingCount?`; zachowano ${data.existingCount} istniejących`:''}${mediaRightsConfirmed?'':' bez zdjęć producenta'}. Ustaw ceny i sprawdź warianty przed włączeniem sprzedaży. Niczego nie opublikowano.${data.existingCount?' Aby dodać zdjęcia do istniejącego szkicu, użyj karty produktu.':''}`);
  } catch(e) {setError(e instanceof Error?e.message:'Nie udało się przygotować oferty.');}
  finally {setBusy('');onBusyChange?.(false);}
 }

 function card(item:NphotoStarter) {
  return <article key={item.key} className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
   <img loading="lazy" src={item.image} alt={`Przykładowa realizacja: ${item.title}`} className="aspect-[4/3] w-full bg-[#f7f5ef] object-contain"/>
   <div className="flex flex-1 flex-col gap-3 p-4">
    <h3 className="font-semibold text-white">{item.title}</h3>
    <p className="text-xs leading-relaxed text-zinc-400">{item.description}</p>
    <a href={item.source} target="_blank" rel="noreferrer" className="text-sm text-amber-200 underline underline-offset-4">Sprawdź u producenta</a>
    <button type="button" disabled={blocked} onClick={()=>add(item.key)} className="mt-auto min-h-11 rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-zinc-200 disabled:opacity-40">{busy===item.key?'Przygotowywanie…':'Dodaj tylko ten szkic'}</button>
   </div>
  </article>;
 }

 return <section aria-label="Startowa oferta nPhoto" aria-busy={!!busy} className="space-y-5 rounded-2xl border border-amber-200/20 bg-zinc-900 p-4 sm:p-6">
  <div><p className="text-xs uppercase tracking-[.2em] text-amber-200">Twoja pierwsza kolekcja</p><h2 className="mt-2 text-xl font-semibold text-white">Pięć propozycji nPhoto na dobry początek</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">Odbitki 15×21, Harmonijka, Fotoalbum PRO, Lite Album i Fotoobraz Wall Decor. Jeden import przygotuje cztery produkty oraz jeden format odbitek we wspólnym cenniku. Nie musisz dodawać ich osobno dla każdego klienta.</p></div>
  <div className="space-y-3 rounded-xl bg-white/5 p-4">
   <p className="text-sm text-zinc-300">To edytowalne szkice bez ustalonej ceny. Ty określasz wariant i liczbę stron; klient wybiera zdjęcia i liczbę sztuk. Import nie włącza sprzedaży i nie składa zamówienia w nPhoto. Fotoobraz 40×60 ma dostawę wyłącznie kurierem; sprawdź gabaryt paczki przed nadaniem.</p>
   <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-zinc-300"><input type="checkbox" checked={mediaRightsConfirmed} disabled={blocked} onChange={event=>setMediaRightsConfirmed(event.target.checked)} className="mt-1 size-5 shrink-0 accent-amber-200"/><span>Dodaj zdjęcia producenta — potwierdzam prawo do użycia prezentowanych zdjęć produktowych w swojej ofercie.</span></label>
   <p className="text-sm text-zinc-300">Bez potwierdzenia przygotujemy szkice bez zdjęć. Możesz dodać własne media w karcie produktu.</p>
   <p className="text-xs leading-relaxed text-zinc-400">Zdjęcia na publicznej stronie producenta nie oznaczają automatycznie zgody na ich publikację. Sprawdź <a href={NPHOTO_MEDIA_SOURCE} target="_blank" rel="noreferrer" className="text-amber-200 underline">materiały nPhoto do pobrania</a>; możesz też przygotować własne zdjęcia. Podglądy pokazują przykładowe realizacje.</p>
   <button type="button" disabled={blocked} onClick={()=>add('launch-five')} className="min-h-12 rounded-xl bg-amber-200 px-5 py-3 font-semibold text-zinc-950 disabled:opacity-40">{busy==='launch-five'?'Przygotowywanie kolekcji…':'Przygotuj 5 propozycji jako szkice'}</button>
   {disabled&&<p className="text-xs text-amber-200">Najpierw zapisz bieżące zmiany oferty.</p>}
  </div>
  {notice&&<p role="status" className="rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</p>}
  {error&&<p role="alert" className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{launch.map(card)}</div>
  <details className="rounded-xl border border-white/10 p-4"><summary className="cursor-pointer text-sm font-medium text-zinc-300">Pozostałe propozycje: kalendarz i komplet formatów odbitek</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">{additional.map(card)}</div></details>
 </section>;
}
