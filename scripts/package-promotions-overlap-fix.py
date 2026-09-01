from pathlib import Path

path = Path('src/app/api/admin/package-promotions/route.ts')
content = path.read_text(encoding='utf-8')
old = """                await tx.packagePromotion.updateMany({
                    where: {
                        id: { not: promotion.id },
                        package_id: { in: servicePackageIds.map(item => item.id) },
                        show_on_home: true,
                    },
                    data: { show_on_home: false, updated_at: now },
                });
"""
new = """                // Keep non-overlapping scheduled promotions eligible for the same
                // homepage tile. Only a promotion competing in the same time
                // window loses the homepage flag.
                await tx.packagePromotion.updateMany({
                    where: {
                        id: { not: promotion.id },
                        package_id: { in: servicePackageIds.map(item => item.id) },
                        is_enabled: true,
                        show_on_home: true,
                        ...(endsAt ? { starts_at: { lt: endsAt } } : {}),
                        OR: [{ ends_at: null }, { ends_at: { gt: startsAt } }],
                    },
                    data: { show_on_home: false, updated_at: now },
                });
"""
if old not in content:
    raise SystemExit('Expected homepage promotion update block not found.')
path.write_text(content.replace(old, new, 1), encoding='utf-8')
print('Homepage promotion overlap correction applied.')
