import {ShopValidationError} from '@/lib/galleries/merchandise';
import {fetchInpostPoints} from './inpost-points';
/** Validate delivery at checkout; never collect money for an unknown/closed locker. */
export async function verifyParcelPoint(code:string) {
 if(!/^[A-Z0-9_-]{3,30}$/.test(code))throw new ShopValidationError('Wybierz poprawny punkt InPost.');
 let points;
 try{points=await fetchInpostPoints(new URLSearchParams({name:code,per_page:'1'}));}
 catch{throw new ShopValidationError('Nie można teraz sprawdzić punktu InPost. Spróbuj ponownie przed płatnością.',503);}
 const point=points.items[0];
 if(!point)throw new ShopValidationError('Punkt InPost nie istnieje. Wybierz inny punkt.');
 if(point.name!==code||point.status!=='Operating'||!Array.isArray(point.functions)||!point.functions.includes('parcel_collect'))throw new ShopValidationError('Ten punkt nie przyjmuje przesyłek. Wybierz inny punkt InPost.');
}
