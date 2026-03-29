'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '@/lib/api-config';
import {
  Save,
  Image as ImageIcon,
  Box,
  RotateCcw,
  Zap,
  Monitor,
  Trash2,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';
import PhotoCube3D from '@/components/sections/PhotoCube3D';

interface CubeSettings {
  enabled: boolean;
  mode: 'section' | 'intro';
  cube_size: number;
  image_fit: 'cover' | 'contain';
  rotation_speed: number;
  smoothness: number;
  entry_speed: number;
  entry_direction: 'left' | 'right';
  background_color: string;
  title: string;
  subtitle: string;
  images: string[];
}

const DEFAULT_SETTINGS: CubeSettings = {
  enabled: false,
  mode: 'section',
  cube_size: 280,
  image_fit: 'cover',
  rotation_speed: 0.4,
  smoothness: 0.95,
  entry_speed: 2200,
  entry_direction: 'left',
  background_color: '#ffffff',
  title: '',
  subtitle: '',
  images: [],
};

export default function PhotoCubeAdminPage() {
  const [settings, setSettings] = useState<CubeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch(getApiUrl('photo-cube'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
      } catch {
        // First time — use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(getApiUrl('photo-cube'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Ustawienia kostki zapisane!');
      } else {
        throw new Error(data.error);
      }
    } catch {
      toast.error('Błąd zapisu ustawień');
    } finally {
      setSaving(false);
    }
  };

  // Image management
  const handleAddImages = useCallback(
    (urls: string | string[]) => {
      const newUrls = Array.isArray(urls) ? urls : [urls];
      setSettings((prev) => ({
        ...prev,
        images: [...prev.images, ...newUrls].slice(0, 6), // max 6 faces
      }));
      setShowMediaPicker(false);
    },
    []
  );

  const handleRemoveImage = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const updateField = <K extends keyof CubeSettings>(
    key: K,
    value: CubeSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const FACE_NAMES = ['Przód', 'Tył', 'Prawo', 'Lewo', 'Góra', 'Dół'];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Box className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Kostka 3D</h1>
            <p className="text-zinc-400 text-sm">
              Interaktywna kostka ze zdjęciami na ściankach
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setPreviewKey((k) => k + 1);
              setShowPreview(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" /> Podgląd
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Zapisuję...' : 'Zapisz'}
          </button>
        </div>
      </div>

      {/* Main toggle */}
      <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Aktywna</h3>
            <p className="text-zinc-400 text-sm">
              Włącz/wyłącz kostkę na stronie
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateField('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ─── Display Mode ─────────────────────────────────── */}
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Tryb wyświetlania</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateField('mode', 'section')}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                settings.mode === 'section'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-zinc-600 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <div className="text-2xl mb-1">📦</div>
              <div className="text-sm font-medium">Moduł / Sekcja</div>
              <div className="text-xs text-zinc-500 mt-1">
                Kostka jako element strony
              </div>
            </button>
            <button
              onClick={() => updateField('mode', 'intro')}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                settings.mode === 'intro'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-zinc-600 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <div className="text-2xl mb-1">🎬</div>
              <div className="text-sm font-medium">Intro / Wejście</div>
              <div className="text-xs text-zinc-500 mt-1">
                Pełnoekranowe intro na starcie
              </div>
            </button>
          </div>

          {/* Background color */}
          <div>
            <label className="text-sm text-zinc-400 block mb-1">
              Kolor tła
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.background_color}
                onChange={(e) =>
                  updateField('background_color', e.target.value)
                }
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={settings.background_color}
                onChange={(e) =>
                  updateField('background_color', e.target.value)
                }
                className="bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm flex-1"
              />
            </div>
          </div>

          {/* Title / Subtitle */}
          <div>
            <label className="text-sm text-zinc-400 block mb-1">Tytuł</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="np. Moje Portfolio"
              className="w-full bg-zinc-700 text-white px-3 py-2 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 block mb-1">
              Podtytuł
            </label>
            <input
              type="text"
              value={settings.subtitle}
              onChange={(e) => updateField('subtitle', e.target.value)}
              placeholder="np. Zobacz moje najlepsze kadry"
              className="w-full bg-zinc-700 text-white px-3 py-2 rounded-lg"
            />
          </div>
        </div>

        {/* ─── Size & Fit ──────────────────────────────────── */}
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-semibold">
              Rozmiar i dopasowanie
            </h3>
          </div>

          {/* Cube size slider */}
          <div>
            <label className="text-sm text-zinc-400 flex justify-between">
              <span>Wielkość kostki</span>
              <span className="text-white font-mono">
                {settings.cube_size}px
              </span>
            </label>
            <input
              type="range"
              min={120}
              max={600}
              step={10}
              value={settings.cube_size}
              onChange={(e) =>
                updateField('cube_size', parseInt(e.target.value))
              }
              className="w-full accent-blue-500 mt-1"
            />
            <div className="flex justify-between text-xs text-zinc-600">
              <span>120px</span>
              <span>600px</span>
            </div>
          </div>

          {/* Image fit */}
          <div>
            <label className="text-sm text-zinc-400 block mb-2">
              Dopasowanie zdjęć
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateField('image_fit', 'cover')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  settings.image_fit === 'cover'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-zinc-600 text-zinc-400'
                }`}
              >
                Cover (wypełnij)
              </button>
              <button
                onClick={() => updateField('image_fit', 'contain')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  settings.image_fit === 'contain'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-zinc-600 text-zinc-400'
                }`}
              >
                Contain (cały obraz)
              </button>
            </div>
          </div>

          {/* Entry direction */}
          <div>
            <label className="text-sm text-zinc-400 block mb-2">
              Kierunek wjazdu
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateField('entry_direction', 'left')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  settings.entry_direction === 'left'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-zinc-600 text-zinc-400'
                }`}
              >
                ← Z lewej
              </button>
              <button
                onClick={() => updateField('entry_direction', 'right')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  settings.entry_direction === 'right'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-zinc-600 text-zinc-400'
                }`}
              >
                Z prawej →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Animation Settings ─────────────────────────────── */}
      <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-semibold">Animacja i ruch</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Rotation speed */}
          <div>
            <label className="text-sm text-zinc-400 flex justify-between">
              <span>Szybkość obrotu</span>
              <span className="text-white font-mono">
                {settings.rotation_speed.toFixed(2)}
              </span>
            </label>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.05}
              value={settings.rotation_speed}
              onChange={(e) =>
                updateField('rotation_speed', parseFloat(e.target.value))
              }
              className="w-full accent-yellow-500 mt-1"
            />
            <div className="flex justify-between text-xs text-zinc-600">
              <span>Wolno</span>
              <span>Szybko</span>
            </div>
          </div>

          {/* Smoothness / inertia */}
          <div>
            <label className="text-sm text-zinc-400 flex justify-between">
              <span>Płynność (inercja)</span>
              <span className="text-white font-mono">
                {settings.smoothness.toFixed(2)}
              </span>
            </label>
            <input
              type="range"
              min={0.8}
              max={0.99}
              step={0.01}
              value={settings.smoothness}
              onChange={(e) =>
                updateField('smoothness', parseFloat(e.target.value))
              }
              className="w-full accent-yellow-500 mt-1"
            />
            <div className="flex justify-between text-xs text-zinc-600">
              <span>Gwałtowne</span>
              <span>Płynne</span>
            </div>
          </div>

          {/* Entry speed */}
          <div>
            <label className="text-sm text-zinc-400 flex justify-between">
              <span>Czas wjazdu</span>
              <span className="text-white font-mono">
                {settings.entry_speed}ms
              </span>
            </label>
            <input
              type="range"
              min={800}
              max={5000}
              step={100}
              value={settings.entry_speed}
              onChange={(e) =>
                updateField('entry_speed', parseInt(e.target.value))
              }
              className="w-full accent-yellow-500 mt-1"
            />
            <div className="flex justify-between text-xs text-zinc-600">
              <span>0.8s</span>
              <span>5s</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Images (6 faces) ───────────────────────────────── */}
      <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">
              Zdjęcia na ściankach ({settings.images.length}/6)
            </h3>
          </div>
          {settings.images.length < 6 && (
            <button
              onClick={() => setShowMediaPicker(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
            >
              <ImageIcon className="w-4 h-4" /> Dodaj zdjęcia
            </button>
          )}
        </div>

        {settings.images.length === 0 ? (
          <div
            onClick={() => setShowMediaPicker(true)}
            className="border-2 border-dashed border-zinc-600 rounded-lg p-12 text-center cursor-pointer hover:border-purple-500 transition-colors"
          >
            <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">
              Kliknij aby dodać zdjęcia na ścianki kostki
            </p>
            <p className="text-zinc-600 text-sm mt-1">
              Możesz dodać od 1 do 6 zdjęć
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {settings.images.map((img, i) => (
              <div key={i} className="relative group">
                <div className="aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700">
                  <img
                    src={img}
                    alt={`Ścianka ${FACE_NAMES[i]}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {FACE_NAMES[i]}
                </div>
                <button
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {settings.images.length < 6 && (
              <div
                onClick={() => setShowMediaPicker(true)}
                className="aspect-square border-2 border-dashed border-zinc-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-zinc-600 mb-2" />
                <span className="text-xs text-zinc-500">Dodaj</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Live Preview ───────────────────────────────────── */}
      {showPreview && settings.images.length > 0 && (
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white font-semibold">Podgląd na żywo</h3>
            </div>
            <button
              onClick={() => setPreviewKey((k) => k + 1)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Odtwórz ponownie
            </button>
          </div>
          <div
            className="rounded-lg overflow-hidden flex items-center justify-center"
            style={{
              backgroundColor: settings.background_color,
              minHeight: Math.max(settings.cube_size + 100, 400),
            }}
          >
            <PhotoCube3D
              key={previewKey}
              images={settings.images}
              cubeSize={settings.cube_size}
              imageFit={settings.image_fit}
              rotationSpeed={settings.rotation_speed}
              smoothness={settings.smoothness}
              entrySpeed={settings.entry_speed}
              entryDirection={settings.entry_direction}
              mode="section"
              backgroundColor="transparent"
              title={settings.title}
              subtitle={settings.subtitle}
            />
          </div>
        </div>
      )}

      {/* MediaPicker */}
      {showMediaPicker && (
        <MediaPicker
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(urls) => handleAddImages(urls)}
          multiple={true}
        />
      )}
    </div>
  );
}
