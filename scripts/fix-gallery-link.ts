import prisma from '../src/lib/db/prisma';

async function main() {
    console.log('--- RECONNECTING GALLERY ---');

    // Update the gallery for Ola Goral
    const updatedGallery = await prisma.clientGallery.update({
        where: { id: 5 },
        data: {
            client_id: 7,
            client_email: 'pwlasniewski@icloud.com'
        }
    });

    console.log('UPDATED GALLERY:', JSON.stringify(updatedGallery, null, 2));
}

main().catch(console.error);
