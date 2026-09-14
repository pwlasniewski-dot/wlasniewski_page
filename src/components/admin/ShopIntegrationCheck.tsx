'use client';
import {useState} from 'react';

type Result = {checkedAt:string; inpost:{connected:boolean; environment:string; missing:string[]; locker:boolean; courier:boolean; courierService:string; pickupConfigured:boolean; pointsConnected:boolean; mapConfigured:boolean; message:string}; payment:{connected:boolean;environment:string|null;message:string}};
export default function ShopIntegrationCheck() {
 const [result,setResult]=useState<Result|null>(null); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 async function check() {
  setBusy(true); setError(''); setResult(null);
  try {
   const response=await fetch('/api/admin/gallery-shop/integrations',{credentials:'include',cache:'no-store'});
   const data=await response.json();
   if(!response.ok || !data.success) throw new Error(data.error || 'Nie udało się sprawdzić połączeń.');
   setResult(data);
  } catch(e) {setError(e instanceof Error?e.message:'Nie udało się sprawdzić połączeń.');}
  finally {setBusy(false);}
 }
 const rows=result ? [
  ['Konto InPost',result.inpost.connected,result.inpost.message],
  ['Paczkomaty',result.inpost.locker,'Usługa inpost_locker_standard na Twoim koncie.'],
  ['Kurier',result.inpost.courier,`Usługa ${result.inpost.courierService} na Twoim koncie.`],
  ['Wyszukiwanie punktów',result.inpost.pointsConnected,'Połączenie z API Points używanym przed płatnością.'],
  ['Mapa Paczkomatów',result.inpost.mapConfigured,'Token jest zapisany. Działanie mapy na domenie sprawdź w koszyku.'],
  ['Odbiór przez kuriera',result.inpost.pickupConfigured,'Wymaga pełnych danych nadawcy i adresu odbioru.'],
  ['Płatności PayU',result.payment.connected,result.payment.message],
 ] as const : [];
 return <div className="space-y-4 rounded-xl border border-white/10 bg-black/15 p-4" aria-label="Sprawdzenie integracji sklepu">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h5 className="font-semibold text-white">Połączenie z InPost i PayU</h5><p className="mt-1 text-sm text-zinc-400">Sprawdź konto, uprawnienia i wyszukiwarkę punktów. Test nie tworzy przesyłki ani płatności.</p></div><button type="button" disabled={busy} onClick={()=>void check()} className="min-h-11 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50">{busy?'Sprawdzam połączenia…':'Sprawdź połączenia'}</button></div>
  {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
  {result && <div role="status"><p className="mb-3 text-xs text-zinc-400">InPost: {result.inpost.environment} · PayU: {result.payment.environment || 'brak konfiguracji'} · sprawdzono {new Date(result.checkedAt).toLocaleTimeString('pl-PL')}</p><dl className="grid gap-3 sm:grid-cols-2">{rows.map(([name,ok,detail])=><div key={name} className="rounded-lg border border-white/10 p-3"><dt className="flex flex-wrap justify-between gap-2 text-sm font-medium">{name}<span className={ok?'text-emerald-300':'text-amber-200'}>{ok?'Potwierdzone':'Do sprawdzenia'}</span></dt><dd className="mt-2 text-xs leading-relaxed text-zinc-400">{detail}</dd></div>)}</dl>{result.inpost.missing.length>0 && <p className="mt-3 break-words text-xs text-amber-200">Do uzupełnienia na serwerze: {result.inpost.missing.join(', ')}</p>}<p className="mt-3 text-xs text-zinc-400">Potwierdzenie dostępu nie zastępuje testu płatności, etykiety i odbioru przesyłki.</p></div>}
 </div>;
}
