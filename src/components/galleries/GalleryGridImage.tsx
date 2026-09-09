import React from 'react';

type GalleryGridImageProps = {
    src: string;
    alt: string;
    width?: number | null;
    height?: number | null;
    className?: string;
};

/** Reserve the final box before lazy loading; missing metadata must not collapse it. */
export default function GalleryGridImage({ src, alt, width, height, className = '' }: GalleryGridImageProps) {
    const validDimensions = Number.isFinite(width) && Number.isFinite(height) && (width ?? 0) > 0 && (height ?? 0) > 0;
    const reservedWidth = validDimensions ? width! : 1500;
    const reservedHeight = validDimensions ? height! : 1000;
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            width={reservedWidth}
            height={reservedHeight}
            style={{ aspectRatio: `${reservedWidth} / ${reservedHeight}` }}
            loading="lazy"
            decoding="async"
            className={`block w-full h-auto object-contain ${className}`}
        />
    );
}
