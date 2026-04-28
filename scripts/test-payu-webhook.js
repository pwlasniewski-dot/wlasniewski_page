// Reset challenge to pre-payment state, then POST a signed PayU notification
// to /api/payu/notify and verify result.
//
// Usage: node scripts/test-payu-webhook.js
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const UNIQUE_LINK = '5c5493b1-a972-4010-9a60-d27c478dbd97';
const HOST = 'http://localhost:3000';

(async () => {
    const prisma = new PrismaClient();
    try {
        const before = await prisma.photoChallenge.findUnique({
            where: { unique_link: UNIQUE_LINK },
            select: { id: true, status: true, payment_status: true, payment_id: true, paid_amount: true, package: { select: { challenge_price: true } } },
        });
        if (!before) throw new Error('Challenge not found');
        console.log('BEFORE:', before);

        // Reset to pending payment
        await prisma.photoChallenge.update({
            where: { id: before.id },
            data: {
                status: 'pending_payment',
                payment_status: 'pending',
                payment_id: null,
                paid_amount: null,
                accepted_at: null,
            },
        });
        await prisma.booking.updateMany({
            where: { challenge_id: before.id },
            data: { status: 'challenge_pending' },
        });
        console.log('Reset to pending_payment + challenge_pending');

        const setting = await prisma.setting.findFirst({
            where: { payu_md5_key: { not: null } },
            orderBy: { id: 'asc' },
            select: { payu_md5_key: true },
        });
        const md5Key = setting?.payu_md5_key;
        if (!md5Key) throw new Error('payu_md5_key not configured in DB');

        const totalAmountGrosze = (before.package?.challenge_price ?? 0) * 100;
        const orderIdPayU = `TEST-${Date.now()}`;
        const extOrderId = `CHALLENGE_${before.id}_${Date.now()}`;

        const payload = {
            order: {
                orderId: orderIdPayU,
                extOrderId,
                status: 'COMPLETED',
                totalAmount: String(totalAmountGrosze),
                currencyCode: 'PLN',
            },
            localReceiptDateTime: new Date().toISOString(),
            properties: [],
        };
        const bodyText = JSON.stringify(payload);
        const signature = crypto.createHash('md5').update(bodyText + md5Key).digest('hex');
        const sigHeader = `signature=${signature};algorithm=MD5;sender=checkout`;

        console.log('Sending webhook with extOrderId =', extOrderId);
        const res = await fetch(`${HOST}/api/payu/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'OpenPayu-Signature': sigHeader },
            body: bodyText,
        });
        console.log('Status:', res.status, await res.text());

        // Wait briefly for async DB writes
        await new Promise((r) => setTimeout(r, 500));

        const after = await prisma.photoChallenge.findUnique({
            where: { id: before.id },
            select: { status: true, payment_status: true, payment_id: true, paid_amount: true, payment_method: true },
        });
        console.log('AFTER:', after);

        const events = await prisma.challengeTimelineEvent.findMany({
            where: { challenge_id: before.id, event_type: 'PAYMENT_COMPLETED' },
            orderBy: { created_at: 'desc' },
            take: 1,
        });
        console.log('Latest PAYMENT_COMPLETED event:', events[0]);

        const ok =
            after?.status === 'sent' &&
            after?.payment_status === 'paid' &&
            after?.payment_id === orderIdPayU;

        console.log(ok ? '✅ E2E PASS' : '❌ E2E FAIL');
        process.exit(ok ? 0 : 1);
    } catch (e) {
        console.error('TEST ERROR:', e);
        process.exit(2);
    } finally {
        await prisma.$disconnect();
    }
})();
