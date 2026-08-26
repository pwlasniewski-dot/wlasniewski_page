import prisma from '@/lib/db/prisma';

export interface ClientSessionIdentity {
    id: number;
    email: string;
    role?: string;
    type?: string;
}

export interface ActiveClientOptions {
    allowPasswordResetRequired?: boolean;
}

export async function revalidateActiveClient(
    identity: ClientSessionIdentity,
    options: ActiveClientOptions = {},
) {
    // Reject an explicitly non-client token. Missing claims are accepted only
    // for legacy client sessions and are still bound to the User row below.
    if (identity.type && identity.type !== 'client') return null;
    if (identity.role && identity.role !== 'CLIENT') return null;

    const user = await prisma.user.findUnique({
        where: { id: identity.id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            is_active: true,
            deleted_at: true,
            password_reset_required: true,
            permissions: true,
            workshops_enabled: true,
        },
    });
    if (!user || user.role !== 'CLIENT' || !user.is_active || user.deleted_at) return null;
    if (!options.allowPasswordResetRequired && user.password_reset_required) return null;
    if (user.email.trim().toLowerCase() !== identity.email.trim().toLowerCase()) return null;
    return user;
}
