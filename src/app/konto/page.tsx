'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    Calendar,
    Gift,
    LogOut,
    User as UserIcon,
    ChevronRight,
    ExternalLink,
    Clock,
    MapPin,
    AlertCircle,
    Star,
    Image as ImageIcon,
    CheckCircle2,
    ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'overview' | 'sessions' | 'bookings' | 'settings' | 'partner';

export default function AccountPage() {
    const router = useRouter();
    const { user, token, logout, isLoading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [giftCards, setGiftCards] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [galleries, setGalleries] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/logowanie');
            return;
        }

        if (token) {
            async function fetchData() {
                try {
                    const [userRes, challengeRes, galleriesRes] = await Promise.all([
                        fetch('/api/user/me', { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch('/api/photo-challenge/client/challenges', { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch('/api/galleries/client', { headers: { 'Authorization': `Bearer ${token}` } })
                    ]);

                    if (userRes.ok) {
                        const data = await userRes.json();
                        setGiftCards(data.user.gift_cards || []);
                        setBookings(data.user.bookings || []); // Corrected to use real bookings
                    }

                    if (challengeRes.ok) {
                        const data = await challengeRes.json();
                        setChallenges(data.challenges || []);
                    }

                    if (galleriesRes.ok) {
                        const data = await galleriesRes.json();
                        setGalleries(data.galleries || []);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            }
            fetchData();
        }
    }, [token, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-zinc-100 pb-20">
            {/* Header / Hero */}
            <div className="relative pt-32 pb-16 px-4 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-gold-900/10 to-transparent opacity-30 pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-gold-500 font-bold uppercase tracking-[0.2em] text-xs"
                            >
                                Twoja Strefa Klienta
                            </motion.p>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight"
                            >
                                Witaj, {user?.name?.split(' ')[0]}!
                            </motion.h1>
                        </div>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={logout}
                            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors py-2 group bg-zinc-900/50 px-4 rounded-xl"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Wyloguj się</span>
                        </motion.button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-4 mt-12 overflow-x-auto pb-4 no-scrollbar">
                        <TabButton id="overview" label="Przegląd" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Star className="w-4 h-4" />} />
                        <TabButton id="sessions" label="Zdjęcia z sesji" active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')} icon={<ImageIcon className="w-4 h-4" />} count={challenges.length + galleries.length} />
                        <TabButton id="bookings" label="Rezerwacje" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} icon={<Calendar className="w-4 h-4" />} count={bookings.length} />
                        <TabButton id="settings" label="Ustawienia" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<UserIcon className="w-4 h-4" />} />
                        {user?.role === 'PHOTOGRAPHER' && (
                            <TabButton id="partner" label="Strefa Partnera" active={activeTab === 'partner'} onClick={() => setActiveTab('partner')} icon={<Star className="w-4 h-4 text-gold-500" />} />
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'sessions' && renderSessions()}
                        {activeTab === 'bookings' && renderBookingsTab()}
                        {activeTab === 'settings' && renderSettingsTab()}
                        {activeTab === 'partner' && renderPartnerTab()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );

    // --- Sub-renderers ---

    function TabButton({ id, label, active, onClick, icon, count }: { id: Tab, label: string, active: boolean, onClick: () => void, icon: React.ReactNode, count?: number }) {
        return (
            <button
                onClick={onClick}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all ${active ? 'bg-gold-600 text-black font-bold' : 'bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
                {icon}
                <span>{label}</span>
                {count !== undefined && count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                        {count}
                    </span>
                )}
            </button>
        );
    }

    function renderOverview() {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-gold-600 to-gold-400 rounded-2xl flex items-center justify-center text-black font-bold text-2xl">
                                {user?.name?.[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">{user?.name}</h3>
                                <p className="text-zinc-500 text-sm">{user?.email}</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-800 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Rola</span>
                                <span className="px-2 py-0.5 bg-gold-500/10 text-gold-500 rounded-md text-[10px] uppercase font-bold tracking-widest">{user?.role || 'CLIENT'}</span>
                            </div>
                        </div>

                        <button onClick={() => setActiveTab('settings')} className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold transition-all">
                            Zarządzaj Profilem
                        </button>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6">
                        <h4 className="font-bold mb-3 flex items-center gap-2 text-gold-500">
                            <Gift className="w-4 h-4 text-gold-500" />
                            Prezent dla Ciebie
                        </h4>
                        <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                            Pamiętaj o swoich kartach podarunkowych. Możesz je wykorzystać przy następnej rezerwacji.
                        </p>
                        <button onClick={() => setActiveTab('settings')} className="text-xs font-bold text-gold-500 hover:underline">
                            Zobacz portfel kart
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-12">
                    <div className="grid md:grid-cols-2 gap-6">
                        <QuickCard
                            title="Ostatnia sesja"
                            value={challenges[0]?.invitee_name ? `Wyzwanie dla ${challenges[0].invitee_name}` : (galleries[0]?.client_name || 'Brak sesji')}
                            icon={<ImageIcon className="w-5 h-5" />}
                            actionLabel="Zobacz zdjęcia"
                            onAction={() => setActiveTab('sessions')}
                        />
                        <QuickCard
                            title="Twoje rezerwacje"
                            value={bookings.length > 0 ? `${bookings.length} aktywnych` : 'Zaplanuj sesję'}
                            icon={<Calendar className="w-5 h-5" />}
                            actionLabel="Zarządzaj"
                            onAction={() => setActiveTab('bookings')}
                        />
                    </div>
                    {renderGiftCards()}
                </div>
            </div>
        );
    }

    function QuickCard({ title, value, icon, actionLabel, onAction }: any) {
        return (
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl hover:border-gold-500/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-zinc-800 rounded-2xl text-gold-500 group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                    <button onClick={onAction} className="text-xs text-gold-500 hover:underline">{actionLabel} →</button>
                </div>
                <h4 className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{title}</h4>
                <p className="font-bold text-lg text-white">{value}</p>
            </div>
        );
    }

    function renderSessions() {
        return (
            <div className="space-y-8">
                <div className="max-w-3xl">
                    <h2 className="text-3xl font-bold mb-2">Zdjęcia z sesji</h2>
                    <p className="text-zinc-500">Tutaj znajdziesz wszystkie swoje galerie. Możesz pobierać zdjęcia oraz zamawiać dodatkowe ujęcia.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Standard Galleries */}
                    {galleries.map((gallery) => (
                        <div key={`gallery-${gallery.id}`} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] hover:border-gold-500/30 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gold-500 text-black rounded-2xl flex items-center justify-center font-bold">
                                            {gallery.photo_count}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-2xl group-hover:text-gold-400 transition-colors">
                                                {gallery.client_name}
                                            </h4>
                                            <div className="flex items-center gap-2 text-sm text-zinc-500 mt-0.5">
                                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[9px] uppercase font-black">Sesja Standard</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Do: {gallery.expires_at ? new Date(gallery.expires_at).toLocaleDateString() : 'Bez limitu'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <Badge icon={<CheckCircle2 className="w-3.5 h-3.5" />} text={`${gallery.standard_count} w pakiecie`} color="green" />
                                        <Badge icon={<ShoppingCart className="w-3.5 h-3.5" />} text={`Zdjęcia PREMIUM możliwe`} color="gold" />
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center gap-3">
                                    <Link
                                        href={`/galeria/${gallery.access_code}`}
                                        className="px-10 py-4 bg-gold-600 text-black font-black rounded-2xl hover:bg-gold-500 transition-all text-center flex items-center justify-center gap-3 shadow-xl shadow-gold-600/10"
                                    >
                                        Wybierz i zapłać za zdjęcia
                                        <ChevronRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Challenges */}
                    {challenges.map((challenge) => (
                        <div key={`challenge-${challenge.id}`} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] hover:border-gold-500/30 transition-all group overflow-hidden relative">
                            <div className="flex flex-col md:flex-row justify-between gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-zinc-800 text-gold-500 rounded-2xl flex items-center justify-center">
                                            <Star className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-2xl group-hover:text-gold-400 transition-colors capitalize">
                                                {challenge.inviter_name} → {challenge.invitee_name}
                                            </h4>
                                            <div className="flex items-center gap-2 text-sm text-zinc-500 mt-0.5">
                                                <span className="px-2 py-0.5 bg-gold-500/10 text-gold-500 rounded text-[9px] uppercase font-black">Foto Wyzwanie</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {challenge.location?.name || 'Toruń'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-zinc-400 text-sm">Pakiet: <span className="text-white font-bold">{challenge.package?.name}</span></p>
                                </div>

                                <div className="flex flex-col justify-center gap-3">
                                    <Link
                                        href={challenge.gallery?.is_published ? `/foto-wyzwanie/gallery/${challenge.id}` : `/foto-wyzwanie?link=${challenge.unique_link}`}
                                        className={`px-10 py-4 font-black rounded-2xl transition-all text-center text-md ${challenge.gallery?.is_published ? 'bg-gold-600 text-black hover:bg-gold-500 shadow-xl shadow-gold-600/10' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                                    >
                                        {challenge.gallery?.is_published ? 'Przejdź do galerii' : 'Szczegóły wyzwania'}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {challenges.length === 0 && galleries.length === 0 && (
                        <div className="bg-zinc-900/20 border-2 border-dashed border-zinc-800 p-20 rounded-[3rem] text-center">
                            <ImageIcon className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold mb-2">Brak sesji do wyświetlenia</h3>
                            <p className="text-zinc-500 max-w-sm mx-auto">Jak tylko fotograf udostępni Twoje zdjęcia, pojawią się one w tym miejscu.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function Badge({ icon, text, color }: { icon: any, text: string, color: 'gold' | 'green' | 'blue' | 'zinc' }) {
        const colors = {
            gold: 'bg-gold-500/10 text-gold-500',
            green: 'bg-green-500/10 text-green-500',
            blue: 'bg-blue-500/10 text-blue-500',
            zinc: 'bg-zinc-800 text-zinc-400'
        };
        return (
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${colors[color]}`}>
                {icon}
                {text}
            </span>
        );
    }

    function renderBookingsTab() {
        return (
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Twoje Rezerwacje</h2>
                        <p className="text-zinc-500">Zarządzaj terminami swoich sesji zdjęciowych.</p>
                    </div>
                    <Link href="/rezerwacja" className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-gold-500 transition-all text-center">
                        Zarezerwuj nowy termin
                    </Link>
                </div>

                {bookings.length === 0 ? (
                    <div className="bg-zinc-900/20 border border-zinc-800 p-20 rounded-[3rem] text-center">
                        <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold mb-2">Nie masz jeszcze rezerwacji</h3>
                        <p className="text-zinc-500 max-w-sm mx-auto mb-8">Czas to zmienić! Zaplanuj swoją sesję i stwórz niezapomniane pamiątki.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] hover:border-gold-500/30 transition-all group flex flex-col md:flex-row justify-between items-center gap-8">
                                <div className="flex gap-6 w-full md:w-auto">
                                    <div className="w-16 h-16 bg-zinc-800 rounded-[1.5rem] flex items-center justify-center text-gold-500 text-2xl font-black">
                                        {new Date(booking.date).getDate()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl mb-1">{booking.service_type || 'Sesja Indywidualna'}</h4>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
                                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(booking.date).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</span>
                                            <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Toruń, Polska</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-zinc-800 pt-6 md:pt-0">
                                    <span className="px-4 py-1.5 bg-green-500/10 text-green-500 rounded-full text-[10px] uppercase font-black tracking-widest border border-green-500/20">
                                        {booking.status === 'confirmed' ? 'Potwierdzona' : 'Oczekuje'}
                                    </span>
                                    <Link href={`/rezerwacja/${booking.id}`} className="p-3 bg-zinc-800 hover:bg-gold-500 text-zinc-400 hover:text-black rounded-2xl transition-all">
                                        <ChevronRight className="w-6 h-6" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    function renderSettingsTab() {
        // Embed the existing settings functionality or link to it
        return (
            <div className="space-y-12">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-10">
                    <h2 className="text-3xl font-bold mb-8 flex items-center gap-4">
                        <UserIcon className="w-8 h-8 text-gold-500" />
                        Ustawienia Konta
                    </h2>
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="font-bold text-xl">Profil</h3>
                            <div className="space-y-4">
                                <InfoItem label="Imię i nazwisko" value={user?.name} />
                                <InfoItem label="E-mail" value={user?.email} />
                                <InfoItem label="Telefon" value={user?.phone || 'Nie podano'} />
                            </div>
                            <Link href="/konto/ustawienia" className="inline-block mt-4 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all">
                                Edytuj dane i hasło
                            </Link>
                        </div>
                        <div className="space-y-6">
                            <h3 className="font-bold text-xl">Prywatność i RODO</h3>
                            <p className="text-zinc-500 text-sm">Twoje dane są bezpieczne i przetwarzane zgodnie z polityką prywatności. Masz prawo do ich wglądu, zmiany oraz usunięcia.</p>
                            <button className="text-red-500 text-sm font-bold hover:underline">Usuń konto (nieodwracalne)</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function InfoItem({ label, value }: { label: string, value: any }) {
        return (
            <div className="p-4 bg-black/40 rounded-2xl border border-zinc-800/50">
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-1">{label}</p>
                <p className="text-white font-medium">{value}</p>
            </div>
        );
    }

    function renderPartnerTab() {
        return (
            <div className="space-y-8">
                <div className="bg-gradient-to-br from-gold-900/20 to-zinc-900 border border-gold-500/20 rounded-[3rem] p-12 text-center">
                    <div className="w-20 h-20 bg-gold-500/10 rounded-3xl flex items-center justify-center text-gold-500 mx-auto mb-6">
                        <Star className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-display font-bold mb-4">Strefa Partnera</h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto mb-8 text-lg">
                        Witaj we wspólnym zespole! Jako fotograf partnerski masz dostęp do zaawansowanych narzędzi zarządzania swoimi galeriami i klientami.
                    </p>
                    <div className="grid md:grid-cols-3 gap-6 text-left">
                        <PartnerMetric label="Aktywnych sesji" value="12" />
                        <PartnerMetric label="Zarobek (30 dni)" value="2,450 PLN" />
                        <PartnerMetric label="Średnia ocena" value="4.9 / 5.0" />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem]">
                        <h3 className="font-bold text-xl mb-6">Szybkie akcje</h3>
                        <div className="space-y-4">
                            <PartnerAction label="Utwórz nową galerię" icon={<ImageIcon />} />
                            <PartnerAction label="Wyślij link do klienta" icon={<ExternalLink />} />
                            <PartnerAction label="Pobierz fakturę prowizyjną" icon={<ShoppingCart />} />
                        </div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem]">
                        <h3 className="font-bold text-xl mb-6">Twoi Ostatni Klienci</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-zinc-800/50">
                                <div>
                                    <p className="font-bold">Marek Nowak</p>
                                    <p className="text-xs text-zinc-500">Sesja Standard • test-galeria-123</p>
                                </div>
                                <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[9px] font-black uppercase tracking-widest">GOTOWE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function PartnerMetric({ label, value }: { label: string, value: string }) {
        return (
            <div className="bg-black/50 p-6 rounded-[2rem] border border-white/5">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-black text-white">{value}</p>
            </div>
        );
    }

    function PartnerAction({ label, icon }: { label: string, icon: any }) {
        return (
            <button className="flex items-center gap-4 w-full p-4 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-2xl transition-all text-sm font-bold group">
                <span className="text-zinc-500 group-hover:text-gold-500 transition-colors">{icon}</span>
                {label}
            </button>
        );
    }

    function renderGiftCards() {
        return (
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <Gift className="w-5 h-5 text-gold-500" />
                        Twój Portfel Kart
                    </h2>
                </div>

                {giftCards.length === 0 ? (
                    <div className="bg-zinc-900/20 border border-zinc-800 p-10 rounded-3xl text-center">
                        <p className="text-zinc-500 text-sm mb-4">Nie posiadasz jeszcze aktywnych kart podarunkowych.</p>
                        <Link href="/karta-podarunkowa" className="text-xs font-bold text-gold-500 hover:underline">
                            Kup swoją pierwszą kartę na prezent
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {giftCards.map((card) => (
                            <div key={card.id} className="relative aspect-[16/9] bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 rounded-[2rem] p-6 overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Gift className="w-20 h-20 text-gold-500" />
                                </div>
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="text-[8px] uppercase font-black tracking-[0.3em] text-gold-500 mb-1">Karta Podarunkowa</div>
                                        <div className="text-2xl font-bold text-white tracking-widest">{card.value} <span className="text-sm font-normal">PLN</span></div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-white/5">
                                        <div className="font-mono text-zinc-500 text-xs tracking-widest">{card.code}</div>
                                        <Link
                                            href={`/karta-podarunkowa/dostep/${card.access_token}`}
                                            className="px-4 py-2 bg-gold-600 text-black text-[10px] font-black rounded-xl hover:bg-gold-500 transition-colors shadow-lg shadow-gold-600/10 uppercase tracking-widest"
                                        >
                                            Aktywuj
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        );
    }
}
