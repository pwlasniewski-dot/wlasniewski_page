import type { DronePhotographyPackage } from './dronePhotographyOffer';
import { packageDescriptionLines, parsePackageFeatures } from './packageScope';

/** Drone copy has complementary summary, deliverables and delivery fields. */
export function dronePackageScopeLines(pkg: Pick<DronePhotographyPackage, 'summary' | 'features' | 'delivery'>): string[] {
    return [...new Set([
        ...packageDescriptionLines(pkg.summary),
        ...parsePackageFeatures(pkg.features),
        ...packageDescriptionLines(pkg.delivery),
    ])];
}
