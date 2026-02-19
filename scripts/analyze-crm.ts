
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Analyzing CRM Data...");

    const userCount = await prisma.user.count();
    const clientCount = await prisma.client.count();
    const galleryCount = await prisma.clientGallery.count();

    console.log(`Users (Legacy/Auth): ${userCount}`);
    console.log(`Clients (New CRM): ${clientCount}`);
    console.log(`ClientGalleries: ${galleryCount}`);

    // Check for "Ola Goral"
    console.log("\nSearching for 'Ola Goral'...");

    const olaUser = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'Ola', mode: 'insensitive' } },
                { email: { contains: 'ola', mode: 'insensitive' } }
            ]
        }
    });

    if (olaUser) {
        console.log("Found User:", JSON.stringify(olaUser, null, 2));

        // Check galleries by email
        const galleriesByEmail = await prisma.clientGallery.findMany({
            where: { client_email: olaUser.email }
        });
        console.log(`Galleries by User Email (${olaUser.email}): ${galleriesByEmail.length}`);

        // Check galleries by relation (photographer_id)
        // Note: The relation "assigned_galleries" uses photographer_id, which is wrong for client view.
        // We can't check assigned_galleries easily here as it's not a direct query, but let's check by ID if possible.
        const galleriesByPhotographerId = await prisma.clientGallery.findMany({
            where: { photographer_id: olaUser.id }
        });
        console.log(`Galleries by User ID (as photographer): ${galleriesByPhotographerId.length}`);
    } else {
        console.log("User 'Ola Goral' (or similar) NOT found in User table.");
    }

    const olaClient = await prisma.client.findFirst({
        where: {
            OR: [
                { firstName: { contains: 'Ola', mode: 'insensitive' } },
                { lastName: { contains: 'Goral', mode: 'insensitive' } },
                { email: { contains: 'ola', mode: 'insensitive' } }
            ]
        }
    });

    if (olaClient) {
        console.log("Found Client (CRM):", JSON.stringify(olaClient, null, 2));
    } else {
        console.log("Client 'Ola Goral' (or similar) NOT found in Client table.");
    }

    // Check galleries for "Ola Goral" directly by name
    const galleriesByName = await prisma.clientGallery.findMany({
        where: { client_name: { contains: 'Ola', mode: 'insensitive' } }
    });
    console.log(`Galleries by Name 'Ola': ${galleriesByName.length}`);
    if (galleriesByName.length > 0) {
        console.log("Example Gallery:", JSON.stringify(galleriesByName[0], null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
