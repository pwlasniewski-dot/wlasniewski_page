
async function main() {
    const baseUrl = 'http://localhost:3000';
    console.log('1. Attempting login...');

    // @ts-ignore
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'przemyslaw@wlasniewski.pl',
            password: 'password123'
        })
    });

    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status);

    if (!loginRes.ok) {
        console.error('Login failed:', loginData);
        return;
    }

    const token = loginData.token;
    console.log('Token received (first 20 chars):', token.substring(0, 20) + '...');

    console.log('2. Attempting to fetch settings...');
    // @ts-ignore
    const settingsRes = await fetch(`${baseUrl}/api/settings`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    console.log('Settings Get Status:', settingsRes.status);
    if (!settingsRes.ok) {
        const err = await settingsRes.text();
        console.error('Settings Get failed:', err);
    } else {
        console.log('Settings Get Success');
    }

    console.log('3. Attempting to save settings...');
    // @ts-ignore
    const saveRes = await fetch(`${baseUrl}/api/settings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            urgency_enabled: true,
            urgency_slots_remaining: 4
        })
    });

    console.log('Settings Save Status:', saveRes.status);
    const saveData = await saveRes.json();
    console.log('Save Response:', saveData);
}

main().catch(console.error);
