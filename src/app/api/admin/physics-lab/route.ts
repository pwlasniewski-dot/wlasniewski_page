import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdminAuth } from '@/lib/auth/middleware';
import {
    PHYSICS_SETTING_PREFIX,
    createPhysicsProfile,
    emptyProgress,
    isValidPhysicsToken,
    parsePhysicsProfile,
    sanitizeExperimentIds,
    sanitizeStudentName,
    settingKeyForPhysicsToken,
} from '@/lib/physics-lab/profile';
import { physicsCatalogVersion } from '@/lib/physics-lab/catalog';

export const dynamic = 'force-dynamic';

function newToken() {
    return randomBytes(18).toString('base64url');
}

async function loadProfiles() {
    const records = await prisma.setting.findMany({
        where: { setting_key: { startsWith: PHYSICS_SETTING_PREFIX } },
        select: { setting_value: true, updated_at: true },
        orderBy: { updated_at: 'desc' },
    });

    return records
        .map(record => parsePhysicsProfile(record.setting_value))
        .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));
}

export async function GET(request: NextRequest) {
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    try {
        const profiles = await loadProfiles();
        return NextResponse.json({ success: true, catalogVersion: physicsCatalogVersion, profiles });
    } catch (error) {
        console.error('[physics-lab/admin] GET failed:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się pobrać profili laboratorium.' },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const action = typeof body.action === 'string' ? body.action : 'save';
        const suppliedToken = typeof body.token === 'string' ? body.token.trim() : '';
        const token = suppliedToken || newToken();

        if (!isValidPhysicsToken(token)) {
            return NextResponse.json({ success: false, error: 'Nieprawidłowy identyfikator profilu.' }, { status: 400 });
        }

        const settingKey = settingKeyForPhysicsToken(token);
        const existingRecord = await prisma.setting.findUnique({
            where: { setting_key: settingKey },
            select: { setting_value: true },
        });
        const existing = parsePhysicsProfile(existingRecord?.setting_value);

        if (action === 'delete') {
            if (existingRecord) await prisma.setting.delete({ where: { setting_key: settingKey } });
            revalidatePath('/admin/fizyka');
            return NextResponse.json({ success: true, deleted: true, token });
        }

        if (action === 'resetProgress') {
            if (!existing) {
                return NextResponse.json({ success: false, error: 'Profil nie istnieje.' }, { status: 404 });
            }
            const profile = { ...existing, progress: emptyProgress(), updatedAt: new Date().toISOString() };
            await prisma.setting.update({
                where: { setting_key: settingKey },
                data: { setting_value: JSON.stringify(profile) },
            });
            revalidatePath(`/laboratorium-fizyki/${token}`);
            return NextResponse.json({ success: true, profile });
        }

        if (action !== 'save') {
            return NextResponse.json({ success: false, error: 'Nieznana operacja.' }, { status: 400 });
        }

        const studentName = sanitizeStudentName(body.studentName);
        if (!studentName) {
            return NextResponse.json({ success: false, error: 'Wpisz imię dziecka.' }, { status: 400 });
        }

        const enabledExperimentIds = sanitizeExperimentIds(body.enabledExperimentIds);
        const now = new Date().toISOString();
        const profile = existing
            ? {
                ...existing,
                version: physicsCatalogVersion,
                studentName,
                enabledExperimentIds,
                finalTestEnabled: body.finalTestEnabled === true,
                updatedAt: now,
            }
            : createPhysicsProfile({
                token,
                studentName,
                enabledExperimentIds,
                finalTestEnabled: body.finalTestEnabled === true,
            });

        await prisma.setting.upsert({
            where: { setting_key: settingKey },
            create: { setting_key: settingKey, setting_value: JSON.stringify(profile) },
            update: { setting_value: JSON.stringify(profile) },
        });

        revalidatePath('/admin/fizyka');
        revalidatePath(`/laboratorium-fizyki/${token}`);
        return NextResponse.json({ success: true, profile });
    } catch (error) {
        console.error('[physics-lab/admin] POST failed:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się zapisać ustawień laboratorium.' },
            { status: 500 },
        );
    }
}
