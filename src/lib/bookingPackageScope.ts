/** Stored copy is plain text. Never replace missing history with today's offer. */
export function storedPackageScopeLines(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((line): line is string => typeof line === 'string' && line.trim().length > 0) : [];
}

export function bookingSnapshotScopeLines(snapshot: unknown): string[] {
    if (!snapshot || typeof snapshot !== 'object' || !('package' in snapshot)) return [];
    const pkg = snapshot.package;
    return pkg && typeof pkg === 'object' && 'scopeLines' in pkg ? storedPackageScopeLines(pkg.scopeLines) : [];
}
