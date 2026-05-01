import { Metadata } from 'next';
import MatchSettingsForm from './MatchSettingsForm';

export const metadata: Metadata = {
    title: 'Foto-Match · Matching i bonusy',
};

export default function MatchSettingsPage() {
    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white">Matching i bonusy</h1>
                <p className="text-zinc-400 mt-1">15 cech filtrujących + bonus referralowy. Zmiany propagują się w ≤5 sekund.</p>
            </div>
            <MatchSettingsForm />
        </div>
    );
}
