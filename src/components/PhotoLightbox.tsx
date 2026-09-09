"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Lightbox, { type SlideImage } from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import { ZoomIn, ZoomOut } from "lucide-react";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "./PhotoLightbox.css";

const activeViewers = new Set<symbol>();
const plugins = [Zoom, Counter];

type PhotoLightboxProps = {
  open: boolean;
  index: number;
  slides: SlideImage[];
  onClose: () => void;
  onView: (index: number) => void;
  actions?: ReactNode;
};

function PhotoActions({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    const viewer = element?.closest<HTMLElement>(".photo-viewer");
    if (!element || !viewer) return;
    const resize = () => viewer.style.setProperty("--photo-viewer-bottom", `${element.getBoundingClientRect().height}px`);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => {
      observer.disconnect();
      viewer.style.removeProperty("--photo-viewer-bottom");
    };
  }, []);
  return (
    <div
      ref={ref}
      className="photo-viewer__actions"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  );
}

/** Shared viewer. Callers retain control of photo access and selection actions. */
export default function PhotoLightbox({ open, index, slides, onClose, onView, actions }: PhotoLightboxProps) {
  const visible = open && slides.length > 0;

  useEffect(() => {
    if (!visible) return;
    const viewer = Symbol("photo-viewer");
    activeViewers.add(viewer);
    document.documentElement.dataset.photoViewerOpen = "true";
    window.dispatchEvent(new CustomEvent("photo-viewer-visibility", { detail: true }));
    return () => {
      activeViewers.delete(viewer);
      if (activeViewers.size === 0) {
        delete document.documentElement.dataset.photoViewerOpen;
        window.dispatchEvent(new CustomEvent("photo-viewer-visibility", { detail: false }));
      }
    };
  }, [visible]);

  return (
    <Lightbox
      open={visible}
      index={index}
      slides={slides}
      close={onClose}
      on={{ view: ({ index: nextIndex }) => onView(nextIndex) }}
      plugins={plugins}
      className={`photo-viewer${actions ? " photo-viewer--with-actions" : ""}`}
      carousel={{ preload: 1, padding: 0, spacing: 16, imageFit: "contain" }}
      animation={{ fade: 160, swipe: 240, navigation: 200, zoom: 200 }}
      controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
      zoom={{ maxZoomPixelRatio: 2, scrollToZoom: true }}
      counter={{ container: { "aria-live": "polite", "aria-atomic": true } }}
      labels={{
        Previous: "Poprzednie zdjęcie",
        Next: "Następne zdjęcie",
        Close: "Zamknij podgląd",
        "Zoom in": "Powiększ zdjęcie",
        "Zoom out": "Dopasuj zdjęcie",
        Lightbox: "Podgląd zdjęć",
        Carousel: "Galeria",
        "Photo gallery": "Galeria zdjęć",
        Slide: "Zdjęcie",
        "{index} of {total}": "Zdjęcie {index} z {total}",
      }}
      render={{
        buttonPrev: slides.length < 2 ? () => null : undefined,
        buttonNext: slides.length < 2 ? () => null : undefined,
        buttonZoom: ({ zoom, minZoom, disabled, zoomIn, changeZoom }) => (
          <button
            type="button"
            className="yarl__button"
            disabled={disabled}
            aria-label={zoom > minZoom ? "Dopasuj zdjęcie" : "Powiększ zdjęcie"}
            onClick={() => zoom > minZoom ? changeZoom(minZoom) : zoomIn()}
          >
            {zoom > minZoom ? <ZoomOut size={22} /> : <ZoomIn size={22} />}
          </button>
        ),
        controls: actions ? () => <PhotoActions>{actions}</PhotoActions> : undefined,
      }}
    />
  );
}
