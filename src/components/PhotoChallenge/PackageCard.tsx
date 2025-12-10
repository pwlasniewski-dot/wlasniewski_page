'use client';

// Package Card with pricing and hover effects

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ChallengePackage } from '@/types/photo-challenge';

interface PackageCardProps {
    package: ChallengePackage;
    selected?: boolean;
    onSelect?: () => void;
}

export default function PackageCard({ package: pkg, selected, onSelect }: PackageCardProps) {
    const discount = pkg.base_price - pkg.challenge_price;
    const savingsPercentage = pkg.discount_percentage;

    return (
        <motion.div
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelect}
            className={`
        relative p-6 rounded-xl cursor-pointer premium-card
        ${selected ? 'ring-2 ring-gold-400 bg-gold-900/10' : ''}
        transition-all duration-300
      `}
        >
            {/* Savings Badge */}
            <div className="absolute -top-3 -right-3 bg-gold-400 text-black px-4 py-1 rounded-full shadow-lg">
                <span className="font-bold text-sm">-{savingsPercentage}%</span>
            </div>

            {/* Package Name */}
            <h3 className="text-2xl font-display font-bold text-gold-400 mb-2">
                {pkg.name}
            </h3>

            {/* Description */}
            {pkg.description && (
                <p className="text-gray-400 text-sm mb-6">
                    {pkg.description}
                </p>
            )}

            {/* Pricing */}
            <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-display font-bold text-gold-400">
                        {pkg.challenge_price.toFixed(0)} zł
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                        {pkg.base_price.toFixed(0)} zł
                    </span>
                </div>
                <p className="text-green-400 text-sm font-semibold">
                    Oszczędzasz {discount.toFixed(0)} zł!
                </p>
            </div>

            {/* Included Items */}
            {pkg.included_items && pkg.included_items.length > 0 && (
                <ul className="space-y-3">
                    {pkg.included_items.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-300">
                            <Check className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{item}</span>
                        </li>
                    ))}
                </ul>
            )}

            {/* Select Indicator */}
            {selected && (
                <div className="absolute bottom-4 right-4">
                    <div className="w-6 h-6 rounded-full bg-gold-400 flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" />
                    </div>
                </div>
            )}
        </motion.div>
    );
}
