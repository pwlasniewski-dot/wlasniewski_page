'use client';

import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Calendar, Check, Star, User, ShoppingBag, X, MapPin, ArrowLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';

// --- Types ---
interface ProviderPackage {
    id: number;
    name: string;
    price: number;
    hours: number;
    description?: string;
    features?: string;
}

interface Provider {
    id: number | 'admin';
    name: string;
    is_admin: boolean;
    profile: {
        avatar_url?: string;
        bio?: string;
        rating: number;
        highlight_photos?: string;
    } | null;
    packages: ProviderPackage[];
}

interface Category {
    id: number;
    name: string;
    icon?: string;
    providers: Provider[];
    order?: number;
}

// --- Animation Variants ---
const zoomVariants = {
    initial: (direction: number) => ({
        scale: direction > 0 ? 0.5 : 2, // Entering: Zoom In (0.5->1) or Zoom Out (2->1)
        opacity: 0,
        filter: 'blur(10px)'
    }),
    animate: {
        scale: 1,
        opacity: 1,
        filter: 'blur(0px)',
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
    },
    exit: (direction: number) => ({
        scale: direction > 0 ? 2 : 0.5, // Exiting: Zoom In (1->2) or Zoom Out (1->0.5)
        opacity: 0,
        filter: 'blur(10px)',
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
    })
};

