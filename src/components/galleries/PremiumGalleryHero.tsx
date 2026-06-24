'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, LayoutGrid, BookOpen, Check } from 'lucide-react';

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
  limitReached?: boolean;
  onLimitReached?: (photoId: number) => void;
  extraSelectedPhotoIds?: Set<number>;
  paidExtraPhotoIds?: Set<number>;
}

/**
 * PREMIUM hero slider: pełnoekranowy, autoplay, crossfade,
 * ze sprawdzonym kadrowaniem jak na stronie głównej (cover + center 30%).
 * Na PC filtrujemy zdjęcia pionowe z hero.
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
  selectedPhotoIds,
  onToggleSelect,
  limitReached,
  onLimitReached,
  extraSelectedPhotoIds,
  paidExtraPhotoIds,
}: PremiumGalleryHeroProps) {
  // Detect desktop vs mobile
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);
  
  // Na PC: filtruj pionowe zdjęcia (portrait = height > width)
  // Na mobile: pokaż wszystkie
  const filteredPhotos = isDesktop
    ? photos.filter(p => {
        if (!p.width || !p.height) return true; // brak danych = include
        return p.width >= p.height; // tylko landscape lub square
      })
    : photos;
  
  // Fallback: jeśli po filtracji nie ma nic, użyj oryginalnych
  const slides = (filteredPhotos.length > 0 ? filteredPhotos : photos).slice(0, maxSlides);
  const desktopAllPortrait = isDesktop && slides.length > 0 && slides.every((p) => {
    if (!p.width || !p.height) return false;
    return p.height > p.width;
  });
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
      style={{ height: '90vh', minHeight: '600px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides z crossfade i smart orientation-aware framing */}
      {slides.map((p, i) => {
        const active = i === idx;
        const bgSource = slides[(i + 1) % slides.length] || p;
        // Detect portrait orientation to prevent head cropping
        const isPortrait = p.width && p.height && p.height > p.width;
        const bgPosition = isPortrait ? 'center top' : 'center 30%';
        const transformOrigin = isPortrait ? 'center top' : 'center 30%';
        
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: active ? 1 : 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full overflow-hidden"
          >
            {desktopAllPortrait ? (
              <>
                <motion.div
                  className="absolute inset-0 w-full h-full bg-cover bg-center"
                  initial={{ scale: 1.08 }}
                  animate={active ? { scale: 1.14 } : { scale: 1.08 }}
                  transition={{ duration: 12, ease: 'linear', repeat: 0 }}
                  style={{
                    backgroundImage: `url("${bgSource.file_url}")`,
                    filter: 'blur(20px) brightness(0.55) saturate(1.05)',
                    transformOrigin: 'center center'
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center p-6 md:p-10">
                  <motion.div
                    className="relative w-full h-full max-w-[720px]"
                    initial={{ scale: 1 }}
                    animate={active ? { scale: 1.015 } : { scale: 1 }}
                    transition={{ duration: 10, ease: 'linear', repeat: 0 }}
                  >
                    <Image
                      src={p.file_url}
                      alt="Zdjęcie hero"
                      fill
                      priority={i === 0}
                      className="object-contain drop-shadow-[0_16px_45px_rgba(0,0,0,0.6)]"
                      sizes="(max-width: 768px) 100vw, 70vw"
                    />
                  </motion.div>
                </div>
              </>
            ) : (
              <motion.div
                className="w-full h-full bg-cover bg-no-repeat"
                initial={{ scale: 1 }}
                animate={active ? { scale: 1.02 } : { scale: 1 }}
                transition={{
                  duration: 15,
                  ease: "linear",
                  repeat: 0
                }}
                style={{
                  backgroundImage: `url("${p.file_url}")`,
                  backgroundPosition: bgPosition,
                  transformOrigin: transformOrigin
                }}
              />
            )}
          </motion.div>
        );
      })}

      {/* Gradient overlay dla kontrastu tekstu */}
      <div className="absolute inset-0 bg-black/20 z-10" />
      <div className="absolute bottom-0 left-0 w-full h-[60vh] bg-gradient-to-t from-black via-black/80 to-transparent z-10" />

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
          {onToggleSelect && (() => {
            const isSel = selectedPhotoIds?.has(slides[idx].id) || false;
            const isInExtras = extraSelectedPhotoIds?.has(slides[idx].id) || false;
            const isPaid = paidExtraPhotoIds?.has(slides[idx].id) || false;
            const isBlocked = !isSel && limitReached;
            return (
              <button
                onClick={() => {
                  if (isBlocked) { onLimitReached?.(slides[idx].id); return; }
                  onToggleSelect(slides[idx]);
                }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-lg flex items-center gap-2 ${
                  isSel ? 'bg-zinc-900 text-white border border-gold-500'
                  : isInExtras ? 'bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer'
                  : isBlocked ? 'bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer'
                  : 'bg-white text-black hover:bg-zinc-100'
                }`}
                title={isInExtras ? 'Kliknij aby usunąć z koszyka' : isBlocked ? 'Kup dodatkową odbitkę' : isPaid ? 'Kupione wcześniej — możesz zamówić ponownie' : undefined}
              >
                <Check className="w-4 h-4" />
                {isSel ? 'Odznacz do druku' : isInExtras ? 'Wybór płatny ✓' : isBlocked ? '🛒 Dodaj do koszyka' : 'Zaznacz do druku'}
              </button>
            );
          })()}
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
  selectedPhotoIds,
  onToggleSelect,
  onPhotoClick,
  limitReached,
  onLimitReached,
  extraSelectedPhotoIds,
  paidExtraPhotoIds,
}: {
  photos: HeroPhoto[];
  selectedPhotoIds?: Set<number>;
  onToggleSelect?: (photo: HeroPhoto) => void;
  onPhotoClick?: (photo: HeroPhoto) => void;
  limitReached?: boolean;
  onLimitReached?: (photoId: number) => void;
  extraSelectedPhotoIds?: Set<number>;
  paidExtraPhotoIds?: Set<number>;
}) {
  if (photos.length === 0) return null;

  return (
    <div className="w-full overflow-x-hidden">
      {photos.map((photo, index) => {
        const isLight = index % 2 === 0;
        const isSelected = selectedPhotoIds?.has(photo.id) || false;
        const isInExtras = extraSelectedPhotoIds?.has(photo.id) || false;
        const isPaid = paidExtraPhotoIds?.has(photo.id) || false;
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

              <div
                role="button"
                tabIndex={0}
                onClick={() => onPhotoClick?.(photo)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPhotoClick?.(photo);
                  }
                }}
                className={`group relative w-full rounded-xl overflow-hidden border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
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
              </div>

              <div className="flex items-center justify-between gap-3">
                {onToggleSelect && (() => {
                  const isBlocked = !isSelected && limitReached;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (isBlocked) {
                          onLimitReached?.(photo.id);
                          return;
                        }
                        onToggleSelect(photo);
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        isSelected
                          ? 'bg-gold-500 text-black'
                          : isInExtras
                              ? 'bg-emerald-500 text-black'
                              : isBlocked
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                                : (isLight ? 'bg-zinc-900 text-white hover:bg-black' : 'bg-white text-black hover:bg-zinc-100')
                      }`}
                      title={isSelected ? 'Odznacz do druku' : isInExtras ? 'Kliknij aby usunąć z koszyka' : isBlocked ? 'Kup dodatkową odbitkę' : isPaid ? 'Kupione wcześniej — możesz zamówić ponownie' : 'Zaznacz do druku'}
                    >
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Odznacz</span>
                      ) : isInExtras ? (
                        <span className="inline-flex items-center gap-1">✓ Wybór płatny</span>
                      ) : isBlocked ? (
                        <span className="inline-flex items-center gap-1">🛒 Dodaj do koszyka</span>
                      ) : (
                        'Do druku'
                      )}
                    </button>
                  );
                })()}
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
