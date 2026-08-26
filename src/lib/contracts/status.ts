export const IMMUTABLE_CONTRACT_STATUSES = ['sending', 'sent', 'signed'] as const;
export const CLIENT_VISIBLE_CONTRACT_STATUSES = ['sent', 'signed'] as const;
export const CLIENT_ACTIONABLE_CONTRACT_STATUSES = ['sent'] as const;

export function normalizeContractStatus(status: unknown): string {
    return String(status || '').trim().toLowerCase();
}

export function isImmutableContractStatus(status: unknown): boolean {
    return (IMMUTABLE_CONTRACT_STATUSES as readonly string[]).includes(normalizeContractStatus(status));
}

export function isClientVisibleContractStatus(status: unknown): boolean {
    return (CLIENT_VISIBLE_CONTRACT_STATUSES as readonly string[]).includes(normalizeContractStatus(status));
}

export function isClientActionableContractStatus(status: unknown): boolean {
    return (CLIENT_ACTIONABLE_CONTRACT_STATUSES as readonly string[]).includes(normalizeContractStatus(status));
}

export const CLIENT_VISIBLE_CONTRACT_STATUS_VALUES = CLIENT_VISIBLE_CONTRACT_STATUSES.flatMap(status => [status, status.toUpperCase()]);
export const CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES = CLIENT_ACTIONABLE_CONTRACT_STATUSES.flatMap(status => [status, status.toUpperCase()]);
