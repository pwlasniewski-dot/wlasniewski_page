
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugMenuDelete() {
    console.log('🗑️ Debugging Menu Deletion...');

    try {
        // 1. Create a dummy item
        const item = await prisma.menuItem.create({
            data: {
                title: 'DEBUG_DELETE_ME',
                url: '/debug',
                order: 9999,
                menu_type: 'b2b'
            }
        });
        console.log(`✅ Created dummy item ID: ${item.id}`);

        // 2. Attempt to delete it + children (mimic API logic)
        console.log(`Trying to delete item ID: ${item.id}...`);

        // Find existing
        const existing = await prisma.menuItem.findUnique({ where: { id: item.id } });
        if (existing) {
            // Delete children
            const deletedChildren = await prisma.menuItem.deleteMany({ where: { parent_id: item.id } });
            console.log(`   Deleted ${deletedChildren.count} children.`);

            // Delete item
            await prisma.menuItem.delete({ where: { id: item.id } });
            console.log(`✅ Successfully deleted item ID: ${item.id}`);
        } else {
            console.error('❌ Item not found immediately after creation!');
        }

    } catch (e) {
        console.error('❌ Error during deletion simulation:', e);
    }
}

debugMenuDelete()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
