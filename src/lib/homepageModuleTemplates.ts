// Szablony modułów dla strony głównej
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
        order: 0
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
            image_desktop: '/assets/placeholder/about-desktop.jpg',
            image_mobile: '/assets/placeholder/about-mobile.jpg',
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
            imageOffset: 20
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
            image_desktop: '/assets/placeholder/info-desktop.jpg',
            image_mobile: '/assets/placeholder/info-mobile.jpg',
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
            photos: ['/assets/placeholder/ch1.jpg','/assets/placeholder/ch2.jpg'],
            advanced: {
                enabled: true,
                items: [
                    {
                        id: `item-${uuidv4()}`,
                        type: 'image',
                        src: '/assets/placeholder/challenge-1.jpg',
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

export default {
    createHeroSlideTemplate,
    createAboutSectionTemplate,
    createFeaturesSectionTemplate,
    createParallaxSectionTemplate,
    createInfoBandTemplate,
    createChallengeBannerTemplate,
    createTestimonialsTemplate
};
