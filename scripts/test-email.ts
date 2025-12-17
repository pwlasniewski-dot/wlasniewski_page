
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testEmail() {
    console.log('--- Testing Email Configuration (ENV Only) ---');

    // Simulate sender.ts fallback logic
    const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
    };

    console.log('Resolved Configuration from ENV:');
    console.log(`Host: ${config.host}`);
    console.log(`Port: ${config.port}`);
    console.log(`User: ${config.user}`);
    console.log(`Secure (Port 465?): ${config.port === 465}`);

    if (!config.host) {
        console.error('ERROR: No SMTP Host defined in .env');
        return;
    }

    console.log(`\nAttempting connection to ${config.host}:${config.port}...`);

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
            user: config.user,
            pass: config.pass,
        },
        connectionTimeout: 10000,
        debug: true,
        logger: true
    });

    try {
        await transporter.verify();
        console.log('✅ Connection Verified Successfully!');
    } catch (error: any) {
        console.error('❌ Connection Failed:', error.message);
        if (error.code === 'ETIMEDOUT') {
            console.log('Suggest: Check firewall or try Port 465 (SSL) instead of 587.');
        }
    }
}

testEmail();
