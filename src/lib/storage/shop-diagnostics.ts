import {HeadObjectCommand,GetObjectCommand,GetBucketLifecycleConfigurationCommand} from '@aws-sdk/client-s3';
import {s3Client} from './s3';
export type StorageCheckStatus='ok'|'missing'|'denied'|'timeout'|'unavailable';
export type StorageDiagnostics={head:StorageCheckStatus;read:StorageCheckStatus;lifecycle:StorageCheckStatus;enabledLifecycleRules:number|null;privateStorageConfirmed:boolean};
const testKey='shop-personalization/test.txt';
type Sender=(command:HeadObjectCommand|GetObjectCommand|GetBucketLifecycleConfigurationCommand,options:{abortSignal:AbortSignal})=>Promise<any>;
function status(error:unknown):StorageCheckStatus{
 const e=error as {name?:string;$metadata?:{httpStatusCode?:number}};
 if(e?.name==='AbortError'||e?.name==='TimeoutError')return 'timeout';
 if(e?.$metadata?.httpStatusCode===403||e?.name==='AccessDenied')return 'denied';
 if(e?.$metadata?.httpStatusCode===404||['NotFound','NoSuchKey','NoSuchLifecycleConfiguration'].includes(e?.name||''))return 'missing';
 return 'unavailable';
}
/** Fixed diagnostic object only. Never exposes content, credentials, signed URLs or AWS errors. */
export async function checkShopStorage(send:Sender=(command,options)=>s3Client.send(command as any,options),timeoutMs=8000):Promise<StorageDiagnostics>{
 const Bucket=process.env.S3_BUCKET||'wlasniewski-photo-storage';
 async function run<T>(action:(signal:AbortSignal)=>Promise<T>):Promise<{status:StorageCheckStatus;value?:T}>{
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const value=await Promise.race([action(controller.signal),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Object.assign(new Error(),{name:'TimeoutError'}));},timeoutMs);})]);
   return {status:'ok',value};
  }catch(error){return {status:status(error)};}finally{if(timer)clearTimeout(timer);}
 }
 const [head,read,lifecycle]=await Promise.all([
  run(signal=>send(new HeadObjectCommand({Bucket,Key:testKey}),{abortSignal:signal})),
  run(async signal=>{const result=await send(new GetObjectCommand({Bucket,Key:testKey,Range:'bytes=0-3'}),{abortSignal:signal});
   // Read at most the requested four bytes, discard immediately, and close the socket.
   const body=result.Body;let count=0;const abort=()=>body?.destroy?.();signal.addEventListener('abort',abort,{once:true});
   try{if(!body||typeof body[Symbol.asyncIterator]!=='function')throw Error();for await(const chunk of body){count+=chunk.byteLength;if(count>4)throw Error();}if(count!==Math.min(4,Number(result.ContentLength)))throw Error();}
   finally{signal.removeEventListener('abort',abort);body?.destroy?.();}
   return true;
  }),
  run(async signal=>{const result=await send(new GetBucketLifecycleConfigurationCommand({Bucket}),{abortSignal:signal});return (result.Rules||[]).filter((rule:{Status?:string})=>rule.Status==='Enabled').length as number;}),
 ]);
 return {head:head.status,read:read.status,lifecycle:lifecycle.status,enabledLifecycleRules:lifecycle.value??null,privateStorageConfirmed:process.env.SHOP_UPLOADS_PRIVATE_STORAGE_CONFIRMED==='true'};
}
