/**
 * EMERGENCY: Seed Settings Table
 * 
 * Problem: Production database has NO records in settings table
 * Symptom: /api/settings and /api/settings/public return 500 Internal Server Error
 * 
 * This script creates the first settings record with default values.
 * Run with: node scripts/emergency-seed-settings.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking settings table...');

    const existing = await prisma.setting.findFirst();

    if (existing) {
        console.log('✅ Settings record already exists with ID:', existing.id);
        console.log('   No action needed.');
        return;
    }

    console.log('⚠️  No settings record found. Creating initial record...');

    const defaultSettings = await prisma.setting.create({
        data: {
            setting_key: 'system_init',
            setting_value: 'true',

            // Navbar
            navbar_layout: 'logo_left_menu_right',
            navbar_sticky: true,
            navbar_transparent: false,
            navbar_font_size: 16,
            navbar_font_family: 'Montserrat',

            // Logo & Branding
            logo_size: 140,
            seasonal_effect: 'none',

            // Email SMTP (empty by default, will be configured in admin)
            smtp_port: 587,

            // Payment P24
            p24_test_mode: true,
            p24_method_blik: true,
            p24_method_card: true,
            p24_method_transfer: true,

            // Payment PayU
            payu_environment: 'sandbox',

            // Booking
            booking_currency: 'PLN',
            booking_min_days_ahead: 7,
            booking_payment_method: 'stripe',
            booking_require_payment: false,

            // Marketing
            urgency_enabled: false,
            urgency_slots_remaining: 5,
            social_proof_enabled: true,
            social_proof_total_clients: 100,
            promo_code_discount_enabled: false,
            promo_code_discount_amount: 10,
            promo_code_discount_type: 'percentage',

            // Gift Cards
            gift_card_promo_enabled: false,
            gift_card_promo_title: 'Karty Podarunkowe',
            gift_card_promo_rotation_interval: 5,
            gift_card_hero_opacity: 0.6,

            // Portfolio
            portfolio_layout: 'slider',
        }
    });

    console.log('✅ Settings record created successfully!');
    console.log('   ID:', defaultSettings.id);
    console.log('   setting_key:', defaultSettings.setting_key);
    console.log('   navbar_layout:', defaultSettings.navbar_layout);
    console.log('   logo_size:', defaultSettings.logo_size);

    console.log('\n📊 Settings Summary:');
    console.log('   - Navbar: Configured with default layout');
    console.log('   - Payment gateways: Test mode enabled');
    console.log('   - Marketing: Disabled by default');
    console.log('   - Portfolio: Slider layout');

    console.log('\n✅ Database is now ready!');
    console.log('   API endpoints /api/settings and /api/settings/public should work now.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log('\n🎉 Done! Database connection closed.');
        process.exit(0);
    })
    .catch(async (e) => {
        console.error('❌ Error:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
