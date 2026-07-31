import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PreparationGuide from '../../src/components/StyleGuide/PreparationGuide';
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

process.stdout.write(renderToStaticMarkup(
    React.createElement(PreparationGuide, {
        data: guideData,
        fallbackContext: { groupSize: 4 },
    })
));
