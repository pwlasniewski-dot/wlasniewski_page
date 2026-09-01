import assert from 'node:assert/strict';
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
    assert.match(helper, /SELECT 1::integer AS "acquired"/);
    assert.match(helper, /hashtext/);
    assert.match(helper, /hashtextextended/);
    assert.match(helper, /CAST\(\$\{namespace\} AS integer\)/);
});
