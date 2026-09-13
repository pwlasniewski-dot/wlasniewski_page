'use client';
import {useState} from 'react';
import {nphotoStarters} from '@/lib/nphoto/starter-catalog';
export default function NphotoStarterCatalog({onImported}:{onImported:()=>Promise<void>}) {
 const [busy,setBusy]=useState(''); const [notice,setNotice]=useState(''); const [error,setError]=useState('');
 async function add(key:string) {
  setBusy(key);setError('');setNotice('');
  try {const token=localStorage.getItem('admin_token');const response=await fetch('/api/admin/gallery-shop/nphoto-import',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({key})});const data=await response.json();if(!response.ok||!data.success)throw new Error(data.error||'Nie udało się dodać produktu.');await onImported();setNotice('Dodano do wspólnej oferty. Ustaw swoją cenę i włącz widoczność.');}
  catch(e){setError(e instanceof Error?e.message:'Nie udało się dodać produktu.');}finally{setBusy('');}
 }
 return <section className="space-y-4 rounded-2xl border border-amber-200/20 bg-zinc-900 p-4 sm:p-6">
  <div><p className="text-xs uppercase tracking-[.2em] text-amber-200">Prawdziwe produkty producenta</p><h2 className="mt-2 text-xl font-semibold text-white">Zacznij od czterech sprawdzonych propozycji</h2><p className="mt-2 text-sm text-zinc-300">Nazwy, parametry i materiały nPhoto są przygotowane. Dodajesz raz, ustalasz swoją cenę i udostępniasz klientom. Ponowne dodanie zachowa Twoje zmiany.</p></div>
  {notice&&<p role="status" className="text-emerald-300">{notice}</p>}{error&&<p role="alert" className="text-red-300">{error}</p>}
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{nphotoStarters.map(item=><article key={item.key} className="flex overflow-hidden rounded-xl border border-white/10 bg-zinc-950 flex-col"><img loading="lazy" src={item.image} alt={item.title} className="aspect-[4/3] w-full object-contain bg-[#f7f5ef]"/><div className="flex flex-1 flex-col gap-3 p-4"><h3 className="font-semibold text-white">{item.title}</h3><p className="text-xs leading-relaxed text-zinc-400">{item.description}</p><a href={item.source} target="_blank" rel="noreferrer" className="text-sm text-amber-200 underline">Zobacz produkt u producenta</a><button type="button" disabled={!!busy} onClick={()=>add(item.key)} className="mt-auto min-h-11 rounded-xl bg-amber-200 px-3 py-2 font-semibold text-zinc-950 disabled:opacity-50">{busy===item.key?'Dodawanie…':'Dodaj do wspólnej oferty'}</button></div></article>)}</div>
 </section>;
}
