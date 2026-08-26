import { randomBytes } from 'crypto';
import { safeReturnTo } from '../auth/return-to.ts';
export { safeReturnTo } from '../auth/return-to.ts';

export const OWNER_EMAIL = 'pwlasniewski@gmail.com';

export function normalizeEmail(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
}

export function appUrl(): string {
    return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl').replace(/\/$/, '');
}

export function buildLoginUrl(returnTo: string): string {
    return `${appUrl()}/logowanie?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}

export function buildPasswordSetupUrl(token: string, returnTo: string): string {
    return `${appUrl()}/logowanie/ustaw-haslo?token=${encodeURIComponent(token)}&returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}

export function newPasswordSetupToken(now = Date.now()): { token: string; expiresAt: Date } {
    return {
        token: randomBytes(32).toString('hex'),
        expiresAt: new Date(now + 72 * 60 * 60 * 1000),
    };
}

export type DeliveryStepResult = { ok: boolean; status?: number; error?: string };

export async function runCriticalDeliveryPipeline(steps: {
    validate: () => Promise<DeliveryStepResult>;
    storePdf: () => Promise<DeliveryStepResult>;
    sendEmail: () => Promise<DeliveryStepResult>;
}): Promise<{ success: boolean; failedStep?: 'validation' | 's3' | 'email'; results: Record<string, DeliveryStepResult> }> {
    const results: Record<string, DeliveryStepResult> = {};
    results.validation = await steps.validate();
    if (!results.validation.ok) return { success: false, failedStep: 'validation', results };

    results.s3 = await steps.storePdf();
    if (!results.s3.ok) return { success: false, failedStep: 's3', results };

    results.email = await steps.sendEmail();
    if (!results.email.ok) return { success: false, failedStep: 'email', results };

    return { success: true, results };
}
