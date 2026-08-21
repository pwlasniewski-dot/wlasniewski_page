'use client';

import ThermalHeroSlider from '@/components/ThermalHeroSlider';

interface ThermalSection {
    id: string;
    category: string;
    description?: string;
    visualImage: string;
    thermalImage: string;
    labelLeft?: string;
    labelRight?: string;
    alignmentStatus?: 'registered' | 'side_by_side_only' | 'pending';
    objectPosition?: string;
    objectPositionMobile?: string;
}

interface ThermalSliderProps {
    visualImage?: string;
    thermalImage?: string;
    labelLeft?: string;
    labelRight?: string;
    sections?: ThermalSection[];
    title?: string;
    switchInterval?: number;
    alignmentStatus?: 'registered' | 'side_by_side_only' | 'pending';
    objectPosition?: string;
    objectPositionMobile?: string;
}

export default function ThermalSlider({ visualImage, thermalImage, labelLeft = 'Obraz rzeczywisty', labelRight = 'Termowizja', sections = [], title, alignmentStatus = 'side_by_side_only', objectPosition, objectPositionMobile }: ThermalSliderProps) {
    const source = sections.length ? sections : [{ id: 'comparison', category: title || 'Porównanie', visualImage: visualImage || '', thermalImage: thermalImage || '', labelLeft, labelRight, alignmentStatus, objectPosition, objectPositionMobile }];
    const valid = source.filter(item => item.visualImage && item.thermalImage);

    if (!valid.length) return <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-zinc-500">Para obrazu rzeczywistego i termicznego nie została jeszcze opublikowana.</div>;

    return <ThermalHeroSlider slides={valid.map(item => ({
        id: item.id,
        category: item.category,
        title: title || item.category,
        description: item.description,
        visualMedia: item.visualImage,
        thermalMedia: item.thermalImage,
        labelLeft: item.labelLeft || labelLeft,
        labelRight: item.labelRight || labelRight,
        alignmentStatus: item.alignmentStatus,
        objectPosition: item.objectPosition,
        objectPositionMobile: item.objectPositionMobile,
    }))} />;
}
