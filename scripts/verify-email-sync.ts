import prisma from '../src/lib/db/prisma';

async function verify() {
    console.log('--- VERIFYING EMAIL SYNC ---');

    // 1. Setup test data
    const testClient = await prisma.user.create({
        data: {
            email: `test-${Date.now()}@example.com`,
            name: 'Test Sync Client',
            password_hash: 'dummy',
            role: 'CLIENT'
        }
    });

    const testOffer = await prisma.offer.create({
        data: {
            title: 'Test Offer Sync',
            slug: `test-offer-${Date.now()}`,
            client_id: testClient.id,
            client_email: testClient.email
        }
    });

    const testGallery = await prisma.clientGallery.create({
        data: {
            client_name: 'Test Gallery Sync',
            access_code: `test-code-${Date.now()}`,
            client_id: testClient.id,
            client_email: testClient.email
        }
    });

    console.log(`Created test client: ${testClient.email} (ID: ${testClient.id})`);
    console.log(`Initially linked Offer email: ${testOffer.client_email}`);
    console.log(`Initially linked Gallery email: ${testGallery.client_email}`);

    // 2. Simulate the fix logic (from the API)
    const newEmail = `updated-${Date.now()}@example.com`;
    console.log(`\nChanging email to: ${newEmail}...`);

    await prisma.$transaction(async (tx) => {
        // Update user
        await tx.user.update({
            where: { id: testClient.id },
            data: { email: newEmail }
        });

        // Cascading update (the logic I just added to the APIs)
        await tx.offer.updateMany({
            where: { client_id: testClient.id },
            data: { client_email: newEmail }
        });

        await tx.clientGallery.updateMany({
            where: { client_id: testClient.id },
            data: { client_email: newEmail }
        });
    });

    // 3. Check results
    const updatedOffer = await prisma.offer.findUnique({ where: { id: testOffer.id } });
    const updatedGallery = await prisma.clientGallery.findUnique({ where: { id: testGallery.id } });

    console.log(`Resulting Offer email: ${updatedOffer?.client_email}`);
    console.log(`Resulting Gallery email: ${updatedGallery?.client_email}`);

    const success = updatedOffer?.client_email === newEmail && updatedGallery?.client_email === newEmail;

    if (success) {
        console.log('\n✅ VERIFICATION SUCCESSFUL: Emails synced correctly.');
    } else {
        console.error('\n❌ VERIFICATION FAILED: Emails did not sync.');
    }

    // 4. Cleanup
    await prisma.clientGallery.delete({ where: { id: testGallery.id } });
    await prisma.offer.delete({ where: { id: testOffer.id } });
    await prisma.user.delete({ where: { id: testClient.id } });
}

verify().catch(console.error);
