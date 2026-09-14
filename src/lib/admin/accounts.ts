import type { Prisma } from '@prisma/client';
import { acquireAdvisoryTransactionLock } from '@/lib/db/advisoryLock';

export class AdminAccountError extends Error {
    constructor(message: string, public status = 400) { super(message); }
}

export function adminAccountInput(body: unknown, creating: boolean) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AdminAccountError('Nieprawidłowe dane konta.');
    const data = body as Record<string, unknown>;
    if (data.role !== undefined && data.role !== 'ADMIN' && data.role !== 'USER') throw new AdminAccountError('Nieprawidłowa rola konta.');
    if (data.name !== undefined && data.name !== null && (typeof data.name !== 'string' || data.name.length > 200)) throw new AdminAccountError('Nazwa może mieć do 200 znaków.');
    if (data.password !== undefined && typeof data.password !== 'string') throw new AdminAccountError('Nieprawidłowe hasło.');
    const password = data.password as string | undefined;
    if ((creating || password) && (!password || password.length < 8 || password.length > 128)) throw new AdminAccountError('Hasło musi mieć od 8 do 128 znaków.');
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    if (creating && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new AdminAccountError('Podaj poprawny adres e-mail.');
    return { email, password, name: data.name === undefined ? undefined : (typeof data.name === 'string' ? data.name.trim() : '') || null, role: data.role as 'ADMIN' | 'USER' | undefined };
}

export function adminAccountId(value: string | null) {
    if (!value || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) throw new AdminAccountError('Nieprawidłowy identyfikator konta.');
    return Number(value);
}

export async function lockAdminAccounts(tx: Prisma.TransactionClient, actorId: number) {
    await acquireAdvisoryTransactionLock(tx, 'admin-accounts');
    // An authorization check before waiting for the lock is not enough: another
    // administrator may have removed the actor while this request was waiting.
    const actor = await tx.adminUser.findUnique({ where: { id: actorId }, select: { role: true } });
    if (actor?.role !== 'ADMIN') throw new AdminAccountError('Sesja administratora wygasła.', 403);
}

export async function protectAdminAccount(tx: Prisma.TransactionClient, actorId: number, targetId: number, nextRole?: string) {
    const target = await tx.adminUser.findUnique({ where: { id: targetId }, select: { role: true } });
    if (!target) throw new AdminAccountError('Nie znaleziono konta.', 404);
    if (nextRole === 'ADMIN' || (nextRole === undefined && target.role !== 'ADMIN')) return;
    if (actorId === targetId) throw new AdminAccountError('Nie możesz odebrać dostępu własnemu kontu.', 409);
    if (target.role === 'ADMIN' && await tx.adminUser.count({ where: { role: 'ADMIN' } }) <= 1) throw new AdminAccountError('Musi pozostać co najmniej jeden administrator.', 409);
}
