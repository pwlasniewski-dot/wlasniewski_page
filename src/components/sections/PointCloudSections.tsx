'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
    MapPin, Calendar, Ruler, Box, ArrowRight, X, ExternalLink, Layers,
    Mountain, Building2, Truck, Zap, ChevronLeft, ChevronRight, GripVertical
} from 'lucide-react';

const ModelViewer3D = dynamic(() => import('@/components/ModelViewer3D'), { ssr: false });

// ─────────────────────────────────────
// TYPES
// ─────────────────────────────────────
export interface PointCloudProject {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    category?: string;
    location?: string;
    date?: string;
    area?: string;
    pointCount?: string;
    accuracy?: string;
    modelUrl?: string;   // .glb file
    coverImage?: string;
    images?: string[];
    tags?: string[];
}

export interface PointCloudServiceItem {
    id: string;
    icon: string;
    title: string;
    description: string;
    features?: string[];
    image?: string;
}

export interface PointCloudTechStep {
    id: string;
    stepNumber: string;
    title: string;
    description: string;
    details?: string;
    image?: string;
    icon?: string;
}

// ─────────────────────────────────────
// POINT CLOUD HERO
// ─────────────────────────────────────
export function PointCloudHero({
    title, subtitle, tag, buttonText, buttonLink, image, modelUrl, stats
}: {
    title?: string; subtitle?: string; tag?: string;
    buttonText?: string; buttonLink?: string; image?: string;
    modelUrl?: string;
    stats?: Array<{ value: string; label: string }>;
}) {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden">
            {/* Background */}
            {image ? (
                <>
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${image}")` }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40" />
                </>
            ) : (
                <div className="absolute inset-0 bg-zinc-950">
                    {/* Animated grid */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'linear-gradient(rgba(234,179,8,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(234,179,8,0.3) 1px, transparent 1px)',
                            backgroundSize: '60px 60px'
                        }} />
                    </div>
                    {/* Particle dots */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(30)].map((_, i) => {
                            // Deterministic pseudo-random positions to avoid hydration mismatch
                            const seed = (i + 1) * 137.508;
                            const left = ((seed * 2.3) % 100).toFixed(2);
                            const top = ((seed * 3.7) % 100).toFixed(2);
                            const dur = 3 + (i % 7);
                            const del = (i % 5) * 0.4;
                            return (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-yellow-500/30 rounded-full"
                                    style={{ left: `${left}%`, top: `${top}%` }}
                                    animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.5, 1.5, 0.5] }}
                                    transition={{ duration: dur, repeat: Infinity, delay: del }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Ambient effects */}
            <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-32 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Content */}
                    <div>
                        {tag && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-black uppercase tracking-[0.3em] mb-8"
                            >
                                <Layers size={14} className="animate-pulse" /> {tag}
                            </motion.div>
                        )}

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.8 }}
                            className="text-5xl md:text-7xl xl:text-8xl font-bold text-white mb-8 leading-[1.05] tracking-tight"
                            dangerouslySetInnerHTML={{ __html: title || 'Chmura Punktów & <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-yellow-500">Pomiary 3D</span>' }}
                        />

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-zinc-400 text-lg md:text-xl mb-12 max-w-xl leading-relaxed"
                        >
                            {subtitle || 'Precyzyjne modele 3D, ortofotomapy i pomiary objętości przy użyciu najnowszej technologii LiDAR i fotogrametrii.'}
                        </motion.p>

                        {buttonText && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <a
                                    href={buttonLink || '#rfq'}
                                    className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-10 py-5 rounded-2xl hover:from-cyan-400 hover:to-blue-500 transition-all group hover:scale-105 active:scale-95 shadow-xl shadow-cyan-500/20"
                                >
                                    {buttonText}
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </a>
                            </motion.div>
                        )}

                        {/* Quick stats */}
                        {stats && stats.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-16 flex gap-12"
                            >
                                {stats.map((stat, i) => (
                                    <div key={i}>
                                        <div className="text-3xl font-black text-white">{stat.value}</div>
                                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Right: 3D Model or Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        {modelUrl ? (
                            <ModelViewer3D
                                src={modelUrl}
                                poster={image}
                                height="700px"
                                autoRotate
                                cameraControls
                            />
                        ) : image ? (
                            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                <img src={image} alt="" className="w-full aspect-square object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-6 left-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-lg rounded-lg border border-white/10 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                                        <Box size={12} /> Chmura Punktów
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </motion.div>
                </div>
            </div>

            {/* Bottom line */}
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </section>
    );
}

// ─────────────────────────────────────
// POINT CLOUD SHOWCASE (Projects Gallery with 3D)
// ─────────────────────────────────────
export function PointCloudShowcase({
    title, subtitle, projects
}: {
    title?: string; subtitle?: string;
    projects: PointCloudProject[];
}) {
    const [selectedProject, setSelectedProject] = useState<PointCloudProject | null>(null);

    const ICON_MAP: Record<string, React.ReactNode> = {
        'Mountain': <Mountain size={14} />,
        'Building2': <Building2 size={14} />,
        'Truck': <Truck size={14} />,
        'Zap': <Zap size={14} />,
        'Layers': <Layers size={14} />,
        'MapPin': <MapPin size={14} />,
    };

    return (
        <section className="py-32 px-6 relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-[1400px] mx-auto relative z-10">
                {/* Header */}
                <div className="mb-20">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-6"
                    >
                        <Layers size={14} /> Realizacje
                    </motion.div>
                    <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-none mb-4"
                        dangerouslySetInnerHTML={{ __html: title || 'Nasze <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Projekty</span>' }}
                    />
                    {subtitle && <p className="text-zinc-500 text-lg max-w-2xl">{subtitle}</p>}
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map((project, i) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            onClick={() => setSelectedProject(project)}
                            className="group relative rounded-3xl overflow-hidden border border-white/5 bg-zinc-900/50 hover:border-cyan-500/30 transition-all cursor-pointer hover:shadow-xl hover:shadow-cyan-500/5"
                        >
                            {/* Cover */}
                            <div className="relative aspect-[4/3] overflow-hidden">
                                {project.coverImage ? (
                                    <img src={project.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                        <Box size={48} className="text-zinc-700" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

                                {/* Category Badge */}
                                {project.category && (
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                                        {project.category}
                                    </div>
                                )}

                                {/* 3D Badge */}
                                {project.modelUrl && (
                                    <div className="absolute top-4 right-4 px-2.5 py-1 bg-yellow-500/20 backdrop-blur-md rounded-lg border border-yellow-500/30 text-[10px] font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-1">
                                        <Box size={10} /> 3D
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{project.title}</h3>

                                <div className="flex flex-wrap gap-3 mb-4">
                                    {project.location && (
                                        <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                            <MapPin size={10} /> {project.location}
                                        </span>
                                    )}
                                    {project.area && (
                                        <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                            <Ruler size={10} /> {project.area}
                                        </span>
                                    )}
                                    {project.date && (
                                        <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                            <Calendar size={10} /> {project.date}
                                        </span>
                                    )}
                                </div>

                                {project.description && (
                                    <p className="text-sm text-zinc-500 line-clamp-2">{project.description}</p>
                                )}

                                {/* Tags */}
                                {project.tags && project.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-4">
                                        {project.tags.map((tag, ti) => (
                                            <span key={ti} className="px-2 py-0.5 bg-zinc-800 rounded text-[9px] text-zinc-500 font-bold uppercase">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Hover Glow */}
                            <div className="absolute -inset-8 bg-cyan-500/5 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Project Detail Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedProject(null)}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-lg overflow-y-auto flex items-center justify-center p-4 md:p-8"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-6xl bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setSelectedProject(null)}
                                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors border border-white/10"
                            >
                                <X size={24} />
                            </button>

                            {/* 3D Model Viewer */}
                            {selectedProject.modelUrl && (
                                <div className="w-full">
                                    <ModelViewer3D
                                        src={selectedProject.modelUrl}
                                        poster={selectedProject.coverImage}
                                        title={selectedProject.title}
                                        height="500px"
                                        autoRotate
                                        cameraControls
                                    />
                                </div>
                            )}

                            {/* If no 3D, show cover */}
                            {!selectedProject.modelUrl && selectedProject.coverImage && (
                                <div className="w-full h-[400px]">
                                    <img src={selectedProject.coverImage} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}

                            {/* Project Info */}
                            <div className="p-8 md:p-12 space-y-6">
                                <div>
                                    {selectedProject.category && (
                                        <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-[0.2em] mb-3">
                                            <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                                            {selectedProject.category}
                                        </div>
                                    )}
                                    <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">{selectedProject.title}</h2>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {selectedProject.location && (
                                        <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                                            <MapPin size={16} className="text-cyan-400 mb-2" />
                                            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Lokalizacja</div>
                                            <div className="text-white font-bold text-sm">{selectedProject.location}</div>
                                        </div>
                                    )}
                                    {selectedProject.area && (
                                        <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                                            <Ruler size={16} className="text-cyan-400 mb-2" />
                                            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Obszar</div>
                                            <div className="text-white font-bold text-sm">{selectedProject.area}</div>
                                        </div>
                                    )}
                                    {selectedProject.pointCount && (
                                        <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                                            <Layers size={16} className="text-cyan-400 mb-2" />
                                            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Punkty</div>
                                            <div className="text-white font-bold text-sm">{selectedProject.pointCount}</div>
                                        </div>
                                    )}
                                    {selectedProject.accuracy && (
                                        <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                                            <Zap size={16} className="text-cyan-400 mb-2" />
                                            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Dokładność</div>
                                            <div className="text-white font-bold text-sm">{selectedProject.accuracy}</div>
                                        </div>
                                    )}
                                </div>

                                {selectedProject.description && (
                                    <div className="prose prose-invert prose-lg max-w-none text-zinc-300" dangerouslySetInnerHTML={{ __html: selectedProject.description }} />
                                )}

                                {/* Additional Images */}
                                {selectedProject.images && selectedProject.images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {selectedProject.images.map((img, idx) => (
                                            <div key={idx} className="rounded-xl overflow-hidden border border-white/5">
                                                <img src={img} alt="" className="w-full aspect-video object-cover hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

// ─────────────────────────────────────
// POINT CLOUD SERVICES
// ─────────────────────────────────────
export function PointCloudServices({
    title, subtitle, services
}: {
    title?: string; subtitle?: string;
    services: PointCloudServiceItem[];
}) {
    const ICON_MAP: Record<string, React.ReactNode> = {
        'Mountain': <Mountain size={28} />,
        'Building2': <Building2 size={28} />,
        'Truck': <Truck size={28} />,
        'Zap': <Zap size={28} />,
        'Layers': <Layers size={28} />,
        'MapPin': <MapPin size={28} />,
        'Ruler': <Ruler size={28} />,
        'Box': <Box size={28} />,
    };

    return (
        <section className="py-32 px-6 relative overflow-hidden bg-zinc-950">
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-[1400px] mx-auto relative z-10">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6"
                    >
                        <Box size={12} /> Usługi
                    </motion.div>
                    <h2
                        className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6"
                        dangerouslySetInnerHTML={{ __html: title || 'Co możemy dla Ciebie <span class="text-cyan-400">zrobić</span>?' }}
                    />
                    {subtitle && <p className="text-zinc-500 text-lg max-w-2xl mx-auto">{subtitle}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, i) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative p-8 bg-zinc-900/30 backdrop-blur-sm rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-all hover:bg-zinc-900/60"
                        >
                            {/* Icon */}
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 group-hover:from-cyan-500/20 group-hover:to-blue-500/20 transition-all">
                                {ICON_MAP[service.icon] || <Layers size={28} />}
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                                {service.title}
                            </h3>

                            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                                {service.description}
                            </p>

                            {/* Features list */}
                            {service.features && service.features.length > 0 && (
                                <ul className="space-y-2">
                                    {service.features.map((feat, fi) => (
                                        <li key={fi} className="flex items-start gap-2 text-sm text-zinc-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Service 3D model or image */}
                            {service.modelUrl ? (
                                <div className="mt-6 rounded-xl overflow-hidden border border-cyan-500/20 bg-black/40">
                                    <div className="aspect-[16/10] relative">
                                        <ModelViewer3D
                                            src={service.modelUrl}
                                            alt={service.title}
                                            autoRotate={true}
                                            className="w-full h-full"
                                        />
                                    </div>
                                    <div className="px-3 py-1.5 bg-cyan-950/50 border-t border-cyan-500/10 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                        <span className="text-[9px] text-cyan-500/70 uppercase tracking-widest font-bold">Model interaktywny — kliknij i obracaj</span>
                                    </div>
                                </div>
                            ) : service.image ? (
                                <div className="mt-6 rounded-xl overflow-hidden border border-white/5">
                                    <img src={service.image} alt={service.title} className="w-full aspect-[16/10] object-cover" />
                                </div>
                            ) : null}

                            {/* Corner accent */}
                            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/5 rounded-tr-xl group-hover:border-cyan-500/30 transition-colors" />

                            {/* Hover glow */}
                            <div className="absolute -inset-4 bg-cyan-500/5 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─────────────────────────────────────
// POINT CLOUD TECHNOLOGY (Process/Pipeline)
// ─────────────────────────────────────
export function PointCloudTechnology({
    title, subtitle, description, steps, image
}: {
    title?: string; subtitle?: string; description?: string;
    steps: PointCloudTechStep[];
    image?: string;
}) {
    return (
        <section className="py-40 px-6 relative overflow-hidden">
            {/* Ambient BG */}
            <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-cyan-500/3 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
                    {/* Left: Sticky Info */}
                    <div className="sticky top-32">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8"
                        >
                            <Layers size={12} /> Technologia
                        </motion.div>

                        <h2 className="text-5xl md:text-7xl font-bold text-white mb-10 leading-[1.05] tracking-tight"
                            dangerouslySetInnerHTML={{ __html: title || 'Pipeline <span class="text-cyan-400">pomiarowy</span> od A do Z.' }}
                        />

                        <p className="text-zinc-400 text-lg mb-12 max-w-lg leading-relaxed">
                            {description || 'Od nalotu dronem, przez przetwarzanie chmury punktów, po gotowy model 3D — cały proces realizujemy w domu, bez zewnętrznych podwykonawców.'}
                        </p>

                        {/* Tech Specs Card */}
                        {image && (
                            <div className="rounded-3xl overflow-hidden border border-white/5">
                                <img src={image} alt="Technologia" className="w-full aspect-video object-cover" />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6 mt-8">
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 group"
                            >
                                <Layers className="text-cyan-400 mb-4" size={28} />
                                <p className="text-white font-black text-xs uppercase tracking-widest mb-1">Dokładność</p>
                                <p className="text-[10px] text-zinc-500 font-bold tracking-tight uppercase">do 2cm GSD</p>
                            </motion.div>

                            <motion.div
                                whileHover={{ y: -5 }}
                                className="p-6 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 group"
                            >
                                <Zap className="text-yellow-500 mb-4" size={28} />
                                <p className="text-white font-black text-xs uppercase tracking-widest mb-1">Realizacja</p>
                                <p className="text-[10px] text-zinc-500 font-bold tracking-tight uppercase">od 48h do 5 dni</p>
                            </motion.div>
                        </div>
                    </div>

                    {/* Right: Steps */}
                    <div className="space-y-8 relative">
                        {/* Vertical Connect Line */}
                        <div className="absolute left-[39px] top-10 bottom-10 w-px bg-gradient-to-b from-cyan-500/50 via-zinc-800 to-transparent hidden md:block" />

                        {steps.map((step, i) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.12, duration: 0.6 }}
                                className="group relative pl-0 md:pl-20"
                            >
                                {/* Step Number */}
                                <div className="hidden md:flex absolute left-0 top-0 w-20 items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-white text-xs font-black z-10 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-all duration-500">
                                        {i + 1}
                                    </div>
                                    <div className="absolute w-14 h-14 rounded-full border border-cyan-500/0 group-hover:border-cyan-500/20 group-hover:scale-125 transition-all duration-700 pointer-events-none" />
                                </div>

                                <div className="p-10 bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-[32px] hover:bg-zinc-900/60 hover:border-white/10 transition-all duration-500 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 text-8xl font-black text-white/[0.02] group-hover:text-cyan-500/[0.05] transition-colors select-none">
                                        {step.stepNumber || `0${i + 1}`}
                                    </div>

                                    <div className="relative z-10">
                                        {/* Mobile step indicator */}
                                        <div className="flex items-center gap-4 mb-4 md:hidden">
                                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-black">
                                                {i + 1}
                                            </div>
                                            <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Etap Procesu</div>
                                        </div>

                                        <h4 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                                            {step.title}
                                        </h4>
                                        <p className="text-zinc-500 text-sm leading-relaxed max-w-md mb-4">
                                            {step.description}
                                        </p>

                                        {step.details && (
                                            <p className="text-[11px] text-zinc-600 leading-relaxed max-w-md">
                                                {step.details}
                                            </p>
                                        )}

                                        {step.image && (
                                            <div className="mt-6 rounded-xl overflow-hidden border border-white/5">
                                                <img src={step.image} alt={step.title} className="w-full aspect-video object-cover" />
                                            </div>
                                        )}

                                        <div className="mt-8 flex items-center gap-4">
                                            <div className="h-px w-8 bg-zinc-800" />
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">
                                                Etap {step.stepNumber || `0${i + 1}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─────────────────────────────────────
// POINT CLOUD VIEWER (Standalone 3D viewer section)
// ─────────────────────────────────────
export function PointCloudViewerSection({
    title, subtitle, modelUrl, poster, description, stats
}: {
    title?: string; subtitle?: string; modelUrl?: string; poster?: string;
    description?: string;
    stats?: Array<{ label: string; value: string }>;
}) {
    return (
        <section className="py-24 px-6 relative overflow-hidden">
            <div className="max-w-[1400px] mx-auto">
                {(title || subtitle) && (
                    <div className="text-center mb-12">
                        {subtitle && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                                <Box size={12} /> {subtitle}
                            </div>
                        )}
                        {title && (
                            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight"
                                dangerouslySetInnerHTML={{ __html: title }}
                            />
                        )}
                    </div>
                )}

                {/* 3D Viewer */}
                {modelUrl && (
                    <ModelViewer3D
                        src={modelUrl}
                        poster={poster}
                        height="700px"
                        autoRotate
                        cameraControls
                    />
                )}

                {/* Stats bar */}
                {stats && stats.length > 0 && (
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 bg-zinc-900/50 rounded-2xl border border-white/5 text-center"
                            >
                                <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Description */}
                {description && (
                    <div className="mt-8 max-w-3xl mx-auto text-center">
                        <p className="text-zinc-400 text-lg leading-relaxed">{description}</p>
                    </div>
                )}
            </div>
        </section>
    );
}
