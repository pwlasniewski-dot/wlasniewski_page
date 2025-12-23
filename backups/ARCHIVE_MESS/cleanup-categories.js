// Cleanup deeply escaped JSON in portfolio_categories
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanup() {
    try {
        console.log('🧹 Cleaning up portfolio_categories...');

        const settings = await prisma.setting.findFirst();
        
        if (!settings) {
            console.log('No settings found');
            process.exit(0);
        }

        console.log('Current value:', settings.portfolio_categories);

        // Try to unescape and parse
        let categories = [];
        
        if (settings.portfolio_categories) {
            try {
                // First, try direct JSON parse
                categories = JSON.parse(settings.portfolio_categories);
                console.log('✅ Valid JSON found:', categories);
            } catch (e) {
                // Try manual unescape if it's escaped
                let unescaped = settings.portfolio_categories;
                
                // Remove excessive escaping
                while (unescaped.includes('\\\"') || unescaped.includes('\\\\')) {
                    unescaped = unescaped
                        .replace(/\\\"/g, '"')
                        .replace(/\\\\/g, '\\');
                }
                
                try {
                    categories = JSON.parse(unescaped);
                    console.log('✅ Unescaped JSON:', categories);
                } catch (e2) {
                    console.log('⚠️ Could not parse as JSON, treating as comma-separated');
                    categories = unescaped.split(',').map(s => s.trim()).filter(s => s && !s.includes('\\'));
                    console.log('✅ Categories extracted:', categories);
                }
            }
        }

        // Save clean categories
        const cleanJSON = JSON.stringify(categories);
        console.log('📝 Saving clean JSON:', cleanJSON);

        await prisma.setting.update({
            where: { id: settings.id },
            data: {
                portfolio_categories: cleanJSON
            }
        });

        console.log('✅ Cleanup complete!');
        console.log('📦 New value:', cleanJSON);
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
