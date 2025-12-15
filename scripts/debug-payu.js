const { PrismaClient } = require('@prisma/client');
// const fetch = require('node-fetch'); // Built-in in Node 18+

const prisma = new PrismaClient();

async function testPayU() {
    console.log("--- Starting PayU Debug ---");
    try {
        const settings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });

        if (!settings) {
            console.error("❌ No settings found in database!");
            return;
        }

        console.log("1. Environment Config:");
        console.log(`   - Environment: ${settings.payu_environment || 'sandbox'}`);
        console.log(`   - POS ID: ${settings.payu_merchant_pos_id ? 'SET' : 'MISSING'}`);
        console.log(`   - Client ID: ${settings.payu_client_id ? 'SET' : 'MISSING'}`);
        console.log(`   - Client Secret: ${settings.payu_client_secret ? 'SET' : 'MISSING'}`);
        console.log(`   - MD5 Key: ${settings.payu_md5_key ? 'SET' : 'MISSING'}`);

        if (!settings.payu_client_id || !settings.payu_client_secret) {
            console.error("❌ Missing required credentials.");
            return;
        }

        const env = (settings.payu_environment === 'secure' || settings.payu_environment === 'production') ? 'secure' : 'sandbox';

        // Correct Domain Logic
        const domain = env === 'secure' ? 'secure.payu.com' : 'secure.snd.payu.com';
        const url = `https://${domain}/pl/standard/user/oauth/authorize`;

        console.log(`2. Testing Auth connection to: ${url}`);

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', settings.payu_client_id);
        params.append('client_secret', settings.payu_client_secret);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ Auth Failed! Status: ${response.status}`);
            console.error(`   Response: ${text}`);
            console.log("   TIP: Check if you are mixing Sandbox keys with Production environment or vice versa.");
        } else {
            const data = await response.json();
            console.log("✅ Auth SUCCESS!");
            console.log(`   Access Token received (length: ${data.access_token.length})`);
        }

    } catch (e) {
        console.error("❌ Unexpected Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testPayU();
