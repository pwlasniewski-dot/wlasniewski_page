'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Pause, LayoutGrid, BookOpen } from 'lucide-react';

export interface HeroPhoto {
  id: number;
  file_url: string;
  thumbnail_url?: string | null;
  width?: number | null;
  height?: number | null;
}

interface PremiumGalleryHeroProps {
  photos: HeroPhoto[];
  title: string;
  subtitle?: string;
  badge?: string;
  /** ile zdjęć użyć w sliderze (default 8) */
  maxSlides?: number;
  /** ms między slajdami (default 5000) */
  intervalMs?: number;
  /** czy pokazać przełącznik trybu (grid/story) – wymaga onModeChange */
  showModeToggle?: boolean;
  mode?: 'grid' | 'story';
  onModeChange?: (m: 'grid' | 'story') => void;
  onPhotoClick?: (photo: HeroPhoto) => void;
}

/**
 * PREMIUM hero slider: pełnoekranowy, autoplay, crossfade,
 * ze sprawdzonym kadrowaniem jak na stronie głównej (cover + center 30%).
 */
export default function PremiumGalleryHero({
  photos,
  title,
  subtitle,
  badge,
  maxSlides = 8,
  intervalMs = 5000,
  showModeToggle = false,
  mode = 'grid',
  onModeChange,
  onPhotoClick,
}: PremiumGalleryHeroProps) {
  const slides = photos.slice(0, maxSlides);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    if (slides.length === 0) return;
    setIdx((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    if (slides.length === 0) return;
    setIdx((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(next, intervalMs);
    return () => clearInterval(t);
  }, [paused, next, intervalMs, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      style={{ height: 'min(60vh, 500px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides z crossfade i sprawdzonym kadrowaniem */}
      {slides.map((p, i) => {
        const active = i === idx;
        return (
          <div
            key={p.id}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
              active ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={!active}
          >
            <Image
              src={p.file_url}
              alt={`${title} – slajd ${i + 1}`}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover object-top transition-transform duration-[10000ms] ease-linear ${
                active ? 'scale-[1.03]' : 'scale-100'
              }`}
            />
          </div>
        );
      })}

      {/* Gradient overlay dla kontrastu tekstu */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Treść */}
      <div className="relative h-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col justify-end pb-16 md:pb-24">
        {badge && (
          <span className="inline-block self-start text-[10px] tracking-[0.3em] uppercase text-gold-400 bg-black/40 backdrop-blur-sm border border-gold-500/30 px-3 py-1.5 rounded-full mb-4">
            {badge}
          </span>
        )}
        <h1
          className="text-white font-serif text-4xl md:text-6xl lg:text-7xl font-bold leading-tight drop-shadow-2xl"
          style={{ textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg md:text-xl text-zinc-100/90 max-w-2xl drop-shadow-lg">
            {subtitle}
          </p>
        )}

        {/* Sterowanie + kontrolki */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full text-sm border border-white/20 transition-all"
            aria-label={paused ? 'Wznów slajdy' : 'Zatrzymaj slajdy'}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {paused ? 'Wznów' : 'Pauza'}
          </button>

          {showModeToggle && onModeChange && (
            <div className="inline-flex bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1">
              <button
                onClick={() => onModeChange('grid')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all ${
                  mode === 'grid' ? 'bg-white text-black font-semibold' : 'text-white hover:bg-white/10'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Siatka
              </button>
              <button
                onClick={() => onModeChange('story')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all ${
                  mode === 'story' ? 'bg-white text-black font-semibold' : 'text-white hover:bg-white/10'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Opowieść
              </button>
            </div>
          )}

          {onPhotoClick && (
            <button
              onClick={() => onPhotoClick(slides[idx])}
              className="px-5 py-2 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded-full text-sm transition-all shadow-lg"
            >
              Zobacz to zdjęcie
            </button>
          )}
        </div>
      </div>

      {/* Strzałki */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-black/40 hover:bg-gold-500 hover:text-black text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all"
            aria-label="Poprzedni slajd"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-black/40 hover:bg-gold-500 hover:text-black text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all"
            aria-label="Następny slajd"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </>
      )}

      {/* Kropki + licznik */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-10 bg-gold-500' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slajd ${i + 1}`}
              />
            ))}
          </div>
          <span className="text-xs text-white/70 font-mono tabular-nums">
            {String(idx + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Pasek postępu autoplay */}
      {!paused && slides.length > 1 && (
        <div
          key={idx}
          className="absolute bottom-0 left-0 h-0.5 bg-gold-500/80 animate-progress"
          style={{ animationDuration: `${intervalMs}ms` }}
        />
      )}

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress linear forwards;
        }
      `}</style>
    </section>
  );
}

/**
 * Story (kolumnowa opowieść) – pionowo od góry do dołu, kadr po kadrze,
 * naprzemiennie białe/czarne tło dla wyraźnego rytmu.
 */
export function PremiumGalleryStory({
  photos,
  onPhotoClick,
}: {
  photos: HeroPhoto[];
  onPhotoClick?: (photo: HeroPhoto) => void;
}) {
  if (photos.length === 0) return null;

  return (
    <div className="w-full">
      {photos.map((photo, index) => {
        const isLight = index % 2 === 0;
        return (
          <section
            key={photo.id}
            className={`py-14 md:py-20 ${isLight ? 'bg-white text-black' : 'bg-black text-white'}`}
          >
            <div className="max-w-5xl mx-auto px-6 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <span
                  className={`font-mono text-xs tracking-[0.4em] uppercase ${
                    isLight ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Kadr {String(index + 1).padStart(2, '0')}
                </span>
                <div className={`h-px flex-1 ${isLight ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
              </div>

              <button
                onClick={() => onPhotoClick?.(photo)}
                className={`group relative w-full rounded-xl overflow-hidden border ${
                  isLight ? 'border-zinc-200' : 'border-zinc-800'
                }`}
              >
                {(() => {
                  const isPortrait = photo.width && photo.height && photo.height > photo.width;
                  if (isPortrait) {
                    return (
                      <div className="relative w-full flex items-center justify-center py-8">
                        <Image
                          src={photo.file_url}
                          alt={`Kadr ${index + 1}`}
                          width={photo.width || 800}
                          height={photo.height || 1200}
                          className="w-auto max-w-full h-auto max-h-[70vh] object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      </div>
                    );
                  }
                  return (
                    <div className="relative w-full aspect-[3/2]">
                      <Image
                        src={photo.file_url}
                        alt={`Kadr ${index + 1}`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 1024px"
                        className="object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                  );
                })()}
              </button>

              <div className="flex justify-end">
                <button
                  onClick={() => onPhotoClick?.(photo)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold ${
                    isLight ? 'bg-zinc-900 text-white hover:bg-black' : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  Otwórz podgląd
                </button>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
