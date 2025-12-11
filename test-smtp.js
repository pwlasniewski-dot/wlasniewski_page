// Test email sending directly
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
    console.log('📧 Testing SMTP Configuration...\n');
    
    const config = {
        host: process.env.SMTP_HOST || 'mail.wlasniewski.pl',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true, // port 465 = secure
        auth: {
            user: process.env.SMTP_USER || 'noreply@wlasniewski.pl',
            pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
        }
    };
    
    console.log('Config (pass hidden):');
    console.log(`  Host: ${config.host}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  Secure: ${config.secure}`);
    console.log(`  User: ${config.auth.user}`);
    console.log(`  Pass: ${config.auth.pass ? '[SET]' : '[NOT SET]'}`);
    
    if (!config.auth.pass) {
        console.log('\n❌ ERROR: SMTP_PASS or SMTP_PASSWORD not set in .env');
        process.exit(1);
    }
    
    try {
        console.log('\n📨 Creating transporter...');
        const transporter = nodemailer.createTransport(config);
        
        console.log('🔍 Verifying connection...');
        await transporter.verify();
        
        console.log('✅ SMTP Connection Verified!\n');
        
        console.log('📤 Sending test email...');
        const result = await transporter.sendMail({
            from: config.auth.user,
            to: config.auth.user, // send to self
            subject: '✅ Test Email - SMTP Working',
            html: `
                <h1>SMTP Test Successful!</h1>
                <p>Your SMTP configuration is working correctly.</p>
                <p><strong>From:</strong> ${config.auth.user}</p>
                <p><strong>Host:</strong> ${config.host}:${config.port}</p>
            `
        });
        
        console.log('✅ Email sent successfully!');
        console.log(`   Message ID: ${result.messageId}`);
        
    } catch (error) {
        console.log('\n❌ SMTP Error:');
        console.log(`   ${error.message}`);
        console.log(`   Code: ${error.code}`);
        console.log(`   Command: ${error.command}`);
        console.log(`   Response: ${error.response}`);
        console.log(`   Response Code: ${error.responseCode}`);
        process.exit(1);
    }
}

testSMTP();
