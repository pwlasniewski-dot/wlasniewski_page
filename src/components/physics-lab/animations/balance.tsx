'use client';

import { motion } from 'framer-motion';
import { Arrow, Base, Label, cyan, violet, orange, lime, ink, white, muted } from './core';

export function BalanceRopeScene() {
    return (
        <Base title="Dwie osoby ciągnące linę równymi siłami">
            <motion.path d="M125 180 C220 168 420 192 515 180" fill="none" stroke="#d5b283" strokeWidth="15" strokeLinecap="round" animate={{ d: ['M125 180 C220 168 420 192 515 180', 'M125 180 C220 192 420 168 515 180', 'M125 180 C220 168 420 192 515 180'] }} transition={{ duration: 1.2, repeat: Infinity }} />
            <circle cx="320" cy="180" r="13" fill={orange} filter="url(#softGlow)" />
            <Arrow x1={300} y1={125} x2={115} y2={125} label="5 N" color={violet} />
            <Arrow x1={340} y1={125} x2={525} y2={125} label="5 N" color={cyan} />
            <motion.line x1="320" y1="78" x2="320" y2="287" stroke={lime} strokeWidth="4" strokeDasharray="8 9" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.6, repeat: Infinity }} />
            <Label x={320} y={322} color={lime} size={25}>WYPADEK: 0 N</Label>
        </Base>
    );
}

export function BalanceDiagramsScene() {
    const diagrams = [
        { x: 80, label: 'A', type: 0 },
        { x: 220, label: 'B', type: 1 },
        { x: 360, label: 'C', type: 2 },
        { x: 500, label: 'D', type: 3 },
    ];
    return (
        <Base title="Cztery diagramy sił, z których jeden jest zrównoważony">
            <Label x={320} y={47} color={white} size={23}>KTÓRY UKŁAD DAJE 0 N?</Label>
            {diagrams.map(({ x, label, type }, index) => (
                <motion.g key={label} animate={type === 2 ? { scale: [1, 1.08, 1] } : { opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, delay: index * 0.12 }} style={{ transformOrigin: `${x + 40}px 190px` }}>
                    <rect x={x} y="90" width="115" height="200" rx="18" fill={type === 2 ? '#133b35' : '#102034'} stroke={type === 2 ? lime : '#334e68'} strokeWidth="3" />
                    <Label x={x + 58} y={127} color={type === 2 ? lime : white} size={24}>{label}</Label>
                    <circle cx={x + 58} cy="195" r="9" fill={orange} />
                    {type === 0 && <><Arrow x1={x + 58} y1={195} x2={x + 58} y2={145} color={cyan} width={4} /><Arrow x1={x + 58} y1={195} x2={x + 105} y2={195} color={violet} width={4} /></>}
                    {type === 1 && <><Arrow x1={x + 20} y1={175} x2={x + 100} y2={175} color={cyan} width={4} /><Arrow x1={x + 20} y1={215} x2={x + 100} y2={215} color={cyan} width={4} /></>}
                    {type === 2 && <><Arrow x1={x + 58} y1={195} x2={x + 12} y2={195} color={violet} width={4} /><Arrow x1={x + 58} y1={195} x2={x + 104} y2={195} color={cyan} width={4} /></>}
                    {type === 3 && <><Arrow x1={x + 58} y1={195} x2={x + 20} y2={235} color={violet} width={4} /><Arrow x1={x + 58} y1={195} x2={x + 85} y2={168} color={cyan} width={4} /></>}
                </motion.g>
            ))}
        </Base>
    );
}

export function ResultantScene() {
    return (
        <Base title="Siła wypadkowa dwóch przeciwnych sił 2 N i 3 N">
            <rect x="255" y="135" width="130" height="90" rx="16" fill="#64748b" stroke={white} strokeWidth="4" />
            <Arrow x1={255} y1={180} x2={105} y2={180} label="2 N" color={violet} />
            <Arrow x1={385} y1={180} x2={575} y2={180} label="3 N" color={cyan} />
            <motion.g animate={{ y: [0, 7, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Arrow x1={270} y1={285} x2={370} y2={285} label="1 N" color={lime} width={8} />
            </motion.g>
            <Label x={320} y={55} color={white} size={23}>3 N − 2 N = 1 N W PRAWO</Label>
        </Base>
    );
}

export function BrothersScene() {
    return (
        <Base title="Dwie siły skierowane w tę samą stronę sumują się">
            <rect x="350" y="145" width="160" height="110" rx="12" fill="#7a5b43" stroke="#c99c72" strokeWidth="4" />
            <Arrow x1={80} y1={135} x2={325} y2={135} label="100 N" color={violet} />
            <Arrow x1={80} y1={210} x2={325} y2={210} label="150 N" color={cyan} />
            <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                <Arrow x1={155} y1={302} x2={500} y2={302} label="250 N" color={lime} width={9} />
            </motion.g>
            <Label x={320} y={56} color={white} size={24}>TEN SAM ZWROT → DODAJ</Label>
        </Base>
    );
}

export function ZeroResultantScene() {
    return (
        <Base title="Zerowa siła wypadkowa">
            <motion.circle cx="320" cy="180" r="78" fill="#102b2c" stroke={lime} strokeWidth="7" animate={{ scale: [1, 1.06, 1], filter: ['none', 'url(#softGlow)', 'none'] }} transition={{ duration: 2, repeat: Infinity }} />
            <Label x={320} y={198} color={lime} size={54}>0 N</Label>
            <Arrow x1={250} y1={80} x2={90} y2={80} label="6 N" color={violet} />
            <Arrow x1={390} y1={80} x2={550} y2={80} label="6 N" color={cyan} />
            <Label x={320} y={314} color={white} size={24}>RÓWNOWAGA, NIE BRAK SIŁ</Label>
        </Base>
    );
}
