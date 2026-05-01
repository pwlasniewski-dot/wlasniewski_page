/**
 * Foto-Match: onboarding wizard (4 kroki).
 * Wymaga zalogowania (ProtectedRoute via AuthContext).
 *
 * Kroki:
 *   1. Podstawy (display_name, gender, birth_year, city)
 *   2. Preferencje (radius_km, interests, comfort_level, experience, bio)
 *   3. Zdjęcia (upload 3-6, reorder, delete)
 *   4. Weryfikacja (selfie + dowód → admin akceptuje)
 *
 * Po ukończeniu kroku 4 → /foto-match/profil/oczekujace (status PENDING).
 */
import type { Metadata } from 'next';
import OnboardingWizard from './OnboardingWizard';

export const metadata: Metadata = {
    title: 'Foto-Match — onboarding',
    robots: { index: false, follow: false },
};

export default function OnboardingPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white">
            <OnboardingWizard />
        </main>
    );
}
