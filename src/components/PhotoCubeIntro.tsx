'use client';

import { useState, useEffect } from 'react';
import PhotoCube3D from '@/components/sections/PhotoCube3D';

/**
 * Loads Photo Cube 3D settings from the API and renders the cube
 * in "intro" mode as a fullscreen overlay before the page content.
 * Only renders if enabled + mode === 'intro' in admin settings.
 */
export default function PhotoCubeIntro() {
  const [settings, setSettings] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchCubeSettings = async () => {
      try {
        const res = await fetch('/api/photo-cube');
        const data = await res.json();
        if (data.success && data.settings?.enabled && data.settings.mode === 'intro') {
          setSettings(data.settings);
        }
      } catch {
        // silently skip intro if fetch fails
      }
    };
    fetchCubeSettings();
  }, []);

  if (!settings || dismissed) return null;

  return (
    <PhotoCube3D
      images={settings.images || []}
      cubeSize={settings.cube_size}
      imageFit={settings.image_fit}
      rotationSpeed={settings.rotation_speed}
      smoothness={settings.smoothness}
      entrySpeed={settings.entry_speed}
      entryDirection={settings.entry_direction}
      mode="intro"
      backgroundColor={settings.background_color}
      title={settings.title}
      subtitle={settings.subtitle}
      edgeColor={settings.edge_color || '#c8a960'}
      edgeWidth={settings.edge_width ?? 1.5}
      autoRotate={settings.auto_rotate ?? true}
      autoRotateSpeed={settings.auto_rotate_speed ?? 0.15}
      onIntroEnd={() => setDismissed(true)}
    />
  );
}
