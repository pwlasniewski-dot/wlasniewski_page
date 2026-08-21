'use client';

import B2BContactForm from '@/components/B2BContactForm';

/**
 * Kompatybilna nazwa dla starej strony /dron. Formularz techniczny nie może
 * używać endpointu rezerwacji fotografii dronowej, który ma inny kontrakt.
 */
export default function DroneOrderForm() {
    return <B2BContactForm defaultService="Konsultacja / dobór usługi" />;
}
