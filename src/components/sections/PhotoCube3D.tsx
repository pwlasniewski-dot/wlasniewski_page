'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────
export interface PhotoCube3DProps {
  images: string[];               // 1-6 URLs for each face
  cubeSize?: number;              // px – edge length  (default 280)
  imageFit?: 'cover' | 'contain'; // how photos fill faces
  rotationSpeed?: number;         // drag sensitivity 0.1-2  (default 0.4)
  smoothness?: number;            // inertia damping 0.85-0.99 (default 0.95)
  entrySpeed?: number;            // roll-in duration in ms (default 2200)
  entryDirection?: 'left' | 'right'; // which side cube enters from
  mode?: 'section' | 'intro';    // section = inline module; intro = fullscreen overlay
  backgroundColor?: string;       // wrapper bg
  title?: string;
  subtitle?: string;
  onIntroEnd?: () => void;        // called after intro mode animation finishes
}

// Face order: front, back, right, left, top, bottom
const FACE_LABELS = ['front', 'back', 'right', 'left', 'top', 'bottom'] as const;

// ─── Component ────────────────────────────────────────────────────
export default function PhotoCube3D({
  images = [],
  cubeSize = 280,
  imageFit = 'cover',
  rotationSpeed = 0.4,
  smoothness = 0.95,
  entrySpeed = 2200,
  entryDirection = 'left',
  mode = 'section',
  backgroundColor = '#ffffff',
  title,
  subtitle,
  onIntroEnd,
}: PhotoCube3DProps) {
  // ── refs & state ──────────────────────────────────────────────
  const sceneRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: -25, y: 35 }); // starting angle

  const [phase, setPhase] = useState<'rolling' | 'interactive'>('rolling');
  const [introVisible, setIntroVisible] = useState(mode === 'intro');
  const [cubeTransform, setCubeTransform] = useState('');

  // Pad images array to 6 (repeat or leave empty)
  const faces = FACE_LABELS.map((_, i) => images[i % images.length] || '');

  const half = cubeSize / 2;

  // ── Face transforms ───────────────────────────────────────────
  const faceTransforms: Record<string, string> = {
    front:  `rotateY(0deg)   translateZ(${half}px)`,
    back:   `rotateY(180deg) translateZ(${half}px)`,
    right:  `rotateY(90deg)  translateZ(${half}px)`,
    left:   `rotateY(-90deg) translateZ(${half}px)`,
    top:    `rotateX(90deg)  translateZ(${half}px)`,
    bottom: `rotateX(-90deg) translateZ(${half}px)`,
  };

  // ── Rolling entry animation ───────────────────────────────────
  useEffect(() => {
    if (phase !== 'rolling') return;

    const start = performance.now();
    const totalRoll = 720; // degrees rolled during entry
    const fromX = entryDirection === 'left' ? -120 : 120; // % off-screen

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / entrySpeed, 1);

      // easeOutCubic
      const ease = 1 - Math.pow(1 - t, 3);

      const translateX = fromX * (1 - ease); // slides to 0
      const rollAngle = totalRoll * ease;

      // rolling on surface: rotate around Z + slight X wobble
      const rx = -20 + Math.sin(t * Math.PI * 2) * 8;
      const ry = rollAngle;
      const rz = entryDirection === 'left' ? -rollAngle * 0.3 : rollAngle * 0.3;

      setCubeTransform(
        `translateX(${translateX}vw) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`
      );

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Settle into resting pose
        rotation.current = { x: rx, y: ry % 360 };
        setPhase('interactive');
        if (mode === 'intro') {
          // Keep intro visible for a moment then fade out
          setTimeout(() => {
            setIntroVisible(false);
            onIntroEnd?.();
          }, 800);
        }
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Interactive inertia loop ──────────────────────────────────
  useEffect(() => {
    if (phase !== 'interactive') return;

    const loop = () => {
      if (!dragging.current) {
        velocity.current.x *= smoothness;
        velocity.current.y *= smoothness;
        rotation.current.x += velocity.current.y;
        rotation.current.y += velocity.current.x;
      }

      setCubeTransform(
        `rotateX(${rotation.current.x}deg) rotateY(${rotation.current.y}deg)`
      );
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, smoothness]);

  // ── Pointer handlers ──────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== 'interactive') return;
    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [phase]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = (e.clientX - lastPointer.current.x) * rotationSpeed;
    const dy = (e.clientY - lastPointer.current.y) * rotationSpeed;

    rotation.current.y += dx;
    rotation.current.x -= dy;
    velocity.current = { x: dx, y: -dy };
    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, [rotationSpeed]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // ── Touch support (prevents scroll while dragging) ────────────
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => {
      if (dragging.current) e.preventDefault();
    };
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, []);

  // ── Render ────────────────────────────────────────────────────
  const cubeJSX = (
    <div
      ref={sceneRef}
      className="relative select-none"
      style={{
        width: cubeSize,
        height: cubeSize,
        perspective: cubeSize * 3,
        cursor: phase === 'interactive' ? 'grab' : 'default',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        ref={cubeRef}
        style={{
          width: cubeSize,
          height: cubeSize,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: cubeTransform,
          transition: phase === 'interactive' ? 'none' : undefined,
        }}
      >
        {FACE_LABELS.map((face, i) => (
          <div
            key={face}
            className="absolute inset-0 overflow-hidden backface-visible border border-white/10"
            style={{
              width: cubeSize,
              height: cubeSize,
              transform: faceTransforms[face],
              backfaceVisibility: 'hidden',
            }}
          >
            {faces[i] ? (
              <Image
                src={faces[i]}
                alt={`Cube face ${face}`}
                fill
                className="pointer-events-none"
                style={{ objectFit: imageFit }}
                sizes={`${cubeSize}px`}
              />
            ) : (
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600 text-xs">
                {face}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── INTRO mode: fullscreen overlay ─────────────────────────
  if (mode === 'intro') {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700 ${
          introVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor }}
      >
        <div className="flex flex-col items-center gap-8">
          {title && (
            <h1 className="text-3xl md:text-5xl font-display font-bold text-zinc-800 text-center">
              {title}
            </h1>
          )}
          {cubeJSX}
          {subtitle && (
            <p className="text-lg text-zinc-500 text-center">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  // ── SECTION mode: inline module ────────────────────────────
  return (
    <section
      className="py-20 flex flex-col items-center justify-center gap-10"
      style={{ backgroundColor }}
    >
      {(title || subtitle) && (
        <div className="text-center space-y-3 px-6">
          {subtitle && (
            <p className="text-sm uppercase tracking-[0.4em] text-zinc-400 font-medium">
              {subtitle}
            </p>
          )}
          {title && (
            <h2 className="text-3xl md:text-5xl font-display font-bold text-zinc-800">
              {title}
            </h2>
          )}
          <div className="w-12 h-[1px] bg-gold-500 mx-auto mt-4" />
        </div>
      )}
      {cubeJSX}
      <p className="text-sm text-zinc-400 select-none">
        ☝ Przeciągnij aby obrócić kostkę
      </p>
    </section>
  );
}
