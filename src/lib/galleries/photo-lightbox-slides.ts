type GalleryPreviewPhoto = { id: number; file_url?: string | null; thumbnail_url: string | null };

export type GalleryLightboxSlide = {
  src: string;
  alt: string;
  previewOnly: boolean;
  previewUnavailable: boolean;
};

// Never fall back to the public full preview for an unpaid premium photo.
const unavailablePreview = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";

export function galleryLightboxSlides(
  photos: GalleryPreviewPhoto[],
  type: "standard" | "premium",
  paidPhotoIds: number[],
): GalleryLightboxSlide[] {
  const paid = new Set(paidPhotoIds);
  return photos.map((photo) => {
    const previewOnly = type === "premium" && !paid.has(photo.id);
    // The gallery API already supplies these optimized previews (up to 2000px).
    // Never preload full-size JPG downloads; the explicit download action keeps
    // its existing protected endpoint and original quality.
    const previewUrl = previewOnly ? photo.thumbnail_url : photo.file_url || photo.thumbnail_url;
    return {
      src: previewUrl || unavailablePreview,
      alt: `Zdjęcie ${photo.id}`,
      previewOnly,
      previewUnavailable: !previewUrl,
    };
  });
}
