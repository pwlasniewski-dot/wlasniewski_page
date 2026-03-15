'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, RotateCw, ZoomIn, X, Box, Layers } from 'lucide-react';

interface ModelViewer3DProps {
    src: string;
    poster?: string;
    title?: string;
    description?: string;
    autoRotate?: boolean;
    cameraControls?: boolean;
    backgroundColor?: string;
    height?: string;
    showControls?: boolean;
    environmentImage?: string;
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                src?: string;
                poster?: string;
                alt?: string;
                'auto-rotate'?: boolean | string;
                'camera-controls'?: boolean | string;
                'camera-target'?: string;
                'min-camera-orbit'?: string;
                'max-camera-orbit'?: string;
                'shadow-intensity'?: string;
                'environment-image'?: string;
                exposure?: string;
                loading?: string;
                'interaction-prompt'?: string;
                'touch-action'?: string;
                'disable-pan'?: boolean | string;
                ref?: React.Ref<any>;
            };
        }
    }
}

export default function ModelViewer3D({
    src,
    poster,
    title,
    description,
    autoRotate = false,
    cameraControls = true,
    backgroundColor = '#0a0a0a',
    height = '600px',
    showControls = true,
    environmentImage
}: ModelViewer3DProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isRotating, setIsRotating] = useState(autoRotate);
    const [isLoaded, setIsLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const modelRef = useRef<any>(null);

    const resolvedSrc = (() => {
        if (!src) return '';
        if (src.includes('.s3.') && src.includes('amazonaws.com')) {
            return `/api/media/proxy?url=${encodeURIComponent(src)}`;
        }
        return src;
    })();

    useEffect(() => {
        if (typeof window !== 'undefined' && !customElements.get('model-viewer')) {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
            document.head.appendChild(script);
        }
    }, []);

    const setupRef = useCallback((el: any) => {
        if (!el) return;
        modelRef.current = el;
        el.addEventListener('load', () => setIsLoaded(true));

        // WebODM GLB = Z-up. model-viewer = Y-up.
        // Wymuszamy orientację + stały kąt pionowy kamery,
        // żeby drag lewo/prawo obracał wyłącznie wokół osi pionowej.
        const apply = () => {
            try {
                // Obrót modelu: +90° wokół X (poprawka względem poprzedniego ustawienia)
                el.orientation = '90deg 0deg 0deg';
                // Kamera: stały kąt pionowy => brak efektu "koła samochodu"
                el.cameraOrbit = '0deg 45deg 105%';
                el.minCameraOrbit = 'auto 45deg auto';
                el.maxCameraOrbit = 'Infinity 45deg 300%';
                el.cameraTarget = 'auto auto auto';
            } catch (e) {
                console.warn('[ModelViewer3D] setup failed:', e);
            }
        };

        if (customElements.get('model-viewer')) {
            if (el.updateComplete) {
                el.updateComplete.then(apply);
            } else {
                apply();
            }
        } else {
            customElements.whenDefined('model-viewer').then(() => {
                if (el.updateComplete) {
                    el.updateComplete.then(apply);
                } else {
                    apply();
                }
            });
        }

        if (!el.__potteryWheelLockAttached) {
            const lockPolarAngle = () => {
                if (!el.getCameraOrbit) return;
                const orbit = el.getCameraOrbit();
                const theta = orbit?.theta?.toString?.() || '0deg';
                const radius = orbit?.radius?.toString?.() || '105%';
                el.cameraOrbit = `${theta} 45deg ${radius}`;
            };
            el.addEventListener('camera-change', lockPolarAngle);
            el.__potteryWheelLockAttached = true;
        }
    }, []);

    const toggleFullscreen = () => {
        if (!isFullscreen && containerRef.current) {
            containerRef.current.requestFullscreen?.();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const h = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', h);
        return () => document.removeEventListener('fullscreenchange', h);
    }, []);

    const toggleRotation = () => {
        const mv = modelRef.current;
        if (mv) {
            if (isRotating) mv.removeAttribute('auto-rotate');
            else mv.setAttribute('auto-rotate', '');
            setIsRotating(!isRotating);
        }
    };

    const resetCamera = () => {
        const mv = modelRef.current;
        if (mv) {
            mv.cameraOrbit = '0deg 45deg 105%';
            mv.fieldOfView = 'auto';
            mv.jumpCameraToGoal?.();
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative group rounded-2xl overflow-hidden border border-white/10"
            style={{ height, backgroundColor }}
        >
            {!isLoaded && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950">
                    <div className="relative">
                        <div className="w-16 h-16 border-2 border-yellow-500/20 rounded-full animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Box className="w-6 h-6 text-yellow-500 animate-spin" />
                        </div>
                    </div>
                    <p className="mt-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                        Ładowanie modelu 3D...
                    </p>
                </div>
            )}

            <model-viewer
                ref={setupRef}
                src={resolvedSrc}
                poster={poster}
                alt={title || 'Model 3D'}
                auto-rotate={isRotating ? '' : undefined}
                camera-controls={cameraControls ? '' : undefined}
                disable-pan
                camera-target="auto auto auto"
                min-camera-orbit="auto 45deg auto"
                max-camera-orbit="Infinity 45deg 300%"
                shadow-intensity="0.3"
                exposure="1"
                environment-image="neutral"
                interaction-prompt="auto"
                touch-action="none"
                loading="eager"
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'transparent',
                    outline: 'none',
                }}
            />

            {(title || description) && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none">
                    {title && <h3 className="text-xl font-bold text-white mb-1">{title}</h3>}
                    {description && <p className="text-sm text-zinc-400">{description}</p>}
                </div>
            )}

            {showControls && (
                <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={toggleRotation}
                        className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${isRotating
                            ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-500'
                            : 'bg-black/50 border-white/10 text-white hover:border-yellow-500/30'}`}
                        title={isRotating ? 'Zatrzymaj obrót' : 'Rozpocznij obrót'}
                    >
                        <RotateCw size={16} className={isRotating ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={resetCamera}
                        className="p-2.5 bg-black/50 rounded-xl border border-white/10 text-white hover:border-yellow-500/30 backdrop-blur-md transition-all"
                        title="Resetuj kamerę"
                    >
                        <ZoomIn size={16} />
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-2.5 bg-black/50 rounded-xl border border-white/10 text-white hover:border-yellow-500/30 backdrop-blur-md transition-all"
                        title="Pełny ekran"
                    >
                        {isFullscreen ? <X size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            )}

            <div className="absolute top-4 left-4 z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <Layers size={12} className="text-yellow-500" />
                    Model 3D
                </div>
            </div>

            <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[10px] text-zinc-500">
                    Kliknij i przeciągnij aby obrócić • Scroll aby przybliżyć
                </div>
            </div>
        </div>
    );
}
