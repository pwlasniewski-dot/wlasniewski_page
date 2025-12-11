#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    console.log('\n' + '='.repeat(70));
    console.log('ADMIN SETTINGS COMPREHENSIVE AUDIT');
    console.log('='.repeat(70) + '\n');
    
    try {
        // 1. Check Settings table
        console.log('📋 SETTINGS TABLE (Setting model):');
        const allSettings = await prisma.setting.findMany({
            select: { setting_key: true, setting_value: true }
        });
        
        if (allSettings.length === 0) {
            console.log('   ⚠️  EMPTY - No settings found!');
        } else {
            console.log(`   Found ${allSettings.length} total settings`);
        }

        console.log('\n📌 FEATURE FLAGS:');
        const featureKeys = [
            'urgency_enabled',
            'social_proof_total_clients',
            'gift_card_promo_enabled',
            'promo_code_discount_enabled'
        ];
        
        featureKeys.forEach(key => {
            const setting = allSettings.find(s => s.setting_key === key);
            const value = setting?.setting_value || 'NOT SET';
            const status = value === 'NOT SET' ? '❌' : (value === 'true' ? '✅' : value === 'false' ? '🔴' : '⚠️');
            console.log(`   ${status} ${key}: ${value}`);
        });

        console.log('\n📧 EMAIL CONFIG:');
        const emailKeys = ['smtp_host', 'smtp_user', 'smtp_port', 'smtp_password', 'smtp_from'];
        const emailConfig = {};
        emailKeys.forEach(key => {
            const setting = allSettings.find(s => s.setting_key === key);
            const value = setting?.setting_value || 'NOT SET';
            emailConfig[key] = value;
            const status = value === 'NOT SET' ? '❌' : '✅';
            console.log(`   ${status} ${key}: ${value === 'NOT SET' ? 'NOT SET' : (key === 'smtp_password' && value !== 'NOT SET' ? '***HIDDEN***' : value)}`);
        });
        
        const emailComplete = !Object.values(emailConfig).includes('NOT SET');
        console.log(`   ${emailComplete ? '✅ COMPLETE' : '❌ INCOMPLETE - Email sending will fail'}`);

        console.log('\n🎨 NAVBAR CONFIG:');
        const navKeys = ['navbar_sticky', 'navbar_transparent', 'navbar_font_size', 'navbar_layout'];
        navKeys.forEach(key => {
            const setting = allSettings.find(s => s.setting_key === key);
            const value = setting?.setting_value || 'NOT SET';
            const status = value === 'NOT SET' ? '⚠️' : '✅';
            console.log(`   ${status} ${key}: ${value}`);
        });

        // 2. Check ChallengeSetting table
        console.log('\n\n📸 CHALLENGE SETTINGS TABLE (ChallengeSetting model):');
        const challengeSettings = await prisma.challengeSetting.findMany({
            select: { setting_key: true, setting_value: true, setting_type: true }
        });
        
        if (challengeSettings.length === 0) {
            console.log('   ⚠️  EMPTY - No challenge settings found!');
            console.log('   This needs to be initialized from admin panel');
        } else {
            console.log(`   Found ${challengeSettings.length} settings`);
            challengeSettings.forEach(s => {
                console.log(`   - ${s.setting_key}: ${s.setting_value} (type: ${s.setting_type})`);
            });
        }

        // 3. Check Photo Challenge data
        console.log('\n\n🎬 PHOTO CHALLENGE DATA:');
        const photoChallengeCount = await prisma.photoChallenge.count();
        console.log(`   Total invitations: ${photoChallengeCount}`);

        // 4. Check Gift Cards
        console.log('\n\n🎁 GIFT CARD DATA:');
        const giftCards = await prisma.giftCard.count();
        const giftCardOrders = await prisma.giftCardOrder.count();
        console.log(`   Gift card products: ${giftCards}`);
        console.log(`   Gift card orders: ${giftCardOrders}`);

        if (giftCards > 0) {
            const cards = await prisma.giftCard.findMany({
                select: { code: true, value: true, status: true },
                take: 5
            });
            console.log('   Products:');
            cards.forEach(c => console.log(`      - ${c.code}: ${c.value} PLN (${c.status})`));
        }

        // 5. Check Settings API endpoint requirements
        console.log('\n\n✅ SETTINGS API ENDPOINT REQUIREMENTS:');
        const requiredSettings = [
            'smtp_host',
            'smtp_port', 
            'smtp_user',
            'smtp_password',
            'smtp_from'
        ];
        
        const missingSettings = requiredSettings.filter(key => {
            const setting = allSettings.find(s => s.setting_key === key);
            return !setting || !setting.setting_value;
        });

        if (missingSettings.length > 0) {
            console.log(`   ❌ Missing/Empty: ${missingSettings.join(', ')}`);
            console.log('   → Go to Admin → Settings → Email and fill in values');
        } else {
            console.log('   ✅ All required email settings are configured');
        }

        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('SUMMARY:');
        console.log('='.repeat(70));
        
        console.log(`\n✅ Settings configured: ${allSettings.length}`);
        console.log(`${emailComplete ? '✅' : '❌'} Email fully configured`);
        console.log(`${challengeSettings.length > 0 ? '✅' : '⚠️'} Challenge settings: ${challengeSettings.length > 0 ? 'Yes' : 'Not yet initialized'}`);
        
        const activeFeatures = [
            allSettings.find(s => s.setting_key === 'urgency_enabled')?.setting_value === 'true' ? 'Urgency' : null,
            allSettings.find(s => s.setting_key === 'social_proof_total_clients')?.setting_value ? 'Social Proof' : null,
            allSettings.find(s => s.setting_key === 'gift_card_promo_enabled')?.setting_value === 'true' ? 'Gift Card Promo' : null,
            allSettings.find(s => s.setting_key === 'promo_code_discount_enabled')?.setting_value === 'true' ? 'Promo Codes' : null,
            challengeSettings.find(s => s.setting_key === 'module_enabled')?.setting_value === 'true' ? 'Photo Challenge' : null,
        ].filter(Boolean);

        console.log(`\n🎯 Active features: ${activeFeatures.length > 0 ? activeFeatures.join(', ') : 'None'}`);
        
        console.log('\n' + '='.repeat(70) + '\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
