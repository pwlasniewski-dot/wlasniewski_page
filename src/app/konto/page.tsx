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
    ShoppingCart,
    FileText,
    Download,
    ShoppingBag,
    Send,
    MessageSquare,
    Sparkles,
    Heart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ClientOfferRecommendedAlbums from '@/components/client/ClientOfferRecommendedAlbums';

type Tab = 'overview' | 'sessions' | 'bookings' | 'documents' | 'gift_cards' | 'settings' | 'partner';

export default function AccountPage() {
    const router = useRouter();
    const { user, token, logout, isLoading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [giftCards, setGiftCards] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [galleries, setGalleries] = useState<any[]>([]);
    const [offers, setOffers] = useState<any[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    const [photoOrders, setPhotoOrders] = useState<any[]>([]);
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
    const [fotoMatchProfile, setFotoMatchProfile] = useState<{ id: number; status: string; display_name: string } | null>(null);
    const [fotoMatchEnabled, setFotoMatchEnabled] = useState<boolean>(false);
    const [savingNote, setSavingNote] = useState<{ type: string; id: number } | null>(null);
    const [noteStates, setNoteStates] = useState<Record<string, string>>({});

    // Initialize note states when data is loaded
    useEffect(() => {
        const initialNotes: Record<string, string> = {};
        offers.forEach(o => {
            initialNotes[`offer-${o.id}`] = o.client_note || '';
        });
        contracts.forEach(c => {
            initialNotes[`contract-${c.id}`] = c.client_note || '';
        });
        setNoteStates(prev => ({ ...prev, ...initialNotes }));
    }, [offers, contracts]);

    useEffect(() => {
        if (!authLoading && !token) {
            router.push('/logowanie');
            return;
        }

        if (token) {
            async function fetchData() {
                try {
                    const [userRes, challengeRes, galleriesRes, fmRes, fmSettingsRes] = await Promise.all([
                        fetch('/api/user/me', { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch('/api/photo-challenge/client/challenges', { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch('/api/galleries/client', { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch('/api/foto-match/profile/me', { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch('/api/foto-match/settings/public')
                    ]);

                    if (userRes.ok) {
                        const data = await userRes.json();
                        setGiftCards(data.user.gift_cards || []);
                        setBookings(data.user.bookings || []);
                        setOffers(data.user.offers || []);
                        setContracts(data.user.contracts || []);
                        setPhotoOrders(data.user.photo_orders || []);
                        // Load permissions from API response
                        if (data.user.permissions && typeof data.user.permissions === 'object') {
                            setUserPermissions(data.user.permissions);
                        }
                    }

                    if (challengeRes.ok) {
                        const data = await challengeRes.json();
                        setChallenges(data.challenges || []);
                    }

                    if (galleriesRes.ok) {
                        const data = await galleriesRes.json();
                        setGalleries(data.galleries || []);
                    }

                    if (fmRes.ok) {
                        const data = await fmRes.json();
                        if (data.profile) {
                            setFotoMatchProfile({
                                id: data.profile.id,
                                status: data.profile.status,
                                display_name: data.profile.display_name,
                            });
                        }
                    }

                    if (fmSettingsRes.ok) {
                        const data = await fmSettingsRes.json();
                        setFotoMatchEnabled(!!data.enabled);
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
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 pb-20 relative">
            {/* Animated gradient mesh background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-gold-500/15 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }} />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/10 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
                <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-gradient-radial from-rose-500/8 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>
            {/* Header / Hero */}
            <div className="relative pt-32 pb-16 px-4 overflow-hidden z-10">
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
                            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors py-2 group bg-zinc-900/30 backdrop-blur-xl px-4 rounded-xl"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Wyloguj się</span>
                        </motion.button>
                    </div>

                    {/* Tab Navigation — filtered by permissions */}
                    <div className="flex bg-zinc-900/50 p-2 rounded-[2.5rem] border border-zinc-800 backdrop-blur-xl overflow-x-auto no-scrollbar">
                        <TabButton id="overview" label="Przegląd" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Star className="w-4 h-4" />} />

                        {userPermissions?.galleries !== false && (
                            <TabButton id="sessions" label="Galerie" active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')} icon={<ImageIcon className="w-4 h-4" />} count={galleries.length + challenges.length} />
                        )}

                        {userPermissions?.bookings !== false && (
                            <TabButton id="bookings" label="Rezerwacje" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} icon={<Calendar className="w-4 h-4" />} count={bookings.length} />
                        )}

                        {(userPermissions?.offers !== false || userPermissions?.contracts !== false) && (
                            <TabButton id="documents" label="Oferty i Umowy" active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={<FileText className="w-4 h-4" />} count={offers.length + contracts.length} />
                        )}

                        {userPermissions?.gift_cards !== false && (
                            <TabButton id="gift_cards" label="Karty Podarunkowe" active={activeTab === 'gift_cards'} onClick={() => setActiveTab('gift_cards')} icon={<Gift className="w-4 h-4" />} count={giftCards.length} />
                        )}

                        <TabButton id="settings" label="Ustawienia" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<UserIcon className="w-4 h-4" />} />
                        {user?.role === 'PHOTOGRAPHER' && (
                            <TabButton id="partner" label="Strefa Partnera" active={activeTab === 'partner'} onClick={() => setActiveTab('partner')} icon={<Star className="w-4 h-4 text-gold-500" />} />
                        )}
                        {(user?.role === 'PHOTOGRAPHER' || user?.role === 'ADMIN') && (
                            <Link
                                href="/panel-fotografa"
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold shadow-lg hover:shadow-xl"
                            >
                                <Calendar className="w-4 h-4" /> Mój kalendarz
                            </Link>
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
                        {activeTab === 'documents' && renderDocumentsTab()}
                        {activeTab === 'gift_cards' && renderGiftCards()}
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
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all ${active ? 'bg-gold-600 text-black font-bold' : 'bg-zinc-900/30 backdrop-blur-xl text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
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
        const activeOffer = offers.find((o: any) => o.status !== 'rejected') || offers[0];
        const activeContract = contracts.find((c: any) => c.status !== 'rejected') || contracts[0];
        const activeGallery = galleries[0];

        const offerStatusLabel: Record<string, { label: string; color: string }> = {
            draft: { label: 'Szkic', color: 'text-zinc-400 bg-zinc-800 border-zinc-700' },
            sent: { label: 'Do zatwierdzenia', color: 'text-amber-400 bg-amber-900/20 border-amber-700/30' },
            negotiating: { label: 'Negocjacja', color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
            accepted: { label: '✓ Zatwierdzona', color: 'text-green-400 bg-green-900/20 border-green-700/30' },
            rejected: { label: 'Odrzucona', color: 'text-red-400 bg-red-900/20 border-red-700/30' },
        };
        const contractStatusLabel: Record<string, { label: string; color: string }> = {
            pending: { label: 'Oczekuje', color: 'text-amber-400 bg-amber-900/20 border-amber-700/30' },
            sent: { label: 'Wysłana', color: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
            signed: { label: '✓ Podpisana', color: 'text-green-400 bg-green-900/20 border-green-700/30' },
            rejected: { label: 'Odrzucona', color: 'text-red-400 bg-red-900/20 border-red-700/30' },
        };

        return (
            <div className="space-y-10">
                {/* Foto-Match block (tylko gdy enabled lub klient ma profil) */}
                {(fotoMatchEnabled || fotoMatchProfile) && (
                    <FotoMatchOverviewBlock profile={fotoMatchProfile} />
                )}

                {/* Hero Status Block */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {userPermissions?.offers !== false && (
                        activeOffer ? (
                            (() => {
                                const offerNeedsAction = activeOffer.status === 'pending' || activeOffer.status === 'sent' || activeOffer.status === 'draft' || activeOffer.status === 'unlock_requested';
                                return (
                                    <button onClick={() => setActiveTab('documents')} className={`text-left rounded-2xl p-5 transition-all group relative overflow-hidden ${offerNeedsAction
                                        ? 'bg-gradient-to-br from-gold-500/20 via-gold-500/5 to-transparent border-2 border-gold-500/70 shadow-[0_0_30px_rgba(212,175,55,0.3)] animate-pulse-soft'
                                        : 'bg-zinc-900/30 backdrop-blur-xl border border-zinc-800 hover:border-gold-500/30'}`}>
                                        {offerNeedsAction && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-gold-500 text-zinc-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                <span className="relative flex h-1.5 w-1.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-950 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-950"></span>
                                                </span>
                                                AKCJA
                                            </div>
                                        )}
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Aktualna Oferta</p>
                                        <p className="font-bold text-white text-sm mb-2 group-hover:text-gold-400 transition-colors line-clamp-1">{activeOffer?.title || 'Bez tytułu'}</p>
                                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${(offerStatusLabel[activeOffer?.status] || offerStatusLabel.draft).color}`}>
                                            {(offerStatusLabel[activeOffer?.status] || offerStatusLabel.draft).label}
                                        </span>
                                        {offerNeedsAction && (
                                            <p className="mt-3 text-xs text-gold-300 font-semibold">👉 Kliknij aby zobaczyć szczegóły</p>
                                        )}
                                    </button>
                                );
                            })()
                        ) : (
                            <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-5">
                                <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Aktualna Oferta</p>
                                <p className="text-sm text-zinc-600">Brak oferty</p>
                            </div>
                        )
                    )}

                    {userPermissions?.contracts !== false && (
                        activeContract ? (
                            <div className="bg-zinc-900/20 backdrop-blur-xl border border-zinc-800 hover:border-gold-500/30 rounded-2xl p-5 transition-all group relative">
                                <button onClick={() => setActiveTab('documents')} className="text-left w-full h-full">
                                    <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Umowa</p>
                                    <p className="font-bold text-white text-sm mb-2 line-clamp-1">{activeContract?.offer?.title || activeContract?.contract_number || `Umowa #${activeContract?.id}`}</p>
                                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${(contractStatusLabel[activeContract?.status] || contractStatusLabel.pending).color}`}>
                                        {(contractStatusLabel[activeContract?.status] || contractStatusLabel.pending).label}
                                    </span>
                                </button>
                                {activeContract.pdf_url && (
                                    <a
                                        href={`/api/contracts/${activeContract.id}/pdf?token=${token}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-gold-600 text-zinc-400 hover:text-black rounded-lg transition-all"
                                        title="Pobierz PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-5">
                                <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Umowa</p>
                                <p className="text-sm text-zinc-600">Brak umowy</p>
                            </div>
                        )
                    )}

                    {userPermissions?.galleries !== false && (
                        activeGallery ? (
                            <button onClick={() => setActiveTab('sessions')} className="text-left bg-zinc-900/20 backdrop-blur-xl border border-zinc-800 hover:border-gold-500/30 rounded-2xl p-5 transition-all group">
                                <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Galeria Zdjęć</p>
                                <p className="font-bold text-white text-sm mb-2 group-hover:text-gold-400 transition-colors line-clamp-1">{activeGallery?.client_name || 'Twoja sesja'}</p>
                                <span className="inline-block text-xs px-2 py-0.5 rounded-full border text-green-400 bg-green-900/20 border-green-700/30">
                                    ✓ Dostępna
                                </span>
                            </button>
                        ) : (
                            <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-5">
                                <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Galeria Zdjęć</p>
                                <p className="text-sm text-zinc-600">Brak galerii</p>
                            </div>
                        )
                    )}
                </div>

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

                        {userPermissions?.gift_cards !== false && (
                            <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 hover:border-gold-500/30 transition-all hover:shadow-lg hover:shadow-gold-500/10">
                                <h4 className="font-bold mb-3 flex items-center gap-2 text-gold-500">
                                    <Gift className="w-4 h-4 text-gold-500" />
                                    Prezent dla Ciebie
                                </h4>
                                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                                    Pamiętaj o swoich kartach podarunkowych. Możesz je wykorzystać przy następnej rezerwacji.
                                </p>
                                <button onClick={() => setActiveTab('gift_cards')} className="text-xs font-bold text-gold-500 hover:underline">
                                    Zobacz portfel kart
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-8 space-y-12">
                        {(() => {
                            // Wyzwania, które czekają na decyzję zaproszonego — powinny się świecić i mrugać.
                            const pending = challenges.filter((c: any) =>
                                c.role === 'invitee' && (c.status === 'sent' || c.status === 'viewed')
                            );
                            if (pending.length === 0) return null;
                            const c = pending[0];
                            return (
                                <Link
                                    href={`/foto-wyzwanie/invite/${c.unique_link}`}
                                    className="relative block overflow-hidden rounded-3xl p-6 border-2 border-gold-500/60 bg-gradient-to-br from-gold-500/10 via-pink-500/10 to-amber-500/10 shadow-[0_0_40px_rgba(212,175,55,0.25)] hover:shadow-[0_0_60px_rgba(212,175,55,0.45)] transition-all animate-pulse-slow"
                                >
                                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold-400/20 blur-3xl animate-pulse" />
                                    <div className="relative flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gold-500 text-black flex items-center justify-center text-3xl shadow-lg shadow-gold-500/40">
                                            🎁
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] uppercase tracking-widest text-gold-300 font-black">Czeka na Twoją decyzję</div>
                                            <h3 className="text-xl font-bold text-white">{c.inviter_name} zaprasza Cię na sesję</h3>
                                            <p className="text-sm text-zinc-300">{c.package?.name} • {c.location?.name || c.custom_location || 'Lokalizacja TBD'}</p>
                                        </div>
                                        <div className="hidden sm:flex items-center justify-center px-5 py-3 rounded-xl bg-gold-500 text-black font-bold text-sm whitespace-nowrap">
                                            Otwórz →
                                        </div>
                                    </div>
                                </Link>
                            );
                        })()}
                        <div className="grid md:grid-cols-2 gap-6">
                            {userPermissions?.galleries !== false && (
                                <QuickCard
                                    title="Ostatnia sesja"
                                    value={challenges[0]?.invitee_name ? `Wyzwanie dla ${challenges[0].invitee_name}` : (galleries[0]?.client_name || 'Brak sesji')}
                                    icon={<ImageIcon className="w-5 h-5" />}
                                    actionLabel="Zobacz zdjęcia"
                                    onAction={() => setActiveTab('sessions')}
                                />
                            )}
                            {(userPermissions?.offers !== false || userPermissions?.contracts !== false) && (
                                <QuickCard
                                    title="Twoje dokumenty"
                                    value={(offers.length + contracts.length) > 0 ? `${offers.length + contracts.length} dokumentów` : 'Brak dokumentów'}
                                    icon={<FileText className="w-5 h-5" />}
                                    actionLabel="Oferty i Umowy"
                                    onAction={() => setActiveTab('documents')}
                                />
                            )}
                        </div>
                        {userPermissions?.gift_cards !== false && renderGiftCards()}
                    </div>
                </div>
            </div>
        );
    }

    function QuickCard({ title, value, icon, actionLabel, onAction }: any) {
        return (
            <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800 p-6 rounded-3xl hover:border-gold-500/40 transition-all group hover:scale-[1.02] hover:shadow-2xl hover:shadow-gold-500/10">
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
                        <div key={`gallery-${gallery.id}`} className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800 p-8 rounded-[2rem] hover:border-gold-500/40 transition-all group overflow-hidden relative hover:shadow-2xl hover:shadow-gold-500/10 hover:scale-[1.01]">
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
                    {challenges.map((challenge) => {
                        const statusMap: Record<string, { label: string; color: string }> = {
                            sent: { label: 'Wysłane', color: 'bg-blue-500/15 text-blue-300' },
                            viewed: { label: 'Zobaczone', color: 'bg-cyan-500/15 text-cyan-300' },
                            accepted: { label: 'Zaakceptowane', color: 'bg-emerald-500/15 text-emerald-300' },
                            rejected: { label: 'Odrzucone', color: 'bg-red-500/15 text-red-300' },
                            declined: { label: 'Odrzucone', color: 'bg-red-500/15 text-red-300' },
                            pending_payment: { label: 'Oczekuje płatności', color: 'bg-amber-500/15 text-amber-300' },
                            completed: { label: 'Zakończone', color: 'bg-purple-500/15 text-purple-300' },
                        };
                        const st = statusMap[challenge.status] || { label: challenge.status, color: 'bg-zinc-500/15 text-zinc-300' };
                        const isInviter = challenge.role === 'inviter';
                        const needsDecision = !isInviter && (challenge.status === 'sent' || challenge.status === 'viewed');
                        const sessionDateLabel = challenge.session_date
                            ? new Date(challenge.session_date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                            : null;
                        return (
                        <div key={`challenge-${challenge.id}`} className={`bg-zinc-900/30 backdrop-blur-xl border p-8 rounded-[2rem] transition-all group overflow-hidden relative hover:shadow-2xl hover:scale-[1.01] ${needsDecision ? 'border-gold-500/70 shadow-[0_0_40px_rgba(212,175,55,0.25)] animate-pulse-slow' : 'border-zinc-800 hover:border-gold-500/40 hover:shadow-gold-500/10'}`}>
                            <div className="flex flex-col md:flex-row justify-between gap-8">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-zinc-800 text-gold-500 rounded-2xl flex items-center justify-center">
                                            <Star className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-2xl group-hover:text-gold-400 transition-colors capitalize">
                                                {challenge.inviter_name} → {challenge.invitee_name}
                                            </h4>
                                            <div className="flex items-center gap-2 text-sm text-zinc-500 mt-0.5 flex-wrap">
                                                <span className="px-2 py-0.5 bg-gold-500/10 text-gold-500 rounded text-[9px] uppercase font-black">Foto Wyzwanie</span>
                                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${isInviter ? 'bg-pink-500/15 text-pink-300' : 'bg-cyan-500/15 text-cyan-300'}`}>
                                                    {isInviter ? 'Zapraszasz' : 'Zaproszony/a'}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${st.color}`}>{st.label}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {challenge.location?.name || challenge.custom_location || 'Lokalizacja TBD'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-zinc-400 text-sm">Pakiet: <span className="text-white font-bold">{challenge.package?.name}</span></p>
                                    {sessionDateLabel && (
                                        <p className="text-zinc-400 text-sm flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gold-500" />
                                            <span>Termin: <span className="text-white font-bold capitalize">{sessionDateLabel}</span></span>
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col justify-center gap-3">
                                    <Link
                                        href={challenge.gallery?.is_published ? `/foto-wyzwanie/gallery/${challenge.id}` : `/foto-wyzwanie/invite/${challenge.unique_link}`}
                                        className={`px-10 py-4 font-black rounded-2xl transition-all text-center text-md ${needsDecision ? 'bg-gold-500 text-black hover:bg-gold-400 shadow-xl shadow-gold-500/30 animate-pulse' : challenge.gallery?.is_published ? 'bg-gold-600 text-black hover:bg-gold-500 shadow-xl shadow-gold-600/10' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                                    >
                                        {needsDecision ? '🎁 Zdecyduj' : challenge.gallery?.is_published ? 'Przejdź do galerii' : 'Szczegóły wyzwania'}
                                    </Link>
                                </div>
                            </div>
                        </div>
                        );
                    })}

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

    function renderDocumentsTab() {
        const saveNote = async (type: 'offer' | 'contract', id: number, note: string) => {
            setSavingNote({ type, id });
            try {
                const res = await fetch(`/api/user/${type === 'offer' ? 'offers' : 'contracts'}/${id}/note`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ client_note: note })
                });
                if (res.ok) {
                    alert('Notatka zosta\u0142a zapisana!');
                } else {
                    const data = await res.json().catch(() => ({}));
                    alert(data.error || 'B\u0142\u0105d zapisu notatki');
                }
            } catch {
                alert('B\u0142\u0105d po\u0142\u0105czenia');
            } finally {
                setSavingNote(null);
            }
        };

        return (
            <div className="space-y-12">
                {/* Offers Section */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Twoje Oferty</h2>
                            <p className="text-zinc-500">Przeglądaj przygotowane propozycje współpracy.</p>
                        </div>
                    </div>

                    {offers.length === 0 ? (
                        <div className="bg-zinc-900/20 backdrop-blur-xl border border-zinc-800 p-12 rounded-[2rem] text-center">
                            <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-lg font-bold mb-1">Brak aktywnych ofert</h3>
                            <p className="text-zinc-500 text-sm">Nie masz obecnie żadnych otwartych ofert.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {offers.map((offer) => {
                                const noteKey = `offer-${offer.id}`;
                                const noteText = noteStates[noteKey] || '';
                                const setNoteText = (val: string) => setNoteStates(prev => ({ ...prev, [noteKey]: val }));

                                const isSaving = savingNote?.type === 'offer' && savingNote?.id === offer.id;
                                const needsAction = offer.status === 'pending' || offer.status === 'sent' || offer.status === 'draft' || offer.status === 'unlock_requested';
                                return (
                                    <div key={offer.id} className={`rounded-[2rem] overflow-hidden transition-all hover:scale-[1.01] ${needsAction
                                        ? 'bg-gradient-to-br from-gold-500/15 via-zinc-900/80 to-zinc-900/50 backdrop-blur-xl border-2 border-gold-500/60 shadow-[0_0_40px_rgba(212,175,55,0.25)] animate-pulse-soft'
                                        : 'bg-zinc-900/30 backdrop-blur-xl border border-zinc-800 hover:border-gold-500/40 hover:shadow-2xl hover:shadow-gold-500/10'}`}>
                                        {needsAction && (
                                            <Link href={`/strefa-klienta/oferty/${offer.id}`}
                                                className="block bg-gradient-to-r from-gold-500 to-amber-500 text-zinc-950 px-6 py-3 font-bold text-sm flex items-center justify-between hover:from-gold-400 hover:to-amber-400 transition">
                                                <span className="flex items-center gap-2">
                                                    <span className="relative flex h-2.5 w-2.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-950 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zinc-950"></span>
                                                    </span>
                                                    NOWA OFERTA CZEKA NA TWOJĄ ODPOWIEDŹ - kliknij aby zobaczyć szczegóły
                                                </span>
                                                <span className="hidden sm:inline-flex items-center gap-1">
                                                    Otwórz <ChevronRight className="w-4 h-4" />
                                                </span>
                                            </Link>
                                        )}
                                        <Link
                                            href={`/strefa-klienta/oferty/${offer.id}`}
                                            className="p-6 flex flex-col md:flex-row justify-between items-center gap-6 group hover:bg-white/[0.02] transition-all block"
                                        >
                                            <div className="flex items-center gap-5 w-full md:w-auto">
                                                <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-gold-500">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-lg group-hover:text-gold-400 transition-colors">{offer.title}</h4>
                                                        <StatusBadge status={offer.status} />
                                                    </div>
                                                    <p className="text-zinc-500 text-sm flex gap-3">
                                                        <span>#{offer.offerNumber || offer.id}</span>
                                                        <span>•</span>
                                                        <span>{new Date(offer.created_at).toLocaleDateString()}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right w-full md:w-auto flex items-center justify-between md:justify-end gap-6">
                                                <div>
                                                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Wartość</p>
                                                    {offer.status === 'accepted' ? (
                                                        <p className="text-xl font-bold text-white">{offer.total_price} PLN</p>
                                                    ) : (
                                                        <p className="text-sm text-zinc-500 italic">Oczekuje na zatwierdzenie</p>
                                                    )}
                                                </div>
                                                {needsAction ? (
                                                    <span className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-zinc-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-gold-500/40 animate-pulse-soft text-sm whitespace-nowrap">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                                        </span>
                                                        OTWÓRZ OFERTĘ
                                                        <ChevronRight className="w-4 h-4" />
                                                    </span>
                                                ) : (
                                                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-gold-600 group-hover:text-black transition-all">
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                                )}
                                            </div>
                                        </Link>
                                        {/* Client Note */}
                                        <div className="px-6 pb-6 border-t border-zinc-800/50 pt-4">
                                            <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                Twoja notatka dla fotografa
                                            </label>
                                            <div className="flex gap-3">
                                                <textarea
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                    placeholder="Napisz coś do fotografa — pytania, życzenia, szczegóły..."
                                                    rows={2}
                                                    className="flex-1 bg-black/50 border border-zinc-700 focus:border-gold-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all resize-none"
                                                />
                                                <button
                                                    onClick={() => saveNote('offer', offer.id, noteText)}
                                                    disabled={isSaving}
                                                    className="px-4 py-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-black rounded-xl font-bold transition-all flex items-center gap-2 text-sm self-start mt-1"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                    {isSaving ? 'Zapis...' : 'Wyślij'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Recommended nPhoto Albums - dla każdej oferty */}
                                        <ClientOfferRecommendedAlbums offerId={offer.id} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Contracts Section */}
                {contracts.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">Umowy</h2>
                                <p className="text-zinc-500">Podpisane dokumenty i formalności.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {contracts.map((contract) => {
                                const noteKey = `contract-${contract.id}`;
                                const noteText = noteStates[noteKey] || '';
                                const setNoteText = (val: string) => setNoteStates(prev => ({ ...prev, [noteKey]: val }));

                                const isSaving = savingNote?.type === 'contract' && savingNote?.id === contract.id;
                                return (
                                    <div key={contract.id} className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800 rounded-[2rem] overflow-hidden hover:border-gold-500/40 transition-all hover:shadow-2xl hover:shadow-gold-500/10 hover:scale-[1.01]">
                                        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6 group">
                                            <Link
                                                href={`/strefa-klienta/umowy/${contract.id}`}
                                                className="flex items-center gap-5 w-full md:w-auto text-left hover:opacity-80 transition-opacity"
                                            >
                                                <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-green-500">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-lg group-hover:text-gold-400 transition-colors">{contract.offer?.title || contract.contract_number || 'Umowa Samodzielna'}</h4>
                                                        <StatusBadge status={contract.status} />
                                                    </div>
                                                    <p className="text-zinc-500 text-sm">
                                                        {contract.offer ? `Dotyczy oferty: #${contract.offer.offerNumber || contract.offer.id}` : `Numer umowy: ${contract.contract_number || contract.id}`}
                                                    </p>
                                                </div>
                                            </Link>
                                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                                {/* PDF always available for signed contracts (dynamic generation) */}
                                                <a
                                                    href={`/api/contracts/${contract.id}/pdf?token=${token}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-gold-600 text-zinc-400 hover:text-black rounded-xl transition-all text-sm font-bold"
                                                    title="Pobierz PDF"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    PDF
                                                </a>
                                                <Link
                                                    href={`/strefa-klienta/umowy/${contract.id}`}
                                                    className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:bg-gold-600 hover:text-black transition-all"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </Link>
                                            </div>
                                        </div>
                                        {/* Client Note */}
                                        <div className="px-6 pb-6 border-t border-zinc-800/50 pt-4">
                                            <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                Twoja notatka do umowy
                                            </label>
                                            <div className="flex gap-3">
                                                <textarea
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                    placeholder="Kwestie do omówienia, pytania, uwagi przed podpisaniem..."
                                                    rows={2}
                                                    className="flex-1 bg-black/50 border border-zinc-700 focus:border-gold-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all resize-none"
                                                />
                                                <button
                                                    onClick={() => saveNote('contract', contract.id, noteText)}
                                                    disabled={isSaving}
                                                    className="px-4 py-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-black rounded-xl font-bold transition-all flex items-center gap-2 text-sm self-start mt-1"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                    {isSaving ? 'Zapis...' : 'Wyślij'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Photo Order History */}
                {photoOrders.length > 0 && (
                    <section>
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold mb-2">Historia Zakupów Zdjęć</h2>
                            <p className="text-zinc-500">Zamówienia złożone w galeriach zdjęciowych.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {photoOrders.map((order: any) => (
                                <div key={order.id} className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4 hover:border-gold-500/40 transition-all hover:shadow-lg hover:shadow-gold-500/10">
                                    <div className="flex items-center gap-5 w-full md:w-auto">
                                        <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-gold-500">
                                            <ShoppingBag className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-white">Zamówienie #{order.id}</h4>
                                            <p className="text-zinc-500 text-sm">
                                                {order.gallery?.client_name} • {order.photo_count} zdjęć • {new Date(order.created_at).toLocaleDateString('pl-PL')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                        <div className="text-right">
                                            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Kwota</p>
                                            <p className="text-xl font-bold text-white">{(order.total_amount / 100).toFixed(2)} PLN</p>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.payment_status === 'paid'
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                            {order.payment_status === 'paid' ? 'Opłacono' : 'Oczekuje'}
                                        </span>
                                        {order.gallery?.access_code && (
                                            <Link
                                                href={`/galeria/${order.gallery.access_code}`}
                                                className="p-2 bg-zinc-800 hover:bg-gold-500 text-zinc-400 hover:text-black rounded-xl transition-all"
                                                title="Wróć do galerii"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        );
    }


    function StatusBadge({ status }: { status: string }) {
        const styles: Record<string, string> = {
            draft: 'bg-zinc-800 text-zinc-400',
            sent: 'bg-blue-500/20 text-blue-500',
            accepted: 'bg-green-500/20 text-green-500',
            rejected: 'bg-red-500/20 text-red-500',
            signed: 'bg-green-500/20 text-green-500',
            pending: 'bg-yellow-500/20 text-yellow-500'
        };

        const labels: Record<string, string> = {
            draft: 'Szkic',
            sent: 'Wysłana',
            accepted: 'Zaakceptowana',
            rejected: 'Odrzucona',
            signed: 'Podpisana',
            pending: 'Oczekuje'
        };

        return (
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${styles[status] || styles.draft}`}>
                {labels[status] || status}
            </span>
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
                            <div key={booking.id} className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800 p-8 rounded-[2rem] hover:border-gold-500/40 transition-all group flex flex-col md:flex-row justify-between items-center gap-8 hover:shadow-2xl hover:shadow-gold-500/10 hover:scale-[1.01]">
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

function FotoMatchOverviewBlock({ profile }: { profile: { id: number; status: string; display_name: string } | null }) {
    if (!profile) {
        return (
            <Link
                href="/foto-match/onboarding"
                className="group block relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-zinc-950 p-6 hover:border-amber-400 transition"
            >
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
                <div className="relative">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-300 mb-3">
                        <Sparkles className="w-4 h-4" /> Nowość · Foto-Match
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        Wspólna fotograficzna przygoda
                    </h3>
                    <p className="text-sm text-zinc-300 mb-4 max-w-2xl">
                        Pierwszy w Polsce projekt łączący ludzi w pary, które razem stworzą sesję fotograficzną.
                        Stwórz profil w 4 krokach i odkryj kogoś, z kim chcesz mieć wspólne zdjęcia.
                    </p>
                    <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-5 py-2.5 font-bold text-white text-sm group-hover:scale-[1.02] transition">
                        Dołącz do Foto-Match <Heart className="w-4 h-4" />
                    </span>
                </div>
            </Link>
        );
    }

    const statusBadge: Record<string, { label: string; cls: string }> = {
        PENDING: { label: 'Czeka na akceptację', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
        ACTIVE: { label: 'Aktywny', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
        SUSPENDED: { label: 'Zawieszony', cls: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
        REJECTED: { label: 'Odrzucony', cls: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
    };
    const badge = statusBadge[profile.status] || statusBadge.PENDING;

    return (
        <Link
            href="/foto-match/profil"
            className="group block rounded-3xl border border-zinc-800 hover:border-amber-400 bg-gradient-to-br from-zinc-900/60 to-zinc-950 p-6 transition"
        >
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-300 mb-2">
                        <Sparkles className="w-4 h-4" /> Foto-Match
                    </div>
                    <h3 className="text-lg font-bold text-white">Mój profil: {profile.display_name}</h3>
                    <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full border ${badge.cls}`}>
                        {badge.label}
                    </span>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-300 group-hover:text-amber-200">
                    Otwórz <ChevronRight className="w-4 h-4" />
                </span>
            </div>
        </Link>
    );
}
