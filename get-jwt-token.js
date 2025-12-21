const { PrismaClient } = require('@prisma/client');
const { SignJWT } = require('jose');

const prisma = new PrismaClient();

async function main() {
    // Get any admin user
    const admin = await prisma.adminUser.findFirst();
    
    if (!admin) {
        console.error('❌ No admin user found!');
        process.exit(1);
    }
    
    console.log('✅ Found admin user:', admin.email);
    
    // Create JWT token (same algorithm/secret scheme as app code)
    const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'fallback-secret-change-this'
    );
    const token = await new SignJWT({ id: admin.id, email: admin.email, role: admin.role, type: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
    
    console.log('✅ Generated JWT token');
    console.log('\n📋 Use this token in HTTP tests:\n');
    console.log(`Authorization: Bearer ${token}`);
    console.log('\n📝 Example curl command:');
    console.log(`curl -X POST http://localhost:3000/api/settings \\\n  -H "Authorization: Bearer ${token}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"logo_url":"https://example.com/logo.png"}'`);
    
    await prisma.$disconnect();
}

main().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
