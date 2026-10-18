'use client';

import { motion } from 'framer-motion';
import { Arrow, Base, Label, cyan, violet, orange, lime, ink, white, muted } from './core';

export function FoilScene() {
    return (
        <Base title="Folia aluminiowa zmieniająca kształt">
            <motion.rect x="76" y="116" width="130" height="112" rx="8" fill="url(#metal)" initial={{ rotate: -3 }} animate={{ rotate: [-3, 2, -3] }} transition={{ duration: 3.5, repeat: Infinity }} />
            <motion.circle cx="320" cy="174" r="62" fill="url(#metal)" animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            <motion.path d="M438 217 Q490 104 555 217 Q500 251 438 217Z" fill="url(#metal)" animate={{ y: [0, -7, 0] }} transition={{ duration: 2.2, repeat: Infinity }} />
            <Label x={141} y={268}>płaska folia</Label>
            <Label x={320} y={268}>kulka</Label>
            <Label x={500} y={268}>łódka</Label>
            <Arrow x1={213} y1={174} x2={246} y2={174} color={orange} />
            <Arrow x1={385} y1={174} x2={425} y2={174} color={orange} />
            <Label x={320} y={58} color={cyan} size={24}>TA SAMA SUBSTANCJA: ALUMINIUM</Label>
        </Base>
    );
}

export function SpoonsScene() {
    const spoon = (x: number, color: string, label: string, delay: number) => (
        <motion.g key={label} initial={{ y: 35, opacity: 0 }} animate={{ y: [0, -5, 0], opacity: 1 }} transition={{ y: { duration: 2.5, repeat: Infinity, delay }, opacity: { duration: 0.5, delay } }}>
            <ellipse cx={x} cy="117" rx="42" ry="58" fill={color} stroke={white} strokeOpacity="0.32" strokeWidth="3" />
            <rect x={x - 13} y="160" width="26" height="124" rx="13" fill={color} />
            <Label x={x} y={322} color={color}>{label}</Label>
        </motion.g>
    );
    return (
        <Base title="Trzy łyżki z różnych materiałów">
            <Label x={320} y={54} color={cyan} size={25}>JEDNO CIAŁO — RÓŻNE SUBSTANCJE</Label>
            {spoon(150, '#dceaf5', 'metal', 0)}
            {spoon(320, '#ff7ca8', 'plastik', 0.2)}
            {spoon(490, '#b77b45', 'drewno', 0.4)}
        </Base>
    );
}

export function PencilScene() {
    return (
        <Base title="Przekrój ołówka i materiały, z których jest wykonany">
            <motion.g animate={{ x: [-7, 7, -7] }} transition={{ duration: 4, repeat: Infinity }}>
                <polygon points="85,185 165,137 525,137 570,185 525,233 165,233" fill="#e7a64b" />
                <polygon points="85,185 165,160 525,160 548,185 525,210 165,210" fill="#f4d48a" />
                <polygon points="85,185 165,177 525,177 533,185 525,193 165,193" fill="#38414b" />
                <polygon points="85,185 165,177 165,193" fill="#202831" />
                <rect x="448" y="137" width="78" height="96" fill="#ef5f68" opacity="0.9" />
                <rect x="424" y="137" width="24" height="96" fill="url(#metal)" />
            </motion.g>
            <Arrow x1={224} y1={116} x2={224} y2={152} label="drewno" color={orange} width={4} />
            <Arrow x1={340} y1={253} x2={340} y2={202} label="grafit" color={cyan} width={4} />
            <Label x={320} y={55} color={violet} size={25}>OŁÓWEK ≠ OŁÓW</Label>
        </Base>
    );
}

