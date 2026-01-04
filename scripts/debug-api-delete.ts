
// Native fetch is available in Node 18+

async function debugApiDelete() {
    console.log('🌐 Debugging API Deletion...');

    const BASE_URL = 'http://localhost:3000';
    const TEST_EMAIL = 'pwlasniewski@gmail.com';
    const TEST_PASS = 'admin123'; // Re-verify this is current

    // 1. Login to get token
    console.log('🔑 Logging in...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS })
    });

    if (!loginRes.ok) {
        throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log(`✅ Got token: ${token.substring(0, 10)}...`);

    // 2. Create Dummy Item via API
    console.log('➕ Creating dummy item via API...');
    const createRes = await fetch(`${BASE_URL}/api/menu/items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            title: 'API_DELETE_TEST',
            url: '/api-test',
            menu_type: 'b2b'
        })
    });

    if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(`Create failed: ${createRes.status} ${err}`);
    }

    const createdItem = await createRes.json();
    console.log(`✅ Created item ID: ${createdItem.id}`);

    // 3. Delete via API
    console.log(`🗑️ Deleting item ID: ${createdItem.id} via API...`);
    const deleteRes = await fetch(`${BASE_URL}/api/menu/items?id=${createdItem.id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!deleteRes.ok) {
        const err = await deleteRes.text();
        throw new Error(`Delete failed: ${deleteRes.status} ${err}`);
    }

    const deleteJson = await deleteRes.json();
    console.log('✅ Delete response:', deleteJson);
}

// Node 18+ has fetch built-in, otherwise we need to handle potential missing fetch
debugApiDelete().catch(console.error);
