const h=require('./qa/gallery-shop-dom.cjs');
const {assert,React,mount,reset,click,button,field,set}=h;
const Panel=require('../src/components/admin/ProdigiCatalogImportPanel.tsx').default;
let imports=0;const requests=[];
const product={sku:'GLOBAL-FAP-10X10',description:'Fine art fixture',variants:[{attributes:{paperType:'EMA'},shipsTo:['PL'],printAreaSizes:{default:{horizontalResolution:1000,verticalResolution:1000}}}]};
global.fetch=async(url,init)=>{assert.equal(url,'/api/admin/gallery-shop/prodigi-import');const body=JSON.parse(init.body);requests.push(body);const data=body.action==='product'?{success:true,product}:body.action==='quote'?{success:true,quote:{costSummary:{totalCost:{amount:'11.70',currency:'EUR'}}},fx:{mid:'4.3745',effectiveDate:'2026-10-02',tableNo:'192/A/NBP/2026'},pln:{amount:'51.18'}}:{success:true,id:50,existing:false};return {ok:true,json:async()=>data};};
(async()=>{
 function Wrapper(){const [amount,change]=React.useState(0);return React.createElement(Panel,{onImported:async()=>{imports++;},customerDeliveryAmount:amount,onDeliveryChange:change});}
 await mount(Wrapper,{});
 await click(button('Odczytaj produkt z API'));assert.ok(document.body.textContent.includes('Fine art fixture'));
 await click(button('Przelicz koszt i dostawę'));assert.ok(document.body.textContent.includes('51.18 PLN'));
 await set(field('Dostawa płatna przez klienta za koszyk (PLN)'),'20');await set(field('Docelowa marża całego koszyka (%)'),'20');await click(button('Wstaw do ceny'));
 assert.equal(field('Cena sprzedaży jednej sztuki (PLN)').value,'43.98');
 await set(field('Nazwa produktu w sklepie'),'Fotografia Fine art');await click(button('Zapisz produkt jako szkic sandbox'));
 assert.equal(imports,1);assert.equal(requests.at(-1).input.price,4398);assert.equal(requests.at(-1).input.shipmentMethod,'Budget');assert.ok(document.body.textContent.includes('Sandbox nie jest publikowany klientom'));
 await set(field('Ilość w kalkulacji'),2);assert.equal(button('Zapisz produkt jako szkic sandbox').disabled,true);
 console.log('PASS independent DOM API product → quote EUR/PLN → shipping/margin calculation → inactive import → refetch; changed quantity invalidates quote');
 await reset();
})().catch(error=>{console.error(error);process.exitCode=1;});
