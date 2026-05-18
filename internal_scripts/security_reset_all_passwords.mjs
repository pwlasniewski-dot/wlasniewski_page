import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function randomPassword(length = 24) {
  // URL-safe, high-entropy temporary password.
  return crypto.randomBytes(length).toString('base64url');
}

async function main() {
  const now = new Date();
  const cost = 12;

  const admins = await prisma.adminUser.findMany({
    select: { id: true, email: true },
    orderBy: { id: 'asc' },
  });

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
    orderBy: { id: 'asc' },
  });

  if (admins.length === 0 && users.length === 0) {
    console.log('No accounts found to reset.');
    return;
  }

  const adminCredentials = [];

  await prisma.$transaction(async (tx) => {
    // 1) Reset all admin passwords and generate emergency credentials.
    for (const admin of admins) {
      const tempPassword = randomPassword(24);
      const passwordHash = await bcrypt.hash(tempPassword, cost);

      await tx.adminUser.update({
        where: { id: admin.id },
        data: {
          password_hash: passwordHash,
          last_login: null,
        },
      });

      adminCredentials.push({
        id: admin.id,
        email: admin.email,
        tempPassword,
      });
    }

    // 2) Reset all client passwords + invalidate reset tokens.
    for (const user of users) {
      const tempPassword = randomPassword(24);
      const passwordHash = await bcrypt.hash(tempPassword, cost);

      await tx.user.update({
        where: { id: user.id },
        data: {
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expires: null,
          last_login: null,
          last_failed_login: now,
        },
      });
    }
  }, { timeout: 120000 });

  console.log('=== PASSWORD RESET COMPLETED ===');
  console.log(`Admins reset: ${admins.length}`);
  console.log(`Users reset: ${users.length}`);
  console.log('');
  console.log('=== EMERGENCY ADMIN TEMP PASSWORDS ===');
  for (const c of adminCredentials) {
    console.log(`${c.email} => ${c.tempPassword}`);
  }
  console.log('');
  console.log('IMPORTANT: Log in immediately and set new admin passwords in a secure manager.');
}

main()
  .catch((error) => {
    console.error('Reset failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
