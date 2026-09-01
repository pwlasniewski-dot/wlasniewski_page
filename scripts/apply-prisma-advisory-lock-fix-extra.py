from pathlib import Path

path = Path('src/app/api/basket/checkout/route.ts')
content = path.read_text(encoding='utf-8')

replacements = [
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
]

for old, new, expected in replacements:
    count = content.count(old)
    if count != expected:
        raise SystemExit(f'Expected {expected} occurrence(s), found {count}: {old}')
    content = content.replace(old, new)

path.write_text(content, encoding='utf-8')
print('Replaced remaining checkout advisory locks.')
