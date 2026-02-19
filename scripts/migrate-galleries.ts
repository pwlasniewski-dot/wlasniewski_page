
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateGalleries() {
    console.log("Starting gallery migration...");

    // 1. Get all galleries without client_id
    const galleries = await prisma.clientGallery.findMany({
        where: {
            client_id: null
        }
    });

    console.log(`Found ${galleries.length} unlinked galleries.`);

    let linkedCount = 0;

    for (const gallery of galleries) {
        if (!gallery.client_email) {
            console.log(`Gallery ${gallery.id} has no email. Skipping.`);
            continue;
        }

        // 2. Find user by email
        const user = await prisma.user.findUnique({
            where: { email: gallery.client_email }
        });

        if (user) {
            console.log(`Linking Gallery ${gallery.id} (${gallery.client_email}) to User ${user.id} (${user.name})`);

            // 3. Update gallery with client_id
            await prisma.clientGallery.update({
                where: { id: gallery.id },
                data: { client_id: user.id }
            });
            linkedCount++;
        } else {
            console.log(`No user found for email ${gallery.client_email} (Gallery ${gallery.id})`);
        }
    }

    console.log(`Migration complete. Linked ${linkedCount}/${galleries.length} galleries.`);
}

migrateGalleries()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
