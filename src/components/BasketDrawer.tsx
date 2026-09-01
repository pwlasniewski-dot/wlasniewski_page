'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import PromotionPriceBlock from '@/components/promotions/PromotionPriceBlock';

export default function BasketDrawer() {
    const { items, removeItem, updateItem, totalAmount, isOpen, setIsOpen } = useCart();

    const formattedTotal = (totalAmount / 100).toFixed(2);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-screen w-full max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <ShoppingBag className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Twój Koszyk</h2>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Jedna bezpieczna płatność</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-zinc-800 rounded-full transition-colors group"
                            >
                                <X className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                            </button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                        <ShoppingBag className="w-10 h-10 text-zinc-700" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-2">Koszyk jest pusty</h3>
                                    <p className="text-zinc-500 text-sm max-w-[200px]">Dodaj wymarzoną sesję lub kartę podarunkową, aby kontynuować.</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative group p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl hover:bg-zinc-900/50 hover:border-amber-500/20 transition-all"
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 uppercase font-bold tracking-tighter">
                                                        {item.type === 'booking' ? 'Rezerwacja' : 'Karta'}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-white text-lg leading-snug">{item.title}</h4>
                                                {item.subtitle && <p className="text-sm text-zinc-500">{item.subtitle}</p>}

                                                {/* Gift Card Personalization Inputs */}
                                                {item.type === 'gift_card' && (
                                                    <div className="mt-4 space-y-3 p-3 bg-black/20 rounded-xl border border-white/5">
                                                        <div>
                                                            <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-1 block">Dla kogo (Imię)</label>
                                                            <input
                                                                type="text"
                                                                placeholder="np. Anna"
                                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
                                                                value={item.metadata?.recipient_name || ''}
                                                                onChange={(e) => updateItem(item.id, {
                                                                    metadata: { ...item.metadata, recipient_name: e.target.value }
                                                                })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-1 block">Wiadomość (opcjonalne)</label>
                                                            <textarea
                                                                rows={2}
                                                                placeholder="Najlepsze życzenia..."
                                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600 resize-none"
                                                                value={item.metadata?.message || ''}
                                                                onChange={(e) => updateItem(item.id, {
                                                                    metadata: { ...item.metadata, message: e.target.value }
                                                                })}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {item.type === 'booking' && item.metadata?.package_promotion && (
                                                    <PromotionPriceBlock promotion={item.metadata.package_promotion} variant="summary" className="mt-4" />
                                                )}

                                                <div className="mt-4 flex items-center justify-between">
                                                    <span className="text-amber-500 font-extrabold text-xl">
                                                        {(item.price / 100).toFixed(2)} zł
                                                    </span>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-8 bg-zinc-900/80 border-t border-zinc-800 backdrop-blur-xl">
                                <div className="flex justify-between items-end mb-8">
                                    <div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold mb-1">Razem do zapłaty</p>
                                        <p className="text-amber-500 text-3xl font-black">{formattedTotal} zł</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-zinc-600 text-[10px] uppercase font-bold">Jedna pozycja</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => window.location.href = '/checkout'}
                                    className="w-full bg-amber-600 hover:bg-amber-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-amber-900/20 transition-all flex items-center justify-center gap-3 overflow-hidden relative group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                    <span>Przejdź do Płatności</span>
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <p className="text-[10px] text-zinc-600 text-center mt-6 uppercase tracking-widest font-bold">
                                    Bezpieczna płatność obsługiwana przez PayU
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
