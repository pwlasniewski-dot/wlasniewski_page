/* Apply foto-match profile migration via Prisma */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, '..', 'database', 'migration_foto_match_profile.sql');
const prisma = new PrismaClient();

async function main() {
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  // Split on semicolons that end a statement; remove pure comments.
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.replace(/^--.*$/gm, '').trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Applying ${statements.length} statements from ${SQL_FILE}...`);
  for (const stmt of statements) {
    const preview = stmt.substring(0, 80).replace(/\s+/g, ' ');
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log('  OK:', preview);
    } catch (err) {
      console.error('  FAIL:', preview, '->', err.message);
      throw err;
    }
  }

  // Sanity checks
  const profileExists = await prisma.$queryRawUnsafe(
    `SELECT to_regclass('public.foto_match_profile') as exists`
  );
  const photoExists = await prisma.$queryRawUnsafe(
    `SELECT to_regclass('public.foto_match_photo') as exists`
  );
  console.log('foto_match_profile:', profileExists);
  console.log('foto_match_photo:', photoExists);

  await prisma.$disconnect();
  console.log('DONE.');
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
