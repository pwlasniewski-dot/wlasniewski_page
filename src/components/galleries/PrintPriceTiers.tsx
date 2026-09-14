import type {PrintFormat} from '@/lib/galleries/merchandise';
const money=(value:number)=>new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'}).format(value/100);
export default function PrintPriceTiers({format,dark=false}:{format:PrintFormat;dark?:boolean}) {
 if(!format.priceTiers?.length) return null;
 const tiers=[{minQuantity:1,unitAmount:format.unitAmount},...format.priceTiers];
 return <div className={`mt-3 rounded-xl border p-3 text-sm ${dark?'border-stone-700 text-stone-300':'border-stone-200 bg-white text-stone-600'}`} aria-label={`Ceny ilościowe ${format.label}`}><p className="mb-2 font-medium">Cena za sztukę według łącznej liczby odbitek</p><dl className="space-y-1">{tiers.map((tier,index)=><div key={tier.minQuantity} className="flex justify-between gap-4"><dt>{tiers[index+1]?`${tier.minQuantity}–${tiers[index+1].minQuantity-1}`:`${tier.minQuantity}+`} szt.</dt><dd>{money(tier.unitAmount)}</dd></div>)}</dl><p className="mt-2 text-xs">Różne zdjęcia w tym samym formacie liczymy razem. Cena aktualizuje się w koszyku.</p></div>;
}