export function MeasureScene() {
    return (
        <Base title="Stanowiska do pomiaru długości, masy i objętości">
            <Label x={320} y={45} color={cyan} size={23}>LICZBA + JEDNOSTKA = WYNIK</Label>
            <g transform="translate(50 85)">
                <rect width="180" height="48" rx="10" fill="#f5d876" />
                {Array.from({ length: 13 }).map((_, index) => <line key={index} x1={12 + index * 13} y1="4" x2={12 + index * 13} y2={index % 5 === 0 ? 28 : 18} stroke="#43350c" strokeWidth="3" />)}
                <Label x={90} y={86} color={white}>120 cm</Label>
            </g>
            <g transform="translate(265 80)">
                <path d="M20 118 H150 L132 28 H38 Z" fill="#48596e" stroke={white} strokeOpacity="0.4" strokeWidth="3" />
                <rect x="57" y="58" width="56" height="34" rx="5" fill="#b8ff6a" />
                <Label x={85} y={82} color="#172018" size={17}>185 g</Label>
                <motion.circle cx="85" cy="25" r="29" fill="#ff647c" animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }} />
            </g>
            <g transform="translate(465 76)">
                <path d="M20 22 H114 L102 160 H32 Z" fill="none" stroke={white} strokeWidth="4" />
                <motion.path d="M31 112 H104 L99 158 H35 Z" fill="url(#water)" animate={{ d: ['M31 112 H104 L99 158 H35 Z', 'M27 88 H108 L99 158 H35 Z', 'M31 112 H104 L99 158 H35 Z'] }} transition={{ duration: 3, repeat: Infinity }} />
                {Array.from({ length: 5 }).map((_, index) => <line key={index} x1="25" y1={54 + index * 21} x2="45" y2={54 + index * 21} stroke={white} strokeWidth="3" />)}
                <Label x={67} y={199} color={white}>300 ml</Label>
            </g>
        </Base>
    );
}

export function UnitAlarmScene() {
    return (
        <Base title="Alarm brakującej jednostki">
            <motion.circle cx="320" cy="175" r="105" fill="#41162b" stroke="#ff5f77" strokeWidth="7" animate={{ scale: [1, 1.04, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.1, repeat: Infinity }} />
            <Label x={320} y={142} color={white} size={36}>150</Label>
            <motion.text x="320" y="203" fill="#ff5f77" textAnchor="middle" fontSize="34" fontWeight="900" animate={{ opacity: [0.15, 1, 0.15] }} transition={{ duration: 0.8, repeat: Infinity }}>BRAK JEDNOSTKI!</motion.text>
            <motion.g animate={{ y: [8, -4, 8] }} transition={{ duration: 2.2, repeat: Infinity }}>
                <rect x="215" y="284" width="210" height="44" rx="22" fill={cyan} />
                <Label x={320} y={313} color={ink} size={22}>150 cm ✓</Label>
            </motion.g>
        </Base>
    );
}

export function QuantityDetectorScene() {
    const words = [
        { text: 'masa', x: 110, y: 90, targetX: 175, color: cyan },
        { text: 'deszcz', x: 295, y: 85, targetX: 465, color: orange },
        { text: 'temperatura', x: 90, y: 142, targetX: 175, color: cyan },
        { text: 'chmura', x: 360, y: 138, targetX: 465, color: orange },
    ];
    return (
        <Base title="Sortowanie wielkości fizycznych i zjawisk">
            <rect x="70" y="225" width="220" height="94" rx="18" fill="#102e46" stroke={cyan} strokeWidth="3" />
            <rect x="350" y="225" width="220" height="94" rx="18" fill="#3b2618" stroke={orange} strokeWidth="3" />
            <Label x={180} y={274} color={cyan}>MIERZALNA CECHA</Label>
            <Label x={460} y={274} color={orange}>CIAŁO / ZJAWISKO</Label>
            {words.map((word, index) => (
                <motion.g key={word.text} animate={{ x: [0, word.targetX - word.x, word.targetX - word.x, 0], y: [0, 110, 110, 0] }} transition={{ duration: 5, repeat: Infinity, delay: index * 0.45, times: [0, 0.45, 0.75, 1] }}>
                    <rect x={word.x - 54} y={word.y - 24} width="108" height="42" rx="21" fill={word.color} opacity="0.2" stroke={word.color} />
                    <Label x={word.x} y={word.y + 5} color={word.color} size={17}>{word.text}</Label>
                </motion.g>
            ))}
        </Base>
    );
}

export function FallingBallScene() {
    return (
        <Base title="Spadająca i odbijająca się piłka">
            <rect x="70" y="296" width="500" height="12" rx="6" fill="#587086" />
            <motion.circle cx="320" cy="85" r="40" fill="#ff6d78" stroke="#ffd5d9" strokeWidth="4" animate={{ cy: [85, 255, 185, 255, 225, 255], scaleY: [1, 1, 1, 0.72, 1, 0.8] }} transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.38, 0.58, 0.68, 0.82, 1] }} />
            <motion.path d="M320 65 V258" stroke={cyan} strokeWidth="5" strokeDasharray="10 12" animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 3.2, repeat: Infinity }} />
            <Label x={150} y={92} color={cyan}>PIŁKA = CIAŁO</Label>
            <Label x={470} y={173} color={orange}>SPADANIE = ZJAWISKO</Label>
        </Base>
    );
}

