
import { v4 as uuidv4 } from 'uuid';

export function createHeroSlideTemplate() {
    return {
        id: `slide-${Date.now()}`,
        image: '/assets/placeholder/hero-default.jpg',
        title: 'Nagłówek',
        subtitle: 'Podtytuł',
        buttonText: 'Zobacz Portfolio',
        buttonLink: '/portfolio',
        enabled: true,
        order: 0,
        shader: 'cinematic' as const
    };
}

export function createAboutSectionTemplate() {
    return {
        id: `about-${uuidv4()}`,
        type: 'about',
        label: 'Sekcja O mnie',
        enabled: true,
        backgroundColor: 'black',
        data: {
            title: 'O mnie',
            content: '<p>Krótki opis o mnie...</p>',
            image: '/assets/placeholder/about.jpg',
            image_desktop: '/assets/placeholder/about.jpg',
            image_mobile: '/assets/placeholder/about.jpg',
            cta1Text: 'Czytaj więcej',
            cta1Link: '/o-mnie',
            cta2Text: '',
            cta2Link: '',
            imageShape: 'circle',
            imageSize: 100,
            textPosition: 'left',
            floatingImage: false,
            imageOffset: 0
        }
    };
}

export function createFeaturesSectionTemplate() {
    return {
        id: `features-${uuidv4()}`,
        type: 'features',
        label: 'Kafelki (Features)',
        enabled: true,
        backgroundColor: 'zinc-900',
        data: {
            features: [
                { id: `f-${uuidv4()}`, title: 'Sesje rodzinne', items: ['indywidualne podejście', 'krótkie sesje'], enabled: true },
                { id: `f-${uuidv4()}`, title: 'Reportaże ślubne', items: ['pełna relacja', 'albumy'], enabled: true }
            ]
        }
    };
}

export function createParallaxSectionTemplate() {
    return {
        id: `parallax-${uuidv4()}`,
        type: 'parallax',
        label: 'Parallax',
        enabled: true,
        backgroundColor: 'black',
        data: {
            image: '/assets/placeholder/parallax.jpg',
            image_desktop: '/assets/placeholder/parallax-desktop.jpg',
            image_mobile: '/assets/placeholder/parallax-mobile.jpg',
            title: 'Parallax',
            floatingImage: true,
            parallaxSpeed: 0.5,
            imageOffset: 20,
            textOpacity: 1,
            textColor: '#FFFFFF',
            textAnimation: 'slide-up'
        }
    };
}

export function createInfoBandTemplate() {
    return {
        id: `infoband-${uuidv4()}`,
        type: 'info_band',
        label: 'Info Band',
        enabled: true,
        backgroundColor: 'white',
        data: {
            image: '/assets/placeholder/info.jpg',
            image_desktop: '/assets/placeholder/info.jpg',
            image_mobile: '/assets/placeholder/info.jpg',
            title: 'Informacja',
            content: '<p>Krótka informacja</p>',
            position: 'left'
        }
    };
}

export function createChallengeBannerTemplate() {
    return {
        id: `challenge-${uuidv4()}`,
        type: 'challenge_banner',
        label: 'Foto Wyzwanie',
        enabled: true,
        backgroundColor: 'zinc-900',
        data: {
            title: 'Foto Wyzwanie',
            content: 'Podejmij wyzwanie i wygraj!',
            buttonText: 'Dołącz',
            buttonLink: '/foto-wyzwanie',
            effect: 'carousel',
            photos: ['/assets/placeholder/hero-default.jpg', '/assets/placeholder/hero-default.jpg'],
            advanced: {
                enabled: true,
                items: [
                    {
                        id: `item-${uuidv4()}`,
                        type: 'image',
                        src: '/assets/placeholder/hero-default.jpg',
                        title: 'Wyzwanie 1',
                        subtitle: 'Opis',
                        ctaText: 'Dołącz',
                        ctaLink: '/foto-wyzwanie',
                        animation: 'fade',
                        imageSize: 100,
                        contentPosition: 'center',
                        imageShape: 'square'
                    }
                ],
                config: {
                    autoScroll: true,
                    interval: 5,
                    height: '600px',
                    floating: true,
                    loop: true,
                    layout: 'full'
                }
            }
        }
    };
}

export function createTestimonialsTemplate() {
    return {
        id: `testimonials-${uuidv4()}`,
        type: 'testimonials',
        label: 'Opinie',
        enabled: true,
        backgroundColor: 'black',
        data: {
            title: 'Co mówią klienci',
            subtitle: ''
        }
    };
}

export function createStoriesGridTemplate() {
    return {
        id: `stories-${uuidv4()}`,
        type: 'stories_grid',
        label: 'Siatka Historii',
        enabled: true,
        backgroundColor: 'white',
        data: {
            title: 'Wybierzcie swoją historię',
            subtitle: 'Zobacz reportaże',
            stories_items: [
                { id: `story-${uuidv4()}`, title: 'Przykładowa Historia', image: '/assets/placeholder/hero-default.jpg', link: '#', category: 'Reportaż' }
            ]
        }
    };
}

