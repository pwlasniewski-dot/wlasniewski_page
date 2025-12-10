#!/usr/bin/env node
/**
 * Szybki skrypt do sprawdzenia adminów w bazie
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAdmins() {
    try {
        console.log('\n📋 Lista Administratorów\n');

        const admins = await prisma.adminUser.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                created_at: true,
                last_login: true
            },
            orderBy: { id: 'asc' }
        });

        if (admins.length === 0) {
            console.log('⚠️  Brak administratorów w bazie danych!');
            console.log('\nAby utworzyć admina, uruchom:');
            console.log('node scripts/create-admin.js');
        } else {
            console.log(`Znaleziono ${admins.length} administrator(ów):\n`);

            admins.forEach((admin, index) => {
                console.log(`${index + 1}. ${admin.email}`);
                console.log(`   Nazwa: ${admin.name || 'Brak'}`);
                console.log(`   Rola: ${admin.role}`);
                console.log(`   Utworzony: ${admin.created_at.toLocaleString('pl-PL')}`);
                console.log(`   Ostatnie logowanie: ${admin.last_login ? admin.last_login.toLocaleString('pl-PL') : 'Nigdy'}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Błąd:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

listAdmins();
