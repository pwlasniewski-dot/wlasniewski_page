/** Only the JPEG/PNG result enters the existing private, checksum-protected upload. */
export type PhotoLimits = { fileBytes: number; maxPixels: number; minDimension: number };
const heifBrands = new Set(['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1']);
const ascii = (bytes: Uint8Array, start: number) => String.fromCharCode(...bytes.subarray(start, start + 4));
export function photoFormat(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'heif' | null {
 if(bytes[0]===255 && bytes[1]===216 && bytes[2]===255)return 'image/jpeg';
 if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'image/png';
 if(bytes.length>=16 && ascii(bytes,4)==='ftyp'){
  const size=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(0);
  if(size<16 || size>bytes.length)return null;
  if(heifBrands.has(ascii(bytes,8)))return 'heif';
  for(let i=16;i+4<=size;i+=4)if(heifBrands.has(ascii(bytes,i)))return 'heif';
 }
 return null;
}
/** Inspect container spatial extents before the decoder allocates RGBA pixels.
 * Reject oversized auxiliary images too; bounds only, the decoder validates the file. */
export function checkHeifDimensions(bytes: Uint8Array, maxPixels: number) {
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let found=false;
 function boxes(start:number,end:number,depth:number){
  if(depth>8)throw Error('Nieprawidłowy plik HEIC/HEIF.');
  for(let offset=start;offset+8<=end;){
   let size=view.getUint32(offset); const kind=ascii(bytes,offset+4);
   if(size===0)size=end-offset;
   if(size<8 || offset+size>end)throw Error('Nieprawidłowy plik HEIC/HEIF.');
   if(kind==='ispe'){
    if(size<20)throw Error('Nieprawidłowy plik HEIC/HEIF.');
    const width=view.getUint32(offset+12),height=view.getUint32(offset+16);
    if(!width || !height || width*height>maxPixels)throw Error('Rozdzielczość zdjęcia przekracza limit. Wybierz zdjęcie do 60 megapikseli.');
    found=true;
   }
   if(kind==='meta')boxes(offset+12,offset+size,depth+1);
   else if(kind==='iprp' || kind==='ipco')boxes(offset+8,offset+size,depth+1);
   offset+=size;
  }
 }
 boxes(0,bytes.length,0);
 if(!found)throw Error('Nie można odczytać rozdzielczości HEIC/HEIF. Wybierz inny oryginał zdjęcia.');
}
type Converter = (file: File) => Promise<Blob>;
let decoderTimedOut=false;
async function convertHeif(file:File):Promise<Blob>{
 if(decoderTimedOut)throw Error('HEIF_TIMEOUT');
 // CSP build uses a local decoder worker, without external photo services or eval.
 const {heicTo}=await import('heic-to/csp');
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  return await Promise.race([heicTo({blob:file,type:'image/jpeg',quality:0.95}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{decoderTimedOut=true;reject(Error('HEIF_TIMEOUT'));},90_000);})]);
 }finally{if(timer)clearTimeout(timer);}
}
export async function prepareShopPhoto(file:File,limits:PhotoLimits,onConverting:()=>void=()=>{},convert:Converter=convertHeif):Promise<File>{
 if(!file.size || file.size>limits.fileBytes)throw Error(`Maksymalny rozmiar zdjęcia to ${Math.floor(limits.fileBytes/1024/1024)} MB.`);
 const bytes=new Uint8Array(await file.arrayBuffer());
 const format=photoFormat(bytes);
 if(!format)throw Error('Wybierz poprawne zdjęcie JPEG, PNG lub HEIC/HEIF z iPhone’a.');
 if(format!=='heif')return new File([file],file.name,{type:format,lastModified:file.lastModified});
 checkHeifDimensions(bytes,limits.maxPixels);
 onConverting();
 let jpeg:Blob;
 try{jpeg=await convert(file);}catch(error){if(error instanceof Error && error.message==='HEIF_TIMEOUT')throw Error('Przygotowanie HEIC/HEIF trwa zbyt długo. Odśwież stronę przed ponowną próbą lub wybierz zdjęcie JPG.');throw Error('Nie udało się przekształcić zdjęcia HEIC/HEIF. Spróbuj ponownie lub wybierz inne zdjęcie.');}
 if(!jpeg.size || jpeg.size>limits.fileBytes)throw Error('Zdjęcie po zamianie na JPG przekracza limit 20 MB. Wybierz mniejsze zdjęcie.');
 if(photoFormat(new Uint8Array(await jpeg.slice(0,16).arrayBuffer()))!=='image/jpeg')throw Error('Nie udało się przygotować poprawnego JPG. Wybierz inne zdjęcie.');
 return new File([jpeg],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg',lastModified:file.lastModified});
}
