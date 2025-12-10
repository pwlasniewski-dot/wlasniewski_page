// Effect Wrapper - Fetches and displays configured visual effect
'use client';

import { useEffect, useState } from 'react';
import CarouselGallery from './CarouselGallery';
import MasonryGallery from './MasonryGallery';

interface EffectWrapperProps {
    pageSlug: string;
    sectionName: string;
    defaultPhotos?: string[] | Array<{
        url: string;
        alt?: string;
        caption?: string;
    }>;
}

export default function EffectWrapper({ pageSlug, sectionName, defaultPhotos = [] }: EffectWrapperProps) {
    const [effect, setEffect] = useState<any>(null);
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEffect();
    }, [pageSlug, sectionName]);

    const fetchEffect = async () => {
        try {
            const res = await fetch(`/api/effects?page=${pageSlug}&section=${sectionName}`);
            const data = await res.json();

            if (data.success && data.effects.length > 0) {
                const activeEffect = data.effects[0];
                setEffect(activeEffect);

                // Parse photos from manual_photos if available
                if (activeEffect.manual_photos) {
                    try {
                        const parsedPhotos = JSON.parse(activeEffect.manual_photos);
                        setPhotos(normalizePhotos(parsedPhotos));
                    } catch (e) {
                        console.error('Failed to parse manual_photos');
                        setPhotos(normalizePhotos(defaultPhotos));
                    }
                } else {
                    setPhotos(normalizePhotos(defaultPhotos));
                }
            } else {
                // No effect configured, use default photos with default effect type
                setPhotos(normalizePhotos(defaultPhotos));
                setEffect({ effect_type: 'carousel', is_enabled: true });
            }
        } catch (error) {
            console.error('Failed to fetch effect:', error);
            // On error, use defaults
            setPhotos(normalizePhotos(defaultPhotos));
            setEffect({ effect_type: 'carousel', is_enabled: true });
        } finally {
            setLoading(false);
        }
    };

    // Normalize photos to consistent format
    const normalizePhotos = (photoList: any[]): Array<{ url: string; alt?: string; caption?: string }> => {
        if (!photoList || photoList.length === 0) return [];

        return photoList.map((photo: any) => {
            if (typeof photo === 'string') {
                return { url: photo, alt: '', caption: '' };
            }
            return photo;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-400"></div>
            </div>
        );
    }

    // If no photos available at all, return null
    if (!photos || photos.length === 0) {
        return null;
    }

    // If effect is disabled, return null
    if (effect && !effect.is_enabled) {
        return null;
    }

    // Parse config
    let config = {};
    if (effect?.config) {
        try {
            config = JSON.parse(effect.config);
        } catch (e) {
            console.error('Failed to parse config');
        }
    }

    // Determine effect type (default to carousel if none specified)
    const effectType = effect?.effect_type || 'carousel';

    // Render appropriate effect
    switch (effectType) {
        case 'carousel':
            return <CarouselGallery photos={photos} config={config} />;

        case 'masonry':
            return <MasonryGallery photos={photos} config={config} />;

        case 'orbiting3d':
            // TODO: Implement 3D orbiting
            return <div className="text-center py-12 text-gold-400">3D Orbiting (wkrótce)</div>;

        case 'parallax':
            // TODO: Implement parallax
            return <div className="text-center py-12 text-gold-400">Parallax (wkrótce)</div>;

        case 'none':
            return null;

        default:
            // Default to carousel for unknown types
            return <CarouselGallery photos={photos} config={config} />;
    }
}
