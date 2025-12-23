#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    console.log('🔍 DEBUG GIFT CARDS\n');
    
    try {
        // 1. Check gift cards
        const giftCards = await prisma.giftCardOrder.findMany();
        console.log(`📦 Gift Cards w bazie: ${giftCards.length}`);
        if (giftCards.length > 0) {
            giftCards.forEach((card, i) => {
                console.log(`   ${i+1}. ID: ${card.id}, Status: ${card.status}, Email: ${card.recipient_email}`);
            });
        } else {
            console.log('   ❌ BRAK KART W BAZIE');
        }
        
        // 2. Check SMTP settings
        console.log('\n📧 SMTP Configuration:');
        const smtpHost = await prisma.setting.findFirst({ 
            where: { setting_key: 'smtp_host' }
        });
        const smtpPort = await prisma.setting.findFirst({ 
            where: { setting_key: 'smtp_port' }
        });
        const smtpUser = await prisma.setting.findFirst({ 
            where: { setting_key: 'smtp_user' }
        });
        
        console.log(`   Host: ${smtpHost?.setting_value || '❌ NOT SET'}`);
        console.log(`   Port: ${smtpPort?.setting_value || '❌ NOT SET'}`);
        console.log(`   User: ${smtpUser?.setting_value || '❌ NOT SET'}`);
        
        // 3. Check env
        console.log('\n🔑 Environment:');
        console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET'}`);
        console.log(`   SMTP_HOST env: ${process.env.SMTP_HOST || '❌ NOT SET'}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
