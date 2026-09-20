'use client';
import {use,useEffect,useState} from 'react';
import {AuthenticatedAccountPage} from '@/components/client/AccountPage';

type Session={user:{id:number;email:string;name:string;role:'CLIENT'};token:string|null;blockedReason:string|null};
export default function ClientPreview({params}:{params:Promise<{id:string}>}) {
 const {id}=use(params);
 const [session,setSession]=useState<Session|null>(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 useEffect(()=>{
  const controller=new AbortController();setSession(null);setError('');
  const admin=localStorage.getItem('admin_token');
  fetch(`/api/admin/clients/${id}/preview`,{method:'POST',credentials:'include',headers:admin?{Authorization:`Bearer ${admin}`}:{},signal:controller.signal})
   .then(async response=>{const data=await response.json();if(!response.ok) throw new Error(data.error || 'Nie udało się otworzyć podglądu.');if(!controller.signal.aborted)setSession(data);})
   .catch(e=>{if(!controller.signal.aborted)setError(e.message);});
  const expiry=setTimeout(()=>{setSession(null);setError('Podgląd wygasł po 10 minutach. Odśwież stronę, aby ponownie sprawdzić uprawnienia administratora.');},10*60*1000);
  return ()=>{controller.abort();clearTimeout(expiry);};
 },[id]);
 return <div className="min-h-screen bg-black text-white">
  <aside className="sticky top-0 z-[100] border-b border-amber-300 bg-amber-950 p-4" aria-label="Podgląd administratora">
   <p className="font-semibold">Podgląd konta klienta{session ? `: ${session.user.name} (${session.user.email})` : ''}</p>
   <p className="text-sm">Tylko odczyt · sesja 10 minut · zakładki pokazują dane dostępne klientowi. Przejścia do osobnych stron i operacje na koncie są zablokowane.</p>
   <a className="inline-block min-h-11 py-3 underline" href={`/admin/clients/${id}`}>Zakończ podgląd — wróć do klienta</a>
   {notice && <p role="status">{notice}</p>}
  </aside>
  {error ? <p role="alert" className="p-6">{error}</p> : !session ? <p role="status" className="p-6">Ładowanie podglądu…</p> : session.blockedReason ? <p className="p-6">{session.blockedReason}</p> : session.token && <div onSubmitCapture={e=>{e.preventDefault();e.stopPropagation();}} onClickCapture={e=>{const target=(e.target as HTMLElement).closest('a,button,input,select,textarea');if(target && !target.matches('[data-account-tab]') && !(target.tagName==='BUTTON' && ['Odśwież status','Starsze zamówienia','Spróbuj ponownie'].includes(target.textContent?.trim() || ''))){e.preventDefault();e.stopPropagation();setNotice('To podgląd tylko do odczytu. Użyj zakładek panelu; działania i przejścia na inne strony są zablokowane.');}}}>
   <AuthenticatedAccountPage key={`${id}:${session.token}`} user={session.user} token={session.token} readOnly logout={async()=>{window.location.assign(`/admin/clients/${id}`);}} />
  </div>}
 </div>;
}
