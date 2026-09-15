const h = require('./gallery-shop-dom.cjs');
const { assert, mount, reset, click, set, button, field, check } = h;
const fs = require('node:fs');
const Module = require('node:module');
const { NextRequest } = require('next/server');
let savedWidgetToken = null;
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === '@/lib/db/prisma') return { __esModule: true, default: { setting: { findUnique: async () => savedWidgetToken === null ? null : { setting_value: savedWidgetToken } } } };
  return originalLoad.call(this, name, ...args);
};
const pointsRoute = require('../../src/app/api/shipping/inpost/points/route.ts');
const configRoute = require('../../src/app/api/shipping/inpost/config/route.ts');
const Picker = require('../../src/components/galleries/InPostPointPicker.tsx').default;
let calls = [];
process.env.INPOST_API_TOKEN = 'points-test-secret'; process.env.INPOST_ENVIRONMENT = 'production';
const request = (query) => new NextRequest(`https://example.test/api/shipping/inpost/points?${query}`, { headers: { 'x-forwarded-for': '192.0.2.10' } });
(async () => {
  await check('InPost: invalid query does not reach carrier', async () => {
    global.fetch = async () => { throw Error('Must not fetch'); };
    for (const query of ['q=a', 'q=https%3A%2F%2Fevil.test', 'q=Torun&page=-1', 'q=Torun&page=101']) assert.equal((await pointsRoute.GET(request(query))).status, 400);
  });
  await check('InPost: actual filters, bounded output and unavailable-point rejection', async () => {
    global.fetch = async (url, options) => { calls.push({ url: String(url), options }); return { ok: true, json: async () => ({ total_pages: 2, items: [{ name: 'TOR01M', status: 'Operating', functions: ['parcel_collect'], address: { line1: 'Ulica 1', line2: 'Toruń' } }, { name: 'TOR02M', status: 'Disabled', functions: ['parcel_collect'] }] }) }; };
    const response = await pointsRoute.GET(request('q=87-100'));
    const data = await response.json(); assert.equal(data.points.length, 1); assert.equal(data.points[0].name, 'TOR01M'); assert.equal(data.hasMore, true);
    const url = new URL(calls.at(-1).url); assert.equal(url.searchParams.get('post_code'), '87-100'); assert.equal(url.searchParams.get('functions'), 'parcel_collect'); assert.equal(url.searchParams.get('per_page'), '20'); assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer points-test-secret'); assert.equal(url.origin, 'https://api.inpost.pl'); assert.ok(!JSON.stringify(data).includes('points-test-secret'));
    await pointsRoute.GET(request('q=POP-TOR21')); assert.equal(new URL(calls.at(-1).url).searchParams.get('name'), 'POP-TOR21');
  });
  await check('InPost: carrier error is safe and public config never exposes shipping token', async () => {
    global.fetch = async () => { throw Error('Bearer private-secret'); };
    const response = await pointsRoute.GET(request('q=Toruń')); assert.equal(response.status, 503); const failure = await response.json(); assert.ok(!JSON.stringify(failure).includes('private-secret')); assert.doesNotMatch(failure.error, /mapie/);
    process.env.INPOST_API_TOKEN = 'private-secret'; process.env.INPOST_GEOWIDGET_TOKEN = 'public-widget';
    assert.deepEqual(await (await configRoute.GET()).json(), { token: 'public-widget' });
    savedWidgetToken = 'admin-saved-widget'; assert.deepEqual(await (await configRoute.GET()).json(), { token: 'admin-saved-widget' }); savedWidgetToken = null;
    delete process.env.INPOST_GEOWIDGET_TOKEN; delete process.env.INPOST_API_TOKEN;
    process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN='deployed-widget'; assert.deepEqual(await (await configRoute.GET()).json(), {token:'deployed-widget'}); delete process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN;
  });
  await check('InPost: customer searches and selects real point without manually typing code', async () => {
    global.fetch = async (url) => ({ ok: true, json: async () => String(url).endsWith('/config') ? { token: null } : { success: true, points: [{ name: 'TOR01M', address: 'Ulica 1, Toruń', description: '', openingHours: '24/7' }], hasMore: false } });
    let selected = ''; await mount(Picker, { value: '', onChange: value => { selected = value; } });
    await set(field('Miejscowość, kod pocztowy lub kod punktu'), 'Toruń'); await click(button('Szukaj punktu')); await click(button(/^TOR01M/)); assert.equal(selected, 'TOR01M'); await reset();
  });
  await check('InPost: map loads on demand and official onpoint callback selects a point', async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({ token: 'public-widget' }) });
    let selected = ''; await mount(Picker, { value: '', onChange: value => { selected = value; } });
    assert.equal(document.querySelector('inpost-geowidget'), null);
    await click(button('Wybierz punkt na mapie'));
    const widget = document.querySelector('inpost-geowidget'); assert.ok(widget); assert.equal(widget.getAttribute('config'), 'parcelCollect');
    const name = widget.getAttribute('onpoint');
    await h.act(async () => { widget.dispatchEvent(new CustomEvent('inpost.geowidget.init')); window[name]({ name: 'TOR01M', address: { line1: 'Ulica 1', line2: 'Toruń' } }); });
    assert.equal(selected, 'TOR01M'); assert.equal(document.querySelector('inpost-geowidget'), null); assert.equal(window[name], undefined); await reset();
  });
  await check('InPost: DOM selection event survives three map open/select cycles without stale listeners', async () => {
    global.fetch = async () => ({ok:true,json:async()=>({token:'public-widget'})});
    const selected=[];await mount(Picker,{value:'',onChange:code=>selected.push(code)});
    let eventName;
    for(let round=0;round<3;round++) {
      await click(button('Wybierz punkt na mapie'));
      const widget=document.querySelector('inpost-geowidget');eventName=widget.getAttribute('onpoint');
      await h.act(async()=>{document.dispatchEvent(new CustomEvent(eventName,{detail:{name:'TOR01M',address:{line1:'Ulica 1'}}}));});
      assert.equal(selected.length,round+1);assert.equal(document.querySelector('inpost-geowidget'),null);
      await h.act(async()=>{document.dispatchEvent(new CustomEvent(eventName,{detail:{name:'TOR02M'}}));});
      assert.equal(selected.length,round+1);
    }
    await reset();
  });
  await check('InPost: failed script can be retried without duplicated styles',async()=>{
    document.querySelector('script[data-inpost-geowidget]')?.remove();
    global.fetch=async()=>({ok:true,json:async()=>({token:'public-widget'})});
    await mount(Picker,{value:'',onChange:()=>{}});await click(button('Wybierz punkt na mapie'));
    const first=document.querySelector('script[data-inpost-geowidget]');
    await h.act(async()=>first.dispatchEvent(new Event('error')));
    assert.equal(document.querySelector('script[data-inpost-geowidget]'),null);
    await click(button('Załaduj mapę ponownie'));
    assert.ok(document.querySelector('script[data-inpost-geowidget]'));assert.equal(document.querySelectorAll('link[data-inpost-geowidget]').length,1);
    await h.act(async()=>document.querySelector('inpost-geowidget').dispatchEvent(new CustomEvent('inpost.geowidget.init')));
    assert.equal(document.querySelector('[role="alert"]'),null);await reset();
  });
  await check('InPost: checkout rejects closed and unknown points, verifies exact authenticated result', async () => {
    const {verifyParcelPoint}=require('../../src/lib/shipping/inpost-point.ts');
    process.env.INPOST_API_TOKEN='checkout-test-secret';
    let result={items:[{name:'TOR01M',status:'Operating',functions:['parcel_collect']}]};
    global.fetch=async (url,options)=>{assert.equal(new URL(url).searchParams.get('name'),'TOR01M');assert.equal(options.headers.Authorization,'Bearer checkout-test-secret');return {ok:true,json:async()=>result};};
    await verifyParcelPoint('TOR01M');
    result.items[0].status='Disabled';await assert.rejects(()=>verifyParcelPoint('TOR01M'),/nie przyjmuje/);
    result={items:[]};await assert.rejects(()=>verifyParcelPoint('TOR01M'),/nie istnieje/);
    process.env.INPOST_ENVIRONMENT='sandbox';
    global.fetch=async url=>{assert.equal(new URL(url).origin,'https://sandbox-api-gateway-pl.easypack24.net');return {ok:false,status:401};};
    await assert.rejects(()=>verifyParcelPoint('TOR01M'),/sprawdzić/);
    delete process.env.INPOST_API_TOKEN;delete process.env.INPOST_ENVIRONMENT;
  });
  await check('InPost: private gallery CSP permits the official map frame and rejects unrelated hosts',async()=>{
    const config=(await import('../../next.config.mjs')).default;
    const headers=await config.headers();const csp=headers.filter(row=>row.source==='/galeria/:path*').flatMap(row=>row.headers).find(row=>row.key==='Content-Security-Policy').value;
    assert.ok(csp.split(' ').includes('https://geowidget-app.inpost.pl'));assert.ok(!csp.split(' ').includes('https://geowidget.inpost.pl'));assert.ok(!csp.includes('*'));assert.ok(!csp.includes('https: '));
  });
  await check('InPost: admin settings expose a dedicated Geowidget field wired to server storage', async()=>{
    const page=fs.readFileSync(require.resolve('../../src/app/admin/settings/page.tsx'),'utf8');
    const api=fs.readFileSync(require.resolve('../../src/app/api/settings/route.ts'),'utf8');
    assert.match(page,/InPost — mapa Paczkomatów/);assert.match(page,/inpost_geowidget_token/);assert.match(page,/wlasniewski\.pl/);
    assert.match(api,/inpost_geowidget_token/);assert.match(api,/Token Geowidget InPost ma nieprawidłowy format/);
  });
  console.log('InPost picker: 10 groups PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
