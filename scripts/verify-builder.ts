
const baseUrl = 'http://localhost:3000';

async function testBuilder(date: string) {
    console.log(`\n🔍 Testing Builder API for date: ${date}`);
    try {
        const res = await fetch(`${baseUrl}/api/builder/providers?date=${date}`);
        const data = await res.json();

        if (data.success) {
            console.log('✅ API Request Successful');
            console.log(`Found ${data.categories.length} categories with available providers.`);

            data.categories.forEach((cat: any) => {
                console.log(`\nCategory: ${cat.name} (${cat.providers.length} providers)`);
                cat.providers.forEach((prov: any) => {
                    console.log(`  - ${prov.name} ${prov.is_admin ? '(Admin/Global)' : ''}`);
                    console.log(`    Packages: ${prov.packages.length} | Min Price: ${Math.min(...prov.packages.map((p: any) => p.price)) / 100} PLN`);
                    console.log(`    Rating: ${prov.profile?.rating || 'N/A'}`);
                    if (prov.profile?.highlight_photos) {
                        console.log(`    Has Portfolio: Yes`);
                    }
                });
            });
        } else {
            console.error('❌ API Error:', data.error);
        }
    } catch (error) {
        console.error('❌ Fetch Failed:', error);
    }
}

// Test with a future date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 7);
const dateStr = tomorrow.toISOString().split('T')[0];

testBuilder(dateStr);
