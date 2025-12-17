
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedServices() {
    try {
        console.log('Seeding default services...');

        // 1. Sesja Zdjęciowa
        const session = await prisma.serviceType.create({
            data: {
                name: 'Sesja',
                description: 'Sesje portretowe, rodzinne, narzeczeńskie',
                icon: '📸',
                order: 1,
                is_active: true,
                packages: {
                    create: [
                        { name: 'Mini', hours: 1, price: 40000, description: 'Szybka sesja, 5 zdjęć', order: 1, is_active: true },
                        { name: 'Standard', hours: 2, price: 70000, description: '15 zdjęć, 2 stylizacje', order: 2, is_active: true },
                        { name: 'Premium', hours: 3, price: 120000, description: '30 zdjęć, album, wizaż', order: 3, is_active: true },
                    ]
                }
            }
        });
        console.log('Created Sesja');

        // 2. Ślub
        const wedding = await prisma.serviceType.create({
            data: {
                name: 'Ślub',
                description: 'Pełny reportaż ślubny',
                icon: '💍',
                order: 2,
                is_active: true,
                packages: {
                    create: [
                        { name: 'Ceremonia', hours: 4, price: 150000, description: 'Tylko ceremonia i życzenia', order: 1, is_active: true },
                        { name: 'Wesele', hours: 10, price: 350000, description: 'Od przygotowań do oczepin', order: 2, is_active: true },
                        { name: 'Full Day', hours: 14, price: 500000, description: 'Pełny dzień + sesja plenerowa', order: 3, is_active: true },
                    ]
                }
            }
        });
        console.log('Created Ślub');

        // 3. Przyjęcie
        const event = await prisma.serviceType.create({
            data: {
                name: 'Przyjęcie',
                description: 'Urodziny, rocznice, eventy',
                icon: '🎉',
                order: 3,
                is_active: true,
                packages: {
                    create: [
                        { name: 'Reportaż', hours: 4, price: 120000, description: 'Dokumentacja wydarzenia', order: 1, is_active: true },
                    ]
                }
            }
        });
        console.log('Created Przyjęcie');

    } catch (error) {
        console.error('Error seeding services:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedServices();
