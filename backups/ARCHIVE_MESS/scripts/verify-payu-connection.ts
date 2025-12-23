// Fixed markdown error
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock fetch for node environment if needed, but node 18+ has native fetch.
// No change needed yet18+

async function verifySystem() {
    console.log('=== DEEP SYSTEM VERIFICATION ===\n');

    try {
        // 1. Verify Settings Integrity
        console.log('[1] Check Settings Integrity...');
        const settingsCount = await prisma.setting.count();
        if (settingsCount > 1) {
            console.error(`[FAIL] Duplicate settings found: ${settingsCount}. Cleanup required.`);
        } else {
            console.log(`[PASS] Single settings record found.`);
        }

        const settings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        if (!settings) throw new Error("No settings found!");

        console.log(`    PayU Environment: ${settings.payu_environment} `);
        console.log(`    POS ID: ${settings.payu_merchant_pos_id} `);
        console.log(`    Client ID: ${settings.payu_client_id} `);

        if (!settings.payu_merchant_pos_id) {
            throw new Error("[FAIL] POS ID is missing!");
        }

        // 2. Verify Hero Slider
        console.log('\n[2] Check Hero Slider...');
        const slides = await prisma.heroSlide.findMany({ include: { image: true } });
        if (slides.length === 0) {
            console.error('[FAIL] No hero slides found!');
        } else {
            console.log(`[PASS] Found ${slides.length} slides.`);
            slides.forEach(s => {
                console.log(`    Slide #${s.id}: "${s.title}" -> Image: ${s.image ? s.image.file_path : 'MISSING!'} `);
                if (!s.image) console.error('    [FAIL] Slide has no image!');
            });
        }

        // 3. Live PayU Connection Test
        console.log('\n[3] Testing PayU Connection (Live HTTP Request)...');

        const env = settings.payu_environment || 'sandbox';
        const domain = env === 'secure' ? 'secure.payu.com' : 'secure.snd.payu.com';
        const authUrl = `https://${domain}/pl/standard/user/oauth/authorize`;

        console.log(`    Target: ${authUrl}`);

        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: settings.payu_client_id,
            client_secret: settings.payu_client_secret,
        });

        const authRes = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        if (!authRes.ok) {
            const txt = await authRes.text();
            throw new Error(`[FAIL] PayU Auth REJECTED: ${authRes.status} ${txt}`);
        }

        const authData = await authRes.json();
        console.log(`[PASS] PayU Auth SUCCESS! Token received.`);

        // 4. Create Mock Order
        console.log(`    Attempting to create a test order (dry run)...`);
        const orderUrl = `https://${domain}/api/v2_1/orders`;
        const token = authData.access_token;

        const orderPayload = {
            notifyUrl: 'https://wlasniewski.pl/api/payments/webhook',
            customerIp: '127.0.0.1',
            merchantPosId: settings.payu_merchant_pos_id,
            description: 'Test Order Verification',
            currencyCode: 'PLN',
            totalAmount: 100, // 1.00 PLN
            products: [{ name: 'Test Product', unitPrice: 100, quantity: 1 }],
            buyer: { email: 'test@example.com', language: 'pl' }
        };

        const orderRes = await fetch(orderUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderPayload),
            redirect: 'manual'
        });

        if (!orderRes.ok) {
            const txt = await orderRes.text();
            // 302 is success for PayU sometimes if it redirects to payment page directly? 
            // API v2_1 usually returns JSON with redirectUri and status 200 or 201 or 302.
            console.log(`    PayU Response Status: ${orderRes.status}`);
            if (orderRes.status >= 400) {
                throw new Error(`[FAIL] Order Creation Failed: ${txt}`);
            }
        }

        const orderData = await orderRes.json();
        console.log(`[PASS] Order Created! Status: ${orderData.status.statusCode}`);
        if (orderData.redirectUri) {
            console.log(`       Redirect URL generated: ${orderData.redirectUri}`);
        }

    } catch (e) {
        console.error('\n[CRITICAL FAILURE]');
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifySystem();
