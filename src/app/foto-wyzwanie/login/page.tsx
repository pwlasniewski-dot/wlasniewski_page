import { redirect } from 'next/navigation';

/**
 * Stara strona logowania foto-wyzwania zostala zlikwidowana.
 * Cala strefa klienta jest pod /logowanie + /konto.
 */
export default function LegacyChallengeLoginRedirect() {
    redirect('/logowanie');
}