export function RulerSoundScene() {
    return (
        <Base title="Drgająca linijka wytwarzająca dźwięk">
            <rect x="54" y="210" width="310" height="68" rx="8" fill="#704b31" />
            <rect x="240" y="178" width="48" height="66" rx="8" fill="#2f3e4d" />
            <motion.path d="M265 197 C365 197 455 197 555 197" fill="none" stroke="#f6df75" strokeWidth="18" strokeLinecap="round" animate={{ d: ['M265 197 C365 197 455 197 555 197', 'M265 197 C365 145 455 245 555 197', 'M265 197 C365 245 455 145 555 197', 'M265 197 C365 197 455 197 555 197'] }} transition={{ duration: 0.35, repeat: Infinity }} />
            {[0, 1, 2].map(index => (
                <motion.path key={index} d={`M${512 + index * 20} ${145 - index * 13} Q${575 + index * 10} 197 ${512 + index * 20} ${249 + index * 13}`} fill="none" stroke={cyan} strokeWidth="4" opacity={0.85 - index * 0.2} animate={{ opacity: [0.1, 0.9, 0.1] }} transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.2 }} />
            ))}
            <Label x={320} y={70} color={cyan} size={26}>DRGANIA → DŹWIĘK</Label>
        </Base>
    );
}

