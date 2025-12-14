"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

import Link from "next/link";

type Photo = { src: string; alt?: string; link?: string; linkLabel?: string };

type LightboxGalleryProps = {
  photos: Photo[];
  highlightedIndices?: number[];
  fitMode?: 'cover' | 'blur';
};

export default function LightboxGallery({ photos, highlightedIndices = [], fitMode = 'cover' }: LightboxGalleryProps) {
  const [open, setOpen] = React.useState(false);
  const [idx, setIdx] = React.useState(0);
  const [direction, setDirection] = React.useState<1 | -1>(1);

  const count = photos?.length ?? 0;

  const openAt = (i: number) => {
    if (!photos || photos.length === 0) return;
    setIdx(i);
    setDirection(1);
    setOpen(true);
  };

  const close = () => setOpen(false);

  const goTo = React.useCallback(
    (nextIndex: number, dir: 1 | -1) => {
      if (!count) return;
      const normalized = (nextIndex + count) % count;
      setDirection(dir);
      setIdx(normalized);
    },
    [count]
  );

  const prev = React.useCallback(() => goTo(idx - 1, -1), [goTo, idx]);
  const next = React.useCallback(() => goTo(idx + 1, 1), [goTo, idx]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next]);

  if (!photos || photos.length === 0) return null;

  // Chunking logic
  const chunks: Array<{ type: 'grid' | 'full'; items: Array<{ photo: Photo; globalIndex: number }> }> = [];
  let currentGrid: Array<{ photo: Photo; globalIndex: number }> = [];

  photos.forEach((photo, index) => {
    if (highlightedIndices.includes(index)) {
      // If we have pending grid items, push them first
      if (currentGrid.length > 0) {
        chunks.push({ type: 'grid', items: currentGrid });
        currentGrid = [];
      }
      // Push the full width item
      chunks.push({ type: 'full', items: [{ photo, globalIndex: index }] });
    } else {
      currentGrid.push({ photo, globalIndex: index });
    }
  });
  // Push remaining grid items
  if (currentGrid.length > 0) {
    chunks.push({ type: 'grid', items: currentGrid });
  }

  return (
    <>
      <div className={`space-y-4 md:space-y-8 ${highlightedIndices.length === 0 ? 'p-4' : ''}`}>
        {chunks.map((chunk, chunkIndex) => (
          <div key={chunkIndex}>
            {chunk.type === 'full' ? (
              // Full Width Layout
              <div className="w-full">
                {(() => {
                  const item = chunk.items[0];
                  const photo = item.photo;
                  const isLink = !!photo.link;

                  const Content = (
                    <figure className="relative w-full h-[60vh] md:h-[92vh] overflow-hidden bg-zinc-950">
                      {/* Blur Background for Contain Mode */}
                      <img
                        src={photo.src}
                        alt=""
                        className={`absolute inset-0 w-full h-full object-cover blur-3xl scale-110 transition-opacity duration-500 ${fitMode === 'blur' ? 'opacity-40' : 'opacity-0'}`}
                      />

                      {/* Main Image */}
                      <img
                        src={photo.src}
                        alt={photo.alt ?? ""}
                        className={`relative w-full h-full z-10 shadow-xl transition-transform duration-700 group-hover:scale-[1.02] ${fitMode === 'blur' ? 'object-contain p-0 md:p-4' : 'object-cover'}`}
                      />

                      {/* Title Overlay */}
                      {photo.linkLabel && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                          <h2 className="text-4xl md:text-6xl font-display text-white drop-shadow-2xl tracking-widest uppercase">
                            {photo.linkLabel}
                          </h2>
                          <span className="inline-block mt-4 text-sm tracking-[0.3em] text-white/80 border-b border-white/40 pb-2">
                            ZOBACZ SESJĘ
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 z-15 transition-colors duration-500 pointer-events-none" />
                    </figure>
                  );

                  return isLink ? (
                    <Link href={photo.link!} className="group relative w-full block h-[60vh] md:h-[92vh] cursor-pointer">
                      {Content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAt(item.globalIndex)}
                      className="group relative w-full block h-[60vh] md:h-[92vh] cursor-zoom-in"
                    >
                      {Content}
                    </button>
                  );
                })()}
              </div>
            ) : (
              // Grid Layout
              <div className="columns-1 sm:columns-2 md:columns-3 gap-2 space-y-2 md:gap-4 md:space-y-4">
                {chunk.items.map((item) => (
                  <div key={item.globalIndex} className="break-inside-avoid">
                    <GridCard photo={item.photo} onClick={() => openAt(item.globalIndex)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <div className="relative flex h-full w-full flex-col items-center justify-center px-3 md:px-8" onClick={(e) => e.stopPropagation()}>
              <div className="absolute left-1/2 top-4 z-[110] -translate-x-1/2">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs md:text-sm text-zinc-100 shadow-lg">
                  <span className="font-semibold">{idx + 1}</span>
                  <span className="text-zinc-400">/</span>
                  <span>{count}</span>
                </div>
              </div>

              <div className="relative flex w-full max-w-[96vw] items-center justify-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={idx}
                    className="flex w-full items-center justify-center"
                    initial={{ opacity: 0, x: direction * 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -direction * 40 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <motion.img
                      src={photos[idx].src}
                      alt={photos[idx].alt ?? ""}
                      className="max-h-[92vh] max-w-[96vw] w-auto h-auto object-contain rounded-2xl shadow-2xl select-none"
                      draggable={false}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.25}
                      onDragEnd={(_, info) => {
                        const threshold = 60;
                        if (info.offset.x < -threshold) {
                          next();
                        } else if (info.offset.x > threshold) {
                          prev();
                        }
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {photos[idx].alt && (
                <div className="mt-3 px-4 text-center text-sm text-zinc-300">
                  {photos[idx].alt}
                </div>
              )}

              <button
                type="button"
                onClick={close}
                aria-label="Zamknij"
                className="absolute right-4 top-4 md:right-8 md:top-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-2xl text-zinc-100 shadow-lg hover:bg-black/80 transition"
              >
                ×
              </button>

              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prev();
                    }}
                    aria-label="Poprzednie zdjęcie"
                    className="absolute left-3 md:left-6 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-zinc-100 shadow-lg hover:bg-black/80 transition"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    aria-label="Następne zdjęcie"
                    className="absolute right-3 md:right-6 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-zinc-100 shadow-lg hover:bg-black/80 transition"
                  >
                    ›
                  </button>
                </>
              )}

              {count > 1 && (
                <div className="pointer-events-auto absolute bottom-4 left-1/2 z-[110] flex w-full max-w-4xl -translate-x-1/2 justify-center px-3 md:px-0">
                  <div className="flex max-w-full gap-2 overflow-x-auto rounded-full bg-black/40 px-2 py-2 backdrop-blur-sm">
                    {photos.map((p, i) => {
                      const isActive = i === idx;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => goTo(i, i > idx ? 1 : -1)}
                          className={`relative h-12 w-9 flex-shrink-0 overflow-hidden rounded-xl border transition ${isActive
                            ? "border-zinc-100/80"
                            : "border-transparent opacity-70 hover:opacity-100"
                            }`}
                        >
                          <img
                            src={p.src}
                            alt={p.alt ?? ""}
                            className="h-full w-full object-cover"
                            draggable={false}
                          />
                          {isActive && (
                            <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-zinc-100/80 ring-offset-2 ring-offset-black/40" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

type GridCardProps = {
  photo: Photo;
  onClick: () => void;
};

function GridCard({ photo, onClick }: GridCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left"
    >
      <figure className="relative w-full overflow-hidden rounded-xl bg-zinc-900 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <img
          src={photo.src}
          alt={photo.alt ?? ""}
          loading="lazy"
          className="block w-full h-auto object-contain"
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
      </figure>
    </button>
  );
}
