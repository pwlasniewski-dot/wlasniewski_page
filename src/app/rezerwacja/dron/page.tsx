import { redirect } from 'next/navigation';

export default async function LegacyDroneBookingPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const current = await searchParams;
    const params = new URLSearchParams({ service: 'Dron' });
    for (const [key, value] of Object.entries(current)) {
        if (typeof value === 'string') params.set(key, value);
    }
    redirect(`/rezerwacja?${params.toString()}`);
}
