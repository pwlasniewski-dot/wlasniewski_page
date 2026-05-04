require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.contract.findUnique({
  where: { id: 20 },
  select: {
    id: true, contract_number: true, deposit_amount: true,
    deposit_due_at: true, deposit_paid_at: true, created_at: true, content: true
  }
}).then(c => {
  if (!c) { console.log('not found'); return; }
  console.log('id:', c.id);
  console.log('nr:', c.contract_number);
  console.log('deposit_amount:', c.deposit_amount);
  console.log('deposit_due_at:', c.deposit_due_at);
  console.log('deposit_paid_at:', c.deposit_paid_at);
  console.log('created_at:', c.created_at);
  console.log('--- CONTENT (last 2000 chars) ---');
  console.log((c.content || '').slice(-2000));
}).finally(() => p.$disconnect());
