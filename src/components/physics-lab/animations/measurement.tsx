'use client';

import { motion } from 'framer-motion';
import { Arrow, Base, Label, cyan, violet, orange, lime, ink, white, muted } from './core';

export function GraphScene() {
    return (
        <Base title="Wykres zależności siły od liczby obciążników">
            <line x1="105" y1="285" x2="570" y2="285" stroke={white} strokeWidth="5" />
            <line x1="105" y1="285" x2="105" y2="60" stroke={white} strokeWidth="5" />
            {Array.from({ length: 7 }).map((_, index) => <g key={index}><line x1={105 + index * 70} y1="278" x2={105 + index * 70} y2="292" stroke={white} strokeWidth="3" /><Label x={105 + index * 70} y={320} color={muted} size={14}>{index}</Label></g>)}
            {[1, 2, 3].map(value => <g key={value}><line x1="98" y1={285 - value * 65} x2="112" y2={285 - value * 65} stroke={white} strokeWidth="3" /><Label x={75} y={291 - value * 65} color={muted} size={14}>{value}</Label></g>)}
            <motion.path d="M105 285 L525 90" fill="none" stroke={cyan} strokeWidth="8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }} />
            <motion.circle cx="455" cy="122.5" r="10" fill={orange} filter="url(#softGlow)" animate={{ r: [8, 14, 8] }} transition={{ duration: 1.4, repeat: Infinity }} />
            <line x1="455" y1="122.5" x2="455" y2="285" stroke={orange} strokeDasharray="7 7" strokeWidth="3" />
            <line x1="105" y1="122.5" x2="455" y2="122.5" stroke={orange} strokeDasharray="7 7" strokeWidth="3" />
            <Label x={500} y={147} color={orange} size={19}>5 → 2,5 N</Label>
        </Base>
    );
}

export function DynamometerScene() {
    return (
        <Base title="Skala siłomierza z działkami co 10 N">
            <rect x="225" y="42" width="190" height="280" rx="22" fill="#edf4f7" stroke="#95aabd" strokeWidth="5" />
            <rect x="288" y="67" width="64" height="215" rx="15" fill="#1d2b38" />
            <motion.rect x="300" y="90" width="40" height="160" rx="18" fill="#ff6f72" animate={{ height: [55, 160, 90, 55], y: [195, 90, 160, 195] }} transition={{ duration: 4, repeat: Infinity }} />
            {Array.from({ length: 13 }).map((_, index) => (
                <line key={index} x1="352" y1={82 + index * 16} x2={index % 4 === 0 ? 392 : 378} y2={82 + index * 16} stroke="#17212b" strokeWidth={index % 4 === 0 ? 4 : 2} />
            ))}
            <Label x={385} y={87} color="#17212b" size={15}>0</Label>
            <Label x={385} y={151} color="#17212b" size={15}>40</Label>
            <Label x={385} y={215} color="#17212b" size={15}>80</Label>
            <Label x={385} y={279} color="#17212b" size={15}>120</Label>
            <Label x={320} y={344} color={cyan} size={22}>1 DZIAŁKA = 10 N</Label>
        </Base>
    );
}

export function VolumeScene() {
    return (
        <Base title="Przeliczanie 500 centymetrów sześciennych">
            <motion.path d="M110 80 H260 L240 294 H130 Z" fill="none" stroke={white} strokeWidth="5" />
            <motion.path d="M124 185 H248 L239 291 H132 Z" fill="url(#water)" animate={{ d: ['M124 260 H248 L239 291 H132 Z', 'M124 185 H248 L239 291 H132 Z'] }} transition={{ duration: 2.2, repeat: Infinity, repeatType: 'reverse' }} />
            <Label x={185} y={171} color={cyan} size={20}>500 ml</Label>
            <Arrow x1={280} y1={184} x2={355} y2={184} color={orange} />
            <motion.g animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ transformOrigin: '485px 185px' }}>
                <rect x="390" y="90" width="190" height="190" rx="22" fill="#132944" stroke={violet} strokeWidth="4" />
                <Label x={485} y={143} color={white} size={20}>500 cm³</Label>
                <Label x={485} y={190} color={cyan} size={20}>0,5 dm³</Label>
                <Label x={485} y={238} color={lime} size={20}>0,0005 m³</Label>
            </motion.g>
        </Base>
    );
}

export function ForceScaleScene() {
    return (
        <Base title="Odczytywanie wartości siły ze skali graficznej">
            <Label x={320} y={52} color={white} size={22}>1 ODCINEK = 2 N</Label>
            <line x1="125" y1="105" x2="205" y2="105" stroke={orange} strokeWidth="7" strokeLinecap="round" />
            <line x1="125" y1="88" x2="125" y2="122" stroke={orange} strokeWidth="4" /><line x1="205" y1="88" x2="205" y2="122" stroke={orange} strokeWidth="4" />
            <Label x={165} y={145} color={orange} size={18}>2 N</Label>
            <Arrow x1={125} y1={220} x2={525} y2={220} color={cyan} label="?" width={9} />
            {[1, 2, 3].map(index => <line key={index} x1={125 + index * 100} y1="202" x2={125 + index * 100} y2="238" stroke={white} strokeOpacity="0.5" strokeWidth="3" />)}
            <motion.g animate={{ y: [0, -7, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                <Label x={320} y={307} color={lime} size={27}>4 × 2 N = 8 N = 0,008 kN</Label>
            </motion.g>
        </Base>
    );
}

export function CartBalanceScene() {
    return (
        <Base title="Wózek równoważony trzecią siłą 5 N">
            <motion.g animate={{ x: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}>
                <rect x="330" y="155" width="175" height="72" rx="18" fill="#788ba0" />
                <path d="M365 155 L400 115 H480 L500 155" fill="#9daec0" />
                <circle cx="375" cy="235" r="25" fill="#172431" stroke={white} strokeWidth="4" />
                <circle cx="470" cy="235" r="25" fill="#172431" stroke={white} strokeWidth="4" />
            </motion.g>
            <Arrow x1={330} y1={165} x2={105} y2={165} label="3 N" color={violet} />
            <Arrow x1={330} y1={220} x2={155} y2={220} label="2 N" color={violet} />
            <motion.g animate={{ opacity: [0.2, 1, 1, 0.2] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <Arrow x1={505} y1={190} x2={605} y2={190} label="5 N" color={lime} width={9} />
            </motion.g>
            <Label x={320} y={320} color={lime} size={23}>3 N + 2 N = 5 N, WIĘC 5 N W PRAWO</Label>
        </Base>
    );
}
