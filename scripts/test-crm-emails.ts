// Quick script to get admin token and run CRM email tests
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Get first admin user
    const admin = await prisma.adminUser.findFirst();
    if (!admin) {
        console.error('No admin user found');
        return;
    }
    console.log('Admin found:', admin.email);

    // Generate JWT token
    const token = jwt.sign(
        { id: admin.id, email: admin.email, role: 'admin' },
        'wlasniewski-fotograf-jwt-secret-2024-production',
        { expiresIn: '1h' }
    );
    console.log('TOKEN:', token);

    // Run CRM email test
    const response = await fetch('http://localhost:3000/api/admin/test-email/crm', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            clientEmail: 'pwlasniewski@icloud.com',
            types: ['welcome', 'offer', 'contract', 'gallery', 'booking']
        })
    });

    const result = await response.json();
    console.log('\n=== CRM EMAIL TEST RESULTS ===');
    console.log('Status:', response.status);
    console.log('Admin email:', result.adminEmail);
    console.log('Client email:', result.clientEmail);
    console.log('Summary:', result.summary);
    console.log('\nDetails:');
    for (const [key, val] of Object.entries(result.results || {})) {
        const r = val as any;
        console.log(`  ${r.success ? '✅' : '❌'} ${key}: ${r.success ? `→ ${r.to}` : r.error}`);
    }

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
