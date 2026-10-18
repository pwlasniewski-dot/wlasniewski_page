import {
    PHYSICS_EXPERIMENT_IDS,
    PHYSICS_STARTER_IDS,
    finalTestQuestions,
    physicsCatalogVersion,
} from './catalog';

export const PHYSICS_SETTING_PREFIX = 'physics_lab_profile_';

export interface ExperimentQuizResult {
    score: number;
    total: number;
    completedAt: string;
}

export interface FinalTestAttempt {
    score: number;
    total: number;
    completedAt: string;
}

export interface PhysicsLabProgress {
    completedExperimentIds: string[];
    quizResults: Record<string, ExperimentQuizResult>;
    finalTestAttempts: FinalTestAttempt[];
    updatedAt: string | null;
}

export interface PhysicsLabProfile {
    version: number;
    token: string;
    studentName: string;
    enabledExperimentIds: string[];
    finalTestEnabled: boolean;
    createdAt: string;
    updatedAt: string;
    progress: PhysicsLabProgress;
}

export interface PublicPhysicsLabProfile {
    version: number;
    studentName: string;
    enabledExperimentIds: string[];
    finalTestEnabled: boolean;
    updatedAt: string;
    progress: PhysicsLabProgress;
}

const experimentIdSet = new Set(PHYSICS_EXPERIMENT_IDS);

export function emptyProgress(): PhysicsLabProgress {
    return {
        completedExperimentIds: [],
        quizResults: {},
        finalTestAttempts: [],
        updatedAt: null,
    };
}

export function createPhysicsProfile(input: {
    token: string;
    studentName?: string;
    enabledExperimentIds?: string[];
    finalTestEnabled?: boolean;
}): PhysicsLabProfile {
    const now = new Date().toISOString();
    return {
        version: physicsCatalogVersion,
        token: input.token,
        studentName: sanitizeStudentName(input.studentName) || 'Kinga',
        enabledExperimentIds: sanitizeExperimentIds(input.enabledExperimentIds ?? PHYSICS_STARTER_IDS),
        finalTestEnabled: input.finalTestEnabled === true,
        createdAt: now,
        updatedAt: now,
        progress: emptyProgress(),
    };
}

export function sanitizeStudentName(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ').slice(0, 48);
}

export function sanitizeExperimentIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id): id is string => typeof id === 'string' && experimentIdSet.has(id)))];
}

export function sanitizeProgress(value: unknown): PhysicsLabProgress {
    if (!value || typeof value !== 'object') return emptyProgress();
    const source = value as Partial<PhysicsLabProgress>;
    const completedExperimentIds = sanitizeExperimentIds(source.completedExperimentIds);
    const quizResults: Record<string, ExperimentQuizResult> = {};

    if (source.quizResults && typeof source.quizResults === 'object') {
        for (const [experimentId, rawResult] of Object.entries(source.quizResults)) {
            if (!experimentIdSet.has(experimentId) || !rawResult || typeof rawResult !== 'object') continue;
            const result = rawResult as Partial<ExperimentQuizResult>;
            const score = Number(result.score);
            const total = Number(result.total);
            if (!Number.isInteger(score) || !Number.isInteger(total) || total < 1 || score < 0 || score > total) continue;
            quizResults[experimentId] = {
                score,
                total,
                completedAt: typeof result.completedAt === 'string' ? result.completedAt : new Date().toISOString(),
            };
        }
    }

    const finalTestAttempts = Array.isArray(source.finalTestAttempts)
        ? source.finalTestAttempts
            .filter((attempt): attempt is FinalTestAttempt => {
                if (!attempt || typeof attempt !== 'object') return false;
                const score = Number((attempt as FinalTestAttempt).score);
                const total = Number((attempt as FinalTestAttempt).total);
                return Number.isInteger(score)
                    && Number.isInteger(total)
                    && total === finalTestQuestions.length
                    && score >= 0
                    && score <= total;
            })
            .slice(-10)
            .map(attempt => ({
                score: Number(attempt.score),
                total: Number(attempt.total),
                completedAt: typeof attempt.completedAt === 'string' ? attempt.completedAt : new Date().toISOString(),
            }))
        : [];

    return {
        completedExperimentIds,
        quizResults,
        finalTestAttempts,
        updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : null,
    };
}

export function parsePhysicsProfile(raw: string | null | undefined): PhysicsLabProfile | null {
    if (!raw) return null;
    try {
        const value = JSON.parse(raw) as Partial<PhysicsLabProfile>;
        if (!value || typeof value !== 'object' || typeof value.token !== 'string') return null;
        const token = value.token.trim();
        if (!isValidPhysicsToken(token)) return null;
        const now = new Date().toISOString();
        return {
            version: Number.isInteger(value.version) ? Number(value.version) : physicsCatalogVersion,
            token,
            studentName: sanitizeStudentName(value.studentName) || 'Kinga',
            enabledExperimentIds: sanitizeExperimentIds(value.enabledExperimentIds),
            finalTestEnabled: value.finalTestEnabled === true,
            createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
            updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
            progress: sanitizeProgress(value.progress),
        };
    } catch {
        return null;
    }
}

export function toPublicPhysicsProfile(profile: PhysicsLabProfile): PublicPhysicsLabProfile {
    return {
        version: profile.version,
        studentName: profile.studentName,
        enabledExperimentIds: profile.enabledExperimentIds,
        finalTestEnabled: profile.finalTestEnabled,
        updatedAt: profile.updatedAt,
        progress: profile.progress,
    };
}

export function isValidPhysicsToken(value: string): boolean {
    return /^[A-Za-z0-9_-]{16,48}$/.test(value);
}

export function settingKeyForPhysicsToken(token: string): string {
    return `${PHYSICS_SETTING_PREFIX}${token}`;
}
