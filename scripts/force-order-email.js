
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// --- Manual Mock of imported functionality ---
const generateGiftCardCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GC-';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// --- Mock of sendGiftCardAccessEmail (Simplified wrapper around direct sender) ---
// We will use the sender directly to avoid complex imports if possible,
// but for correctness let's try to simulate the structure from previous analysis.
async function sendEmailLog(to, subject) {
    console.log(`[SIMULATION] Email would be sent to ${to} with subject: ${subject}`);
}
// We will try to dynamically import the real emailer if available, or fetch config and use nodemailer minimally.
// Better: stick to the project structure which we know works now that settings are fixed.

async function main() {
    console.log('--- FORCE ORDER COMPLETION & EMAIL ---');

    // 1. Load Prod Env
    const envPath = path.join(process.cwd(), '.env.production');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
    } else {
        // Fallback to local .env if prod missing (unlikely now)
        dotenv.config();
    }

    // 2. Init Prisma
    const prisma = new PrismaClient();

    try {
        // 3. Find target order
        const orderId = 1; // From previous discovery
        console.log(`Processing Order ID: ${orderId}...`);

        const order = await prisma.giftCardOrder.findUnique({
            where: { id: orderId },
            include: { gift_card: true }
        });

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        console.log(`Found Order: ${order.customer_email}, Status: ${order.payment_status}`);
        if (order.payment_status === 'completed') {
            console.log('Order already completed! proceed to resend email?');
            // If already completed, just resend email
        }

        // 4. Create proper Gift Card record if missing or placeholder
        // The original flow creates a NEW card with a proper code upon payment.
        // The existing "linked" card might be a temporary one or template.
        // In the webhook code: it creates a new GiftCard.

        let finalCardId = order.gift_card_id;
        let giftCard = order.gift_card;

        if (order.payment_status !== 'completed') {
            console.log('Activating Order...');

            if (!giftCard) {
                throw new Error("No linked template card found!");
            }

            const uniqueCode = generateGiftCardCode();
            console.log(`Generated new code: ${uniqueCode}`);

            const newCard = await prisma.giftCard.create({
                data: {
                    code: uniqueCode,
                    amount: giftCard.amount,
                    value: giftCard.value,
                    theme: giftCard.theme || 'christmas',
                    card_template: giftCard.card_template || 'standard',
                    card_title: giftCard.card_title,
                    card_description: giftCard.card_description,
                    recipient_email: order.recipient_email || order.customer_email,
                    recipient_name: order.recipient_name || order.customer_name,
                    sender_name: order.sender_name,
                    message: order.message,
                    status: 'active',
                    owner_id: order.user_id
                }
            });

            finalCardId = newCard.id;
            giftCard = newCard; // Update reference for email

            await prisma.giftCardOrder.update({
                where: { id: orderId },
                data: {
                    payment_status: 'completed',
                    paid_at: new Date(),
                    gift_card_id: finalCardId
                }
            });
            console.log('Database updated: Order Completed, Card Created.');
        } else {
            console.log('Skipping creation (already done).');
        }

        // 5. Trigger Email
        console.log('Triggering Email Dispatch...');

        // We need to use the real email library.
        // Since we are running this script with ts-node/node, direct import of TS files might fail if not compiled.
        // WE MUST USE COMPILED CODE or Register ts-node.
        // OR: simpler -> We construct the email sender using nodemailer locally in this script 
        // ensuring we use the DB settings we just restored.

        const emailLib = await import('../src/lib/email/giftCardAccess.ts').catch(() => null);
        // NOTE: This dynamic import of TS likely won't work in standard node execution without ts-node registration.
        // Safe bet: Re-implement the email logic briefly here to guarantee execution.

        // --- Re-reading SMTP Settings ---
        const settings = await prisma.setting.findFirst({
            where: { smtp_host: { not: null } }
        });
        if (!settings || !settings.smtp_host) throw new Error("SMTP Settings still missing in DB (Checked for non-null host)!");

        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: settings.smtp_host,
            port: settings.smtp_port,
            secure: settings.smtp_port === 465,
            auth: {
                user: settings.smtp_user,
                pass: settings.smtp_password,
            },
            tls: { rejectUnauthorized: false }
        });

        // ... actually, let's just inline a simple HTML for now or try to match the template.
        // The user wants THE email.

        const mailOptions = {
            from: settings.smtp_from,
            to: order.customer_email,
            subject: `Twoja Karta Podarunkowa: ${giftCard.code}`,
            html: `
        <h1>Dziękujemy za zakup!</h1>
        <p>Twoja karta podarunkowa jest gotowa.</p>
        <p><strong>Kod:</strong> ${giftCard.code}</p>
        <p><strong>Link do pobrania:</strong> <a href="https://wlasniewski.pl/karta-podarunkowa/dostep/${order.access_token}">Kliknij tutaj</a></p>
        `
        };

        // Try sending
        const info = await transporter.sendMail(mailOptions);
        console.log('Client Email Sent:', info.messageId);

        // Admin Notif
        const adminMail = settings.smtp_user; // or specific admin email
        if (adminMail) {
            await transporter.sendMail({
                from: settings.smtp_from,
                to: adminMail,
                subject: `[ADMIN] Opłacono kartę ${giftCard.code}`,
                html: `Zamówienie #${orderId} opłacone ręcznie/potwierdzone. Kwota: ${(order.amount_paid / 100).toFixed(2)} PLN.`
            });
            console.log('Admin Email Sent.');
        }

    } catch (e) {
        console.error('Fatal Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
