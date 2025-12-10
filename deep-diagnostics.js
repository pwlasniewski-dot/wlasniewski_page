const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deepDiagnostics() {
    console.log('=== DEEP DATABASE DIAGNOSTICS ===\n');

    try {
        // 1. Check homepage record
        console.log('1️⃣  HOMEPAGE RECORD (ID=1):');
        const homepage = await prisma.page.findUnique({
            where: { id: 1 }
        });
        
        if (homepage) {
            console.log('✅ Found!');
            console.log('   ID:', homepage.id);
            console.log('   slug:', `"${homepage.slug}"`);
            console.log('   title:', homepage.title);
            console.log('   is_in_menu:', homepage.is_in_menu);
            console.log('   is_published:', homepage.is_published);
            console.log('   home_sections length:', homepage.home_sections ? homepage.home_sections.length : 'NULL');
            console.log('   home_sections:', homepage.home_sections ? homepage.home_sections.substring(0, 200) : 'NULL');
            
            if (homepage.home_sections) {
                try {
                    const parsed = JSON.parse(homepage.home_sections);
                    console.log('   ✅ home_sections JSON valid');
                    console.log('   hero_slider count:', parsed.hero_slider?.length || 0);
                    console.log('   sections count:', parsed.sections?.length || 0);
                } catch (e) {
                    console.log('   ❌ home_sections JSON INVALID:', e.message);
                }
            }
        } else {
            console.log('❌ NOT FOUND!');
        }

        // 2. Check all pages
        console.log('\n2️⃣  ALL PAGES IN DATABASE:');
        const allPages = await prisma.page.findMany({
            select: { id: true, slug: true, title: true, is_in_menu: true, is_published: true }
        });
        console.log(`Total pages: ${allPages.length}`);
        allPages.forEach(p => {
            console.log(`   ID ${p.id}: slug="${p.slug}" title="${p.title}" menu=${p.is_in_menu} published=${p.is_published}`);
        });

        // 3. Test API endpoint
        console.log('\n3️⃣  TEST API CALL:');
        const fetch = (await import('node-fetch')).default;
        try {
            const res = await fetch('http://localhost:3000/api/pages?id=1');
            const data = await res.json();
            console.log('Status:', res.status);
            console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
        } catch (e) {
            console.log('❌ API ERROR:', e.message);
            console.log('   (Server might not be running)');
        }

        // 4. Check if home_sections field exists in schema
        console.log('\n4️⃣  DATABASE SCHEMA CHECK:');
        const samplePage = await prisma.page.findFirst();
        if (samplePage) {
            console.log('✅ Pages table exists');
            console.log('   Fields available:', Object.keys(samplePage).join(', '));
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

deepDiagnostics();