export function createChronologicalGalleryTemplate() {
    return {
        id: `chrono-${uuidv4()}`,
        type: 'chronological_gallery',
        label: 'Galeria Chronologiczna',
        enabled: true,
        backgroundColor: 'white',
        data: {
            title: 'Jak pracuję?',
            gallery_layout: 'list',
            chronological_items: [
                { id: `chrono-${uuidv4()}`, image: '/assets/placeholder/hero-default.jpg', description: 'Przygotowania' }
            ]
        }
    };
}

export function createMagazineLayoutTemplate() {
    return {
        id: `magazine-${uuidv4()}`,
        type: 'magazine_layout',
        label: 'Magazine Layout',
        enabled: true,
        backgroundColor: 'white',
        data: {
            title: 'Magazyn',
            subtitle: 'Historia',
            image: '/assets/placeholder/hero-default.jpg',
            secondaryImage: '/assets/placeholder/about.jpg',
            content: '<p>Wpisz treść artykułu...</p>',
            layout: 'left'
        }
    };
}

export function createMasonryGalleryTemplate() {
    return {
        id: `masonry-${uuidv4()}`,
        type: 'masonry_gallery',
        label: 'Masonry Gallery',
        enabled: true,
        backgroundColor: 'white',
        title: 'Galeria',
        subtitle: 'Mozaika',
        images: ['/assets/placeholder/hero-default.jpg', '/assets/placeholder/about.jpg']
    };
}

export function createClientStoryTemplate() {
    return {
        id: `client-story-${uuidv4()}`,
        type: 'client_story',
        label: 'Client Story',
        enabled: true,
        backgroundColor: 'white',
        image: '/assets/placeholder/info.jpg',
        title: 'Historia Klienta',
        tag: 'Anna & Piotr',
        subtitle: 'Warszawa',
        buttonText: '2025',
        content: '<p>Wspaniała historia...</p>'
    };
}

export function createProcessTimelineTemplate() {
    return {
        id: `timeline-${uuidv4()}`,
        type: 'process_timeline',
        label: 'Process Timeline',
        enabled: true,
        backgroundColor: 'white',
        title: 'Proces Współpracy',
        subtitle: 'Krok po kroku',
        data: {
            steps: [
                { id: `step-${uuidv4()}`, title: 'Spotkanie', description: 'Omówienie szczegółów' },
                { id: `step-${uuidv4()}`, title: 'Sesja', description: 'Realizacja zdjęć' },
                { id: `step-${uuidv4()}`, title: 'Oddanie zdjęć', description: 'Galeria online' }
            ]
        }
    };
}

export function createInvestmentTeaserTemplate() {
    return {
        id: `investment-${uuidv4()}`,
        type: 'investment_teaser',
        label: 'Investment Teaser',
        enabled: true,
        backgroundColor: 'zinc-900',
        title: 'Oferta',
        subtitle: 'Inwestycja w wspomnienia',
        buttonText: 'Zobacz Ofertę',
        buttonLink: '/oferta',
        image: '/assets/placeholder/parallax.jpg'
    };
}

export function createNarrativeTextTemplate() {
    return {
        id: `narrative-${uuidv4()}`,
        type: 'narrative_text',
        label: 'Narrative Text',
        enabled: true,
        backgroundColor: 'white',
        content: '<p>Wpisz swój narracyjny tekst tutaj...</p>'
    };
}

export function createFeaturedCarouselTemplate() {
    return {
        id: `carousel-${uuidv4()}`,
        type: 'featured_carousel',
        label: 'Featured Carousel',
        enabled: true,
        backgroundColor: 'white',
        title: 'Wyróżnione',
        subtitle: 'Najlepsze momenty',
        data: {
            items: [
                { id: `feat-${uuidv4()}`, image: '/assets/placeholder/hero-default.jpg', title: 'Moment 1' },
                { id: `feat-${uuidv4()}`, image: '/assets/placeholder/about.jpg', title: 'Moment 2' }
            ]
        }
    };
}

export function createPhotoCube3DTemplate() {
    return {
        id: `cube3d-${uuidv4()}`,
        type: 'photo_cube_3d',
        label: 'Kostka 3D',
        enabled: true,
        backgroundColor: 'black',
        data: {
            images: [],
            cube_size: 320,
            image_fit: 'cover',
            rotation_speed: 0.5,
            smoothness: 0.96,
            entry_speed: 1800,
            entry_direction: 'left',
            background_color: '#000000',
            edge_color: '#c8a960',
            edge_width: 1.5,
            auto_rotate: true,
            auto_rotate_speed: 0.15
        }
    };
}

export default {
    createHeroSlideTemplate,
    createAboutSectionTemplate,
    createFeaturesSectionTemplate,
    createParallaxSectionTemplate,
    createInfoBandTemplate,
    createChallengeBannerTemplate,
    createTestimonialsTemplate,
    createStoriesGridTemplate,
    createChronologicalGalleryTemplate,
    createMagazineLayoutTemplate,
    createMasonryGalleryTemplate,
    createClientStoryTemplate,
    createProcessTimelineTemplate,
    createInvestmentTeaserTemplate,
    createNarrativeTextTemplate,
    createFeaturedCarouselTemplate,
    createPhotoCube3DTemplate
};
