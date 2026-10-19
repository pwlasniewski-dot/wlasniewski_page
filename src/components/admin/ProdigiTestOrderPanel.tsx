'use client';
import {useRef,useState} from 'react';
import type {ProdigiOrderState} from '@/lib/fulfillment/prodigi-orders';
export default function ProdigiTestOrderPanel(){
 const [sku,setSku]=useState('GLOBAL-FAP-10X10'),[testId,setTestId]=useState(''),[state,setState]=useState<ProdigiOrderState|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');const lock=useRef(false);
 async function run(action:'create'|'refresh'|'cancel'){
  if(lock.current)return;
  const id=testId||crypto.randomUUID();setTestId(id);lock.current=true;setBusy(true);setMessage('');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
  try{
   const token=localStorage.getItem('admin_token');
   const response=await fetch('/api/admin/gallery-shop/prodigi-test-orders',{method:'POST',credentials:'include',cache:'no-store',signal:controller.signal,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({action,testId:id,sku})});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Nie potwierdzono wyniku testu.');setState(data.fulfillment);setMessage('Zapisano stan testu.');
  }catch(e){setMessage(controller.signal.aborted?'Upłynął czas odpowiedzi. Zachowaj identyfikator i sprawdź stan; nie twórz nowego testu.':e instanceof Error?e.message:'Nie potwierdzono testu.');}finally{clearTimeout(timer);lock.current=false;setBusy(false);}
 }
 const button='min-h-11 rounded-lg border border-zinc-600 px-4 disabled:opacity-40';
 return <details className="mt-4 rounded-xl border border-zinc-700 p-4"><summary className="min-h-11 cursor-pointer font-semibold">Test realizacji zamówienia w sandbox</summary><div className="space-y-3 pt-3"><p className="text-sm text-zinc-300">Wyłącznie przykładowa grafika i fikcyjny adres. Bez płatności klienta i bez zdjęć z galerii.</p><label className="block text-sm">SKU<input className="mt-1 min-h-11 w-full rounded bg-zinc-950 p-3" value={sku} disabled={busy||Boolean(testId)} onChange={e=>setSku(e.target.value)}/></label><label className="block text-sm">Identyfikator testu (zachowaj do ponownego odczytu)<input className="mt-1 min-h-11 w-full rounded bg-zinc-950 p-3" value={testId} disabled={busy} onChange={e=>{setTestId(e.target.value);setState(null);}} placeholder="Zostanie wygenerowany przy utworzeniu"/></label><div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={busy||Boolean(testId)} onClick={()=>void run('create')}>Utwórz test sandbox</button><button type="button" className={button} disabled={busy||!testId} onClick={()=>void run('refresh')}>Odczytaj stan testu</button><button type="button" className={button} disabled={busy||!testId||state?.state==='cancelled'} onClick={()=>void run('cancel')}>Anuluj test sandbox</button></div>{state&&<p className="text-sm">{state.orderId} · {state.stage||state.state}</p>}{message&&<p role="status" className="text-sm">{message}</p>}</div></details>;
}
