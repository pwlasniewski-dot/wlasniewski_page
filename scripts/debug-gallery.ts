import prisma from '../src/lib/db/prisma';

async function main() {
    console.log('--- DATABASE INSPECTION ---');

    // Find galleries related to "Goral" or "Ola"
    const galleries = await prisma.clientGallery.findMany({
        where: {
            OR: [
                { client_name: { contains: 'Ola', mode: 'insensitive' } },
                { client_name: { contains: 'Goral', mode: 'insensitive' } },
                { client_email: { contains: 'pwlasniewski', mode: 'insensitive' } }
            ]
        }
    });

    console.log('FOUND GALLERIES:', JSON.stringify(galleries, null, 2));

    // Find the client in CRM to see the email
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: 'Ola', mode: 'insensitive' } },
                { name: { contains: 'Goral', mode: 'insensitive' } },
                { email: { contains: 'pwlasniewski', mode: 'insensitive' } }
            ]
        }
    });

    console.log('FOUND CLIENTS (CRM):', JSON.stringify(users, null, 2));
}

main().catch(console.error);
