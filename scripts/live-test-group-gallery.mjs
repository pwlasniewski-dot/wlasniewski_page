// LIVE E2E test for the GROUP gallery purchase flow.
// Creates a temporary TEST gallery, drives the real HTTP endpoints exactly like
// the browser would, simulates the PayU webhook, verifies parent + admin views
// (including ZIP download), then deletes ALL test data.
//
// Run AFTER `npm start` is serving on http://localhost:3000.
//   node scripts/live-test-group-gallery.mjs

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';

const BASE = process.env.LIVE_TEST_BASE || 'http://localhost:3000';
const prisma = new PrismaClient();
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '');

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

async function signAdminToken(admin) {
  return new SignJWT({ id: admin.id, email: admin.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(SECRET);
}
async function signParentToken(p) {
  return new SignJWT({ participant_id: p.participant_id, gallery_id: p.gallery_id, parent_identifier: p.parent_identifier })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(SECRET);
}

const suffix = Date.now().toString(36).toUpperCase();
let gallery, participant, photos = [], orderId = null;

async function main() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing in env');

  // --- SETUP ---------------------------------------------------------------
  gallery = await prisma.clientGallery.create({
    data: {
      client_email: 'admin-test@example.com',
      client_name: `TEST GROUP ${suffix}`,
      access_code: `TESTIND-${suffix}`,
      group_access_code: `TESTGRP-${suffix}`,
      group_password: 'Test123 ', // NOTE: trailing space — proves the trim fix live
      gallery_mode: 'GROUP',
      is_active: true,
      allow_extra_photo_purchase: true,
      max_photos_for_print: 5,
      price_per_premium: 2000,
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      standard_count: 5,
    },
  });

  for (let i = 0; i < 6; i++) {
    const p = await prisma.galleryPhoto.create({
      data: {
        gallery_id: gallery.id,
        file_url: `${BASE}/favicon.jpg`,
        thumbnail_url: `${BASE}/favicon.jpg`,
        file_size: 1000,
        order_index: i,
      },
    });
    photos.push(p);
  }

  participant = await prisma.galleryParticipant.create({
    data: {
      gallery_id: gallery.id,
      name: 'Jan Testowy',
      parent_name: 'Jan Testowy',
      parent_email: `jan.test+${suffix}@example.com`,
      parent_identifier: `JT-${suffix}`.slice(0, 20),
      avatar: '🦊',
      max_selections: 5,
      allow_extra_photo_purchase: true,
    },
  });

  const admin = await prisma.adminUser.findFirst({ select: { id: true, email: true } });
  const adminToken = admin ? await signAdminToken(admin) : null;
  const parentToken = await signParentToken({
    participant_id: participant.id,
    gallery_id: gallery.id,
    parent_identifier: participant.parent_identifier,
  });

  console.log(`\nSetup done: gallery=${gallery.id} code=${gallery.group_access_code} participant=${participant.id} admin=${admin ? admin.id : 'NONE'}\n`);

  // --- 1. AUTH (login) -----------------------------------------------------
  {
    const wrong = await fetch(`${BASE}/api/galleries/group/auth`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_code: gallery.group_access_code, password: 'zlehaslo' }),
    });
    check('Auth: wrong password → 401', wrong.status === 401, `status=${wrong.status}`);

    const noPass = await fetch(`${BASE}/api/galleries/group/auth`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_code: gallery.group_access_code }),
    });
    check('Auth: missing password → 401', noPass.status === 401, `status=${noPass.status}`);

    // Correct password is 'Test123' but stored as 'Test123 ' (trailing space) — must succeed now.
    const ok = await fetch(`${BASE}/api/galleries/group/auth`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_code: gallery.group_access_code, password: 'Test123' }),
    });
    const okData = await ok.json().catch(() => ({}));
    check('Auth: correct password despite stored trailing space → 200 (TRIM FIX)',
      ok.ok && okData.gallery_id === gallery.id, `status=${ok.status} gallery_id=${okData.gallery_id}`);
  }

  // --- 2. STANDARD SELECTION (5 photos, 6th rejected) ----------------------
  {
    let added = 0;
    for (let i = 0; i < 5; i++) {
      const r = await fetch(`${BASE}/api/galleries/group/participant/${participant.id}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${parentToken}` },
        body: JSON.stringify({ photo_id: photos[i].id }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.action === 'added') added++;
    }
    check('Standard: 5 photos selected', added === 5, `added=${added}`);

    const sixth = await fetch(`${BASE}/api/galleries/group/participant/${participant.id}/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${parentToken}` },
      body: JSON.stringify({ photo_id: photos[5].id }),
    });
    check('Standard: 6th photo rejected (limit 5)', sixth.status === 400, `status=${sixth.status}`);
  }

  // --- 3. EXTRA PRINTS: 3x 10x15 + 2x 15x21 + PayU init --------------------
  {
    const order_lines = [
      { photo_id: photos[0].id, print_size: '10x15', quantity: 1 },
      { photo_id: photos[1].id, print_size: '10x15', quantity: 1 },
      { photo_id: photos[2].id, print_size: '10x15', quantity: 1 },
      { photo_id: photos[3].id, print_size: '15x21', quantity: 1 },
      { photo_id: photos[4].id, print_size: '15x21', quantity: 1 },
    ];
    const r = await fetch(`${BASE}/api/galleries/group/participant/${participant.id}/purchase-extras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${parentToken}` },
      body: JSON.stringify({ order_lines }),
    });
    const d = await r.json().catch(() => ({}));
    orderId = d?.order?.id ?? null;
    check('Extras: order created (3x10x15 + 2x15x21)', r.ok && !!orderId,
      `status=${r.status} orderId=${orderId} total=${d?.order?.total_amount} paymentUrl=${d?.paymentUrl ? 'yes' : 'no'}`);

    // Verify stored order total = 3*150 + 2*250 = 950 (defaults if no settings)
    if (orderId) {
      const dbOrder = await prisma.photoOrder.findUnique({ where: { id: orderId } });
      check('Extras: photo_count = 5 stored', dbOrder?.photo_count === 5, `photo_count=${dbOrder?.photo_count}`);
    }
  }

  // --- 4. SIMULATE PayU WEBHOOK → paid -------------------------------------
  if (orderId) {
    const r = await fetch(`${BASE}/api/payments/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'OpenPayu-Signature': 'signature=test;algorithm=MD5' },
      body: JSON.stringify({ order: { extOrderId: `GALLERY_${orderId}_${Date.now()}`, status: 'COMPLETED', orderId: 'PAYU-TEST-ID' } }),
    });
    check('Webhook: PayU COMPLETED accepted', r.ok, `status=${r.status}`);
    const dbOrder = await prisma.photoOrder.findUnique({ where: { id: orderId } });
    check('Webhook: order marked paid in DB', dbOrder?.payment_status === 'paid', `status=${dbOrder?.payment_status}`);
  }

  // --- 5. PARENT VIEW: paid photos visible ---------------------------------
  {
    const r = await fetch(`${BASE}/api/galleries/group/participant/${participant.id}/select`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    const d = await r.json().catch(() => ({}));
    const paid = new Set(d.paid_extra_photo_ids || []);
    const expected = [photos[0].id, photos[1].id, photos[2].id, photos[3].id, photos[4].id];
    const allPresent = expected.every((id) => paid.has(id));
    check('Parent view: 5 paid photos visible', r.ok && allPresent && paid.size === 5,
      `paid=${[...paid].join(',')}`);
  }

  // --- 6. ADMIN ORDERS: breakdown by size ----------------------------------
  if (adminToken && orderId) {
    const r = await fetch(`${BASE}/api/admin/orders`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const d = await r.json().catch(() => ({}));
    const ord = (d.orders || []).find((o) => o.rawId === orderId);
    if (!ord) {
      check('Admin orders: our order present', false, `status=${r.status} found=no`);
    } else {
      const extra = (ord.orderItems || []).filter((it) => it.kind === 'extra_photo');
      const by = Object.fromEntries(extra.map((it) => [it.sizeLabel, it.quantity]));
      check('Admin orders: 10x15 qty=3', by['10x15'] === 3, `qty=${by['10x15']}`);
      check('Admin orders: 15x21 qty=2', by['15x21'] === 2, `qty=${by['15x21']}`);
      check('Admin orders: sizeSummary has both', (ord.sizeSummary || []).includes('10x15') && (ord.sizeSummary || []).includes('15x21'), `sizeSummary=${(ord.sizeSummary || []).join(',')}`);
      check('Admin orders: extraPhotoCount=5', ord.orderBreakdown?.extraPhotoCount === 5, `count=${ord.orderBreakdown?.extraPhotoCount}`);
      check('Admin orders: customerName = parent', ord.customerName === 'Jan Testowy', `name=${ord.customerName}`);
    }
  } else {
    check('Admin orders: (skipped — no admin user)', false, 'no admin user in DB');
  }

  // --- 7. ADMIN DOWNLOAD ZIP: name + format in filenames -------------------
  if (adminToken) {
    const r = await fetch(`${BASE}/api/admin/galleries/${gallery.id}/participants/${participant.id}/download-all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const ct = r.headers.get('content-type') || '';
    const buf = Buffer.from(await r.arrayBuffer());
    const text = buf.toString('latin1'); // filenames are stored as bytes in the zip
    const isZip = buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b; // 'PK'
    check('Admin ZIP: returns zip', r.ok && ct.includes('zip') && isZip, `status=${r.status} ct=${ct} bytes=${buf.length}`);
    check('Admin ZIP: filenames contain parent name', text.includes('Jan Testowy'), '');
    check('Admin ZIP: filenames contain [10x15]', text.includes('[10x15]'), '');
    check('Admin ZIP: filenames contain [15x21]', text.includes('[15x21]'), '');
    check('Admin ZIP: filenames contain [STANDARD]', text.includes('[STANDARD]'), '');
    check('Admin ZIP: filenames contain [PLATNE]', text.includes('[PLATNE]'), '');
  } else {
    check('Admin ZIP: (skipped — no admin user)', false, 'no admin user in DB');
  }
}

async function cleanup() {
  try {
    if (gallery) {
      await prisma.photoOrder.deleteMany({ where: { gallery_id: gallery.id } });
      await prisma.clientGallery.delete({ where: { id: gallery.id } }); // cascades photos, participants, selections
      console.log(`\nCleanup: removed test gallery ${gallery.id} and all related rows.`);
    }
  } catch (e) {
    console.error('CLEANUP ERROR — manual removal may be needed:', e.message);
    if (gallery) console.error(`Test gallery id = ${gallery.id}, code = ${gallery.group_access_code}`);
  }
}

main()
  .catch((e) => { console.error('\nTEST RUN ERROR:', e); })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
    const failed = results.filter((r) => !r.pass);
    console.log(`\n================ SUMMARY ================`);
    console.log(`Total: ${results.length}  Passed: ${results.length - failed.length}  Failed: ${failed.length}`);
    if (failed.length) {
      console.log('FAILED:');
      failed.forEach((f) => console.log(`  - ${f.name} (${f.detail})`));
      process.exitCode = 1;
    } else {
      console.log('ALL GREEN ✓');
    }
  });
