'use client';

import type { PhysicsAnimationKey } from '@/lib/physics-lab/catalog';
import {
    FoilScene,
    SpoonsScene,
    PencilScene,
    MeasureScene,
    UnitAlarmScene,
    QuantityDetectorScene,
    FallingBallScene,
    RulerSoundScene,
    CondensationScene,
    IceRaceScene,
    EvaporationScene,
    CircuitScene,
    MagnetsScene,
    GravityScene,
    ElectrostaticScene,
} from './animations/world';
import {
    ForceUnitsScene,
    InteractionScene,
    ForceVectorScene,
    InstrumentsScene,
    EffectsScene,
    VectorTwinsScene,
} from './animations/force';
import {
    BalanceRopeScene,
    BalanceDiagramsScene,
    ResultantScene,
    BrothersScene,
    ZeroResultantScene,
} from './animations/balance';
import {
    GraphScene,
    DynamometerScene,
    VolumeScene,
    ForceScaleScene,
    CartBalanceScene,
} from './animations/measurement';

interface PhysicsAnimationProps {
    kind: PhysicsAnimationKey;
    step?: number;
    compact?: boolean;
}

export default function PhysicsAnimation({ kind, compact = false }: PhysicsAnimationProps) {
    const scene = (() => {
        switch (kind) {
            case 'foil': return <FoilScene />;
            case 'spoons': return <SpoonsScene />;
            case 'pencil': return <PencilScene />;
            case 'measure': return <MeasureScene />;
            case 'unit-alarm': return <UnitAlarmScene />;
            case 'quantity-detector': return <QuantityDetectorScene />;
            case 'falling-ball': return <FallingBallScene />;
            case 'ruler-sound': return <RulerSoundScene />;
            case 'condensation': return <CondensationScene />;
            case 'ice-race': return <IceRaceScene />;
            case 'evaporation': return <EvaporationScene />;
            case 'circuit': return <CircuitScene />;
            case 'magnets': return <MagnetsScene />;
            case 'gravity': return <GravityScene />;
            case 'electrostatic': return <ElectrostaticScene />;
            case 'force-units': return <ForceUnitsScene />;
            case 'interaction': return <InteractionScene />;
            case 'force-vector': return <ForceVectorScene />;
            case 'instruments': return <InstrumentsScene />;
            case 'effects': return <EffectsScene />;
            case 'vector-twins': return <VectorTwinsScene />;
            case 'balance-rope': return <BalanceRopeScene />;
            case 'balance-diagrams': return <BalanceDiagramsScene />;
            case 'resultant': return <ResultantScene />;
            case 'brothers': return <BrothersScene />;
            case 'zero-resultant': return <ZeroResultantScene />;
            case 'graph': return <GraphScene />;
            case 'dynamometer': return <DynamometerScene />;
            case 'volume': return <VolumeScene />;
            case 'force-scale': return <ForceScaleScene />;
            case 'cart-balance': return <CartBalanceScene />;
            default: return <InteractionScene />;
        }
    })();

    return <div className={compact ? 'physics-animation physics-animation--compact' : 'physics-animation'}>{scene}</div>;
}
