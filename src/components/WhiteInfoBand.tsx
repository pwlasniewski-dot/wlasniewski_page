"use client";

import {
    Building2, Factory, Warehouse, Truck, Plane, Ship,
    HardHat, Zap, ShieldCheck, Crosshair, Thermometer,
    Activity, Gauge, Globe, MapPin, Camera, Workflow,
    Cpu, Layers, Trees, Box, Construction, Hammer,
    Layout, ArrowRight
} from "lucide-react";
import Link from 'next/link';

const IconMap: Record<string, any> = {
    Building2, Factory, Warehouse, Truck, Plane, Ship,
    HardHat, Zap, ShieldCheck, Crosshair, Thermometer,
    Activity, Gauge, Globe, MapPin, Camera, Workflow,
    Cpu, Layers, Trees, Box, Construction, Hammer
};

interface InfoBandItem {
    id: string;
    title: string;
    description: string;
    icon?: string;
    image?: string;
    link?: string;
}

interface WhiteInfoBandProps {
    image?: string;
    title?: string;
    subtitle?: string;
    content?: string;
    items?: InfoBandItem[];
    imagePosition?: 'left' | 'right' | 'center';
}

export default function WhiteInfoBand({ image, title, subtitle, content, items, imagePosition }: WhiteInfoBandProps) {
    const plainTitle = (title || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const demoteTitle = plainTitle.length > 110 || plainTitle.split(' ').filter(Boolean).length > 16;

    return (
        <section className="bg-white py-24 px-6 relative overflow-hidden">
            {/* Subtle architectural background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

            <div className="max-w-7xl mx-auto relative z-10">
                {(title || subtitle) && (
                    <div className="mb-20">
                        {subtitle && (
                            <span className="inline-block px-3 py-1 bg-zinc-100 border border-zinc-200 rounded text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                                {subtitle}
                            </span>
                        )}
                        {demoteTitle ? (
                            <p className="text-4xl md:text-6xl font-bold text-zinc-950 tracking-tight leading-none"
                                dangerouslySetInnerHTML={{ __html: title || 'Infrastruktura i <span class="text-yellow-600">logistyka</span>' }}
                            />
                        ) : (
                            <h2 className="text-4xl md:text-6xl font-bold text-zinc-950 tracking-tight leading-none"
                                dangerouslySetInnerHTML={{ __html: title || 'Infrastruktura i <span class="text-yellow-600">logistyka</span>' }}
                            />
                        )}
                        <div className="h-1.5 w-20 bg-yellow-500 mt-8 rounded-full" />
                    </div>
                )}

                {items && items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                        {items.map((item, idx) => {
                            const IconComponent = item.icon ? IconMap[item.icon] : null;

                            return (
                                <div key={item.id || idx} className="group">
                                    <div className="mb-8 relative">
                                        {item.image ? (
                                            <div className="aspect-video rounded-3xl overflow-hidden border border-zinc-100 shadow-sm transition-transform duration-500 group-hover:scale-[1.02]">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-900 shadow-sm transition-all duration-500 group-hover:bg-yellow-500 group-hover:border-yellow-500 group-hover:scale-110">
                                                {IconComponent ? <IconComponent size={32} strokeWidth={1.5} /> : <Zap size={32} />}
                                            </div>
                                        )}
                                        {/* Decorative line */}
                                        <div className="absolute -bottom-4 left-0 w-0 h-px bg-yellow-500 transition-all duration-500 group-hover:w-full" />
                                    </div>

                                    <h3 className="text-xl font-bold text-zinc-900 mb-4 group-hover:text-yellow-600 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                                        {item.description}
                                    </p>

                                    {item.link ? (
                                        <Link href={item.link} className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-zinc-900 transition-colors">
                                            Szczegóły operacyjne <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-20 items-center ${imagePosition === 'right' ? '' : ''}`}>
                        <div className={`relative aspect-square md:aspect-video rounded-[40px] overflow-hidden shadow-2xl border border-zinc-100 ${imagePosition === 'right' ? 'md:order-2' : ''}`}>
                            {image ? (
                                <img src={image} alt={title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                                    <Layout size={64} className="text-zinc-200" />
                                </div>
                            )}
                        </div>
                        <div className={imagePosition === 'right' ? 'md:order-1' : ''}>
                            <div className="prose prose-zinc prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: content || '' }} />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
