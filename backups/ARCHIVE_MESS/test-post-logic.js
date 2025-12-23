const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPostLogic() {
    console.log('=== Testing POST /api/settings logic ===\n');
    
    // Simulate frontend sending this body
    const body = {
        logo_url: 'https://s3.example.com/logo-test-123.png',
        logo_dark_url: 'https://s3.example.com/logo-dark-test.png',
        logo_size: 200,
        navbar_layout: 'logo_left_menu_right',
        urgency_enabled: true,
        navbar_sticky: false,
    };
    
    console.log('📤 Frontend sends body:', JSON.stringify(body, null, 2));
    
    // Simulate POST handler column field processing
    const columnFields = [
        'parallax_home_1', 'parallax_home_2',
        'about_me_hero_image', 'about_me_portrait',
        'info_band_image', 'info_band_title', 'info_band_content',
        'navbar_layout', 'navbar_sticky', 'navbar_transparent',
        'navbar_font_size', 'navbar_font_family',
        'favicon_url', 'logo_url', 'logo_dark_url', 'logo_size',
        'p24_merchant_id', 'p24_pos_id', 'p24_crc_key', 'p24_api_key',
        'p24_test_mode', 'p24_method_blik', 'p24_method_card', 'p24_method_transfer',
        'payu_client_id', 'payu_client_secret', 'payu_merchant_pos_id', 'payu_md5_key', 'payu_environment',
        'booking_require_payment', 'booking_payment_method', 'booking_currency', 'booking_min_days_ahead',
        'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from',
        'google_analytics_id', 'google_tag_manager_id', 'facebook_pixel_id',
        'meta_verification_google', 'meta_verification_facebook',
        'urgency_enabled', 'urgency_slots_remaining', 'urgency_month',
        'social_proof_total_clients',
        'promo_code_discount_enabled', 'promo_code_discount_amount', 'promo_code_discount_type',
        'gift_card_promo_enabled', 'gift_card_promo_title', 'gift_card_promo_description', 'gift_card_promo_rotation_interval',
        'portfolio_categories',
        'seasonal_effect',
        'portfolio_layout'
    ];
    
    const booleanFields = [
        'navbar_sticky', 'navbar_transparent',
        'urgency_enabled', 'promo_code_discount_enabled',
        'gift_card_promo_enabled', 'p24_test_mode',
        'p24_method_blik', 'p24_method_card', 'p24_method_transfer',
        'booking_require_payment'
    ];
    
    const numericFields = [
        'navbar_font_size', 'logo_size', 'smtp_port',
        'urgency_slots_remaining', 'social_proof_total_clients',
        'booking_min_days_ahead', 'gift_card_promo_rotation_interval'
    ];
    
    const columnUpdates = {};
    const kvUpdates = {};
    
    // Process like POST handler
    for (const [key, value] of Object.entries(body)) {
        console.log(`\n📌 Processing key: "${key}" (value: ${value})`);
        
        if (key === 'payu_pos_id') {
            columnUpdates.payu_merchant_pos_id = value;
            console.log('  → Mapped to payu_merchant_pos_id');
            continue;
        }
        
        if (columnFields.includes(key)) {
            console.log(`  → Found in columnFields`);
            if (booleanFields.includes(key)) {
                columnUpdates[key] = value === 'true' || value === true;
                console.log(`  → Boolean conversion: ${columnUpdates[key]}`);
            } else if (numericFields.includes(key)) {
                columnUpdates[key] = Number(value);
                console.log(`  → Numeric conversion: ${columnUpdates[key]}`);
            } else {
                columnUpdates[key] = value;
                console.log(`  → Direct assign: ${columnUpdates[key]}`);
            }
        } else {
            kvUpdates[key] = String(value);
            console.log(`  → Added to kvUpdates (key/value)`);
        }
    }
    
    console.log('\n\n✅ Final columnUpdates:', JSON.stringify(columnUpdates, null, 2));
    console.log('\n✅ Final kvUpdates:', JSON.stringify(kvUpdates, null, 2));
    
    // Now try to actually save to database
    console.log('\n\n📝 Attempting database update...');
    
    try {
        const firstSetting = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });
        
        if (!firstSetting) {
            console.error('❌ No settings record found!');
            process.exit(1);
        }
        
        console.log(`📌 Updating record id: ${firstSetting.id}`);
        
        const result = await prisma.setting.update({
            where: { id: firstSetting.id },
            data: columnUpdates
        });
        
        console.log('✅ Update successful!');
        console.log('Updated fields:', {
            logo_url: result.logo_url,
            logo_dark_url: result.logo_dark_url,
            logo_size: result.logo_size,
            navbar_layout: result.navbar_layout,
            urgency_enabled: result.urgency_enabled,
            navbar_sticky: result.navbar_sticky,
        });
        
    } catch (error) {
        console.error('❌ Database update failed:', error.message);
        process.exit(1);
    }
    
    await prisma.$disconnect();
}

testPostLogic().catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
});
