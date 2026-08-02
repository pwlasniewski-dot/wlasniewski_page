import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HeroSlider from '../../src/components/HeroSlider';

const html = renderToStaticMarkup(React.createElement(HeroSlider, {
    interval: 6000,
    slides: [{
        id: 'test-hero',
        title: 'Sesja rodzinna w Toruniu',
        subtitle: 'Sprawdź pakiety i wolne terminy.',
        buttonText: 'Zobacz terminy',
        buttonLink: '/rezerwacja?source=hero-test',
        image: '/assets/slider/fotografia-rodzinna-grudziadz-01.webp',
        image_mobile: '/assets/slider/sesja-rodzinna-torun-plener-07.webp',
        enabled: true,
    }],
}));

process.stdout.write(html);