export default function EventBuilderPage() {
    const { addItem } = useCart();

    // --- State ---
    const [view, setView] = useState<'intro' | 'grid' | 'details'>('intro');
    const [direction, setDirection] = useState(1); // 1 = Zoom In (Forward), -1 = Zoom Out (Back)

    // Selection State
    const [eventType, setEventType] = useState<string>('Ślub / Wesele');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedVenue, setSelectedVenue] = useState<string>('');

    // Data State
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(false);

    // Cart Bundle
    const [cartBundle, setCartBundle] = useState<{
        categoryName: string;
        providerId: number | 'admin';
        providerName: string;
        package: ProviderPackage;
    }[]>([]);

    // --- Effects ---
    useEffect(() => {
        if (!selectedDate) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/builder/providers?date=${selectedDate}`);
                const data = await res.json();
                if (data.success) {
                    setCategories(data.categories);
                }
            } catch (error) {
                toast.error('Błąd ładowania dostawców');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate]);

    // --- Handlers ---
    const handleStart = () => {
        if (!selectedDate) {
            toast.error('Wybierz datę, aby rozpocząć.');
            return;
        }
        setDirection(1);
        setView('grid');
    };

    const handleCategorySelect = (cat: Category) => {
        setActiveCategory(cat);
        setDirection(1);
        setView('details');
    };

    const handleBackToGrid = () => {
        setDirection(-1);
        setView('grid');
    };

    const handleAddToBundle = (provider: Provider, pkg: ProviderPackage) => {
        if (!activeCategory) return;
        setCartBundle(prev => {
            const filtered = prev.filter(item => item.categoryName !== activeCategory.name);
            return [...filtered, {
                categoryName: activeCategory.name,
                providerId: provider.id,
                providerName: provider.name,
                package: pkg
            }];
        });
        toast.success(`Wybrano: ${provider.name}`);
        handleBackToGrid(); // Auto-return to grid after selection
    };

    const handleRemoveFromBundle = (categoryName: string) => {
        setCartBundle(prev => prev.filter(p => p.categoryName !== categoryName));
    };

    const finalizeBooking = () => {
        if (cartBundle.length === 0) return;
        cartBundle.forEach(item => {
            addItem({
                type: 'booking',
                title: `${item.categoryName} - ${item.providerName}`,
                subtitle: `${selectedDate} | ${item.package.name} (${item.package.hours}h)`,
                price: item.package.price,
                quantity: 1,
                metadata: {
                    date: selectedDate,
                    venue: selectedVenue,
                    event_type: eventType,
                    provider_id: item.providerId === 'admin' ? null : item.providerId,
                    package_name: item.package.name,
                    service: item.categoryName
                }
            });
        });
        toast.success('Przekierowanie do koszyka...');
        setTimeout(() => window.location.href = '/koszyk', 1000);
    };

    // --- Render ---
    return (
        <main className="h-screen w-screen bg-black text-white overflow-hidden relative selection:bg-amber-500/30">
            <Toaster theme="dark" position="top-center" />

            {/* Background Ambient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80 pointer-events-none" />

            <AnimatePresence mode="popLayout" custom={direction}>

                {/* VIEW 1: INTRO */}
                {view === 'intro' && (
                    <motion.div
                        key="intro"
                        custom={direction}
                        variants={zoomVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10"
                    >
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-600 mb-8 text-center"
                        >
                            Zaplanuj Wydarzenie
                        </motion.h1>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl w-full max-w-2xl shadow-2xl"
                        >
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Rodzaj Imprezy</label>
                                    <select
                                        value={eventType}
                                        onChange={(e) => setEventType(e.target.value)}
                                        className="w-full bg-transparent border-b border-zinc-700 py-3 text-2xl font-light focus:border-amber-500 outline-none transition-colors"
                                    >
                                        <option>Ślub / Wesele</option>
                                        <option>Urodziny</option>
                                        <option>Event Firmowy</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Data</label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full bg-transparent border-b border-zinc-700 py-3 text-2xl font-light focus:border-amber-500 outline-none transition-colors text-white mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Miejsce (Opcjonalne)</label>
                                        <input
                                            type="text"
                                            value={selectedVenue}
                                            onChange={(e) => setSelectedVenue(e.target.value)}
                                            placeholder="Np. Hotel Marriot"
                                            className="w-full bg-transparent border-b border-zinc-700 py-3 text-2xl font-light focus:border-amber-500 outline-none transition-colors mt-1 placeholder:text-zinc-800"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleStart}
                                    className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-zinc-200 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4"
                                >
                                    Rozpocznij Konfigurację <ArrowRight />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* VIEW 2: GRID HUB */}
                {view === 'grid' && (
                    <motion.div
                        key="grid"
                        custom={direction}
                        variants={zoomVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 overflow-y-auto p-4 md:p-12 z-10"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-end mb-12 max-w-7xl mx-auto w-full">
                            <div>
                                <h2 className="text-4xl font-bold text-white mb-2">{eventType}</h2>
                                <p className="text-zinc-400 font-mono flex items-center gap-2">
                                    <Calendar size={16} /> {selectedDate}
                                    {selectedVenue && <span className="flex items-center gap-2 ml-4"><MapPin size={16} /> {selectedVenue}</span>}
                                </p>
                            </div>
                            <button
                                onClick={() => { setDirection(-1); setView('intro'); }}
                                className="text-zinc-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
                            >
                                Zmień Datę
                            </button>
                        </div>

                        {/* Grid */}
                        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-32">
                            {categories.map((cat, idx) => {
                                const selectedItem = cartBundle.find(i => i.categoryName === cat.name);
                                return (
                                    <motion.div
                                        key={cat.id}
                                        layoutId={`category-${cat.id}`}
                                        onClick={() => handleCategorySelect(cat)}
                                        className={`
                                            group relative aspect-video md:aspect-square rounded-3xl border p-8 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02]
                                            ${selectedItem
                                                ? 'bg-gradient-to-br from-zinc-900 to-amber-900/10 border-amber-500/50'
                                                : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50'
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="text-4xl group-hover:scale-110 transition-transform duration-500 origin-top-left">{cat.icon || '✨'}</span>
                                            {selectedItem && (
                                                <span className="bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-in zoom-in">
                                                    WYBRANO
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-amber-500 transition-colors">{cat.name}</h3>
                                            <p className="text-zinc-500 text-sm">
                                                {selectedItem
                                                    ? `${selectedItem.providerName}`
                                                    : `${cat.providers.length} dostępnych wykonawców`
                                                }
                                            </p>
                                        </div>

                                        {selectedItem && (
                                            <div className="absolute inset-x-0 bottom-0 bg-amber-500/10 border-t border-amber-500/20 p-4 backdrop-blur-sm rounded-b-3xl">
                                                <div className="flex justify-between items-center text-xs font-mono font-bold text-amber-500 uppercase">
                                                    <span>{selectedItem.package.name}</span>
                                                    <span>{(selectedItem.package.price / 100).toFixed(0)} PLN</span>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* VIEW 3: DETAILS (PROVIDER LIST) */}
                {view === 'details' && activeCategory && (
                    <motion.div
                        key="details"
                        custom={direction}
                        variants={zoomVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 overflow-y-auto bg-black z-20"
                    >
                        <div className="max-w-7xl mx-auto p-4 md:p-12 pb-32">
                            <button
                                onClick={handleBackToGrid}
                                className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                            >
                                <div className="p-2 border border-zinc-800 rounded-full group-hover:bg-zinc-800 transition-colors">
                                    <ArrowLeft size={20} />
                                </div>
                                <span className="font-bold uppercase tracking-widest text-sm">Powrót do Kategorii</span>
                            </button>

                            <motion.div layoutId={`category-${activeCategory.id}`} className="mb-12">
                                <h2 className="text-5xl font-bold text-white mb-2 flex items-center gap-4">
                                    <span>{activeCategory.icon}</span>
                                    {activeCategory.name}
                                </h2>
                                <p className="text-zinc-500 text-xl">Wybierz wykonawcę dla swojego wydarzenia</p>
                            </motion.div>

                            <div className="grid grid-cols-1 gap-8">
                                {activeCategory.providers.map((prov, idx) => (
                                    <motion.div
                                        key={prov.id}
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden hover:border-zinc-700 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row">
                                            {/* Provider Sidebar: Avatar & Bio */}
                                            <div className="p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900/20">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden relative">
                                                        {prov.profile?.avatar_url ? (
                                                            <Image src={prov.profile.avatar_url} alt={prov.name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-zinc-600"><User /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">{prov.name}</h3>
                                                        <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                                                            <Star size={12} fill="currentColor" /> {prov.profile?.rating || '5.0'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {prov.profile?.bio && (
                                                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">{prov.profile.bio}</p>
                                                )}

                                                {/* Highlights */}
                                                {prov.profile?.highlight_photos && (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {(() => {
                                                            try {
                                                                return JSON.parse(prov.profile.highlight_photos).slice(0, 3).map((url: string, i: number) => (
                                                                    <div key={i} className="aspect-square rounded-lg overflow-hidden relative border border-zinc-700">
                                                                        <Image src={url} alt="" fill className="object-cover" />
                                                                    </div>
                                                                ));
                                                            } catch (e) { return null; }
                                                        })()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Packages List */}
                                            <div className="flex-1 p-8">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Dostępne Pakiety</h4>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {prov.packages.map(pkg => (
                                                        <button
                                                            key={pkg.id}
                                                            onClick={() => handleAddToBundle(prov, pkg)}
                                                            className="text-left border border-zinc-800 bg-zinc-950 p-6 rounded-2xl hover:border-amber-500 hover:bg-zinc-900 transition-all group"
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-bold text-lg text-white group-hover:text-amber-500 transition-colors">{pkg.name}</span>
                                                                <span className="font-mono text-amber-500 font-bold">{(pkg.price / 100).toFixed(0)} zł</span>
                                                            </div>
                                                            <div className="text-zinc-500 text-sm mb-4">{pkg.hours} godzin • {pkg.features || 'Standardowa obsługa'}</div>
                                                            <div className="flex items-center text-xs font-bold uppercase tracking-wide text-zinc-600 group-hover:text-white transition-colors">
                                                                Wybierz <ChevronRight size={14} className="ml-1" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLOATING DOCK (Cart Summary) */}
            <AnimatePresence>
                {cartBundle.length > 0 && view !== 'intro' && (
                    <motion.div
                        initial={{ y: 200 }}
                        animate={{ y: 0 }}
                        exit={{ y: 200 }}
                        className="fixed bottom-6 inset-x-0 flex justify-center pointer-events-none z-50 px-4"
                    >
                        <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-4 shadow-2xl pointer-events-auto w-full max-w-3xl flex items-center justify-between gap-6">

                            {/* Items Preview */}
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
                                {cartBundle.map((item, i) => (
                                    <motion.div
                                        layout
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        key={item.categoryName}
                                        className="shrink-0 flex items-center gap-2 bg-black border border-zinc-800 rounded-lg pr-2 pl-1 py-1"
                                    >
                                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                                            {i + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white leading-none">{item.categoryName}</span>
                                            <span className="text-[10px] text-zinc-500 leading-none">{item.providerName}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFromBundle(item.categoryName)}
                                            className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-red-500 transition-colors ml-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="h-10 w-px bg-zinc-800 shrink-0" />

                            {/* Total & Action */}
                            <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Suma</p>
                                    <p className="text-xl font-bold font-mono text-white">
                                        {(cartBundle.reduce((sum, item) => sum + item.package.price, 0) / 100).toFixed(0)} PLN
                                    </p>
                                </div>
                                <button
                                    onClick={finalizeBooking}
                                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold h-12 px-6 rounded-xl flex items-center gap-2 transition-transform active:scale-95"
                                >
                                    Rezerwuj <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
