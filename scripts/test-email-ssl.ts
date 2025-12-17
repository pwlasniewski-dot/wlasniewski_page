
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testEmailSSL() {
    console.log('--- Testing Email Configuration (Port 465 SSL) ---');

    // Force Port 465
    const config = {
        host: process.env.SMTP_HOST || '78.41.204.37',
        port: 465,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
    };

    console.log('Testing Configuration:');
    console.log(`Host: ${config.host}`);
    console.log(`Port: ${config.port}`);
    console.log(`User: ${config.user}`);
    console.log(`Secure: true`);

    console.log(`\nAttempting connection to ${config.host}:${config.port}...`);

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: true, // Auto-SSL
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
        console.log('✅ Port 465 SSL Connection Verified Successfully!');
    } catch (error: any) {
        console.error('❌ Connection Failed on 465:', error.message);
    }
}

testEmailSSL();
