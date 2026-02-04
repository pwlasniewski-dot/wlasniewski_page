/**
 * Test script: Verify admin authentication for offer creation
 * Tests the complete flow:
 * 1. Admin login
 * 2. Create offer with JWT token
 */

import fetch from 'node-fetch';
import https from 'https';

const BASE_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'pwlasniewski@gmail.com';
const ADMIN_PASSWORD = 'admin123';

async function testOfferAuth() {
    console.log('🧪 Testing Offer Authentication Flow\n');

    try {
        // Step 1: Login and get token
        console.log('1️⃣ Logging in as admin...');
        const loginRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
        });

        if (!loginRes.ok) {
            console.log('❌ Login failed:', loginRes.status);
            const error = await loginRes.json();
            console.log('Error:', error);
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Login successful');
        console.log(`   Token: ${token.substring(0, 30)}...`);

        // Step 2: Create test offer
        console.log('\n2️⃣ Creating test offer with auth header...');
        const offerData = {
            title: 'Test Offer - Auth',
            slug: `test-offer-${Date.now()}`,
            type: 'b2c',
            client_email: 'test@example.com',
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            sections: [
                {
                    title: 'Photography Services',
                    description: 'Professional photography',
                    items: [
                        {
                            title: 'Session Photography',
                            description: '2 hour session',
                            price: 500,
                            quantity: 1,
                            is_optional: false,
                        },
                        {
                            title: 'Extra Prints',
                            description: 'High quality prints',
                            price: 50,
                            quantity: 0,
                            is_optional: true,
                        },
                    ],
                },
            ],
        };

        const createRes = await fetch(`${BASE_URL}/api/admin/offers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(offerData),
        });

        console.log(`   Response status: ${createRes.status}`);

        if (!createRes.ok) {
            console.log('❌ Create offer failed');
            const error = await createRes.json();
            console.log('Error:', error);
            return;
        }

        const createData = await createRes.json();
        const offerId = createData.offer?.id;
        console.log('✅ Offer created successfully');
        console.log(`   Offer ID: ${offerId}`);
        console.log(`   Title: ${createData.offer?.title}`);
        console.log(`   Slug: ${createData.offer?.slug}`);
        console.log(`   Sections: ${createData.offer?.sections?.length}`);

        // Step 3: Fetch offers to verify
        console.log('\n3️⃣ Fetching offers list to verify...');
        const listRes = await fetch(`${BASE_URL}/api/admin/offers`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!listRes.ok) {
            console.log('❌ Fetch offers failed:', listRes.status);
            const error = await listRes.json();
            console.log('Error:', error);
            return;
        }

        const listData = await listRes.json();
        console.log('✅ Offers fetched successfully');
        console.log(`   Total offers: ${listData.total}`);
        console.log(`   Returned: ${listData.offers?.length}`);

        // Verify our offer is in the list
        const foundOffer = listData.offers?.find((o: any) => o.id === offerId);
        if (foundOffer) {
            console.log(`   ✅ Created offer found in list`);
        } else {
            console.log(`   ⚠️ Created offer not found in list`);
        }

        console.log('\n✅ All tests passed!');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testOfferAuth();
