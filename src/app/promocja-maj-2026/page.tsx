import { permanentRedirect } from 'next/navigation';

export default function PromoMajPage() {
    // Kampania zakończyła się 31 maja 2026. Stary adres może nadal istnieć
    // w wynikach wyszukiwania lub reklamach, ale nie może prezentować
    // nieaktualnej ceny, niedostępnego kodu ani sztucznej dostępności.
    permanentRedirect('/rezerwacja');
}
