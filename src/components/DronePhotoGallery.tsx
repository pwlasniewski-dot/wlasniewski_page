'use client';

import { useRef, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, ArrowRight, Expand } from 'lucide-react';
import ParallaxSection from '@/components/ParallaxSection';
import type { DroneImageItem, DronePortfolioModule } from '@/lib/dronePhotographyOffer';
import styles from './DronePhotoGallery.module.css';

const PhotoLightbox = dynamic(() => import('@/components/PhotoLightbox'), { ssr: false });
export type DroneGalleryPhoto = Omit<DroneImageItem, 'id' | 'url'> & { src: string };

/** Native scroll-snap keeps the photographs visible before hydration and supports touch. */
export default function DronePhotoGallery({ photos, module }: { photos: DroneGalleryPhoto[]; module: DronePortfolioModule }) {
    const rail = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(0);
    const [viewer, setViewer] = useState<number | null>(null);
    const layout = module.layout || 'grid';
    const fit = module.imageFit || 'cover';
    const current = Math.min(active, Math.max(0, photos.length - 1));

    function moveTo(index: number) {
        const container = rail.current;
        if (!container) return;
        const next = Math.min(Math.max(index, 0), photos.length - 1);
        const child = container.children[next] as HTMLElement | undefined;
        if (child) container.scrollTo({ left: child.offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }

    function updateActive() {
        const container = rail.current;
        if (!container) return;
        let closest = 0;
        let distance = Infinity;
        Array.from(container.children).forEach((child, index) => {
            const gap = Math.abs((child as HTMLElement).offsetLeft - container.scrollLeft);
            if (gap < distance) { closest = index; distance = gap; }
        });
        setActive(closest);
    }

    if (!photos.length) return null;
    const openLabel = (photo: DroneGalleryPhoto, index: number) => `Otwórz zdjęcie ${index + 1}: ${photo.caption || photo.alt || 'Fotografia z drona'}`;
    const lightbox = viewer !== null ? <PhotoLightbox open index={viewer} slides={photos} onClose={() => setViewer(null)} onView={setViewer} /> : null;

    if (layout === 'parallax') {
        return <div className={styles.panorama} data-drone-gallery="parallax" style={{ '--photo-position': photos[0].position || 'center', '--photo-mobile-position': photos[0].mobilePosition || photos[0].position || 'center' } as CSSProperties}>
            <ParallaxSection image={photos[0].src} height="min-h-[50vh] md:min-h-[70vh]" overlayOpacity={0.05} floatingImage={module.motion === true} parallaxSpeed={0.35} imageOffset={photos[0].position === 'top' ? 0 : photos[0].position === 'bottom' ? 100 : 50}>
                <button type="button" onClick={() => setViewer(0)} aria-label={openLabel(photos[0], 0)} className={styles.panoramaButton}>
                    <Expand size={18} aria-hidden="true" /> Powiększ zdjęcie
                </button>
            </ParallaxSection>
            {photos[0].caption && <p className={styles.panoramaCaption}>{photos[0].caption}</p>}
            {lightbox}
        </div>;
    }

    return <div className={`${styles.gallery} ${module.motion ? styles.motion : ''}`} data-drone-gallery={layout}>
        <div ref={rail} onScroll={layout === 'carousel' ? updateActive : undefined}
            className={layout === 'carousel' ? styles.rail : layout === 'mosaic' ? styles.mosaic : styles.grid}
            role={layout === 'carousel' ? 'region' : undefined} aria-roledescription={layout === 'carousel' ? 'karuzela' : undefined}
            aria-label={layout === 'carousel' ? module.title : undefined} tabIndex={layout === 'carousel' ? 0 : undefined}
            onKeyDown={layout === 'carousel' ? event => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveTo(current + (event.key === 'ArrowRight' ? 1 : -1)); }
                if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); moveTo(event.key === 'Home' ? 0 : photos.length - 1); }
            } : undefined}>
            {photos.map((photo, index) => <figure key={`${photo.src}-${index}`} className={styles.card}>
                <button type="button" className={styles.imageButton} onClick={() => setViewer(index)} aria-label={openLabel(photo, index)}>
                    <img src={photo.src} alt={photo.alt || 'Zdjęcie wykonane z drona'} loading="lazy" decoding="async"
                        className={styles.photo} style={{ objectFit: fit, '--photo-position': photo.position || 'center', '--photo-mobile-position': photo.mobilePosition || photo.position || 'center' } as CSSProperties} />
                    <span className={styles.expand} aria-hidden="true"><Expand size={18} /></span>
                </button>
                <figcaption className={styles.caption}><span className={styles.number}>{String(index + 1).padStart(2, '0')}</span><span>{photo.caption || ''}</span></figcaption>
            </figure>)}
        </div>
        {layout === 'carousel' && photos.length > 1 && <div className={styles.controls}>
            <span className={styles.progress} aria-live="polite" aria-atomic="true">{String(current + 1).padStart(2, '0')} <span>/ {String(photos.length).padStart(2, '0')}</span></span>
            <div className={styles.track} aria-hidden="true"><span style={{ width: `${100 / photos.length}%`, left: `${current * 100 / photos.length}%` }} /></div>
            <button type="button" className={styles.arrow} aria-label="Poprzedni kadr" disabled={current === 0} onClick={() => moveTo(current - 1)}><ArrowLeft size={22} /></button>
            <button type="button" className={styles.arrow} aria-label="Następny kadr" disabled={current === photos.length - 1} onClick={() => moveTo(current + 1)}><ArrowRight size={22} /></button>
        </div>}
        {lightbox}
    </div>;
}
