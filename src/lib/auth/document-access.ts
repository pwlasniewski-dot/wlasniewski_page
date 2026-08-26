export type JwtIdentity = { id: number; email: string; role?: string; type?: string };
export type ActiveClientIdentity = { id: number; email: string };
export type ClientOwnedRecord = { client_id: number | null; client_email?: string | null };
export type ContractOwnedRecord = {
    client_id: number | null;
    offer?: ClientOwnedRecord | null;
};

const normalizedEmail = (value: string | null | undefined) => value?.trim().toLowerCase() || '';

export function isVerifiedAdminIdentity(
    payload: JwtIdentity,
    admin: { id: number; email: string; role: string } | null,
): boolean {
    return payload.type === 'admin'
        && payload.role === 'ADMIN'
        && admin?.role === 'ADMIN'
        && admin.id === payload.id
        && admin.email.trim().toLowerCase() === payload.email.trim().toLowerCase();
}

/** A populated FK is authoritative. Email is a legacy fallback only when the
 * FK is absent, so inconsistent denormalized email cannot disclose a record. */
export function isClientRecordOwner(record: ClientOwnedRecord, client: ActiveClientIdentity): boolean {
    if (record.client_id !== null) return record.client_id === client.id;
    return Boolean(normalizedEmail(record.client_email))
        && normalizedEmail(record.client_email) === normalizedEmail(client.email);
}

export function isContractRecordOwner(record: ContractOwnedRecord, client: ActiveClientIdentity): boolean {
    if (record.client_id !== null) return record.client_id === client.id;
    return record.offer ? isClientRecordOwner(record.offer, client) : false;
}

export function clientOwnershipWhere(client: ActiveClientIdentity) {
    return [
        { client_id: client.id },
        { client_id: null, client_email: normalizedEmail(client.email) },
    ];
}

export function contractOwnershipWhere(client: ActiveClientIdentity) {
    return [
        { client_id: client.id },
        {
            client_id: null,
            offer: { is: { OR: clientOwnershipWhere(client) } },
        },
    ];
}
