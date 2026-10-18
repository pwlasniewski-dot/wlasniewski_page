'use client';

import { motion } from 'framer-motion';
import { Arrow, Base, Label, cyan, violet, orange, lime, ink, white, muted } from './core';

export function ForceUnitsScene() {
    return (
        <Base title="Schody jednostek siły N, kN i MN">
            <motion.g initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ staggerChildren: 0.25 }}>
                <rect x="55" y="244" width="165" height="68" rx="12" fill="#123c4b" stroke={cyan} strokeWidth="3" />
                <rect x="238" y="174" width="165" height="138" rx="12" fill="#2c2450" stroke={violet} strokeWidth="3" />
                <rect x="420" y="95" width="165" height="217" rx="12" fill="#4b2f17" stroke={orange} strokeWidth="3" />
                <Label x={138} y={288} color={cyan} size={34}>N</Label>
                <Label x={320} y={247} color={violet} size={34}>kN</Label>
                <Label x={503} y={213} color={orange} size={34}>MN</Label>
                <Label x={138} y={338} color={muted} size={15}>niuton</Label>
                <Label x={320} y={338} color={muted} size={15}>1000 N</Label>
                <Label x={503} y={338} color={muted} size={15}>1 000 000 N</Label>
            </motion.g>
            <motion.path d="M135 224 Q320 75 505 75" fill="none" stroke={white} strokeWidth="4" strokeDasharray="8 10" animate={{ pathLength: [0, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        </Base>
    );
}

export function InteractionScene() {
    return (
        <Base title="Samochodzik przyspieszający pod wpływem siły">
            <rect x="60" y="285" width="520" height="10" rx="5" fill="#526579" />
            <motion.g animate={{ x: [0, 340, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <rect x="90" y="210" width="150" height="58" rx="20" fill="#ff765e" />
                <path d="M125 210 L155 170 H205 L225 210" fill="#ff9c69" />
                <circle cx="130" cy="270" r="23" fill="#182431" stroke={white} strokeWidth="3" />
                <circle cx="205" cy="270" r="23" fill="#182431" stroke={white} strokeWidth="3" />
            </motion.g>
            <motion.g animate={{ x: [0, 340, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <Arrow x1={65} y1={190} x2={170} y2={190} label="F" color={cyan} />
            </motion.g>
            <Label x={320} y={70} color={cyan} size={24}>SIŁA ZMIENIA RUCH CIAŁA</Label>
        </Base>
    );
}

export function ForceVectorScene() {
    return (
        <Base title="Cztery cechy wektora siły">
            <circle cx="145" cy="195" r="15" fill={orange} filter="url(#softGlow)" />
            <Arrow x1={145} y1={195} x2={495} y2={95} label="8 N" color={cyan} width={9} />
            <motion.g animate={{ opacity: [0.45, 1, 0.45] }} transition={{ duration: 1.8, repeat: Infinity }}>
                <Label x={118} y={246} color={orange} size={17}>punkt przyłożenia</Label>
                <Label x={335} y={268} color={white} size={17}>kierunek: ukośny</Label>
                <Label x={530} y={83} color={cyan} size={17}>zwrot</Label>
                <Label x={320} y={47} color={violet} size={25}>WARTOŚĆ • KIERUNEK • ZWROT • PUNKT</Label>
            </motion.g>
            <line x1="70" y1="217" x2="565" y2="76" stroke={white} strokeOpacity="0.18" strokeWidth="3" strokeDasharray="8 10" />
        </Base>
    );
}

export function InstrumentsScene() {
    const cards = [
        { x: 70, symbol: '◷', name: 'CZAS', color: cyan },
        { x: 210, symbol: '▰', name: 'DŁUGOŚĆ', color: orange },
        { x: 350, symbol: '↕', name: 'SIŁA', color: violet },
        { x: 490, symbol: '⚖', name: 'MASA', color: lime },
    ];
    return (
        <Base title="Przyrządy pomiarowe i mierzone wielkości">
            <Label x={320} y={52} color={white} size={24}>DOPASUJ PRZYRZĄD DO WIELKOŚCI</Label>
            {cards.map((card, index) => (
                <motion.g key={card.name} initial={{ y: 40, opacity: 0 }} animate={{ y: [0, -8, 0], opacity: 1 }} transition={{ y: { duration: 2.4, repeat: Infinity, delay: index * 0.2 }, opacity: { delay: index * 0.15 } }}>
                    <rect x={card.x} y="95" width="105" height="170" rx="22" fill="#102034" stroke={card.color} strokeWidth="3" />
                    <text x={card.x + 52} y="183" fill={card.color} textAnchor="middle" fontSize="62" fontWeight="700">{card.symbol}</text>
                    <Label x={card.x + 52} y={236} color={card.color} size={15}>{card.name}</Label>
                </motion.g>
            ))}
        </Base>
    );
}

export function EffectsScene() {
    return (
        <Base title="Statyczne i dynamiczne skutki siły">
            <Label x={170} y={48} color={orange} size={21}>SKUTEK STATYCZNY</Label>
            <Label x={475} y={48} color={cyan} size={21}>SKUTEK DYNAMICZNY</Label>
            <motion.rect x="95" y="140" width="150" height="70" rx="35" fill="#ff9a57" animate={{ width: [150, 240, 150], x: [95, 50, 95], height: [70, 36, 70], y: [140, 157, 140] }} transition={{ duration: 2.4, repeat: Infinity }} />
            <Arrow x1={84} y1={175} x2={38} y2={175} color={white} width={5} />
            <Arrow x1={256} y1={175} x2={302} y2={175} color={white} width={5} />
            <rect x="350" y="270" width="235" height="10" rx="5" fill="#536b7d" />
            <motion.circle cx="390" cy="225" r="34" fill="#58e8ff" animate={{ cx: [390, 548, 390], cy: [225, 120, 225] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} />
            <Arrow x1={370} y1={300} x2={530} y2={300} color={cyan} label="zmiana ruchu" width={5} />
            <Label x={170} y={246} color={orange} size={17}>zmiana kształtu</Label>
        </Base>
    );
}

export function VectorTwinsScene() {
    return (
        <Base title="Dwie siły o wspólnym kierunku i przeciwnych zwrotach">
            <circle cx="320" cy="180" r="14" fill={orange} />
            <Arrow x1={320} y1={180} x2={92} y2={180} label="F₁" color={violet} />
            <Arrow x1={320} y1={180} x2={548} y2={180} label="F₂" color={cyan} />
            <line x1="55" y1="180" x2="585" y2="180" stroke={white} strokeOpacity="0.18" strokeWidth="3" strokeDasharray="10 10" />
            <Label x={320} y={55} color={white} size={25}>TEN SAM KIERUNEK I PUNKT</Label>
            <Label x={320} y={314} color={orange} size={22}>PRZECIWNE ZWROTY</Label>
        </Base>
    );
}
