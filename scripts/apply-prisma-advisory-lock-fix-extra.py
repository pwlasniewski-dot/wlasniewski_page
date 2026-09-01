from pathlib import Path


def replace_in_file(path: str, replacements: list[tuple[str, str, int]]) -> None:
    target = Path(path)
    content = target.read_text(encoding='utf-8')
    for old, new, expected in replacements:
        count = content.count(old)
        if count != expected:
            raise SystemExit(f'{path}: expected {expected} occurrence(s), found {count}: {old}')
        content = content.replace(old, new)
    target.write_text(content, encoding='utf-8')


replace_in_file(
    'src/app/api/basket/checkout/route.ts',
    [
        (
            "await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`gift-card:${appliedGiftCardCode}`}))`;",
            "await acquireAdvisoryTransactionLock(tx, `gift-card:${appliedGiftCardCode}`);",
            1,
        ),
        (
            "await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`gift-card:${giftCode}`}))`;",
            "await acquireAdvisoryTransactionLock(tx, `gift-card:${giftCode}`);",
            1,
        ),
        (
            "await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`foto-match-voucher:${voucherRef.code}`}))`;",
            "await acquireAdvisoryTransactionLock(tx, `foto-match-voucher:${voucherRef.code}`);",
            2,
        ),
    ],
)

replace_in_file(
    'src/app/api/payu/notify/route.ts',
    [
        (
            "await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`payu-gift-order:${initialGiftCardOrder.id}:${cartId}`}))`;",
            "await acquireAdvisoryTransactionLock(tx, `payu-gift-order:${initialGiftCardOrder.id}:${cartId}`);",
            1,
        ),
    ],
)

print('Replaced all remaining checkout and PayU advisory locks.')
