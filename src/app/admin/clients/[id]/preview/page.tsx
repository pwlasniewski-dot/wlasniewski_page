'use client';
import {useEffect,useState} from 'react';
import {AuthenticatedAccountPage} from '@/components/client/AccountPage';
import ClientPreviewDetail,{type ClientPreviewSelection} from '@/components/client/ClientPreviewDetail';

type Session={user:{id:number;email:string;name:string;role:'CLIENT'};token:string|null;blockedReason:string|null};
export default function ClientPreview({params}:{params:Promise<{id:string}>}) {
 const [id,setId]=useState('');
 const [session,setSession]=useState<Session|null>(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [selection,setSelection]=useState<ClientPreviewSelection|null>(null);
 useEffect(()=>{let active=true;void params.then(value=>{if(active)setId(value.id);});return()=>{active=false;};},[params]);
 useEffect(()=>{
  if(!id)return;
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
   <p className="text-sm">Tylko odczyt · sesja 10 minut · panel i szczegóły pokazują dane dostępne klientowi. Zapis, płatność, podpis, wybór zdjęć i inne operacje są zablokowane.</p>
   <a className="inline-block min-h-11 py-3 underline" href={`/admin/clients/${id}`}>Zakończ podgląd — wróć do klienta</a>
   {notice && <p role="status">{notice}</p>}
  </aside>
  {error ? <p role="alert" className="p-6">{error}</p> : !session ? <p role="status" className="p-6">Ładowanie podglądu…</p> : <>
   {session.blockedReason && <p role="status" className="mx-auto mt-4 max-w-6xl rounded-xl border border-amber-400/50 bg-amber-950/60 p-4 text-amber-100">{session.blockedReason}</p>}
   {session.token && selection ? <ClientPreviewDetail clientId={Number(id)} token={session.token} selection={selection} onBack={()=>{setSelection(null);setNotice('');}}/> : session.token && <div onSubmitCapture={e=>{e.preventDefault();e.stopPropagation();}} onClickCapture={e=>{
    const element=e.target as HTMLElement;
    const previewTarget=element.closest<HTMLElement>('[data-preview-kind][data-preview-id]');
    if(previewTarget){const kind=previewTarget.dataset.previewKind as ClientPreviewSelection['kind'];const resourceId=Number(previewTarget.dataset.previewId);if(['offer','contract','gallery','order','gift-card'].includes(kind)&&Number.isSafeInteger(resourceId)&&resourceId>0){e.preventDefault();e.stopPropagation();setSelection({kind,resourceId});setNotice('');return;}}
    const target=element.closest('a,button,input,select,textarea');
    if(target && !target.matches('[data-account-tab]') && !(target.tagName==='BUTTON' && ['Odśwież status','Starsze zamówienia','Spróbuj ponownie'].includes(target.textContent?.trim() || ''))){e.preventDefault();e.stopPropagation();setNotice('To podgląd tylko do odczytu. Dane możesz przeglądać, ale zapis, płatność, podpis, wybór zdjęć i inne działania są zablokowane.');}
   }}>
    <AuthenticatedAccountPage key={`${id}:${session.token}`} user={session.user} token={session.token} readOnly logout={async()=>{window.location.assign(`/admin/clients/${id}`);}} />
   </div>}
  </>}
 </div>;
}
