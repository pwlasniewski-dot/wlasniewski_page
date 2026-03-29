
import React from 'react';
import { Metadata } from 'next';
import ThermalSlider from '@/components/ThermalSlider';
import DroneOrderForm from '@/components/DroneOrderForm';
import {
    Zap,
    ShieldCheck,
    Search,
    Droplets,
    Building2,
    Camera,
    Mail,
    ArrowRight
} from 'lucide-react';

import prisma from '@/lib/db/prisma';
import DronContent from './DronContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
    const page = await prisma.page.findFirst({
        where: { slug: { in: ['b2b-dron', 'dron', 'b2b/dron'] } }
    });

    return {
        title: page?.meta_title || 'FOTO-DRON Przemysław Właśniewski | Termowizja Mavic 3 Thermal | Toruń, Bydgoszcz',
        description: page?.meta_description || 'Specjalistyczne usługi dronem: termowizja Mavic 3 Thermal, inspekcje dachów, timeline budowy, koła łowieckie. Profesjonalne raporty B2B w kujawsko-pomorskim. NIP: 8781430365.',
        keywords: page?.meta_keywords ? page.meta_keywords.split(',').map(k => k.trim()) : [
            'Mavic 3 Thermal', 'termowizja dronem toruń', 'inspekcja dachu bydgoszcz',
            'analiza paneli fotowoltaicznych', 'ortofotomapy dron', 'monitoring budowy dron',
            'koła łowieckie termowizja', 'operator UAVO kujawsko-pomorskie'
        ],
        alternates: {
            canonical: 'https://aeroanaliza.pl/dron',
        },
        openGraph: {
            title: 'Inspekcje Termowizyjne Dronem | FOTO-DRON',
            description: 'Termowizja Mavic 3 Thermal — wykrywanie mostków cieplnych, awarii PV, inspekcje dachów. Toruń i kujawsko-pomorskie.',
            url: 'https://aeroanaliza.pl/dron',
            images: [{ url: '/og-b2b.jpg', width: 1200, height: 630 }],
        },
    };
}

export default async function DronePage() {
    const pageData = await prisma.page.findUnique({
        where: { slug: 'dron' }
    });

    let sections = [];
    if (pageData?.sections) {
        try {
            sections = JSON.parse(pageData.sections);
        } catch (e) {
            console.error('Failed to parse drone page sections', e);
        }
    }

    return <DronContent pageData={pageData} sections={sections} />;
}


function ServiceCard({ icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="bg-zinc-900/50 p-8 rounded-2xl border border-white/5 hover:border-yellow-500/30 transition-all group">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-yellow-500 mb-6 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
        </div>
    );
}
