
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log('--- PRODUCTION DEBUG: PAYMENTS & ORDERS ---');

    const envPath = path.join(process.cwd(), '.env.production');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
    } else {
        console.error('.env.production not found');
        process.exit(1);
    }

    const prisma = new PrismaClient();

    try {
        // 1. Check Gift Card Orders (Correct Schema)
        console.log('\nPending/Paid Gift Card Orders (Last 24h):');
        const recentOrders = await prisma.giftCardOrder.findMany({
            take: 10,
            orderBy: { created_at: 'desc' },
            where: {
                created_at: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });

        if (recentOrders.length === 0) {
            console.log("No orders found in the last 24h.");
        } else {
            recentOrders.forEach(o => {
                console.log(`[Order] ${o.created_at.toISOString()} | ID: ${o.id} | Email: ${o.customer_email} | Amount: ${o.amount_paid} | Status: ${o.payment_status} | PayU ID: ${o.payu_order_id}`);
            });
        }

        // 2. Check Bookings - DISABLED DUE TO SCHEMA MISMATCH
        /*
        console.log('\nPending/Confirmed Bookings (Last 24h):');
        const recentBookings = await prisma.booking.findMany({
          take: 10,
          orderBy: { created_at: 'desc' },
          where: {
            created_at: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        });
    
        if (recentBookings.length === 0) {
            console.log("No bookings found in the last 24h.");
        } else {
            recentBookings.forEach(b => {
                 console.log(`[Booking] ${b.created_at.toISOString()} | ID: ${b.id} | Email: ${b.client_email} | Status: ${b.status}`);
            });
        }
        */

        // 3. SMTP Check
        console.log('\nCurrent SMTP Config in DB (Setting table):');
        const settings = await prisma.setting.findFirst();
        if (settings) {
            console.log(`Host: ${settings.smtp_host}`);
            console.log(`User: ${settings.smtp_user}`);
            console.log(`Port: ${settings.smtp_port}`);
            console.log(`From: ${settings.smtp_from}`);
            console.log(`Password set: ${!!settings.smtp_password}`);
        } else {
            console.log('No settings record found.');
        }

    } catch (e) {
        console.error('Query Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
