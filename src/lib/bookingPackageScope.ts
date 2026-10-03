/** Stored copy is plain text. Never replace missing history with today's offer. */
export function storedPackageScopeLines(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((line): line is string => typeof line === 'string' && line.trim().length > 0) : [];
}

export function bookingSnapshotScopeLines(snapshot: unknown): string[] {
    if (!snapshot || typeof snapshot !== 'object' || !('package' in snapshot)) return [];
    const pkg = snapshot.package;
    const lines = pkg && typeof pkg === 'object' && 'scopeLines' in pkg ? storedPackageScopeLines(pkg.scopeLines) : [];
    // Standalone drone scope is already in package; addons are a separate copy.
    if ('service' in snapshot && snapshot.service !== 'Dron' && 'drone' in snapshot) {
        const drone = snapshot.drone;
        if (drone && typeof drone === 'object' && 'scopeLines' in drone) {
            lines.push(...storedPackageScopeLines(drone.scopeLines));
        }
    }
    return lines;
}
