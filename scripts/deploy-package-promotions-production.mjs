import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const TARGET_MIGRATION = '20260901130000_package_promotions';
const EXPECTED_DATABASE = process.env.PACKAGE_PROMOTIONS_EXPECTED_DATABASE || 'neondb';
const PRODUCTION_CONTEXT = 'production';

function stop(message) {
  throw new Error(`[package-promotions-deploy] ${message}`);
}

function ensureProductionContext() {
  if (process.env.CONTEXT !== PRODUCTION_CONTEXT) {
    console.log(`[package-promotions-deploy] Skipped outside Netlify production context (${process.env.CONTEXT || 'unknown'}).`);
    return false;
  }
  if (process.env.NETLIFY !== 'true') {
    stop('Safety stop: the migration bridge can run only inside Netlify.');
  }
  return true;
}

function validateConnectionTarget() {
  const raw = process.env.DATABASE_URL;
  if (!raw) stop('Safety stop: DATABASE_URL is missing. No database change was attempted.');

  let connection;
  try {
    connection = new URL(raw);
  } catch {
    stop('Safety stop: DATABASE_URL is not a valid URL.');
  }

  if (!['postgresql:', 'postgres:'].includes(connection.protocol)) {
    stop('Safety stop: DATABASE_URL is not a PostgreSQL connection.');
  }
  if (!/(^|\.)neon\.tech$/i.test(connection.hostname)) {
    stop('Safety stop: DATABASE_URL does not point to Neon.');
  }
  if (decodeURIComponent(connection.pathname.replace(/^\//, '')) !== EXPECTED_DATABASE) {
    stop(`Safety stop: expected database ${EXPECTED_DATABASE}.`);
  }
}

function localMigrationNames() {
  return fs.readdirSync('prisma/migrations', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function runPrismaMigrateDeploy() {
  const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(executable, ['--no-install', 'prisma', 'migrate', 'deploy'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    stop(`prisma migrate deploy exited with code ${result.status ?? 'unknown'}.`);
  }
}

async function inspectBefore(prisma) {
  const [identity] = await prisma.$queryRawUnsafe(`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      to_regclass('public.packages')::text AS packages_table,
      to_regclass('public.bookings')::text AS bookings_table,
      to_regclass('public._prisma_migrations')::text AS migrations_table,
      to_regclass('public.package_promotions')::text AS promotions_table,
      to_regclass('public.package_price_history')::text AS price_history_table
  `);

  if (!identity || identity.database_name !== EXPECTED_DATABASE || identity.schema_name !== 'public') {
    stop('Safety stop: connected database identity does not match the production application database.');
  }
  if (!identity.packages_table || !identity.bookings_table || !identity.migrations_table) {
    stop('Safety stop: required production application tables are missing.');
  }

  const [packageState] = await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*)::int AS packages_count,
      COUNT(*) FILTER (WHERE price <= 0)::int AS invalid_package_prices
    FROM "packages"
  `);
  if (!packageState || packageState.packages_count < 1) {
    stop('Safety stop: no booking packages were found.');
  }
  if (packageState.invalid_package_prices !== 0) {
    stop(`Safety stop: ${packageState.invalid_package_prices} packages have a non-positive price.`);
  }

  const failed = await prisma.$queryRawUnsafe(`
    SELECT migration_name
    FROM "_prisma_migrations"
    WHERE finished_at IS NULL AND rolled_back_at IS NULL
  `);
  if (failed.length > 0) {
    stop(`Safety stop: unfinished Prisma migration(s): ${failed.map((row) => row.migration_name).join(', ')}.`);
  }

  const appliedRows = await prisma.$queryRawUnsafe(`
    SELECT migration_name
    FROM "_prisma_migrations"
    WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
  `);
  const applied = new Set(appliedRows.map((row) => row.migration_name));
  const local = localMigrationNames();
  if (!local.includes(TARGET_MIGRATION)) {
    stop(`Safety stop: local migration ${TARGET_MIGRATION} is missing.`);
  }
  const pending = local.filter((name) => !applied.has(name));

  if (applied.has(TARGET_MIGRATION)) {
    if (!identity.promotions_table || !identity.price_history_table) {
      stop('Safety stop: target migration is marked as applied, but promotion tables are missing.');
    }
    if (pending.length > 0) {
      stop(`Safety stop: unrelated pending migration(s): ${pending.join(', ')}.`);
    }
    console.log(`[package-promotions-deploy] ${TARGET_MIGRATION} is already applied; migration step will be a no-op.`);
    return { shouldMigrate: false, packagesCount: packageState.packages_count };
  }

  if (identity.promotions_table || identity.price_history_table) {
    stop('Safety stop: promotion tables exist without a completed target migration record.');
  }
  if (pending.length !== 1 || pending[0] !== TARGET_MIGRATION) {
    stop(`Safety stop: expected only ${TARGET_MIGRATION} to be pending; found ${pending.join(', ') || 'none'}.`);
  }

  console.log(`[package-promotions-deploy] Preflight OK: exactly one migration is pending (${TARGET_MIGRATION}).`);
  console.log(`[package-promotions-deploy] Validated ${packageState.packages_count} packages; no promotion will be activated.`);
  return { shouldMigrate: true, packagesCount: packageState.packages_count };
}

async function inspectAfter(prisma, expectedPackagesCount) {
  const [verification] = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT COUNT(*)::int
       FROM "_prisma_migrations"
       WHERE migration_name = $1
         AND finished_at IS NOT NULL
         AND rolled_back_at IS NULL) AS completed_migration,
      (SELECT COUNT(*)::int FROM "packages") AS packages_count,
      (SELECT COUNT(*)::int
       FROM "package_price_history"
       WHERE valid_to IS NULL) AS open_history_rows,
      (SELECT COUNT(*)::int
       FROM "package_promotions"
       WHERE is_enabled = TRUE) AS enabled_promotions,
      (SELECT COUNT(*)::int
       FROM pg_trigger
       WHERE tgname = 'packages_record_regular_price_history'
         AND NOT tgisinternal) AS trigger_count,
      (SELECT COUNT(*)::int
       FROM pg_constraint
       WHERE conname IN (
         'package_promotions_price_check',
         'package_promotions_calculation_check',
         'package_promotions_reference_period_check',
         'package_promotions_period_check'
       )) AS critical_constraint_count
  `, TARGET_MIGRATION);

  const failures = [];
  if (!verification || verification.completed_migration !== 1) failures.push('migration record');
  if (verification?.packages_count !== expectedPackagesCount) failures.push('package count changed');
  if (verification?.open_history_rows !== verification?.packages_count) failures.push('price-history baseline');
  if (verification?.enabled_promotions !== 0) failures.push('unexpected active promotion');
  if (verification?.trigger_count !== 1) failures.push('price-history trigger');
  if (verification?.critical_constraint_count !== 4) failures.push('critical constraints');

  if (failures.length > 0) {
    stop(`Post-migration verification failed: ${failures.join(', ')}.`);
  }

  console.log(`[package-promotions-deploy] Migration verified: ${TARGET_MIGRATION}.`);
  console.log(`[package-promotions-deploy] Price history rows: ${verification.open_history_rows}; active promotions: 0.`);
}

async function main() {
  if (!ensureProductionContext()) return;
  validateConnectionTarget();

  const prisma = new PrismaClient();
  try {
    const before = await inspectBefore(prisma);
    await prisma.$disconnect();

    if (before.shouldMigrate) runPrismaMigrateDeploy();

    const verifier = new PrismaClient();
    try {
      await inspectAfter(verifier, before.packagesCount);
    } finally {
      await verifier.$disconnect();
    }
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
