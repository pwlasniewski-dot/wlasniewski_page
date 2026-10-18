import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { finalTestQuestions, physicsExperimentMap } from '@/lib/physics-lab/catalog';
import {
    isValidPhysicsToken,
    parsePhysicsProfile,
    settingKeyForPhysicsToken,
    toPublicPhysicsProfile,
} from '@/lib/physics-lab/profile';

export const dynamic = 'force-dynamic';

function responseHeaders() {
    return {
        'Cache-Control': 'no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow',
    };
}

async function resolveToken(params: Promise<{ token: string }>) {
    const { token } = await params;
    return token.trim();
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ token: string }> },
) {
    const token = await resolveToken(params);
    if (!isValidPhysicsToken(token)) {
        return NextResponse.json({ success: false, error: 'Nieprawidłowy link.' }, { status: 400, headers: responseHeaders() });
    }

    try {
        const record = await prisma.setting.findUnique({
            where: { setting_key: settingKeyForPhysicsToken(token) },
            select: { setting_value: true },
        });
        const profile = parsePhysicsProfile(record?.setting_value);
        if (!profile) {
            return NextResponse.json({ success: false, error: 'Ten profil laboratorium nie istnieje.' }, { status: 404, headers: responseHeaders() });
        }
        return NextResponse.json({ success: true, profile: toPublicPhysicsProfile(profile) }, { headers: responseHeaders() });
    } catch (error) {
        console.error('[physics-lab/public] GET failed:', error);
        return NextResponse.json(
            { success: false, error: 'Laboratorium jest chwilowo niedostępne.' },
            { status: 500, headers: responseHeaders() },
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> },
) {
    const token = await resolveToken(params);
    if (!isValidPhysicsToken(token)) {
        return NextResponse.json({ success: false, error: 'Nieprawidłowy link.' }, { status: 400, headers: responseHeaders() });
    }

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: 'Nieprawidłowe dane.' }, { status: 400, headers: responseHeaders() });
    }

    const action = typeof body.action === 'string' ? body.action : '';
    try {
        const profile = await prisma.$transaction(async tx => {
            const settingKey = settingKeyForPhysicsToken(token);
            const record = await tx.setting.findUnique({
                where: { setting_key: settingKey },
                select: { setting_value: true },
            });
            const current = parsePhysicsProfile(record?.setting_value);
            if (!current) throw new Error('PROFILE_NOT_FOUND');

            const now = new Date().toISOString();
            const next = {
                ...current,
                progress: {
                    ...current.progress,
                    completedExperimentIds: [...current.progress.completedExperimentIds],
                    quizResults: { ...current.progress.quizResults },
                    finalTestAttempts: [...current.progress.finalTestAttempts],
                    updatedAt: now,
                },
            };

            if (action === 'completeExperiment') {
                const experimentId = typeof body.experimentId === 'string' ? body.experimentId : '';
                const experiment = physicsExperimentMap.get(experimentId);
                if (!experiment || !current.enabledExperimentIds.includes(experimentId)) {
                    throw new Error('EXPERIMENT_NOT_AVAILABLE');
                }
                const score = Number(body.score);
                const total = Number(body.total);
                if (!Number.isInteger(score) || !Number.isInteger(total) || total !== experiment.quiz.length || score < 0 || score > total) {
                    throw new Error('INVALID_QUIZ_RESULT');
                }
                if (!next.progress.completedExperimentIds.includes(experimentId)) {
                    next.progress.completedExperimentIds.push(experimentId);
                }
                next.progress.quizResults[experimentId] = { score, total, completedAt: now };
            } else if (action === 'saveFinalTest') {
                if (!current.finalTestEnabled) throw new Error('FINAL_TEST_DISABLED');
                const score = Number(body.score);
                const total = Number(body.total);
                if (!Number.isInteger(score) || total !== finalTestQuestions.length || score < 0 || score > total) {
                    throw new Error('INVALID_FINAL_TEST_RESULT');
                }
                next.progress.finalTestAttempts = [
                    ...next.progress.finalTestAttempts,
                    { score, total, completedAt: now },
                ].slice(-10);
            } else {
                throw new Error('UNKNOWN_ACTION');
            }

            await tx.setting.update({
                where: { setting_key: settingKey },
                data: { setting_value: JSON.stringify(next) },
            });
            return next;
        });

        return NextResponse.json({ success: true, profile: toPublicPhysicsProfile(profile) }, { headers: responseHeaders() });
    } catch (error) {
        const code = error instanceof Error ? error.message : String(error);
        const known: Record<string, { status: number; error: string }> = {
            PROFILE_NOT_FOUND: { status: 404, error: 'Ten profil laboratorium nie istnieje.' },
            EXPERIMENT_NOT_AVAILABLE: { status: 403, error: 'To doświadczenie nie jest teraz włączone.' },
            INVALID_QUIZ_RESULT: { status: 400, error: 'Nieprawidłowy wynik minitestu.' },
            FINAL_TEST_DISABLED: { status: 403, error: 'Test końcowy nie jest jeszcze włączony.' },
            INVALID_FINAL_TEST_RESULT: { status: 400, error: 'Nieprawidłowy wynik testu końcowego.' },
            UNKNOWN_ACTION: { status: 400, error: 'Nieznana operacja.' },
        };
        const response = known[code];
        if (response) {
            return NextResponse.json({ success: false, error: response.error }, { status: response.status, headers: responseHeaders() });
        }
        console.error('[physics-lab/public] PATCH failed:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się zapisać postępu. Spróbuj ponownie.' },
            { status: 500, headers: responseHeaders() },
        );
    }
}
