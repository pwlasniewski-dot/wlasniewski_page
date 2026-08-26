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
    GraduationCap,
    BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ClientOfferRecommendedAlbums from '@/components/client/ClientOfferRecommendedAlbums';
import ClientStyleGuidePanel from '@/components/StyleGuide/ClientStyleGuidePanel';
import AccountTabButton from '@/components/client/AccountTabButton';

type Tab = 'overview' | 'sessions' | 'bookings' | 'documents' | 'gift_cards' | 'workshops' | 'preparation' | 'settings' | 'partner';

type ActionSummary = {
    nextAction: null | {
        kind: 'offer' | 'contract' | 'gallery' | 'challenge';
        label: string;
        statusLabel: string;
        ctaLabel: string;
        href: string;
    };
    counts: { offers: number; contracts: number; galleries: number; challenges: number; bookings: number; giftCards: number };
    modules: { workshops: boolean; galleries: boolean };
};

export default function AccountPage() {
    const router = useRouter();
    const { user, token, logout, isLoading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [actionSummary, setActionSummary] = useState<ActionSummary | null>(null);
    const [dashboardError, setDashboardError] = useState<{ message: string; caseCode?: string } | null>(null);
    const [moduleError, setModuleError] = useState<{ message: string; caseCode?: string } | null>(null);
    const [loadedModules, setLoadedModules] = useState<Record<string, boolean>>({});
    const [giftCards, setGiftCards] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [galleries, setGalleries] = useState<any[]>([]);
    const [offers, setOffers] = useState<any[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    const [photoOrders, setPhotoOrders] = useState<any[]>([]);
    const [workshops, setWorkshops] = useState<any[]>([]);
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
    const [fotoMatchProfile, setFotoMatchProfile] = useState<{ id: number; status: string; display_name: string } | null>(null);
    const [fotoMatchEnabled, setFotoMatchEnabled] = useState<boolean>(false);
    const [savingNote, setSavingNote] = useState<{ type: string; id: number } | null>(null);
    const [noteStates, setNoteStates] = useState<Record<string, string>>({});
    const [deletingAccount, setDeletingAccount] = useState(false);

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
            let cancelled = false;
            const fetchSummary = async (silent = false) => {
                try {
                    const response = await fetch('/api/user/action-summary', {
                        headers: { Authorization: `Bearer ${token}` },
                        cache: 'no-store',
                    });
                    const data = await response.json().catch(() => ({}));
                    if (!response.ok) throw Object.assign(new Error(data.error || 'Nie udało się załadować panelu.'), {
                        caseCode: data.caseCode,
                    });
                    if (!cancelled) {
                        setActionSummary(data);
                        setDashboardError(null);
                    }
                } catch (error) {
                    if (!cancelled) {
                        setDashboardError({
                            message: error instanceof Error ? error.message : 'Nie udało się załadować panelu.',
                            caseCode: typeof error === 'object' && error && 'caseCode' in error ? String(error.caseCode || '') : undefined,
                        });
                    }
                    if (!silent) console.error(error);
                } finally {
                    if (!silent && !cancelled) setLoading(false);
                }
            };
            fetchSummary();

            const iv = setInterval(() => {
                if (document.visibilityState === 'visible') fetchSummary(true);
            }, 120000);
            return () => {
                cancelled = true;
                clearInterval(iv);
            };
        }
    }, [token, authLoading, router]);

    useEffect(() => {
        if (!token) return;
        const moduleKey = activeTab === 'sessions'
            ? 'sessions'
            : activeTab === 'workshops'
                ? 'workshops'
                : ['documents', 'bookings', 'gift_cards', 'preparation'].includes(activeTab)
                    ? 'account'
                    : null;
        if (!moduleKey || loadedModules[moduleKey]) return;

        let cancelled = false;
        setLoadedModules(previous => ({ ...previous, [moduleKey]: true }));
        setModuleError(null);
        const requireOk = async (response: Response) => {
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw Object.assign(new Error(data.error || 'Nie udało się załadować tej sekcji.'), {
                caseCode: data.caseCode,
            });
            return data;
        };

        const loadModule = async () => {
            if (moduleKey === 'account') {
                const data = await requireOk(await fetch('/api/user/me', { headers: { Authorization: `Bearer ${token}` } }));
                if (cancelled) return;
                setGiftCards(data.user.gift_cards || []);
                setBookings(data.user.bookings || []);
                setOffers(data.user.offers || []);
                setContracts(data.user.contracts || []);
                setPhotoOrders(data.user.photo_orders || []);
                if (data.user.permissions && typeof data.user.permissions === 'object') setUserPermissions(data.user.permissions);
                return;
            }
            if (moduleKey === 'sessions') {
                const [galleryData, challengeData] = await Promise.all([
                    fetch('/api/galleries/client', { headers: { Authorization: `Bearer ${token}` } }).then(requireOk),
                    fetch('/api/photo-challenge/client/challenges', { headers: { Authorization: `Bearer ${token}` } }).then(requireOk),
                ]);
                if (!cancelled) {
                    setGalleries(galleryData.galleries || []);
                    setChallenges(challengeData.challenges || []);
                }
                return;
            }
            const data = await requireOk(await fetch('/api/user/workshops', { headers: { Authorization: `Bearer ${token}` } }));
            if (!cancelled) setWorkshops(data.workshops || []);
        };

        loadModule().catch(error => {
            if (cancelled) return;
            setModuleError({
                message: error instanceof Error ? error.message : 'Nie udało się załadować tej sekcji.',
                caseCode: typeof error === 'object' && error && 'caseCode' in error ? String(error.caseCode || '') : undefined,
            });
        });
        return () => { cancelled = true; };
    }, [activeTab, loadedModules, token]);

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
            <div className="relative pt-24 md:pt-32 pb-8 md:pb-16 px-4 overflow-hidden z-10">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-gold-900/10 to-transparent opacity-30 pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
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
                                className="text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white tracking-tight"
                            >
                                Witaj, {user?.name?.split(' ')[0]}!
                            </motion.h1>
                        </div>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={logout}
                            className="flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-colors py-2 group bg-zinc-900/30 backdrop-blur-xl px-4 rounded-xl w-full md:w-auto"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Wyloguj się</span>
                        </motion.button>
                    </div>

                    {/* Tab Navigation — filtered by permissions */}
                    <nav aria-label="Sekcje konta" className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-700 backdrop-blur-xl">
                        <AccountTabButton label="Przegląd" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Star className="h-6 w-6" />} />

                        {actionSummary && ((actionSummary.modules.galleries && actionSummary.counts.galleries > 0) || actionSummary.counts.challenges > 0) && (
                            <AccountTabButton
                                label="Galerie" 
                                active={activeTab === 'sessions'} 
                                onClick={() => setActiveTab('sessions')} 
                                icon={<ImageIcon className="h-6 w-6" />}
                                count={actionSummary.counts.galleries + actionSummary.counts.challenges}
                                hasAlert={actionSummary.nextAction?.kind === 'gallery' || actionSummary.nextAction?.kind === 'challenge'}
                            />
                        )}

                        {(actionSummary?.counts.bookings || 0) > 0 && (
                            <AccountTabButton label="Rezerwacje" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} icon={<Calendar className="h-6 w-6" />} count={actionSummary?.counts.bookings} />
                        )}

                        {((actionSummary?.counts.offers || 0) + (actionSummary?.counts.contracts || 0)) > 0 && (
                            <AccountTabButton
                                label="Oferty i Umowy" 
                                active={activeTab === 'documents'} 
                                onClick={() => setActiveTab('documents')} 
                                icon={<FileText className="h-6 w-6" />}
                                count={(actionSummary?.counts.offers || 0) + (actionSummary?.counts.contracts || 0)}
                                hasAlert={actionSummary?.nextAction?.kind === 'offer' || actionSummary?.nextAction?.kind === 'contract'}
                            />
                        )}

                        {(actionSummary?.counts.giftCards || 0) > 0 && (
                            <AccountTabButton label="Karty Podarunkowe" active={activeTab === 'gift_cards'} onClick={() => setActiveTab('gift_cards')} icon={<Gift className="h-6 w-6" />} count={actionSummary?.counts.giftCards} />
                        )}

                        {actionSummary?.modules.workshops && (
                            <AccountTabButton
                                label="Warsztaty"
                                active={activeTab === 'workshops'}
                                onClick={() => setActiveTab('workshops')}
                                icon={<GraduationCap className="h-6 w-6" />}
                                count={workshops.length || undefined}
                                hasAlert={workshops.some((w: any) => {
                                    const isDepositOverdue = w.deposit_due_at && !w.deposit_paid_at && new Date(w.deposit_due_at) < new Date();
                                    const canPayDeposit = w.deposit_amount && !w.deposit_paid_at;
                                    return isDepositOverdue || canPayDeposit;
                                })}
                            />
                        )}

                        {((actionSummary?.counts.offers || 0) + (actionSummary?.counts.contracts || 0)) > 0 && (
                            <AccountTabButton
                                label="Przygotowanie"
                                active={activeTab === 'preparation'}
                                onClick={() => setActiveTab('preparation')}
                                icon={<BookOpen className="h-6 w-6" />}
                            />
                        )}

                        <AccountTabButton label="Ustawienia" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<UserIcon className="h-6 w-6" />} />
                        {user?.role === 'PHOTOGRAPHER' && (
                            <AccountTabButton label="Strefa Partnera" active={activeTab === 'partner'} onClick={() => setActiveTab('partner')} icon={<Star className="h-6 w-6" />} />
                        )}
                        {(user?.role === 'PHOTOGRAPHER' || user?.role === 'ADMIN') && (
                            <Link
                                href="/panel-fotografa"
                                className="flex min-h-16 min-w-0 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                <Calendar className="w-4 h-4" /> <span className="hidden sm:inline">Mój kalendarz</span><span className="sm:hidden">Kalendarz</span>
                            </Link>
                        )}
                    </nav>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4">
                {moduleError && activeTab !== 'overview' && (
                    <div role="alert" className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
                        <p>{moduleError.message}</p>
                        {moduleError.caseCode && <p className="mt-2 font-mono text-xs">Kod sprawy: {moduleError.caseCode}</p>}
                    </div>
                )}
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
                        {activeTab === 'workshops' && renderWorkshopsTab()}
                        {activeTab === 'preparation' && (
                            <ClientStyleGuidePanel
                                offerId={(offers.find((offer: any) => offer.status === 'accepted' || offer.status === 'sent') || offers[0])?.id}
                            />
                        )}
                        {activeTab === 'settings' && renderSettingsTab()}
                        {activeTab === 'partner' && renderPartnerTab()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );

    // --- Sub-renderers ---

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

        // Wykryj elementy wymagające akcji
        const pendingChallenges = challenges.filter((c: any) =>
            c.role === 'invitee' && (c.status === 'sent' || c.status === 'viewed')
        );
        const pendingWorkshops = workshops.filter((w: any) => {
            const isDepositOverdue = w.deposit_due_at && !w.deposit_paid_at && new Date(w.deposit_due_at) < new Date();
            const canPayDeposit = w.deposit_amount && !w.deposit_paid_at;
            return isDepositOverdue || canPayDeposit;
        });
        const offerNeedsAction = activeOffer && (activeOffer.status === 'sent' || activeOffer.status === 'open');
        const canShowOfferTile = Boolean(loadedModules.account && actionSummary?.counts.offers && !offerNeedsAction);
        const canShowContractTile = Boolean(loadedModules.account && actionSummary?.counts.contracts);
        const canShowGalleryTile = Boolean(loadedModules.sessions && actionSummary?.counts.galleries);
        const visibleStatusTileCount = [canShowOfferTile, canShowContractTile, canShowGalleryTile].filter(Boolean).length;
        const statusGridClass = visibleStatusTileCount <= 1
            ? 'grid-cols-1'
            : visibleStatusTileCount === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';

        return (
            <div className="space-y-10">
                {dashboardError ? (
                    <div role="alert" className="rounded-3xl border border-red-500/50 bg-red-500/10 p-6">
                        <h2 className="text-lg font-bold text-red-100">Panel jest chwilowo niedostępny</h2>
                        <p className="mt-2 text-sm text-red-100/80">{dashboardError.message}</p>
                        {dashboardError.caseCode && <p className="mt-3 font-mono text-xs text-red-200">Kod sprawy: {dashboardError.caseCode}</p>}
                    </div>
                ) : actionSummary?.nextAction ? (
                    <section aria-labelledby="next-action-heading" className="rounded-3xl border-2 border-gold-500/60 bg-gradient-to-br from-gold-500/15 via-zinc-900/80 to-zinc-950 p-6 shadow-[0_0_40px_rgba(212,175,55,0.18)] sm:p-8">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-400">Następny krok</p>
                        <h2 id="next-action-heading" className="mt-2 text-2xl font-bold text-white">{actionSummary.nextAction.statusLabel}</h2>
                        <p className="mt-2 text-zinc-300">{actionSummary.nextAction.label}</p>
                        <Link href={actionSummary.nextAction.href} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 py-3 font-bold text-black transition-colors hover:bg-gold-400">
                            {actionSummary.nextAction.ctaLabel}
                            <ChevronRight className="h-5 w-5" aria-hidden />
                        </Link>
                    </section>
                ) : actionSummary ? (
                    <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" aria-hidden />
                            <h2 className="font-bold text-emerald-100">Nie masz teraz działania do wykonania</h2>
                        </div>
                    </section>
                ) : null}

                {/* SEKCJA AKCJI — Wszystko co wymaga reakcji klienta */}
                {!actionSummary?.nextAction && (pendingChallenges.length > 0 || pendingWorkshops.length > 0 || offerNeedsAction) && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
                            </div>
                            <h2 className="text-xl font-bold text-gold-400">Wymaga Twojej uwagi</h2>
                        </div>

                        {/* Wyzwania czekające na decyzję */}
                        {pendingChallenges.map((c: any) => (
                            <Link
                                key={c.id}
                                href={`/foto-wyzwanie/invite/${c.unique_link}`}
                                className="relative block overflow-hidden rounded-3xl p-4 md:p-6 border-2 border-gold-500/60 bg-gradient-to-br from-gold-500/10 via-pink-500/10 to-amber-500/10 shadow-[0_0_40px_rgba(212,175,55,0.25)] hover:shadow-[0_0_60px_rgba(212,175,55,0.45)] transition-all animate-pulse-slow"
                            >
                                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold-400/20 blur-3xl animate-pulse" />
                                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gold-500 text-black flex items-center justify-center text-2xl md:text-3xl shadow-lg shadow-gold-500/40">
                                        🎁
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] uppercase tracking-widest text-gold-300 font-black">Czeka na Twoją decyzję</div>
                                        <h3 className="text-lg md:text-xl font-bold text-white">{c.inviter_name} zaprasza Cię na sesję</h3>
                                        <p className="text-sm text-zinc-300">{c.package?.name} • {c.location?.name || c.custom_location || 'Lokalizacja TBD'}</p>
                                    </div>
                                    <div className="hidden sm:flex items-center justify-center px-5 py-3 rounded-xl bg-gold-500 text-black font-bold text-sm whitespace-nowrap">
                                        Otwórz →
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {/* Warsztaty do opłacenia */}
                        {pendingWorkshops.map((w: any) => {
                            const isDepositOverdue = w.deposit_due_at && !w.deposit_paid_at && new Date(w.deposit_due_at) < new Date();
                            return (
                                <button
                                    key={w.offer_id}
                                    onClick={() => setActiveTab('workshops')}
                                    className="w-full text-left relative block overflow-hidden rounded-3xl p-4 md:p-6 border-2 border-rose-500/60 bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-transparent shadow-[0_0_40px_rgba(244,63,94,0.25)] hover:shadow-[0_0_60px_rgba(244,63,94,0.45)] transition-all animate-pulse-soft"
                                >
                                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-rose-400/20 blur-3xl animate-pulse" />
                                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-2xl md:text-3xl shadow-lg shadow-rose-500/40">
                                            📸
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] uppercase tracking-widest text-rose-300 font-black">{isDepositOverdue ? '⚠️ Termin minął!' : '⏰ Do zapłaty'}</div>
                                            <h3 className="text-lg md:text-xl font-bold text-white">{w.workshop.title}</h3>
                                            <p className="text-sm text-zinc-300">Zaliczka: {(w.deposit_amount / 100).toFixed(2)} PLN{w.deposit_due_at && ` • Termin: ${new Date(w.deposit_due_at).toLocaleDateString('pl-PL')}`}</p>
                                        </div>
                                        <div className="hidden sm:flex items-center justify-center px-5 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm whitespace-nowrap">
                                            Opłać →
                                        </div>
                                    </div>
                                </button>
                            );
                        })}

                        {/* Oferta do zatwierdzenia */}
                        {offerNeedsAction && (
                            <button
                                onClick={() => setActiveTab('documents')}
                                className="w-full text-left relative block overflow-hidden rounded-3xl p-4 md:p-6 border-2 border-gold-500/60 bg-gradient-to-br from-gold-500/10 via-gold-500/5 to-transparent shadow-[0_0_40px_rgba(212,175,55,0.25)] hover:shadow-[0_0_60px_rgba(212,175,55,0.45)] transition-all animate-pulse-soft"
                            >
                                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold-400/20 blur-3xl animate-pulse" />
                                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gold-500 text-black flex items-center justify-center text-2xl md:text-3xl shadow-lg shadow-gold-500/40">
                                        📄
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] uppercase tracking-widest text-gold-300 font-black">Do zatwierdzenia</div>
                                        <h3 className="text-lg md:text-xl font-bold text-white">{activeOffer?.title || 'Oferta sesji'}</h3>
                                        <p className="text-sm text-zinc-300">Sprawdź szczegóły i zaakceptuj ofertę</p>
                                    </div>
                                    <div className="hidden sm:flex items-center justify-center px-5 py-3 rounded-xl bg-gold-500 text-black font-bold text-sm whitespace-nowrap">
                                        Zobacz →
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>
                )}

                {((actionSummary?.counts.offers || 0) + (actionSummary?.counts.contracts || 0)) > 0 && <button
                    type="button"
                    onClick={() => setActiveTab('preparation')}
                    aria-label="Otwórz poradnik Przygotowanie do sesji"
                    className="group relative w-full overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-gold-500/15 via-zinc-900/80 to-zinc-950 p-5 text-left shadow-lg shadow-black/20 transition-all hover:border-gold-400/60 hover:shadow-xl hover:shadow-gold-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:p-7"
                >
                    <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl transition-colors group-hover:bg-gold-500/20" aria-hidden />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold-500 text-black shadow-lg shadow-gold-500/20" aria-hidden>
                            <BookOpen className="h-7 w-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">Poradnik klienta</p>
                            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Przygotowanie do sesji</h2>
                            <p className="mt-2 text-sm leading-relaxed text-zinc-300 sm:text-base">Jak się ubrać i jak pozować przed sesją</p>
                        </div>
                        <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-black transition-colors group-hover:bg-gold-400 sm:w-auto">
                            Otwórz poradnik
                            <ChevronRight className="h-4 w-4" aria-hidden />
                        </span>
                    </div>
                </button>}

                {/* Foto-Match block (tylko gdy enabled lub klient ma profil) */}
                {(fotoMatchEnabled || fotoMatchProfile) && (
                    <FotoMatchOverviewBlock profile={fotoMatchProfile} />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-4 md:p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gold-600 to-gold-400 rounded-2xl flex items-center justify-center text-black font-bold text-xl md:text-2xl">
                                    {user?.name?.[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg md:text-xl">{user?.name}</h3>
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

                        {(actionSummary?.counts.giftCards || 0) > 0 && (
                            <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-4 md:p-6 hover:border-gold-500/30 transition-all hover:shadow-lg hover:shadow-gold-500/10">
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

                    <div className="lg:col-span-8 space-y-6 md:space-y-12">
                        <div className={`grid ${statusGridClass} gap-4`}>
                            {canShowOfferTile && (
                                activeOffer ? (
                                    <OverviewStatusTile
                                        title="Aktualna oferta"
                                        value={activeOffer?.title || 'Bez tytułu'}
                                        status={(offerStatusLabel[activeOffer?.status] || offerStatusLabel.draft).label}
                                        statusClass={(offerStatusLabel[activeOffer?.status] || offerStatusLabel.draft).color}
                                        onClick={() => setActiveTab('documents')}
                                    />
                                ) : (
                                    <OverviewStatusTile
                                        title="Aktualna oferta"
                                        value="Brak oferty"
                                        muted
                                    />
                                )
                            )}

                            {canShowContractTile && (
                                activeContract ? (
                                    <OverviewStatusTile
                                        title="Umowa"
                                        value={activeContract?.offer?.title || activeContract?.contract_number || `Umowa #${activeContract?.id}`}
                                        status={(contractStatusLabel[activeContract?.status] || contractStatusLabel.pending).label}
                                        statusClass={(contractStatusLabel[activeContract?.status] || contractStatusLabel.pending).color}
                                        onClick={() => setActiveTab('documents')}
                                    />
                                ) : (
                                    <OverviewStatusTile
                                        title="Umowa"
                                        value="Brak umowy"
                                        muted
                                    />
                                )
                            )}

                            {canShowGalleryTile && (
                                activeGallery ? (
                                    <OverviewStatusTile
                                        title="Galeria zdjęć"
                                        value={activeGallery?.client_name || 'Twoja sesja'}
                                        status="Dostępna"
                                        statusClass="text-green-400 bg-green-900/20 border-green-700/30"
                                        onClick={() => setActiveTab('sessions')}
                                    />
                                ) : (
                                    <OverviewStatusTile
                                        title="Galeria zdjęć"
                                        value="Brak galerii"
                                        muted
                                    />
                                )
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {(actionSummary?.counts.galleries || 0) > 0 && (
                                <QuickCard
                                    title="Ostatnia sesja"
                                    value={challenges[0]?.invitee_name ? `Wyzwanie dla ${challenges[0].invitee_name}` : (galleries[0]?.client_name || 'Brak sesji')}
                                    icon={<ImageIcon className="w-5 h-5" />}
                                    actionLabel="Zobacz zdjęcia"
                                    onAction={() => setActiveTab('sessions')}
                                />
                            )}
                            {((actionSummary?.counts.offers || 0) + (actionSummary?.counts.contracts || 0)) > 0 && (
                                <QuickCard
                                    title="Twoje dokumenty"
                                    value={(offers.length + contracts.length) > 0 ? `${offers.length + contracts.length} dokumentów` : 'Brak dokumentów'}
                                    icon={<FileText className="w-5 h-5" />}
                                    actionLabel="Oferty i Umowy"
                                    onAction={() => setActiveTab('documents')}
                                />
                            )}
                        </div>
                        {(actionSummary?.counts.giftCards || 0) > 0 && loadedModules.account && renderGiftCards()}
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

    function OverviewStatusTile({
        title,
        value,
        status,
        statusClass,
        onClick,
        muted = false,
    }: {
        title: string;
        value: string;
        status?: string;
        statusClass?: string;
        onClick?: () => void;
        muted?: boolean;
    }) {
        const baseClass = muted
            ? 'bg-zinc-900/20 border border-dashed border-zinc-800'
            : 'bg-zinc-900/30 backdrop-blur-xl border border-zinc-800 hover:border-gold-500/30';

        return (
            <button
                onClick={onClick}
                disabled={!onClick}
                className={`text-left rounded-2xl p-5 transition-all min-h-[132px] ${baseClass} ${onClick ? 'group' : 'cursor-default'}`}
            >
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">{title}</p>
                <p className={`font-bold text-sm mb-2 line-clamp-2 ${muted ? 'text-zinc-600' : 'text-white group-hover:text-gold-400 transition-colors'}`}>
                    {value}
                </p>
                {status && statusClass && (
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${statusClass}`}>
                        {status}
                    </span>
                )}
            </button>
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
                                                    href={`/api/contracts/${contract.id}/pdf`}
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
                                        <h4 className="font-bold text-xl mb-1">{booking.service || booking.service_type || 'Sesja Indywidualna'}</h4>
                                        <p className="mb-2 text-sm text-zinc-300">{booking.package}{booking.drone_package_name && booking.service !== 'Dron' ? ` + ${booking.drone_package_name}` : ''}</p>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
                                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(booking.date).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</span>
                                            <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {[booking.venue_place, booking.venue_city].filter(Boolean).join(', ') || 'Lokalizacja do ustalenia'}</span>
                                            {booking.drone_package_name && <span>Lot: {booking.flight_check_status === 'APPROVED' ? 'potwierdzony' : 'do sprawdzenia'}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-zinc-800 pt-6 md:pt-0">
                                    <span className="px-4 py-1.5 bg-green-500/10 text-green-500 rounded-full text-[10px] uppercase font-black tracking-widest border border-green-500/20">
                                        {booking.status === 'confirmed' ? 'Potwierdzona' : 'Oczekuje'}
                                    </span>
                                    <Link href={`/rezerwacja/${booking.id}?from=konto`} className="p-3 bg-zinc-800 hover:bg-gold-500 text-zinc-400 hover:text-black rounded-2xl transition-all" aria-label={`Szczegóły rezerwacji ${booking.id}`}>
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
        const handleDeleteAccount = async () => {
            if (!token || deletingAccount) return;

            const password = window.prompt('Aby usunąć konto, wpisz aktualne hasło:');
            if (!password) return;

            const confirmed = window.confirm('Ta operacja jest nieodwracalna. Czy na pewno chcesz usunąć konto?');
            if (!confirmed) return;

            setDeletingAccount(true);
            try {
                const response = await fetch('/api/account/delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ confirm: true, password })
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const message = data?.message || data?.error || 'Nie udało się usunąć konta.';
                    alert(message);
                    return;
                }

                alert('Konto zostało usunięte. Nastąpi wylogowanie.');
                logout();
                router.push('/');
            } catch {
                alert('Błąd połączenia. Spróbuj ponownie.');
            } finally {
                setDeletingAccount(false);
            }
        };

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
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deletingAccount}
                                className="text-red-500 text-sm font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deletingAccount ? 'Usuwanie konta...' : 'Usuń konto (nieodwracalne)'}
                            </button>
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

    function renderWorkshopsTab() {
        const hasAny = workshops.length > 0;

        const handlePayment = async (offerId: number, paymentType: 'deposit' | 'full', email: string) => {
            try {
                const res = await fetch('/api/workshops/pay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        workshop_offer_id: offerId,
                        payment_type: paymentType,
                        email
                    })
                });

                const data = await res.json();
                if (data.success && data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                } else {
                    alert('Błąd inicjalizacji płatności: ' + (data.error || 'Nieznany błąd'));
                }
            } catch (err) {
                console.error('Payment error:', err);
                alert('Błąd połączenia z systemem płatności');
            }
        };

        return (
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-rose-400" />
                        <span>Warsztaty fotograficzne</span>
                        {hasAny && <span className="text-sm font-normal text-zinc-500">({workshops.length})</span>}
                    </h2>
                    <Link href="/" className="text-xs text-zinc-500 hover:text-rose-400 inline-flex items-center gap-1">
                        Oferta warsztatów <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

                {!hasAny ? (
                    <div className="bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-zinc-900/40 border border-rose-500/20 rounded-2xl p-8 text-center">
                        <div className="text-5xl mb-3">📸</div>
                        <h3 className="text-lg font-bold text-white mb-2">Warsztaty fotograficzne tylko dla wybranych</h3>
                        <p className="text-zinc-400 text-sm max-w-md mx-auto">
                            Dostęp do panelu uczestnika, materiałów edukacyjnych i przesyłania prac otrzymasz po zapisie i opłaceniu zaliczki.
                        </p>
                        <p className="text-zinc-500 text-xs mt-3">Skontaktuj się ze mną żeby otrzymać ofertę warsztatów dopasowanych do Ciebie.</p>
                        <a href="mailto:pwlasniewski@gmail.com" className="inline-block mt-4 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-5 py-2 rounded-lg font-bold text-sm">
                            Napisz do mnie
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {workshops.map((w: any) => {
                            const schedule = Array.isArray(w.workshop.schedule) ? w.workshop.schedule : [];
                            const isDepositOverdue = w.deposit_due_at && !w.deposit_paid_at && new Date(w.deposit_due_at) < new Date();
                            const canPayDeposit = w.deposit_amount && !w.deposit_paid_at;
                            const canPayFull = w.price && w.deposit_paid_at && w.status !== 'paid' && w.status !== 'confirmed';

                            return (
                                <div key={w.offer_id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden hover:border-rose-500/40 transition">
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-rose-500/10 to-amber-500/10 border-b border-zinc-800 p-3 md:p-5">
                                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-white text-lg md:text-xl mb-1">{w.workshop.title}</h3>
                                                {w.workshop.location && (
                                                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                                                        <MapPin className="w-4 h-4 text-rose-400" /> 
                                                        {w.workshop.location}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded uppercase whitespace-nowrap ${
                                                w.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                                w.status === 'paid' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                                w.status === 'cancelled' ? 'bg-zinc-700 text-zinc-400' :
                                                'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                            }`}>
                                                {w.status === 'confirmed' ? 'Potwierdzono' : 
                                                 w.status === 'paid' ? 'Opłacono' : 
                                                 w.status === 'deposit_paid' ? 'Zaliczka' :
                                                 w.status === 'cancelled' ? 'Anulowano' : 
                                                 'Oferta wysłana'}
                                            </span>
                                        </div>
                                        
                                        {/* Dates */}
                                        {(w.workshop.starts_at || w.workshop.ends_at) && (
                                            <div className="flex items-center gap-2 text-sm text-zinc-400 mt-3">
                                                <Calendar className="w-4 h-4 text-amber-400" />
                                                {w.workshop.starts_at && new Date(w.workshop.starts_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                {w.workshop.ends_at && ` – ${new Date(w.workshop.ends_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                                            </div>
                                        )}

                                        {/* Participant */}
                                        {w.participant_name && (
                                            <div className="text-sm text-rose-300 mt-2 flex items-center gap-2">
                                                <span className="text-lg">👤</span>
                                                <span>Uczestnik: <strong>{w.participant_name}</strong></span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-3 md:p-5 space-y-4 md:space-y-5">
                                        {/* Description */}
                                        {w.workshop.description && (
                                            <div>
                                                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">O warsztatach</h4>
                                                <p className="text-sm text-zinc-300 leading-relaxed">{w.workshop.description}</p>
                                            </div>
                                        )}

                                        {/* Schedule */}
                                        {schedule.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Program zajęć</h4>
                                                <div className="space-y-2">
                                                    {schedule.map((day: any, idx: number) => (
                                                        <div key={idx} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2 md:p-3">
                                                            <div className="flex items-start gap-2 md:gap-3">
                                                                <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-amber-500/30 flex flex-col items-center justify-center">
                                                                    <div className="text-[9px] md:text-[10px] text-zinc-400 uppercase">Dzień</div>
                                                                    <div className="text-lg md:text-xl font-bold text-white">{idx + 1}</div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    {day.date && (
                                                                        <div className="text-xs text-zinc-400 mb-1">
                                                                            📅 {new Date(day.date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                                                                            {day.start && day.end && ` · ${day.start}–${day.end}`}
                                                                        </div>
                                                                    )}
                                                                    {day.topic && (
                                                                        <div className="text-sm font-semibold text-white mb-1">{day.topic}</div>
                                                                    )}
                                                                    {day.plan && (
                                                                        <div className="text-xs text-zinc-400 leading-relaxed">{day.plan}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment Section */}
                                        {(w.deposit_amount || w.price) && (
                                            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                                                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Płatność</h4>
                                                <div className="space-y-3">
                                                    {/* Price */}
                                                    {w.price && (
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-zinc-400">Cena:</span>
                                                            <span className="text-white font-bold text-lg">{(w.price / 100).toFixed(2)} PLN</span>
                                                        </div>
                                                    )}

                                                    {/* Deposit */}
                                                    {w.deposit_amount && (
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-zinc-400">Zaliczka:</span>
                                                            <div className="text-right">
                                                                <span className={`font-bold ${w.deposit_paid_at ? 'text-emerald-400' : 'text-amber-300'}`}>
                                                                    {(w.deposit_amount / 100).toFixed(2)} PLN
                                                                </span>
                                                                {w.deposit_paid_at && <span className="ml-2 text-emerald-400">✓</span>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Deadline warning */}
                                                    {w.deposit_due_at && !w.deposit_paid_at && (
                                                        <div className={`text-xs p-2 rounded ${
                                                            isDepositOverdue 
                                                                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                                                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                                        }`}>
                                                            {isDepositOverdue ? '⚠️' : '⏰'} Termin wpłaty: {new Date(w.deposit_due_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            {isDepositOverdue && ' (minął!)'}
                                                        </div>
                                                    )}

                                                    {/* Payment Buttons */}
                                                    {canPayDeposit && (
                                                        <button
                                                            onClick={() => handlePayment(w.offer_id, 'deposit', user?.email || '')}
                                                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3 md:px-4 py-3 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition"
                                                        >
                                                            <span>💳</span>
                                                            <span className="hidden sm:inline">Opłać zaliczkę online ({(w.deposit_amount / 100).toFixed(2)} PLN)</span>
                                                            <span className="sm:hidden">Zaliczka {(w.deposit_amount / 100).toFixed(2)} PLN</span>
                                                        </button>
                                                    )}

                                                    {canPayFull && (
                                                        <button
                                                            onClick={() => handlePayment(w.offer_id, 'full', user?.email || '')}
                                                            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-3 md:px-4 py-3 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition"
                                                        >
                                                            <span>💳</span>
                                                            <span className="hidden sm:inline">Opłać całość online ({((w.price - w.deposit_amount) / 100).toFixed(2)} PLN)</span>
                                                            <span className="sm:hidden">Całość {((w.price - w.deposit_amount) / 100).toFixed(2)} PLN</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Panel Button */}
                                        {w.panel_url ? (
                                            <Link 
                                                href={w.panel_url} 
                                                className="block bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-4 py-3 rounded-lg font-bold text-sm text-center transition"
                                            >
                                                🚀 Wejdź do panelu uczestnika →
                                            </Link>
                                        ) : (
                                            <div className="text-xs text-zinc-500 italic text-center py-2 bg-zinc-800/30 rounded-lg">
                                                Panel uczestnika otworzy się po opłaceniu zaliczki i potwierdzeniu zapisu.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
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
