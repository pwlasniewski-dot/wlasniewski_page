import {ShopValidationError} from '@/lib/galleries/merchandise';
/** Validate delivery at checkout; never collect money for an unknown/closed locker. */
export async function verifyParcelPoint(code:string) {
 if(!/^[A-Z0-9_-]{3,30}$/.test(code))throw new ShopValidationError('Wybierz poprawny punkt InPost.');
 let response:Response;
 try{response=await fetch(`https://api-shipx-pl.easypack24.net/v1/points/${encodeURIComponent(code)}`,{signal:AbortSignal.timeout(6000),redirect:'error',cache:'no-store'});}
 catch{throw new ShopValidationError('Nie można teraz sprawdzić punktu InPost. Spróbuj ponownie przed płatnością.',503);}
 if(response.status===404)throw new ShopValidationError('Punkt InPost nie istnieje. Wybierz inny punkt.');
 if(!response.ok)throw new ShopValidationError('Sprawdzenie punktu InPost jest chwilowo niedostępne.',503);
 const point=await response.json();
 if(point.name!==code||point.status!=='Operating'||!Array.isArray(point.functions)||!point.functions.includes('parcel_collect'))throw new ShopValidationError('Ten punkt nie przyjmuje przesyłek. Wybierz inny punkt InPost.');
}
