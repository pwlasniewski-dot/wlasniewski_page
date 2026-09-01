from pathlib import Path

ROOT = Path.cwd()


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding='utf-8')


def replace_exact(path: str, old: str, new: str, expected: int = 1) -> None:
    content = read(path)
    count = content.count(old)
    if count != expected:
        raise SystemExit(f'{path}: expected {expected} occurrence(s), found {count}: {old!r}')
    write(path, content.replace(old, new))


def add_import(path: str, symbol_line: str) -> None:
    content = read(path)
    if symbol_line in content:
        return
    marker = "import prisma from '@/lib/db/prisma';\n"
    if marker not in content:
        raise SystemExit(f'{path}: prisma import marker not found')
    write(path, content.replace(marker, marker + symbol_line + '\n', 1))


admin_route = 'src/app/api/admin/package-promotions/route.ts'
add_import(
    admin_route,
    "import { acquireAdvisoryTransactionLock } from '@/lib/db/advisoryLock';",
)
replace_exact(
    admin_route,
    "await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`package-promotion:${packageId}`}))`;",
    "await acquireAdvisoryTransactionLock(tx, `package-promotion:${packageId}`);",
)
replace_exact(
    admin_route,
    "await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`package-promotion:${current.package_id}`}))`;",
    "await acquireAdvisoryTransactionLock(tx, `package-promotion:${current.package_id}`);",
)

packages_route = 'src/app/api/packages/route.ts'
add_import(
    packages_route,
    "import { acquireAdvisoryTransactionLock } from '@/lib/db/advisoryLock';",
)
replace_exact(
    packages_route,
    "await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`package-promotion:${packageId}`}))`;",
    "await acquireAdvisoryTransactionLock(tx, `package-promotion:${packageId}`);",
)

checkout_route = 'src/app/api/basket/checkout/route.ts'
add_import(
    checkout_route,
    "import { acquireAdvisoryTransactionLock } from '@/lib/db/advisoryLock';",
)
replace_exact(
    checkout_route,
    "await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking:${lockDate}`}))`;",
    "await acquireAdvisoryTransactionLock(tx, `booking:${lockDate}`);",
)
replace_exact(
    checkout_route,
    "await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`promo-code:${appliedPromoCode.toUpperCase()}`}))`;",
    "await acquireAdvisoryTransactionLock(tx, `promo-code:${appliedPromoCode.toUpperCase()}`);",
    expected=2,
)

payu_route = 'src/app/api/payu/notify/route.ts'
add_import(
    payu_route,
    "import { acquireAdvisoryTransactionLock } from '@/lib/db/advisoryLock';",
)
replace_exact(
    payu_route,
    "await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`payu-booking:${initialBooking.id}:${cartId}`}))`;",
    "await acquireAdvisoryTransactionLock(tx, `payu-booking:${initialBooking.id}:${cartId}`);",
)
replace_exact(
    payu_route,
    "await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`promo-code:${promoCode}`}))`;",
    "await acquireAdvisoryTransactionLock(tx, `promo-code:${promoCode}`);",
)

gallery_download = 'src/app/api/galleries/group/[galleryId]/download-all/route.ts'
add_import(
    gallery_download,
    "import { acquireExtendedAdvisoryTransactionLock } from '@/lib/db/advisoryLock';",
)
replace_exact(
    gallery_download,
    "await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${jobId}, 0))`;",
    "await acquireExtendedAdvisoryTransactionLock(transaction, jobId);",
)

for participant_route in [
    'src/app/api/galleries/group/participant/[id]/select/route.ts',
    'src/app/api/galleries/group/participant/[id]/consent/route.ts',
]:
    add_import(
        participant_route,
        "import { acquirePairAdvisoryTransactionLock } from '@/lib/db/advisoryLock';",
    )
    replace_exact(
        participant_route,
        "await tx.$queryRaw`SELECT pg_advisory_xact_lock(7717, ${participantId!})`;",
        "await acquirePairAdvisoryTransactionLock(tx, 7717, participantId!);",
    )

integration_workflow = '.github/workflows/package-promotion-save-integration.yml'
replace_exact(
    integration_workflow,
    """await tx.$queryRawUnsafe(
                'SELECT pg_advisory_xact_lock(hashtext($1))',
                `package-promotion:${packageId}`,
              );""",
    """const lockRows = await tx.$queryRawUnsafe(
                `WITH acquired_lock AS MATERIALIZED (
                   SELECT pg_advisory_xact_lock(hashtext($1))
                 )
                 SELECT 1::integer AS acquired FROM acquired_lock`,
                `package-promotion:${packageId}`,
              );
              if (lockRows[0]?.acquired !== 1) throw new Error('ADVISORY_LOCK_FAILED');""",
)

write(
    'tests/unit/prisma-advisory-locks.test.ts',
    """import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const productionLockFiles = [
    'src/app/api/admin/package-promotions/route.ts',
    'src/app/api/packages/route.ts',
    'src/app/api/basket/checkout/route.ts',
    'src/app/api/payu/notify/route.ts',
    'src/app/api/galleries/group/[galleryId]/download-all/route.ts',
    'src/app/api/galleries/group/participant/[id]/select/route.ts',
    'src/app/api/galleries/group/participant/[id]/consent/route.ts',
];

function source(path: string) {
    return readFileSync(path, 'utf8');
}

test('production routes never return PostgreSQL void advisory locks through Prisma', () => {
    for (const path of productionLockFiles) {
        const content = source(path);
        assert.doesNotMatch(
            content,
            /\$queryRaw(?:Unsafe)?[\s\S]{0,120}SELECT\s+pg_advisory_xact_lock/i,
            `${path} still exposes a void advisory-lock result to Prisma`,
        );
    }
});

test('shared advisory-lock helper materializes the void function and returns integer', () => {
    const helper = source('src/lib/db/advisoryLock.ts');
    assert.match(helper, /WITH acquired_lock AS MATERIALIZED/);
    assert.match(helper, /SELECT 1::integer AS \"acquired\"/);
    assert.match(helper, /hashtext/);
    assert.match(helper, /hashtextextended/);
    assert.match(helper, /CAST\(\$\{namespace\} AS integer\)/);
});
""",
)

print('Applied Prisma-safe advisory-lock patch to all production callers.')
