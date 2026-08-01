import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PreparationGuide from '../../src/components/StyleGuide/PreparationGuide';
import AccountTabButton from '../../src/components/client/AccountTabButton';
import {
    POSE_GUIDE_CARDS,
    WARDROBE_CHECKLISTS,
    WARDROBE_FALLBACK_FAQS,
    WARDROBE_FALLBACK_PALETTES,
    WARDROBE_FALLBACK_TIPS,
} from '../../src/data/preparationGuides';
import type { ClientPreparationGuideData } from '../../src/types/preparation-guide';

const guideData: ClientPreparationGuideData = {
    context: {
        offerId: 42,
        serviceType: 'Sesja rodzinna',
        location: 'Toruń — Stare Miasto',
        personalized: true,
    },
    wardrobe: {
        palettes: WARDROBE_FALLBACK_PALETTES,
        outfits: [],
        tips: WARDROBE_FALLBACK_TIPS,
        faqs: WARDROBE_FALLBACK_FAQS,
        checklists: WARDROBE_CHECKLISTS,
    },
    poses: {
        cards: POSE_GUIDE_CARDS,
        tips: [],
        faqs: [],
    },
    recommended_palettes: WARDROBE_FALLBACK_PALETTES,
    recommended_outfits: [],
    tips: WARDROBE_FALLBACK_TIPS,
};

const navigation = React.createElement(
    'nav',
    {
        'aria-label': 'Sekcje konta',
        'data-account-nav': true,
        className: 'mb-8 grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/50 p-2',
    },
    [
        ['Przegląd', true, '★'],
        ['Galerie', false, '▧'],
        ['Oferty i Umowy', false, '▤'],
        ['Przygotowanie', false, '▣'],
    ].map(([label, active, icon]) => React.createElement(AccountTabButton, {
        key: String(label),
        label: String(label),
        active: Boolean(active),
        icon: React.createElement('span', { 'aria-hidden': true }, String(icon)),
    }))
);

process.stdout.write(renderToStaticMarkup(
    React.createElement(
        React.Fragment,
        null,
        navigation,
        React.createElement(PreparationGuide, {
            data: guideData,
            fallbackContext: { groupSize: 4 },
        })
    )
));
