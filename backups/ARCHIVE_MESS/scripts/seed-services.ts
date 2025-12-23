
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedServices() {
    try {
        console.log('Seeding default services...');

        // 1. Sesja Zdjęciowa
        await prisma.serviceType.upsert({
            where: { name: 'Sesja' },
            create: {
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
            },
            update: {
                description: 'Sesje portretowe, rodzinne, narzeczeńskie',
                icon: '📸',
                is_active: true
            }
        });
        console.log('Upserted Sesja');

        // 2. Ślub
        await prisma.serviceType.upsert({
            where: { name: 'Ślub' },
            create: {
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
            },
            update: {
                description: 'Pełny reportaż ślubny',
                icon: '💍',
                is_active: true
            }
        });
        console.log('Upserted Ślub');

        // 3. Przyjęcie
        await prisma.serviceType.upsert({
            where: { name: 'Przyjęcie' },
            create: {
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
            },
            update: {
                description: 'Urodziny, rocznice, eventy',
                icon: '🎉',
                is_active: true
            }
        });
        console.log('Upserted Przyjęcie');

        // 4. Dron / B2B
        await prisma.serviceType.upsert({
            where: { name: 'Dron' },
            create: {
                name: 'Dron',
                description: 'Usługi techniczne i wizualne z powietrza',
                icon: '🛸',
                order: 4,
                is_active: true,
                packages: {
                    create: [
                        { name: 'Panoramy 360', hours: 1, price: 50000, description: 'Sesja zdjęciowa z powietrza, panoramy sferyczne dla deweloperów', order: 1, is_active: true },
                        { name: 'Inspekcja PV', hours: 3, price: 120000, description: 'Przegląd farmy fotowoltaicznej, raport z Hot-Spotów', order: 2, is_active: true },
                        { name: 'Audyt Termo', hours: 4, price: 180000, description: 'Pełna termowizja budynku, ITC Level 1 certified', order: 3, is_active: true },
                    ]
                }
            },
            update: {
                description: 'Usługi techniczne i wizualne z powietrza',
                icon: '🛸',
                is_active: true
            }
        });
        console.log('Upserted Dron service with packages');

    } catch (error) {
        console.error('Error seeding services:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedServices();
