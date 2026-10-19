#!/usr/bin/env python3
"""Synthetic sandbox only. Key in env, fixed hosts and public provider fixture, no customer data."""
import argparse,datetime,json,os,pathlib,urllib.request,uuid

def request(path,payload=None):
    req=urllib.request.Request('https://api.sandbox.prodigi.com/v4.0/'+path,data=None if payload is None else json.dumps(payload).encode(),headers={'X-API-Key':os.environ['PRODIGI_SANDBOX_API_KEY'],'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=35) as response:return json.load(response)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',required=True);ap.add_argument('--order',action='store_true');args=ap.parse_args()
    report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'environment':'sandbox','scope':'Provider API smoke, not browser upload/PayU/SMTP/delivery E2E','quotes':[]}
    with urllib.request.urlopen('https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json',timeout=15) as response:report['fx']=json.load(response)
    for sku in ['GLOBAL-FAP-10X10','GLOBAL-CAN-10X10']:
        product=request('Products/'+sku)['product'];variant=next(v for v in product['variants'] if 'PL' in v.get('shipsTo',[]))
        item={'sku':sku,'copies':1,'attributes':variant['attributes'],'assets':[{'printArea':'default'}]}
        result=request('Quotes',{'destinationCountryCode':'PL','items':[item]})
        quote=next(q for q in result['quotes'] if q['shipmentMethod']=='Budget')
        report['quotes'].append({'sku':sku,'attributes':variant['attributes'],'outcome':result['outcome'],'shipmentMethod':quote['shipmentMethod'],'costSummary':quote['costSummary']})
    if args.order:
        entry=report['quotes'][0];key='personalization-smoke-'+str(uuid.uuid4())
        payload={'idempotencyKey':key,'merchantReference':key,'shippingMethod':'Budget','recipient':{'name':'Sandbox Test','address':{'line1':'Testowa 1','postalOrZipCode':'00-001','townOrCity':'Warszawa','countryCode':'PL'}},'items':[{'sku':entry['sku'],'copies':1,'sizing':'fitPrintArea','attributes':entry['attributes'],'assets':[{'printArea':'default','url':'https://pwintyimages.blob.core.windows.net/samples/stars/test-sample-grey.png'}]}]}
        created=request('Orders',payload);order_id=created['order']['id'];report['order']={'id':order_id,'created':created['outcome']}
        # Persist confirmed ID immediately; never auto-retry an ambiguous creation.
        pathlib.Path(args.output).write_text(json.dumps(report,indent=2))
        replay=request('Orders',payload);report['order']['replay']={'outcome':replay['outcome'],'sameId':replay['order']['id']==order_id}
        current=request('Orders/'+order_id);report['order']['stage']=current['order']['status']['stage']
        actions=request('Orders/'+order_id+'/actions');report['order']['cancelAvailable']=actions.get('cancel',{}).get('isAvailable')
        if report['order']['cancelAvailable']=='Yes':
            cancelled=request('Orders/'+order_id+'/actions/cancel',{});report['order']['finalStage']=cancelled['order']['status']['stage']
        report['order']['physicalDelivery']=False
    pathlib.Path(args.output).write_text(json.dumps(report,indent=2));print(json.dumps(report))
if __name__=='__main__':main()
