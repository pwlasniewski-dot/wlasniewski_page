'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';

export default function UrgencyBanner() {
    const [settings, setSettings] = useState({
        enabled: false,
        slots: 0,
        month: '',
        promoEnabled: false,
        promoAmount: '10',
        promoType: 'percentage',
        promoCode: '',
        promoExpiry: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(getApiUrl('settings'));
                const data = await res.json();
                if (data.success && data.settings) {
                    const expiryDate = data.settings.promo_code_expiry;
                    const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;

                    setSettings({
                        enabled: data.settings.urgency_enabled === 'true',
                        slots: parseInt(data.settings.urgency_slots_remaining || '0'),
                        month: data.settings.urgency_month || '',
                        promoEnabled: data.settings.promo_code_discount_enabled === 'true' && !isExpired,
                        promoAmount: data.settings.promo_code_discount_amount || '10',
                        promoType: data.settings.promo_code_discount_type || 'percentage',
                        promoCode: data.settings.promo_code || '',
                        promoExpiry: expiryDate || '',
                    });
                }
            } catch (error) {
                console.error('Failed to fetch settings', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    if (loading || (!settings.enabled && !settings.promoEnabled)) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative z-[110] bg-gold-500/10 border-b border-gold-500/20 backdrop-blur-sm"
                data-urgency-banner="true"
            >
                <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center flex-wrap gap-3">
                        <div className="flex items-center flex-wrap justify-center gap-3">
                            {settings.enabled && (
                                <>
                                    <span className="flex p-2 rounded-lg bg-gold-500">
                                        <Clock className="h-5 w-5 text-black" aria-hidden="true" />
                                    </span>
                                    <p className="font-medium text-white">
                                        <span className="md:hidden">
                                            Ostatnie {settings.slots} wolne terminy na {settings.month}!
                                        </span>
                                        <span className="hidden md:inline">
                                            Uwaga! Zostały ostatnie <span className="font-bold text-gold-400">{settings.slots} wolne terminy</span> na {settings.month}.
                                        </span>
                                    </p>
                                </>
                            )}
                            {settings.enabled && settings.promoEnabled && (
                                <span className="text-gold-400 hidden md:inline">•</span>
                            )}
                            {settings.promoEnabled && (
                                <p className="font-medium text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-bold text-gold-400">Rabat {settings.promoAmount}{settings.promoType === 'percentage' ? '%' : ' PLN'}</span>
                                    {settings.promoCode && (
                                        <span className="ml-2 inline-flex items-center gap-1 bg-gold-500 text-black px-3 py-1 rounded font-bold text-sm tracking-wide shadow-md shadow-gold-500/20">
                                            KOD: {settings.promoCode}
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                        <div className="flex-shrink-0">
                            <a
                                href="/rezerwacja"
                                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400"
                            >
                                Rezerwuję
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
