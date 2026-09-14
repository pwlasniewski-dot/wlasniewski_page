const h = require('./gallery-shop-dom.cjs');
const { assert, mount, reset, click, set, button, field, check } = h;
const { NextRequest } = require('next/server');
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
  console.log('InPost picker: 6 groups PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
