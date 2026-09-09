"use client";

import React from "react";
import PhotoLightbox from "@/components/PhotoLightbox";

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

  const slides = React.useMemo(() => photos.map((photo) => ({ src: photo.src, alt: photo.alt })), [photos]);

  const openAt = (i: number) => {
    if (!photos || photos.length === 0) return;
    setIdx(i);
    setOpen(true);
  };

  const close = () => setOpen(false);

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
                        alt={photo.alt || photo.linkLabel || "Zdjęcie z portfolio"}
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

      <PhotoLightbox
        open={open}
        index={idx}
        slides={slides}
        onClose={close}
        onView={setIdx}
      />
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
