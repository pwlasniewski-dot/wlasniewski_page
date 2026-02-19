
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyClientAPI(clientId) {
    console.log(`Verifying Client API for ID: ${clientId}...`);

    try {
        const client = await prisma.user.findUnique({
            where: { id: clientId },
            include: {
                orders: {
                    orderBy: { created_at: 'desc' },
                    include: {
                        gift_card: true
                    }
                },
                assigned_bookings: {
                    orderBy: { date: 'desc' }
                },
                assigned_galleries: {
                    orderBy: { created_at: 'desc' },
                    include: {
                        photos: {
                            take: 1
                        }
                    }
                },
                client_galleries: {
                    orderBy: { created_at: 'desc' },
                    include: {
                        photos: {
                            take: 1
                        }
                    }
                },
                baskets: {
                    include: { items: true },
                    orderBy: { updated_at: 'desc' },
                    take: 1
                },
                offers: true,
                contracts: true
            }
        });

        if (!client) {
            console.error("Client not found!");
            return;
        }

        console.log("Client Found:", client.name);
        console.log("Email:", client.email);
        console.log("--- Relations ---");
        console.log("Assigned Galleries (Old):", client.assigned_galleries ? client.assigned_galleries.length : 0);
        console.log("Client Galleries (New):", client.client_galleries ? client.client_galleries.length : 0);
        console.log("Offers:", client.offers ? client.offers.length : 0);
        console.log("Contracts:", client.contracts ? client.contracts.length : 0);

        if (client.client_galleries && client.client_galleries.length > 0) {
            console.log("SUCCESS: Client has linked galleries.");
            console.log("Gallery Code:", client.client_galleries[0].access_code);
        } else {
            console.log("WARNING: No client_galleries found. Migration might have missed this user or they have no galleries.");
        }

    } catch (error) {
        console.error("API Query Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ola Goral ID seems to be 7 based on previous logs
verifyClientAPI(7);
