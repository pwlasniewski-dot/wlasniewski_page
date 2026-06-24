// PRODUCTION PayU smoke test — verifies the live payment system is operational
// WITHOUT charging anyone. Steps:
//   1. Read PayU settings from the (production) DB.
//   2. Report which config keys are present + environment + notifyUrl.
//   3. Perform real OAuth against PayU (proves credentials are valid).
//   4. Create a minimal 1.00 PLN TEST order (extOrderId = SMOKETEST_*) and read
//      back the redirect URL. The order is never paid and expires within 1h —
//      no money moves.
//
// All payment flows on the site (shop/basket, bookings, workshops, gift cards,
// challenges, group-gallery prints) funnel through this same OAuth + order API,
// so a green run here means the core payment plumbing is live in production.
//
//   node scripts/prod-payu-smoke.mjs

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

async function main() {
  // 1. Read PayU settings (same logic as lib/payu.ts getPayUSettings)
  const s = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
  if (!s) throw new Error('No settings row found in DB');

  const cfg = {
    merchantPosId: s.payu_merchant_pos_id || '',
    clientId: s.payu_client_id || '',
    clientSecret: s.payu_client_secret || '',
    md5Key: s.payu_md5_key || '',
    notifyUrl: s.payu_notify_url || '',
    environment: s.payu_environment || 'sandbox',
  };

  console.log('\n--- PayU config (production DB) ---');
  console.log(`environment   : ${cfg.environment}`);
  console.log(`merchantPosId : ${cfg.merchantPosId ? 'set' : 'MISSING'}`);
  console.log(`clientId      : ${cfg.clientId ? 'set' : 'MISSING'}`);
  console.log(`clientSecret  : ${cfg.clientSecret ? 'set' : 'MISSING'}`);
  console.log(`md5Key        : ${cfg.md5Key ? 'set' : 'MISSING (webhook signature)'}`);
  console.log(`notifyUrl     : ${cfg.notifyUrl || 'MISSING'}`);
  console.log('-----------------------------------\n');

  check('Config: merchantPosId present', !!cfg.merchantPosId);
  check('Config: clientId present', !!cfg.clientId);
  check('Config: clientSecret present', !!cfg.clientSecret);
  check('Config: notifyUrl present', !!cfg.notifyUrl, cfg.notifyUrl);
  check('Config: environment is "secure" (production)', cfg.environment === 'secure', `value=${cfg.environment}`);

  if (!cfg.merchantPosId || !cfg.clientId || !cfg.clientSecret) {
    throw new Error('PayU credentials incomplete — cannot continue.');
  }

  const domain = cfg.environment === 'secure' ? 'secure.payu.com' : 'secure.snd.payu.com';

  // 2. OAuth — proves credentials are valid
  let token = null;
  {
    const url = `https://${domain}/pl/standard/user/oauth/authorize`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    });
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const txt = await r.text();
    let data = {};
    try { data = JSON.parse(txt); } catch {}
    token = data.access_token || null;
    check('PayU OAuth: access token obtained', r.ok && !!token,
      r.ok ? `expires_in=${data.expires_in}s` : `status=${r.status} ${txt.slice(0, 120)}`);
  }

  if (!token) throw new Error('Could not obtain PayU access token — credentials likely invalid.');

  // 3. Create a minimal TEST order (1.00 PLN, never paid, expires in 1h)
  {
    const url = `https://${domain}/api/v2_1/orders`;
    const extOrderId = `SMOKETEST_${Date.now()}`;
    const payload = {
      notifyUrl: cfg.notifyUrl,
      customerIp: '127.0.0.1',
      merchantPosId: cfg.merchantPosId,
      validityTime: 3600,
      description: 'SMOKETEST — automatyczny test systemu płatności (nie płacić)',
      currencyCode: 'PLN',
      totalAmount: 100, // 1.00 PLN in grosze
      extOrderId,
      buyer: { email: 'smoketest@example.com', firstName: 'Smoke', lastName: 'Test', language: 'pl' },
      products: [{ name: 'Test połączenia PayU', unitPrice: 100, quantity: 1 }],
      continueUrl: 'https://wlasniewski.pl/',
    };
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      redirect: 'manual',
    });

    let redirectUri = null;
    let payuOrderId = null;
    if (r.status === 302) {
      redirectUri = r.headers.get('location');
    } else {
      const txt = await r.text();
      let data = {};
      try { data = JSON.parse(txt); } catch {}
      redirectUri = data.redirectUri || null;
      payuOrderId = data.orderId || null;
      if (!r.ok) console.log(`  PayU order raw response: status=${r.status} ${txt.slice(0, 200)}`);
    }
    check('PayU order: created + redirect URL returned', !!redirectUri,
      `payuOrderId=${payuOrderId || 'n/a'}`);
    if (redirectUri) console.log(`\n  Redirect (payment page) URL:\n  ${redirectUri}\n  (test order — leave unpaid, it expires within 1h)\n`);
  }
}

main()
  .catch((e) => { console.error('\nSMOKE TEST ERROR:', e.message); process.exitCode = 1; })
  .finally(async () => {
    await prisma.$disconnect();
    const failed = results.filter((r) => !r.pass);
    console.log('\n================ SUMMARY ================');
    console.log(`Total: ${results.length}  Passed: ${results.length - failed.length}  Failed: ${failed.length}`);
    if (failed.length) {
      console.log('FAILED:');
      failed.forEach((f) => console.log(`  - ${f.name}`));
      process.exitCode = 1;
    } else {
      console.log('PAYMENTS OPERATIONAL ✓');
    }
  });
