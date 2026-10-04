// Runs the actual bundled decoder in an isolated worker-like VM; canvas JPEG encoding
// uses sharp. This verifies codec pixels, not Safari's file picker or real device memory.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
import {prepareShopPhoto} from '../../src/lib/uploads/prepare-shop-photo';
test('real HEIC codec produces portrait JPEG and retains asymmetric colour orientation',async()=>{
 const urls=new Map<string,Blob>();
 const originalURL=URL.createObjectURL;
 const originalWorker=globalThis.Worker;
 const originalDocument=globalThis.document;
 URL.createObjectURL=(blob:Blob)=>{const id=`blob:${urls.size}`;urls.set(id,blob);return id;};
 class LocalWorker {
  listeners=new Map<string,Set<(event:any)=>void>>();
  context:any; ready:Promise<void>;
  constructor(url:string){
   this.ready=urls.get(url)!.text().then(code=>{
    this.context=vm.createContext({ArrayBuffer,Uint8Array,Uint8ClampedArray,console,setTimeout,clearTimeout,TextDecoder,TextEncoder,ImageData:class{data:Uint8ClampedArray;constructor(public width:number,public height:number){this.data=new Uint8ClampedArray(width*height*4);}},postMessage:(data:any)=>this.emit('message',{data,currentTarget:this})});
    vm.runInContext(code,this.context);
   });
  }
  addEventListener(name:string,fn:any){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name)!.add(fn);}
  removeEventListener(name:string,fn:any){this.listeners.get(name)?.delete(fn);}
  emit(name:string,event:any){if(name==='error'||event.data?.error)console.error('codec',event.data);for(const fn of this.listeners.get(name)||[])fn(event);}
  postMessage(data:any){void this.ready.then(()=>this.context.onmessage({data})).catch(error=>this.emit('error',{data:error,currentTarget:this}));}
 }
 globalThis.Worker=LocalWorker as any;
 globalThis.document={createElement:()=>{
  let pixels:any;
  return {width:0,height:0,getContext:()=>({putImageData:(data:any)=>{pixels=data;},clearRect:()=>{pixels=null;}}),toBlob:(callback:any,type:string)=>{
   void sharp(Buffer.from(pixels.data),{raw:{width:pixels.width,height:pixels.height,channels:4}}).jpeg({quality:95}).toBuffer().then(bytes=>callback(new Blob([bytes],{type})));
  }};
 }} as any;
 try{
  for(const rotated of [false,true]){
   const bytes=readFileSync(new URL(`../fixtures/shop-upload/${rotated?'rotated':'portrait'}.heic`,import.meta.url));
   const file=await prepareShopPhoto(new File([bytes],'portrait.HEIC',{type:'image/heic'}),{fileBytes:20*1024*1024,maxPixels:60_000_000,minDimension:100});
   const image=sharp(Buffer.from(await file.arrayBuffer()));
   const width=rotated?240:160,height=rotated?160:240;
   const meta=await image.metadata();assert.equal(meta.format,'jpeg');assert.equal(meta.width,width);assert.equal(meta.height,height);assert.equal(meta.orientation,undefined);
   const pixels=await image.raw().toBuffer();const at=(x:number,y:number,c:number)=>pixels[(y*width+x)*3+c];
   const redY=rotated?130:30;
   assert.ok(at(30,redY,0)>200 && at(30,redY,2)<50,'red follows HEIF irot transformation');
   assert.ok(at(width-30,30,2)>200 && at(width-30,30,0)<50,'blue follows HEIF irot transformation');
  }
 }finally{URL.createObjectURL=originalURL;globalThis.Worker=originalWorker;globalThis.document=originalDocument;}
});
