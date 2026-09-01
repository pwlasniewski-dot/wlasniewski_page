import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db/prisma';
import { acquireAdvisoryTransactionLock } from '@/lib/db/advisoryLock';
import { requireAdminAuth } from '@/lib/auth/middleware';
import { logSystem } from '@/lib/logger';
import {
    calculatePromotionalPrice,
    calculateReferenceDiscountPercent,
    formatPricePln,
    homepagePromotionServiceNames,
    legalReferenceText,
    resolveLowestPriceBeforePromotion,
    toPublicPackagePromotion,
    type PromotionDiscountType,
} from '@/lib/packagePromotions';

function asPositiveInteger(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseDate(value: unknown): Date | null {
    if (typeof value !== 'string' || !value.trim()) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function promotionStatus(promotion: {
    is_enabled: boolean;
    starts_at: Date;
    ends_at: Date | null;
}, now = new Date()) {
    if (!promotion.is_enabled) return 'DRAFT';
    if (promotion.starts_at > now) return 'SCHEDULED';
    if (promotion.ends_at && promotion.ends_at <= now) return 'ENDED';
    return 'ACTIVE';
}

function refreshPromotionSurfaces() {
    revalidatePath('/');
    revalidatePath('/rezerwacja');
    revalidatePath('/admin/promocje');
}

export async function GET(request: NextRequest) {
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    try {
        const packages = await prisma.package.findMany({
            include: {
                service: true,
                promotions: {
                    orderBy: [{ starts_at: 'desc' }, { id: 'desc' }],
                    take: 10,
                },
                price_history: {
                    orderBy: { valid_from: 'desc' },
                    take: 40,
                },
            },
            orderBy: [{ service_id: 'asc' }, { order: 'asc' }],
        });

        const now = new Date();
        const historyPreview = await Promise.all(packages.map(async pkg => {
            try {
                return await resolveLowestPriceBeforePromotion(pkg.id, now, prisma, undefined, pkg.created_at);
            } catch {
                return { completeHistory: false, lowestPrice: null, referencePeriod: 'THIRTY_DAYS' as const };
            }
        }));

        return NextResponse.json({
            success: true,
            generatedAt: now.toISOString(),
            packages: packages.map((pkg, index) => ({
                id: pkg.id,
                serviceId: pkg.service_id,
                serviceName: pkg.service.name,
                packageName: pkg.name,
                regularPrice: pkg.price,
                createdAt: pkg.created_at.toISOString(),
                isActive: pkg.is_active && pkg.service.is_active,
                automaticReference: {
                    available: historyPreview[index]?.completeHistory === true,
                    lowestPrice30d: historyPreview[index]?.lowestPrice || null,
                    referencePeriod: historyPreview[index]?.referencePeriod || 'THIRTY_DAYS',
                },
                promotions: pkg.promotions.map(promotion => ({
                    id: promotion.id,
                    status: promotionStatus(promotion, now),
                    isEnabled: promotion.is_enabled,
                    discountType: promotion.discount_type,
                    discountValue: promotion.discount_value,
                    regularPrice: promotion.regular_price_snapshot,
                    price: promotion.promotional_price,
                    lowestPrice30d: promotion.lowest_price_30d,
                    referenceSource: promotion.lowest_price_source,
                    referencePeriod: promotion.lowest_price_period,
                    label: promotion.label,
                    startsAt: promotion.starts_at.toISOString(),
                    endsAt: promotion.ends_at?.toISOString() || null,
                    allowPromoCode: promotion.allow_promo_code,
                    showOnHome: promotion.show_on_home,
                    displayDiscountPercent: calculateReferenceDiscountPercent(
                        promotion.lowest_price_30d,
                        promotion.promotional_price,
                    ),
                    legalText: legalReferenceText(
                        promotion.lowest_price_30d,
                        promotion.lowest_price_period === 'SINCE_OFFERING' ? 'SINCE_OFFERING' : 'THIRTY_DAYS',
                    ),
                })),
                priceHistory: pkg.price_history.map(entry => ({
                    id: entry.id,
                    price: entry.price,
                    validFrom: entry.valid_from.toISOString(),
                    validTo: entry.valid_to?.toISOString() || null,
                    source: entry.source,
                    verified: entry.verified,
                })),
            })),
        });
    } catch (error: any) {
        console.error('[package-promotions] GET failed:', error);
        const migrationRequired = error?.code === 'P2021' || error?.code === 'P2022';
        return NextResponse.json({
            success: false,
            code: migrationRequired ? 'PACKAGE_PROMOTIONS_MIGRATION_REQUIRED' : 'PACKAGE_PROMOTIONS_LOAD_FAILED',
            error: migrationRequired
                ? 'Moduł promocji czeka na migrację bazy danych.'
                : 'Nie udało się pobrać promocji pakietów.',
        }, { status: migrationRequired ? 503 : 500 });
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const packageId = asPositiveInteger(body.packageId);
        const promotionIdProvided = body.promotionId !== undefined && body.promotionId !== null;
        const promotionId = promotionIdProvided ? asPositiveInteger(body.promotionId) : null;
        const discountType: PromotionDiscountType | null = body.discountType === 'percentage'
            ? 'percentage'
            : body.discountType === 'fixed'
                ? 'fixed'
                : null;
        const discountValue = asPositiveInteger(body.discountValue);
        const startsAt = parseDate(body.startsAt);
        const endsAt = body.endsAt ? parseDate(body.endsAt) : null;
        const manualLowestPrice = body.manualLowestPrice === undefined || body.manualLowestPrice === null
            ? null
            : asPositiveInteger(body.manualLowestPrice);
        const confirmManualReference = body.confirmManualReference === true;
        const isEnabled = body.isEnabled !== false;
        const allowPromoCode = body.allowPromoCode === true;
        const showOnHome = body.showOnHome !== false;
        const label = typeof body.label === 'string' && body.label.trim()
            ? body.label.trim().slice(0, 48)
            : 'Promocja';

        if (!packageId || (promotionIdProvided && !promotionId) || !discountType || !discountValue || !startsAt) {
            return NextResponse.json({
                success: false,
                error: 'Wybierz pakiet, rodzaj i wartość obniżki oraz datę rozpoczęcia.',
            }, { status: 400 });
        }
        if (endsAt && endsAt <= startsAt) {
            return NextResponse.json({
                success: false,
                error: 'Data zakończenia musi być późniejsza od daty rozpoczęcia.',
            }, { status: 400 });
        }

        const result = await prisma.$transaction(async tx => {
            await acquireAdvisoryTransactionLock(tx, `package-promotion:${packageId}`);

            const pkg = await tx.package.findFirst({
                where: { id: packageId, is_active: true, service: { is_active: true } },
                include: { service: true },
            });
            if (!pkg) throw new Error('PACKAGE_NOT_FOUND');

            const existing = promotionId
                ? await tx.packagePromotion.findFirst({ where: { id: promotionId, package_id: packageId } })
                : null;
            if (promotionId && !existing) throw new Error('PROMOTION_NOT_FOUND');

            const now = new Date();
            if (existing?.is_enabled && existing.starts_at <= now) {
                throw new Error('STARTED_PROMOTION_IMMUTABLE');
            }

            const promotionalPrice = calculatePromotionalPrice(pkg.price, discountType, discountValue);
            const reference = await resolveLowestPriceBeforePromotion(
                packageId,
                startsAt,
                tx,
                promotionId || undefined,
                pkg.created_at,
            );

            let lowestPrice30d: number;
            let lowestPriceSource: 'AUTO_HISTORY' | 'ADMIN_CONFIRMED';
            if (reference.completeHistory && reference.lowestPrice) {
                lowestPrice30d = reference.lowestPrice;
                lowestPriceSource = 'AUTO_HISTORY';
            } else {
                if (!manualLowestPrice || !confirmManualReference) {
                    throw new Error('MANUAL_REFERENCE_REQUIRED');
                }
                lowestPrice30d = manualLowestPrice;
                lowestPriceSource = 'ADMIN_CONFIRMED';
            }

            if (lowestPrice30d > pkg.price) {
                throw new Error('REFERENCE_ABOVE_REGULAR');
            }
            if (promotionalPrice >= lowestPrice30d) {
                throw new Error('NOT_LOWER_THAN_REFERENCE');
            }

            if (isEnabled) {
                const overlap = await tx.packagePromotion.findFirst({
                    where: {
                        package_id: packageId,
                        is_enabled: true,
                        ...(promotionId ? { id: { not: promotionId } } : {}),
                        ...(endsAt ? { starts_at: { lt: endsAt } } : {}),
                        OR: [{ ends_at: null }, { ends_at: { gt: startsAt } }],
                    },
                    select: { id: true },
                });
                if (overlap) throw new Error('OVERLAPPING_PROMOTION');
            }

            const data = {
                package_id: packageId,
                is_enabled: isEnabled,
                discount_type: discountType,
                discount_value: discountValue,
                regular_price_snapshot: pkg.price,
                promotional_price: promotionalPrice,
                lowest_price_30d: lowestPrice30d,
                lowest_price_source: lowestPriceSource,
                lowest_price_period: reference.referencePeriod,
                lowest_price_confirmed_at: now,
                label,
                starts_at: startsAt,
                ends_at: endsAt,
                allow_promo_code: allowPromoCode,
                show_on_home: showOnHome,
            };

            const promotion = existing
                ? await tx.packagePromotion.update({
                    where: { id: existing.id },
                    data: { ...data, updated_at: now },
                    include: { package: { include: { service: true } } },
                })
                : await tx.packagePromotion.create({
                    data,
                    include: { package: { include: { service: true } } },
                });

            if (showOnHome && isEnabled) {
                const homeServiceNames = homepagePromotionServiceNames(pkg.service.name);
                const servicePackageIds = await tx.package.findMany({
                    where: { service: { name: { in: homeServiceNames } } },
                    select: { id: true },
                });
                // Keep non-overlapping scheduled promotions eligible for the same
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
            }

            return {
                promotion: toPublicPackagePromotion({
                    ...promotion,
                    package_name: promotion.package.name,
                    package_order: promotion.package.order,
                    service_name: promotion.package.service.name,
                    service_order: promotion.package.service.order,
                }),
                autoReferenceAvailable: reference.completeHistory,
            };
        });

        refreshPromotionSurfaces();
        await logSystem('INFO', 'SYSTEM', 'Package promotion saved', {
            packageId,
            promotionId: result.promotion.id,
            promotionalPrice: result.promotion.price,
            lowestPrice30d: result.promotion.lowestPrice30d,
            referenceSource: result.promotion.referenceSource,
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        const code = error instanceof Error ? error.message : String(error);
        const known: Record<string, { status: number; message: string }> = {
            PACKAGE_NOT_FOUND: { status: 404, message: 'Pakiet nie istnieje albo jest nieaktywny.' },
            PROMOTION_NOT_FOUND: { status: 404, message: 'Promocja nie istnieje.' },
            STARTED_PROMOTION_IMMUTABLE: {
                status: 409,
                message: 'Rozpoczętej promocji nie można przepisywać. Zakończ ją i utwórz nową promocję.',
            },
            MANUAL_REFERENCE_REQUIRED: {
                status: 409,
                message: 'Brakuje pełnej historii wymaganego okresu przed obniżką. Wpisz rzeczywistą najniższą cenę i potwierdź ją świadomie.',
            },
            REFERENCE_ABOVE_REGULAR: {
                status: 409,
                message: 'Najniższa wcześniejsza cena nie może być wyższa od ceny regularnej obowiązującej bezpośrednio przed promocją.',
            },
            NOT_LOWER_THAN_REFERENCE: {
                status: 409,
                message: 'Cena promocyjna musi być niższa od właściwej ceny referencyjnej przed obniżką.',
            },
            OVERLAPPING_PROMOTION: {
                status: 409,
                message: 'Ten pakiet ma już promocję obejmującą wybrany okres.',
            },
        };
        const response = known[code];
        if (response) {
            return NextResponse.json({ success: false, error: response.message, code }, { status: response.status });
        }
        console.error('[package-promotions] POST failed:', error);
        const migrationRequired = error?.code === 'P2021' || error?.code === 'P2022';
        return NextResponse.json({
            success: false,
            code: migrationRequired ? 'PACKAGE_PROMOTIONS_MIGRATION_REQUIRED' : 'PACKAGE_PROMOTION_SAVE_FAILED',
            error: migrationRequired
                ? 'Moduł promocji czeka na migrację bazy danych.'
                : 'Nie udało się zapisać promocji.',
        }, { status: migrationRequired ? 503 : 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    const promotionId = asPositiveInteger(new URL(request.url).searchParams.get('id'));
    if (!promotionId) {
        return NextResponse.json({ success: false, error: 'Brak identyfikatora promocji.' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async tx => {
            const current = await tx.packagePromotion.findUnique({ where: { id: promotionId } });
            if (!current) throw new Error('PROMOTION_NOT_FOUND');
            await acquireAdvisoryTransactionLock(tx, `package-promotion:${current.package_id}`);

            const now = new Date();
            if (current.is_enabled && current.starts_at <= now) {
                const promotion = await tx.packagePromotion.update({
                    where: { id: promotionId },
                    data: { ends_at: now, show_on_home: false, updated_at: now },
                });
                return { promotion, ended: true };
            }
            const promotion = await tx.packagePromotion.update({
                where: { id: promotionId },
                data: { is_enabled: false, show_on_home: false, updated_at: now },
            });
            return { promotion, ended: false };
        });

        refreshPromotionSurfaces();
        await logSystem('INFO', 'SYSTEM', result.ended ? 'Package promotion ended' : 'Package promotion cancelled', {
            promotionId,
            packageId: result.promotion.package_id,
        });

        return NextResponse.json({
            success: true,
            message: result.ended
                ? 'Promocja została zakończona i pozostaje w historii cen.'
                : 'Przyszła promocja została anulowana.',
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'PROMOTION_NOT_FOUND') {
            return NextResponse.json({ success: false, error: 'Promocja nie istnieje.' }, { status: 404 });
        }
        console.error('[package-promotions] DELETE failed:', error);
        return NextResponse.json({ success: false, error: 'Nie udało się zakończyć promocji.' }, { status: 500 });
    }
}
