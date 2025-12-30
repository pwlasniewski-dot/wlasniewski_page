'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, Calendar, MapPin, Activity, ChevronRight, FileSearch } from 'lucide-react';

interface ThermalReport {
    id: string;
    title: string;
    date: string;
    location: string;
    equipment: string;
    pdfUrl: string;
    thumbnailUrl: string;
    type: string; // e.g. "Inspekcja Farmy PV", "Analiza Mostków Cieplnych"
}

interface ThermalReportShowcaseProps {
    title?: string;
    subtitle?: string;
    reports: ThermalReport[];
    ctaTitle?: string;
    ctaDescription?: string;
    ctaButtonText?: string;
    ctaButtonLink?: string;
}

export default function ThermalReportShowcase({
    title,
    subtitle,
    reports = [],
    ctaTitle,
    ctaDescription,
    ctaButtonText,
    ctaButtonLink
}: ThermalReportShowcaseProps) {
    if (!reports || reports.length === 0) return null;

    return (
        <section className="py-24 bg-zinc-950 px-4 md:px-6">
            <div className="max-w-[1400px] mx-auto space-y-16">
                {/* Header */}
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-4"
                    >
                        <FileSearch size={14} className="animate-pulse" /> Official Archive
                    </motion.div>
                    <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                        {title || 'Raporty z Analiz Termowizyjnych'}
                    </h2>
                    {subtitle && (
                        <p className="text-zinc-400 max-w-2xl mx-auto text-lg font-light">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reports.map((report, idx) => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative bg-zinc-900/50 border border-white/5 rounded-[32px] overflow-hidden hover:border-yellow-500/30 transition-all duration-500"
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-[4/3] overflow-hidden">
                                <img
                                    src={report.thumbnailUrl}
                                    alt={report.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                                {/* Report Type Badge */}
                                <div className="absolute top-6 left-6">
                                    <span className="px-4 py-1.5 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xl">
                                        {report.type}
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white group-hover:text-yellow-500 transition-colors">
                                        {report.title}
                                    </h3>
                                    <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-zinc-700" />
                                            {report.date}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-zinc-700" />
                                            {report.location}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats/Equipment */}
                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                                        <span>Sprzęt pomiarowy</span>
                                        <Activity size={12} className="text-yellow-500" />
                                    </div>
                                    <p className="text-xs text-zinc-300 font-medium">
                                        {report.equipment}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="pt-2">
                                    <a
                                        href={report.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-between px-6 py-4 bg-zinc-800 hover:bg-yellow-500 text-zinc-400 hover:text-black rounded-2xl transition-all duration-300 group/btn"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} />
                                            <span className="text-xs font-black uppercase tracking-widest">Zobacz Raport PDF</span>
                                        </div>
                                        <Eye size={18} className="translate-y-0 group-hover/btn:-translate-y-1 transition-transform" />
                                    </a>
                                </div>
                            </div>

                            {/* Tech Borders */}
                            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none">
                                <div className="absolute top-8 right-8 w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Analysis CTA */}
                {(ctaTitle || ctaDescription) && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-12 bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8"
                    >
                        <div className="space-y-4 text-center md:text-left">
                            <h3 className="text-2xl md:text-3xl font-bold text-white">{ctaTitle || 'Potrzebujesz profesjonalnej analizy?'}</h3>
                            <p className="text-zinc-400 max-w-xl font-light">
                                {ctaDescription || 'Każdy nalot kończy się wygenerowaniem szczegółowego raportu w systemie DJI Thermal Analysis, zawierającego precyzyjne pomiary temperatur i mapę anomalii.'}
                            </p>
                        </div>
                        <a
                            href={ctaButtonLink || '#'}
                            className="px-10 py-5 bg-yellow-500 text-black font-black rounded-2xl hover:scale-105 transition-all shadow-2xl flex items-center gap-3"
                        >
                            {ctaButtonText || 'DOWIEDZ SIĘ WIĘCEJ'} <ChevronRight size={20} />
                        </a>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
