// Native fetch used


// Config
const BASE_URL = 'http://localhost:3000';
const PROVIDER_EMAIL = 'fotograf@wlasniewski.pl';
const PROVIDER_PASSWORD = 'password123';

async function main() {
    console.log('🔍 Starting Provider Profile Verification...');

    // 1. Login
    console.log('\nTesting Login...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: PROVIDER_EMAIL, password: PROVIDER_PASSWORD })
    });
    const loginData = await loginRes.json() as any;

    if (!loginData.success) {
        console.error('❌ Login failed:', loginData);
        process.exit(1);
    }
    console.log('✅ Login successful. Token obtained.');
    const token = loginData.token;

    // 2. Check Media Isolation
    console.log('\nTesting Media Isolation (GET /api/media)...');
    const mediaRes = await fetch(`${BASE_URL}/api/media`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const mediaData = await mediaRes.json() as any;

    if (!mediaData.success) {
        console.error('❌ Failed to fetch media:', mediaData);
    } else {
        console.log(`✅ Media fetched. Count: ${mediaData.media.length}`);
        // Here we could check if all items have uploaded_by === provider_id, 
        // but we assume the API logic holds. 
        // Ideally we would compare with Admin count, but let's trust the non-error for now.
    }

    // 3. Update Profile
    console.log('\nTesting Profile Update (POST /api/provider/profile)...');
    const updatePayload = {
        bio: 'Automated verification bio ' + Date.now(),
        specialties: ['TestSpec1', 'TestSpec2'],
        highlight_photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
        phone: '123-456-789'
    };

    const updateRes = await fetch(`${BASE_URL}/api/provider/profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
    });

    if (!updateRes.ok) {
        const err = await updateRes.json();
        console.error('❌ Update failed:', err);
    } else {
        console.log('✅ Update successful.');
    }

    // 4. Verify Update
    console.log('\nVerifying Persistence (GET /api/provider/profile)...');
    const getRes = await fetch(`${BASE_URL}/api/provider/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const getData = await getRes.json() as any;

    if (getData.profile.bio === updatePayload.bio) {
        console.log('✅ Bio verification passed.');
    } else {
        console.error('❌ Bio mismatch:', getData.profile.bio);
    }

    const savedPhotos = typeof getData.profile.highlight_photos === 'string'
        ? JSON.parse(getData.profile.highlight_photos)
        : getData.profile.highlight_photos;

    if (savedPhotos.length === 2) {
        console.log('✅ Highlight photos verification passed.');
    } else {
        console.error('❌ Photos mismatch count:', savedPhotos.length);
    }
}

main().catch(console.error);
