#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    console.log('🔍 ADMIN SETTINGS STATUS\n');
    
    try {
        // Check key settings
        const allSettings = await prisma.setting.findMany({
            select: { setting_key: true, setting_value: true }
        });
        
        const photoChallenge = await prisma.setting.findFirst({
            where: { setting_key: 'photo_challenge_module_enabled' }
        });
        
        console.log('📋 Key Settings (Features):');
        const featureKeys = [
            'urgency_enabled',
            'social_proof_total_clients', 
            'gift_card_promo_enabled',
            'promo_code_discount_enabled'
        ];
        
        featureKeys.forEach(key => {
            const setting = allSettings.find(s => s.setting_key === key);
            const value = setting?.setting_value || 'NOT SET';
            console.log(`   ${key}: ${value}`);
        });
        
        console.log('\n🎬 Photo Challenge Module:');
        console.log(`   Enabled: ${photoChallenge?.setting_value ?? 'NOT SET'}`);
        console.log(`   (Found in settings: ${photoChallenge ? 'YES' : 'NO'})`);
        
        console.log('\n📧 Email Config:');
        const emailKeys = ['smtp_host', 'smtp_user', 'smtp_port'];
        emailKeys.forEach(key => {
            const setting = allSettings.find(s => s.setting_key === key);
            const value = setting?.setting_value || 'NOT SET';
            console.log(`   ${key}: ${value}`);
        });
        
        console.log('\n🎨 Navbar:');
        const navKeys = ['navbar_sticky', 'navbar_transparent', 'navbar_font_size'];
        navKeys.forEach(key => {
            const setting = allSettings.find(s => s.setting_key === key);
            const value = setting?.setting_value || 'NOT SET';
            console.log(`   ${key}: ${value}`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
