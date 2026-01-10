
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'fotograf@wlasniewski.pl';
    const password = 'password123';
    const name = 'Przemysław Provider';

    console.log(`Creating Provider User: ${email}...`);

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'PHOTOGRAPHER',
            password_hash: passwordHash,
            name
        },
        create: {
            email,
            password_hash: passwordHash,
            name,
            role: 'PHOTOGRAPHER',
            is_active: true
        }
    });

    // Ensure Profile exists
    await prisma.photographerProfile.upsert({
        where: { id: user.photographer_profile_id || 0 }, // Simple hack, logically should look up by user connection or create specific
        update: {},
        create: {
            user: { connect: { id: user.id } },
            bio: 'Doświadczony fotograf ślubny.',
            base_commission: 15
        }
    }).catch(async () => {
        // If upsert failed on ID 0, create new connected
        await prisma.photographerProfile.create({
            data: {
                user: { connect: { id: user.id } },
                bio: 'Doświadczony fotograf ślubny.',
                base_commission: 15
            }
        });
    });

    // Connect user to profile if not connected (requires query)
    const profile = await prisma.photographerProfile.findFirst({ where: { user: { id: user.id } } });
    if (profile && !user.photographer_profile_id) {
        await prisma.user.update({
            where: { id: user.id },
            data: { photographer_profile_id: profile.id }
        });
    }

    console.log('✅ Provider created successfully!');
    console.log('Login: ' + email);
    console.log('Pass: ' + password);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
