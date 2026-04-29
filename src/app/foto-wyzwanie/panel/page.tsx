import { redirect } from 'next/navigation';

/**
 * Stary panel foto-wyzwania zostal zlikwidowany.
 * Wszystko w /konto (zakladka Galerie pokazuje wyzwania).
 */
export default function LegacyChallengePanelRedirect() {
    redirect('/konto');
}
