
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkServices() {
    try {
        const services = await prisma.serviceType.findMany({
            include: { packages: true }
        });

        console.log(`Found ${services.length} service types.`);
        services.forEach(s => {
            console.log(`- [${s.id}] ${s.name} (Active: ${s.is_active}) - Packages: ${s.packages.length}`);
        });

        if (services.length === 0) {
            console.log('⚠️ No services found! This explains why the reservation page is empty.');
        }

    } catch (error) {
        console.error('Error checking services:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkServices();
