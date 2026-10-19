#!/usr/bin/env python3
"""Read-only sandbox audit. Key comes from environment; never stored in output.
Product availability covers returned variants; this is not a quote or live qualification.
"""
import argparse, concurrent.futures, datetime, json, os, pathlib, time, re, urllib.request, urllib.error, urllib.parse

def fetch(path, payload=None):
    key=os.environ.get('PRODIGI_SANDBOX_API_KEY','').strip()
    if not key: raise RuntimeError('Missing sandbox key')
    request=urllib.request.Request('https://api.sandbox.prodigi.com/v4.0/'+path, data=None if payload is None else json.dumps(payload).encode(), headers={'X-API-Key':key,'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(request,timeout=25) as response:
            raw=response.read(8_000_001)
            if len(raw)>8_000_000: return {'error':'RESPONSE_LIMIT'}
            return json.loads(raw)
    except urllib.error.HTTPError as error: return {'error':'HTTP_'+str(error.code)}
    except Exception: return {'error':'TRANSPORT'}

def audit(sku):
    result={'sku':sku,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'environment':'sandbox'}
    raw=fetch('Products/'+urllib.parse.quote(sku,safe=''))
    product=raw.get('product')
    if not isinstance(product,dict):return {**result,'status':'unverified','error':raw.get('error',str(raw.get('outcome','INVALID_RESPONSE')))}
    variants=product.get('variants',[])
    if not isinstance(variants,list):return {**result,'status':'unverified','error':'INVALID_VARIANTS'}
    pl=[v for v in variants if 'PL' in v.get('shipsTo',[])]
    required=[k for k,v in product.get('printAreas',{}).items() if v.get('required')]
    result.update(status='available_in_sandbox' if pl else 'not_available_in_sandbox',variantCount=len(variants),plVariantCount=len(pl),requiredAreas=required,adapterSupported=required==['default'] and bool(re.fullmatch(r'GLOBAL-(?:FAP|CAN)-[1-9][0-9]*X[1-9][0-9]*',sku)),plVariants=[{'attributes':v.get('attributes',{}),'printAreaSizes':v.get('printAreaSizes',{})} for v in pl])
    return result

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--input',required=True);ap.add_argument('--output',required=True);ap.add_argument('--workers',type=int,default=3);args=ap.parse_args()
    source=json.loads(pathlib.Path(args.input).read_text())
    # Accept either a SKU array or a discovered product index.
    rows=source if isinstance(source,list) else source.get('products',source.get('pages',[]))
    skus=set()
    for row in rows:
        if isinstance(row,str):skus.add(row)
        elif isinstance(row,dict):
            for value in row.get('skus',[]):skus.add(value if isinstance(value,str) else value.get('sku',''))
    skus=sorted(x for x in skus if x)
    path=pathlib.Path(args.output);path.parent.mkdir(parents=True,exist_ok=True)
    saved=json.loads(path.read_text()) if path.exists() else {'results':[]}
    done={r['sku']:r for r in saved.get('results',[]) if r.get('status')!='unverified'}
    def persist():
        report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'environment':'sandbox','sourceSkuCount':len(skus),'complete':len(done)==len(skus),'scope':'Publicly discovered SKUs only; API-returned variants for PL, not live qualification or full merchant catalogue.', 'results':[done[k] for k in sorted(done)]}
        temp=path.with_suffix('.tmp');temp.write_text(json.dumps(report,ensure_ascii=False,indent=2));temp.replace(path)
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1,min(args.workers,3))) as pool:
        futures={pool.submit(audit,sku):sku for sku in skus if sku not in done}
        for future in concurrent.futures.as_completed(futures):
            row=future.result();done[row['sku']]=row
            if len(done)%25==0: persist();print(json.dumps({'processed':len(done),'total':len(skus)}),flush=True)
    persist();print(json.dumps({'processed':len(done),'total':len(skus),'availablePL':sum(r.get('plVariantCount',0)>0 for r in done.values()),'unverified':sum(r.get('status')=='unverified' for r in done.values())}),flush=True)
if __name__=='__main__': main()
