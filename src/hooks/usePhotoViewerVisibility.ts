'use client';

import { useEffect, useState } from 'react';

export function usePhotoViewerVisibility() {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const update = () => setOpen(document.documentElement.dataset.photoViewerOpen === 'true');
        update();
        window.addEventListener('photo-viewer-visibility', update);
        return () => window.removeEventListener('photo-viewer-visibility', update);
    }, []);
    return open;
}
