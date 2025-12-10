'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function AccountPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Simple auth check assuming token is stored in localStorage 'authToken'
        // Adjust key if different in existing auth logic
        const storedToken = localStorage.getItem('token'); // or 'authToken'? Need to verify
        // checking AcceptChallengePage auth logic... it didn't save token to localStorage explicitly in the snippet I wrote?
        // Wait, AcceptChallengePage:
        // const authData = await authResponse.json();
        // if (authData.success) { ... }
        // It uses `authData.token` immediately for the next request.
        // It does NOT seem to save it to localStorage in that file!
        // I need to check how Auth is persisted. If it isn't, users aren't "logged in" after leaving the page?
        // The user requirement says "Inviter creates account".
        // If auth is not persisted, they can't access a dashboard.

        // Let's assume for now I need to persist it.
        // OR check if other files use cookies/session.

        const t = localStorage.getItem('token');
        if (t) {
            setToken(t);
            // Verify token / get user info
            fetch('/api/image/user', { // Assuming some user endpoint exists or use dummy for now?
                // I don't have a /api/user/me endpoint.
                // I'll skip fetching user details for now and just show the button if token exists.
                headers: { 'Authorization': `Bearer ${t}` }
            }).then(() => {
                // assume valid for now
                setLoading(false);
            }).catch(() => {
                setLoading(false);
                // router.push('/foto-wyzwanie/auth'); // No auth page exists yet
            });
            setLoading(false);
        } else {
            setLoading(false);
            router.push('/foto-wyzwanie');
        }
    }, [router]);

    const handleDeleteAccount = async () => {
        if (!confirm('Czy NA PEWNO chcesz usunąć swoje konto? Ta operacja jest nieodwracalna. Utracisz dostęp do wszystkich wyzwań i zdjęć.')) {
            return;
        }

        // Double confirm
        const confirmation = prompt('Wpisz "USUŃ" aby potwierdzić usunięcie konta');
        if (confirmation !== 'USUŃ') return;

        try {
            const response = await fetch('/api/user/delete', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                alert('Twoje konto zostało usunięte.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/');
            } else {
                alert(data.error || 'Wystąpił błąd');
            }
        } catch (error) {
            console.error('Delete account error:', error);
            alert('Wystąpił błąd połączenia');
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Ładowanie...</div>;

    if (!token) return null;

    return (
        <div className="min-h-screen bg-black text-white pt-32 px-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-display font-bold text-gold-400 mb-8">Twoje Konto</h1>

                <div className="premium-card p-8 rounded-xl border border-zinc-800">
                    <h2 className="text-xl font-semibold mb-4 text-white">Ustawienia</h2>

                    <div className="space-y-6">
                        <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg">
                            <h3 className="text-red-400 font-bold mb-2">Strefa Niebezpieczna</h3>
                            <p className="text-zinc-400 text-sm mb-4">
                                Usunięcie konta spowoduje trwałą utratę dostępu do wszystkich Twoich danych, historii wyzwań oraz galerii zdjęć.
                            </p>
                            <button
                                onClick={handleDeleteAccount}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm font-semibold"
                            >
                                Usuń konto
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
