import { z } from 'zod';
import {
    POSE_GUIDE_CARDS,
    WARDROBE_FALLBACK_PALETTES,
    WARDROBE_FALLBACK_FAQS,
    WARDROBE_FALLBACK_TIPS,
    WARDROBE_CHECKLISTS,
} from '@/data/preparationGuides';
import type { PoseGuideCard, PreparationGuideFaq, PreparationGuidePalette, PreparationGuideTip, WardrobeChecklist } from '@/types/preparation-guide';
import { isAllowedPublicMediaUrl } from '@/lib/publicMediaUrl';

export const PREPARATION_GUIDE_PAGE_SLUG = 'przygotowanie-klienta';

const requiredText = (max: number) => z.string().trim().min(1).max(max);
const mediaImage = z.string().trim().max(2048).refine(
    (value) => isAllowedPublicMediaUrl(value),
    'Obraz musi pochodzić z biblioteki Media'
);
const optionalImage = mediaImage.optional();

const tipSchema = z.object({
    id: z.union([z.string(), z.number()]),
    title: requiredText(160),
    content: requiredText(4000),
    image: optionalImage,
    imageAlt: requiredText(300),
});

const paletteSchema = z.object({
    id: z.union([z.string(), z.number()]),
    name: requiredText(160),
    description: requiredText(1000),
    colors: z.array(z.object({
        name: requiredText(80),
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Kolor musi mieć format #RRGGBB'),
    })).min(1).max(8),
    example_images: z.array(z.object({
        src: mediaImage,
        alt: requiredText(300),
        caption: requiredText(500),
    })).max(1),
});

const poseSchema = z.object({
    id: requiredText(20),
    title: requiredText(160),
    purpose: requiredText(500),
    steps: z.array(requiredText(300)).min(1).max(8),
    body: requiredText(1500),
    variant: requiredText(1000),
    mobility: requiredText(1000),
    image: optionalImage,
    imageAlt: requiredText(300),
});

const checklistSchema = z.object({
    title: requiredText(160),
    items: z.array(requiredText(500)).min(1).max(20),
});

const faqSchema = z.object({
    id: z.union([z.string(), z.number()]),
    question: requiredText(300),
    answer: requiredText(3000),
});

export const preparationGuideCmsSchema = z.object({
    version: z.literal(1),
    wardrobeTips: z.array(tipSchema).length(15),
    wardrobePalettes: z.array(paletteSchema).length(7),
    wardrobeChecklists: z.array(checklistSchema).length(3),
    wardrobeFaqs: z.array(faqSchema).length(12),
    poseCards: z.array(poseSchema).length(30),
}).superRefine((data, context) => {
    const unique = (
        values: Array<string | number>,
        path: 'wardrobeTips' | 'wardrobePalettes' | 'wardrobeFaqs' | 'poseCards'
    ) => {
        const seen = new Set<string>();
        values.forEach((value, index) => {
            const key = String(value);
            if (seen.has(key)) {
                context.addIssue({
                    code: 'custom',
                    message: 'Identyfikatory elementów muszą być unikalne',
                    path: [path, index, 'id'],
                });
            }
            seen.add(key);
        });
    };
    unique(data.wardrobeTips.map((item) => item.id), 'wardrobeTips');
    unique(data.wardrobePalettes.map((item) => item.id), 'wardrobePalettes');
    unique(data.wardrobeFaqs.map((item) => item.id), 'wardrobeFaqs');
    unique(data.poseCards.map((item) => item.id), 'poseCards');
});

export type PreparationGuideCmsData = {
    version: 1;
    wardrobeTips: PreparationGuideTip[];
    wardrobePalettes: PreparationGuidePalette[];
    wardrobeChecklists: WardrobeChecklist[];
    wardrobeFaqs: PreparationGuideFaq[];
    poseCards: PoseGuideCard[];
};

export function defaultPreparationGuideCmsData(): PreparationGuideCmsData {
    return JSON.parse(JSON.stringify({
        version: 1,
        wardrobeTips: WARDROBE_FALLBACK_TIPS,
        wardrobePalettes: WARDROBE_FALLBACK_PALETTES,
        wardrobeChecklists: WARDROBE_CHECKLISTS,
        wardrobeFaqs: WARDROBE_FALLBACK_FAQS,
        poseCards: POSE_GUIDE_CARDS,
    })) as PreparationGuideCmsData;
}

export function parsePreparationGuideCmsData(value: unknown): PreparationGuideCmsData | null {
    let candidate = value;
    if (typeof candidate === 'string') {
        try {
            candidate = JSON.parse(candidate);
        } catch {
            return null;
        }
    }
    const parsed = preparationGuideCmsSchema.safeParse(candidate);
    return parsed.success ? parsed.data as PreparationGuideCmsData : null;
}

export function removePreparationGuideCmsImage(
    data: PreparationGuideCmsData,
    section: 'wardrobe' | 'palettes' | 'poses',
    index: number
): PreparationGuideCmsData {
    const next = structuredClone(data);
    if (section === 'wardrobe') {
        delete next.wardrobeTips[index].image;
    } else if (section === 'poses') {
        delete next.poseCards[index].image;
    } else {
        next.wardrobePalettes[index].example_images = [];
    }
    return next;
}
