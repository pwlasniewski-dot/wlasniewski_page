#!/usr/bin/env python3
"""Enumerate official English product pages and explicit SKU cells, never infer SKUs.
Public metadata only. No API credentials, orders, database writes or descriptions.
"""
import argparse, concurrent.futures, datetime, hashlib, json, pathlib, re, time
import urllib.request, urllib.parse, xml.etree.ElementTree as ET
from html.parser import HTMLParser
BASE = 'https://www.prodigi.com'
class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.links=set(); self.stack=[]; self.title=[]; self.h1=[]; self.tables=[]; self.table=None; self.row=None; self.cell=None; self.term=None; self.value=None; self.properties={}; self.heading=[]
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs); self.stack.append(tag)
        if tag=='a' and attrs.get('href'): self.links.add(attrs['href'])
        if tag=='table': self.table=[]
        if tag=='tr' and self.table is not None: self.row=[]
        if tag in ('td','th') and self.row is not None: self.cell=[]
        if tag=='dt': self.term=[]
        if tag=='dd': self.value=[]
    def handle_endtag(self, tag):
        if tag in ('td','th') and self.cell is not None and self.row is not None: self.row.append(' '.join(' '.join(self.cell).split())); self.cell=None
        if tag=='tr' and self.row is not None and self.table is not None: self.table.append(self.row); self.row=None
        if tag=='table' and self.table is not None: self.tables.append(self.table); self.table=None
        if tag=='dd' and self.value is not None:
            self.properties[' '.join(' '.join(self.term or []).split())]=' '.join(' '.join(self.value).split()); self.value=None; self.term=None
        if tag in self.stack:
            self.stack=self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]
    def handle_data(self, data):
        if 'h1' in self.stack: self.h1.append(data)
        if 'title' in self.stack and 'svg' not in self.stack: self.title.append(data)
        if self.cell is not None: self.cell.append(data)
        if self.term is not None and self.value is None: self.term.append(data)
        if self.value is not None: self.value.append(data)

def canonical(url, source=BASE):
    p=urllib.parse.urlsplit(urllib.parse.urljoin(source,url))
    if p.scheme!='https' or p.netloc!='www.prodigi.com' or not p.path.startswith('/products/'): return None
    return BASE+p.path.rstrip('/')+'/'

def main():
    arg=argparse.ArgumentParser(); arg.add_argument('--output',default='docs/data/prodigi-public-catalog.json'); arg.add_argument('--cache',default='/tmp/prodigi-public-cache'); arg.add_argument('--max-pages',type=int,default=800); args=arg.parse_args()
    cache=pathlib.Path(args.cache); cache.mkdir(parents=True,exist_ok=True)
    def fetch(url):
        path=cache/(hashlib.sha256(url.encode()).hexdigest()+'.html')
        if path.exists() and time.time()-path.stat().st_mtime<86400: return path.read_text(),True
        request=urllib.request.Request(url,headers={'User-Agent':'FotoDron-CatalogAudit/1.0 (public product metadata)'})
        with urllib.request.urlopen(request,timeout=25) as response:
            final=urllib.parse.urlsplit(response.url)
            if final.netloc!='www.prodigi.com': raise ValueError('Unexpected external redirect')
            body=response.read(3_000_001)
            if len(body)>3_000_000: raise ValueError('Page too large')
        text=body.decode('utf-8'); path.write_text(text); return text,False
    sitemap,_=fetch(BASE+'/sitemap.xml'); root=ET.fromstring(sitemap)
    pending={u for node in root.iter() if node.tag.endswith('loc') and (u:=canonical(node.text or ''))}
    initial=len(pending); sources=[BASE+'/sitemap.xml',BASE+'/products/',BASE+'/downloads/']
    for source in sources[1:]:
        try:
            html,_=fetch(source); parser=Page(); parser.feed(html); pending.update(u for link in parser.links if (u:=canonical(link,source)))
        except Exception as e: print('seed_error',source,type(e).__name__,flush=True)
    visited=set(); pages=[]; failures=[]; requests=0; hits=0
    def inspect(url):
        html,cached=fetch(url); parser=Page(); parser.feed(html)
        skus=set(); sku_rows=[]
        for table in parser.tables:
            indexes=[]
            for row in table:
                if any(re.search(r'\bSKU\b',cell,re.I) for cell in row):
                    candidates=[i for i,cell in enumerate(row) if re.fullmatch(r'(?:product\s+)?SKU(?:\s+code)?',cell,re.I)]
                    if candidates: indexes=candidates; continue
                for i in indexes:
                    if i<len(row):
                        value=row[i].strip()
                        if re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{2,120}',value) and '-' in value:
                            skus.add(value); sku_rows.append({'sku':value,'cells':row[:8]})
        prefixes={v for k,v in parser.properties.items() if k.lower()=='sku prefix'}
        item={'sourceURL':url,'title':' '.join(' '.join(parser.h1 or parser.title).split()),'category':urllib.parse.urlsplit(url).path.split('/')[2], 'skus':sorted(skus), 'skuPrefixes':sorted(prefixes), 'websiteShipsTo':parser.properties.get('Ships to'), 'websiteFulfilledFrom':parser.properties.get('Fulfilled from'), 'websiteAvailability':parser.properties.get('Availability'), 'skuRows':sku_rows, 'isProductPage':bool(parser.properties.get('Ships to') or skus or prefixes)}
        return item,{u for link in parser.links if (u:=canonical(link,url))},cached
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        while pending and len(visited)<args.max_pages:
            batch=sorted(pending)[:min(30,args.max_pages-len(visited))]; pending.difference_update(batch); visited.update(batch)
            futures={pool.submit(inspect,url):url for url in batch}
            for future in concurrent.futures.as_completed(futures):
                url=futures[future]
                try:
                    item,links,cached=future.result(); pages.append(item); hits+=int(cached); requests+=int(not cached); pending.update(links-visited)
                except Exception as e: failures.append({'url':url,'error':type(e).__name__+': '+str(e)[:160]})
            print(json.dumps({'visited':len(visited),'pending':len(pending),'pagesWithSku':sum(bool(p['skus']) for p in pages),'uniqueSkus':len({sku for p in pages for sku in p['skus']}),'failures':len(failures)}),flush=True)
    products=[p for p in pages if p['isProductPage']]; output={'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':sources,'scope':'English official product sitemap plus product links; public metadata, not API verification or guarantee of Polish delivery','completenessLimitations':['Public SKU tables show selected sizes, not every available API SKU or variant. Known API GLOBAL-FAP-10X10 is absent from the enhanced-matte-art public table.','SKU prefixes are recorded separately and never expanded by guessing.','Website shipping statements and discontinued flags require API verification.','Failures and pages without explicit SKU tables remain discovery gaps.'],'sitemapProductURLs':initial,'visitedURLs':len(visited),'networkPageRequests':requests,'cachedPages':hits,'remainingURLs':sorted(pending),'failures':failures,'productPages':len(products),'productPagesWithExplicitSku':sum(bool(p['skus']) for p in products),'uniqueExplicitSkus':len({sku for p in products for sku in p['skus']}),'products':sorted(products,key=lambda p:p['sourceURL']),'indexPages':[{'sourceURL':p['sourceURL'],'title':p['title']} for p in pages if not p['isProductPage']]}
    destination=pathlib.Path(args.output); destination.parent.mkdir(parents=True,exist_ok=True); destination.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n'); print(json.dumps({k:v for k,v in output.items() if k not in ('products','indexPages','failures','remainingURLs')}),flush=True)
if __name__=='__main__': main()
