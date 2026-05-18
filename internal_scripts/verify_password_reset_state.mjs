import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.adminUser.count();
  const users = await prisma.user.count();
  const usersWithResetToken = await prisma.user.count({
    where: { reset_token: { not: null } },
  });

  console.log(JSON.stringify({ admins, users, users_with_reset_token: usersWithResetToken }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
