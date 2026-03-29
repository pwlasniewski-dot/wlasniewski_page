'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────
export interface PhotoCube3DProps {
  images: string[];               // 1-6 URLs for each face
  cubeSize?: number;              // px – edge length  (default 320)
  imageFit?: 'cover' | 'contain'; // how photos fill faces
  rotationSpeed?: number;         // drag sensitivity 0.1-2  (default 0.5)
  smoothness?: number;            // inertia damping 0.85-0.99 (default 0.96)
  entrySpeed?: number;            // entry animation duration in ms (default 1800)
  entryDirection?: 'left' | 'right'; // which side cube enters from
  mode?: 'section' | 'intro';    // section = inline module; intro = fullscreen overlay
  backgroundColor?: string;       // wrapper bg
  title?: string;
  subtitle?: string;
  edgeColor?: string;             // cube edge/border glow color (default '#c8a960')
  edgeWidth?: number;             // edge line width px (default 1.5)
  autoRotate?: boolean;           // gentle auto-rotation when idle (default true)
  autoRotateSpeed?: number;       // degrees per frame (default 0.15)
  onIntroEnd?: () => void;        // called after intro mode animation finishes
}

// Face order: front, back, right, left, top, bottom
const FACE_LABELS = ['front', 'back', 'right', 'left', 'top', 'bottom'] as const;

// ─── Component ────────────────────────────────────────────────────
export default function PhotoCube3D({
  images = [],
  cubeSize = 320,
  imageFit = 'cover',
  rotationSpeed = 0.5,
  smoothness = 0.96,
  entrySpeed = 1800,
  entryDirection = 'left',
  mode = 'section',
  backgroundColor = '#000000',
  title,
  subtitle,
  edgeColor = '#c8a960',
  edgeWidth = 1.5,
  autoRotate = true,
  autoRotateSpeed = 0.15,
  onIntroEnd,
}: PhotoCube3DProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: -25, y: 45 });
  const idleTime = useRef(0);

  const [phase, setPhase] = useState<'entering' | 'interactive'>('entering');
  const [introVisible, setIntroVisible] = useState(mode === 'intro');
  const [cubeTransform, setCubeTransform] = useState('');
  const [entryProgress, setEntryProgress] = useState(0);

  // Pad images array to 6
  const faces = FACE_LABELS.map((_, i) => images[i % Math.max(images.length, 1)] || '');
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

  // ── Entry animation: smooth scale + fade + gentle rotation ────
  useEffect(() => {
    if (phase !== 'entering') return;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / entrySpeed, 1);

      // easeOutExpo for buttery smooth entry
      const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

      setEntryProgress(ease);

      // Entry: scale from 0.3 → 1, slide in gently, rotate one full turn
      const scale = 0.3 + 0.7 * ease;
      const offsetX = (entryDirection === 'left' ? -60 : 60) * (1 - ease);
      const ry = 45 + 360 * ease;
      const rx = -25 + Math.sin(ease * Math.PI) * 10;

      setCubeTransform(
        `translateX(${offsetX}px) scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg)`
      );

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rotation.current = { x: rx, y: ry % 360 };
        setPhase('interactive');
        if (mode === 'intro') {
          setTimeout(() => {
            setIntroVisible(false);
            onIntroEnd?.();
          }, 1200);
        }
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Interactive loop with auto-rotation ───────────────────────
  useEffect(() => {
    if (phase !== 'interactive') return;

    const loop = () => {
      if (!dragging.current) {
        velocity.current.x *= smoothness;
        velocity.current.y *= smoothness;

        // If nearly stopped and auto-rotate is on, add gentle rotation
        const speed = Math.abs(velocity.current.x) + Math.abs(velocity.current.y);
        if (speed < 0.1 && autoRotate) {
          idleTime.current++;
          const ramp = Math.min(idleTime.current / 60, 1);
          velocity.current.x += autoRotateSpeed * ramp;
          velocity.current.y += Math.sin(Date.now() / 4000) * autoRotateSpeed * 0.3 * ramp;
        }

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
  }, [phase, smoothness, autoRotate, autoRotateSpeed]);

  // ── Pointer handlers ──────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== 'interactive') return;
    dragging.current = true;
    idleTime.current = 0;
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

  // ── Touch support ─────────────────────────────────────────────
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => {
      if (dragging.current) e.preventDefault();
    };
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, []);

  // ── Edge styling ──────────────────────────────────────────────
  const edgeBorder = `${edgeWidth}px solid ${edgeColor}`;
  const edgeShadow = `inset 0 0 ${Math.round(cubeSize * 0.05)}px ${edgeColor}40, 0 0 ${Math.round(cubeSize * 0.02)}px ${edgeColor}20`;

  // ── Cube JSX ──────────────────────────────────────────────────
  const cubeJSX = (
    <div
      ref={sceneRef}
      className="relative select-none"
      style={{
        width: cubeSize,
        height: cubeSize,
        perspective: cubeSize * 4,
        perspectiveOrigin: '50% 50%',
        cursor: phase === 'interactive' ? 'grab' : 'default',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
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
            className="absolute inset-0 overflow-hidden"
            style={{
              width: cubeSize,
              height: cubeSize,
              transform: faceTransforms[face],
              backfaceVisibility: 'hidden',
              border: edgeBorder,
              boxShadow: edgeShadow,
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
              <div className="w-full h-full bg-zinc-900/80 flex items-center justify-center">
                <div
                  className="w-8 h-8 rounded border opacity-30"
                  style={{ borderColor: edgeColor }}
                />
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
      <AnimatePresence>
        {introVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor }}
            onClick={() => {
              if (phase === 'interactive') {
                setIntroVisible(false);
                onIntroEnd?.();
              }
            }}
          >
            <div
              className="flex flex-col items-center gap-8"
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: entryProgress > 0.3 ? 1 : 0, y: entryProgress > 0.3 ? 0 : -20 }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl md:text-5xl font-display font-bold text-center"
                  style={{ color: edgeColor }}
                >
                  {title}
                </motion.h1>
              )}
              {cubeJSX}
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: entryProgress > 0.5 ? 1 : 0, y: entryProgress > 0.5 ? 0 : 10 }}
                  transition={{ duration: 0.6 }}
                  className="text-lg text-zinc-400 text-center"
                >
                  {subtitle}
                </motion.p>
              )}
              {phase === 'interactive' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-zinc-500"
                >
                  ☝ Przeciągnij kostkę • Kliknij tło aby kontynuować
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ── SECTION mode: inline module ────────────────────────────
  return (
    <section
      className="relative py-20 flex flex-col items-center justify-center gap-8 overflow-hidden"
      style={{ backgroundColor }}
    >
      {/* Subtle ambient glow behind cube */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: cubeSize * 2,
          height: cubeSize * 2,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${edgeColor}15 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {(title || subtitle) && (
        <div className="text-center space-y-3 px-6 relative z-10">
          {subtitle && (
            <p className="text-sm uppercase tracking-[0.4em] text-zinc-500 font-medium">
              {subtitle}
            </p>
          )}
          {title && (
            <h2 className="text-3xl md:text-5xl font-display font-bold" style={{ color: edgeColor }}>
              {title}
            </h2>
          )}
          <div className="w-16 h-[2px] mx-auto mt-4" style={{ backgroundColor: edgeColor }} />
        </div>
      )}

      <div className="relative z-10">
        {cubeJSX}
      </div>

      <p className="text-sm text-zinc-500 select-none relative z-10">
        ☝ Przeciągnij aby obrócić kostkę
      </p>
    </section>
  );
}
