
// Native fetch is used
import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-tajn3-haslo-1234!'; // Fallback must match server!

async function createToken(userId: number) {
    const secret = new TextEncoder().encode(JWT_SECRET);
    return new SignJWT({ id: userId, email: 'debug@test.com' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secret);
}

async function main() {
    console.log('--- Debugging API Save ---');

    // 1. Get an admin user
    const admin = await prisma.adminUser.findFirst();
    if (!admin) {
        console.error('No admin found!');
        return;
    }

    // 2. Generate Token
    const token = await createToken(admin.id);
    console.log('Generated Token:', token.substring(0, 20) + '...');

    // 3. Prepare Payload
    const testLogoUrl = '/uploads/api-test-logo.png';
    const payload = {
        logo_url: testLogoUrl,
        logo_dark_url: testLogoUrl,
        logo_size: 150,
        navbar_font_family: 'Montserrat', // ensure required fields
        urgency_enabled: true
    };

    console.log('Sending Payload:', payload);

    // 4. Send Request
    const response = await fetch('http://localhost:3000/api/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', data);

    // 5. Verify DB
    const setting = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
    console.log('DB logo_url:', setting?.logo_url);

    if (setting?.logo_url === testLogoUrl) {
        console.log('✅ API Save SUCCESSFUL!');
    } else {
        console.log('❌ API Save FAILED!');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
