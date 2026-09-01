import type { Prisma } from '@prisma/client';

type AdvisoryLockTransaction = Pick<Prisma.TransactionClient, '$queryRaw'>;

type LockResult = {
    acquired: number;
};

function assertAcquired(rows: LockResult[], key: string) {
    if (rows[0]?.acquired !== 1) {
        throw new Error(`ADVISORY_LOCK_FAILED:${key}`);
    }
}

/**
 * PostgreSQL advisory lock functions return the database type `void`.
 * Prisma cannot deserialize that type when it is returned directly by
 * `$queryRaw`, so the lock call is materialized and the outer query returns a
 * supported integer instead. The lock is still held until the transaction ends.
 */
export async function acquireAdvisoryTransactionLock(
    tx: AdvisoryLockTransaction,
    key: string,
): Promise<void> {
    const rows = await tx.$queryRaw<LockResult[]>`
        WITH acquired_lock AS MATERIALIZED (
            SELECT pg_advisory_xact_lock(hashtext(${key}))
        )
        SELECT 1::integer AS "acquired"
        FROM acquired_lock
    `;
    assertAcquired(rows, key);
}

/** Same lock contract, using a 64-bit extended text hash. */
export async function acquireExtendedAdvisoryTransactionLock(
    tx: AdvisoryLockTransaction,
    key: string,
): Promise<void> {
    const rows = await tx.$queryRaw<LockResult[]>`
        WITH acquired_lock AS MATERIALIZED (
            SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))
        )
        SELECT 1::integer AS "acquired"
        FROM acquired_lock
    `;
    assertAcquired(rows, key);
}

/** Same lock contract for the two-integer PostgreSQL advisory-lock namespace. */
export async function acquirePairAdvisoryTransactionLock(
    tx: AdvisoryLockTransaction,
    namespace: number,
    objectId: number,
): Promise<void> {
    const rows = await tx.$queryRaw<LockResult[]>`
        WITH acquired_lock AS MATERIALIZED (
            SELECT pg_advisory_xact_lock(
                CAST(${namespace} AS integer),
                CAST(${objectId} AS integer)
            )
        )
        SELECT 1::integer AS "acquired"
        FROM acquired_lock
    `;
    assertAcquired(rows, `${namespace}:${objectId}`);
}