export function CondensationScene() {
    const drops = [150, 205, 265, 330, 390, 445];
    return (
        <Base title="Krople skraplające się na zimnej szklance">
            <path d="M218 70 H422 L396 305 H244 Z" fill="#d9f8ff" fillOpacity="0.1" stroke="#d9f8ff" strokeWidth="5" />
            <path d="M234 170 H406 L392 300 H248 Z" fill="url(#water)" opacity="0.75" />
            {[270, 320, 370].map((x, index) => <rect key={x} x={x - 25} y={112 + index % 2 * 8} width="50" height="50" rx="10" fill="#bffaff" opacity="0.8" transform={`rotate(${index * 13 - 12} ${x} 137)`} />)}
            {drops.map((x, index) => (
                <motion.path key={x} d={`M${x} 105 C${x - 10} 124 ${x - 10} 135 ${x} 143 C${x + 10} 135 ${x + 10} 124 ${x} 105Z`} fill={cyan} animate={{ y: [0, 120, 160], opacity: [0, 1, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.32 }} />
            ))}
            <Label x={320} y={43} color={cyan} size={24}>PARA WODNA → KROPLE</Label>
            <Label x={520} y={287} color={muted} size={17}>skraplanie</Label>
        </Base>
    );
}

export function IceRaceScene() {
    return (
        <Base title="Wyścig topnienia lodu na metalu i drewnie">
            <Label x={170} y={52} color={cyan} size={22}>METAL</Label>
            <Label x={470} y={52} color={orange} size={22}>DREWNO</Label>
            <rect x="65" y="230" width="220" height="55" rx="12" fill="url(#metal)" />
            <rect x="355" y="230" width="220" height="55" rx="12" fill="#9a6038" />
            <motion.rect x="125" y="112" width="96" height="110" rx="18" fill="#bdf7ff" fillOpacity="0.8" stroke={white} strokeWidth="4" animate={{ height: [110, 42, 110], y: [112, 180, 112], opacity: [0.9, 0.45, 0.9] }} transition={{ duration: 5, repeat: Infinity }} />
            <motion.rect x="418" y="112" width="96" height="110" rx="18" fill="#bdf7ff" fillOpacity="0.8" stroke={white} strokeWidth="4" animate={{ height: [110, 80, 110], y: [112, 142, 112], opacity: [0.9, 0.7, 0.9] }} transition={{ duration: 5, repeat: Infinity }} />
            <motion.ellipse cx="173" cy="238" rx="70" ry="14" fill={cyan} opacity="0.55" animate={{ rx: [20, 84, 20] }} transition={{ duration: 5, repeat: Infinity }} />
            <motion.ellipse cx="466" cy="238" rx="35" ry="10" fill={cyan} opacity="0.35" animate={{ rx: [15, 44, 15] }} transition={{ duration: 5, repeat: Infinity }} />
            <Label x={320} y={330} color={white} size={20}>Metal szybciej przekazuje energię do lodu</Label>
        </Base>
    );
}

export function EvaporationScene() {
    return (
        <Base title="Parowanie wody z dłoni przy ruchu powietrza">
            <motion.path d="M145 268 C100 234 94 174 134 142 C160 121 188 139 202 166 C217 130 253 132 268 163 C285 139 322 146 331 180 C343 161 380 170 386 203 C393 246 336 293 253 304Z" fill="#f0b28f" animate={{ x: [-5, 5, -5] }} transition={{ duration: 2.8, repeat: Infinity }} />
            {[170, 220, 270, 320].map((x, index) => <motion.path key={x} d={`M${x} 160 Q${x - 18} 132 ${x} 105 Q${x + 18} 78 ${x} 52`} fill="none" stroke={cyan} strokeWidth="6" strokeLinecap="round" animate={{ y: [15, -20], opacity: [0, 1, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.25 }} />)}
            {[0, 1, 2].map(index => <motion.path key={index} d={`M410 ${135 + index * 45} C470 ${112 + index * 45} 520 ${158 + index * 45} 575 ${130 + index * 45}`} fill="none" stroke={white} strokeWidth="5" strokeLinecap="round" animate={{ x: [-20, 10, -20], opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.18 }} />)}
            <Label x={320} y={335} color={cyan} size={24}>RUCH POWIETRZA PRZYSPIESZA PAROWANIE</Label>
        </Base>
    );
}

export function CircuitScene() {
    return (
        <Base title="Zamknięty obwód elektryczny z baterią i żarówką">
            <rect x="82" y="135" width="100" height="92" rx="12" fill="#3c4b5d" stroke={white} strokeWidth="4" />
            <rect x="112" y="113" width="18" height="25" fill={orange} /><rect x="142" y="119" width="12" height="19" fill={orange} />
            <Label x={132} y={190} color={white} size={20}>BATERIA</Label>
            <motion.circle cx="500" cy="180" r="58" fill="#4c4b2a" stroke="#f9e97d" strokeWidth="5" animate={{ fill: ['#4c4b2a', '#ffe867', '#4c4b2a'], filter: ['none', 'url(#softGlow)', 'none'] }} transition={{ duration: 2.4, repeat: Infinity }} />
            <path d="M474 182 Q500 137 526 182 Q500 224 474 182" fill="none" stroke={white} strokeWidth="5" />
            <motion.path d="M182 155 H350" stroke={cyan} strokeWidth="7" fill="none" animate={{ pathLength: [0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
            <motion.path d="M390 155 H442 Q462 155 462 175" stroke={cyan} strokeWidth="7" fill="none" animate={{ pathLength: [0, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.5 }} />
            <path d="M350 155 L390 126" stroke={orange} strokeWidth="7" strokeLinecap="round" />
            <motion.g animate={{ rotate: [0, 34, 34, 0] }} transition={{ duration: 2.4, repeat: Infinity }} style={{ transformOrigin: '350px 155px' }}>
                <path d="M350 155 L390 126" stroke={orange} strokeWidth="7" strokeLinecap="round" />
            </motion.g>
            <path d="M500 238 V285 H132 V227" fill="none" stroke={cyan} strokeWidth="7" />
            <Label x={320} y={330} color={cyan} size={22}>ZAMKNIJ OBWÓD → PRĄD PŁYNIE</Label>
        </Base>
    );
}

export function MagnetsScene() {
    return (
        <Base title="Dwa magnesy przyciągające się i odpychające">
            <motion.g animate={{ x: [0, 82, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <rect x="70" y="135" width="150" height="90" rx="16" fill="#e74f61" />
                <rect x="145" y="135" width="75" height="90" rx="0" fill="#477cff" />
                <Label x={108} y={190} size={31}>N</Label><Label x={183} y={190} size={31}>S</Label>
            </motion.g>
            <motion.g animate={{ x: [0, -82, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <rect x="420" y="135" width="150" height="90" rx="16" fill="#477cff" />
                <rect x="495" y="135" width="75" height="90" rx="0" fill="#e74f61" />
                <Label x={458} y={190} size={31}>S</Label><Label x={533} y={190} size={31}>N</Label>
            </motion.g>
            <Arrow x1={240} y1={102} x2={305} y2={102} color={cyan} />
            <Arrow x1={400} y1={102} x2={335} y2={102} color={cyan} />
            <Label x={320} y={304} color={cyan} size={24}>OBA MAGNESY DZIAŁAJĄ NA SIEBIE</Label>
        </Base>
    );
}

export function GravityScene() {
    return (
        <Base title="Tor podrzuconej piłki i siła grawitacji">
            <motion.path d="M100 275 Q320 24 540 275" fill="none" stroke={white} strokeOpacity="0.35" strokeWidth="4" strokeDasharray="10 10" />
            <motion.circle r="30" fill="#ff6c7b" animate={{ cx: [100, 320, 540], cy: [275, 68, 275] }} transition={{ duration: 3.3, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.g animate={{ x: [0, 220, 440], y: [0, -207, 0] }} transition={{ duration: 3.3, repeat: Infinity, ease: 'easeInOut' }}>
                <Arrow x1={100} y1={200} x2={100} y2={265} label="g" color={cyan} width={6} />
            </motion.g>
            <Label x={320} y={330} color={cyan} size={23}>GRAWITACJA CAŁY CZAS DZIAŁA W DÓŁ</Label>
        </Base>
    );
}

export function ElectrostaticScene() {
    return (
        <Base title="Naelektryzowany grzebień odchylający strumień wody">
            <motion.path d="M455 42 C455 120 455 200 455 320" fill="none" stroke={cyan} strokeWidth="14" strokeLinecap="round" animate={{ d: ['M455 42 C455 120 455 200 455 320', 'M455 42 C452 120 395 210 365 320', 'M455 42 C455 120 455 200 455 320'] }} transition={{ duration: 3, repeat: Infinity }} />
            <motion.g animate={{ x: [0, 95, 95, 0] }} transition={{ duration: 3, repeat: Infinity, times: [0, 0.35, 0.75, 1] }}>
                <rect x="85" y="155" width="180" height="48" rx="10" fill="#ff79ae" />
                {Array.from({ length: 10 }).map((_, index) => <rect key={index} x={100 + index * 15} y="201" width="7" height="54" rx="3" fill="#ff79ae" />)}
                {Array.from({ length: 8 }).map((_, index) => <motion.text key={index} x={110 + (index % 4) * 39} y={135 + Math.floor(index / 4) * 105} fill={violet} fontSize="24" fontWeight="900" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: index * 0.1 }}>−</motion.text>)}
            </motion.g>
            <Label x={320} y={335} color={cyan} size={23}>ŁADUNKI PRZYCIĄGAJĄ STRUMIEŃ WODY</Label>
        </Base>
    );
}
