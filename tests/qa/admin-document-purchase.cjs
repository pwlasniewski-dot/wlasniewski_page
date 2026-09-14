const { assert, check } = require('./gallery-shop-dom.cjs');
const Module = require('node:module');
const { NextRequest } = require('next/server');

let identity = { id: 2, email: 'admin@example.test', role: 'ADMIN', type: 'admin' };
let contract = { id: 3, client_id: 9, status: 'SIGNED', signed_at: new Date(), content: 'Treść umowy', pdf_url: null, signed_pdf_url: null, offer: null, user: null };
let generated = [], downloads = [], created = [], payuRequests = [], participantId = 8;
const db = {
  adminUser: { findUnique: async () => ({ id: 2, email: 'admin@example.test', role: 'ADMIN' }) },
  contract: { findUnique: async () => contract },
  galleryParticipant: { findUnique: async () => ({ id: 8, gallery_id: 12, parent_email: 'parent@example.test', gallery: { id: 12, gallery_mode: 'GROUP', is_active: true, expires_at: null, allow_extra_photo_purchase: true, client_name: 'Test', client_email: 'parent@example.test' } }) },
  galleryPhoto: { findMany: async () => [{ id: 4 }] },
  setting: { findMany: async () => [{ setting_key: 'group_print_price_15x21', setting_value: '300' }] },
  photoOrder: {
    create: async ({ data }) => { const row = { id: 1, ...data }; created.push(row); return row; },
    update: async ({ data }) => Object.assign(created.at(-1), data),
  },
};
const original = Module._load;
Module._load = function (name) {
  if (name === '@/lib/db/prisma') return { __esModule: true, default: db };
  if (name === '@/lib/auth/jwt') return { extractToken: () => 'test', verifyToken: async () => identity };
  if (name === '@/lib/auth/active-client') return { revalidateActiveClient: async () => identity.type === 'client' ? identity : null };
  if (name === '@/lib/services/pdf') return { generateContractPDF: async (...args) => { generated.push(args); return Buffer.from('%PDF-test'); } };
  if (name === '@/lib/storage/s3') return { getPrivateS3DownloadUrl: async url => { downloads.push(url); return 'https://storage.example.test/private-file'; } };
  if (name === '@/lib/auth/parent-jwt') return { extractTokenFromHeader: () => 'test', verifyParentToken: async () => ({ participant_id: participantId, gallery_id: 12 }) };
  if (name === '@/lib/logger') return { logSystem: async () => {} };
  if (name === '@/lib/payu') return { extractClientIpv4: () => '127.0.0.1', createPayUOrder: async body => { payuRequests.push(body); return { orderId: 'test-pay', redirectUri: 'https://payments.example.test/order' }; } };
  return original.apply(this, arguments);
};
const pdf = require('../../src/app/api/contracts/[id]/pdf/route.ts');
const extras = require('../../src/app/api/galleries/group/participant/[id]/purchase-extras/route.ts');
const getPdf = (id = '3') => pdf.GET(new NextRequest('http://localhost/api/contracts/3/pdf'), { params: Promise.resolve({ id }) });
const purchase = (id = '8') => extras.POST(new NextRequest('http://localhost/api/purchase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_lines: [{ photo_id: 4, print_size: '15x21', quantity: 2 }] }) }), { params: Promise.resolve({ id }) });

(async () => {
  await check('signed contract includes signature even without a client display name', async () => {
    const result = await getPdf();
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('content-type'), 'application/pdf');
    assert.equal(generated.length, 1);
    assert.equal(generated[0].length, 2);
    assert.equal(generated[0][1], true);
    assert.equal(generated[0][0].signed_at, contract.signed_at);
  });
  await check('signed uploaded PDF remains the authoritative private document', async () => {
    contract.signed_pdf_url = 'private/signed.pdf';
    assert.equal((await getPdf()).status, 302);
    assert.deepEqual(downloads, ['private/signed.pdf']);
    assert.equal(generated.length, 1);
    contract.signed_pdf_url = null;
  });
  await check('client cannot retrieve another contract or their own draft', async () => {
    identity = { id: 10, email: 'other@example.test', type: 'client' };
    assert.equal((await getPdf()).status, 403);
    identity.id = 9;
    contract.status = 'draft';
    assert.equal((await getPdf()).status, 404);
    assert.equal(generated.length, 1);
  });
  await check('PDF fallback escapes the contract number and rejects malformed IDs', async () => {
    identity = { id: 2, email: 'admin@example.test', role: 'ADMIN', type: 'admin' };
    contract.contract_number = '<img src=x onerror=alert(1)>';
    const result = await getPdf();
    const body = await result.text();
    assert.equal(result.status, 200);
    assert.ok(body.includes('&lt;img'));
    assert.ok(!body.includes('<img src=x'));
    assert.equal((await getPdf('3bad')).status, 400);
  });
  await check('parent purchase awaits Next.js params and uses the saved print price', async () => {
    const result = await purchase();
    assert.equal(result.status, 200);
    assert.equal((await result.json()).success, true);
    assert.equal(created.length, 1);
    assert.equal(created[0].participant_id, 8);
    assert.equal(created[0].total_amount, 600);
    assert.equal(payuRequests[0].totalAmount, 600);
    assert.deepEqual(payuRequests[0].products, [{ name: 'Dodatkowe odbitki 15x21 cm', unitPrice: 300, quantity: 2 }]);
  });
  await check('malformed or foreign participant creates no order or payment', async () => {
    assert.equal((await purchase('8invalid')).status, 400);
    participantId = 99;
    assert.equal((await purchase()).status, 403);
    assert.equal(created.length, 1);
    assert.equal(payuRequests.length, 1);
  });
})().catch(error => { console.error(error); process.exitCode = 1; });
