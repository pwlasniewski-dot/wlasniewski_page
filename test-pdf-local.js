#!/usr/bin/env node

/**
 * Quick local PDF generation test
 * Tests if OfferDocument renders without React #31 error
 */

const path = require('path');
const fs = require('fs');

// Set required env vars
process.env.NODE_ENV = 'production';

// Simulate Netlify environment
console.log('[TEST] Starting PDF render test...\n');

(async () => {
    try {
        const { renderToBuffer } = require('@react-pdf/renderer');
        const React = require('react');

        console.log('[TEST] Imports successful\n');

        // Mock offer data - minimal but valid
        const mockOffer = {
            id: 28,
            title: 'Test Offer',
            category: 'slub',
            status: 'pending',
            template_data: {
                title: 'Oferta Ślubna - TEST',
                subtitle: 'Pakiet Standardowy',
                contactName: 'Przemysław Właśniewski',
                contactLocation: 'Toruń',
                contactPhone: '+48 123 456 789',
                contactEmail: 'test@example.com',
                eventLocation: 'Toruń',
                eventDate: '2026-06-15',
                eventCount: '80',
                eventTeam: '2 osoby',
                preparations: { before: 'Konsultacja', dayOf: 'Przygotowania' },
                features: ['Profesjonalna obsługa', 'Edycja zdjęć', 'Album'],
                pricingHeaders: ['Pakiet', 'Cena'],
                pricingRows: [
                    { values: ['Klasyczny', '1500 PLN'], isHeader: false },
                    { values: ['Deluxe', '2500 PLN'], isHeader: false }
                ],
                footerPrices: ['', '1500 PLN', '2500 PLN'],
                recommendationColumnIndex: undefined,
                albumDescription: 'Piękne albumy drukowane',
                deliveryTerms: { t1: 'Dostarczenie w 2 tygodnie', t2: '', t3: '' },
                footerCompany: '© 2026 Przemysław Właśniewski',
                labels: {
                    location: 'Lokalizacja',
                    date: 'Data',
                    count: 'Liczba gości',
                    team: 'Zespół',
                    prepBefore: 'Przed ślubem',
                    prepDay: 'W dniu ślubu',
                    albumAdvantage: 'Albumy',
                    footerDisclaimer: '',
                },
                sectionTitles: {
                    preparations: 'Przygotowania',
                    standards: 'Standardy',
                    delivery: 'Dostarczenie',
                },
                sectionVisibility: {
                    eventInfo: true,
                    preparations: true,
                    features: true,
                    pricing: true,
                    album: true,
                    delivery: true
                }
            }
        };

        // Import the component
        const { OfferDocument } = require('./src/lib/services/OfferDocument');

        console.log('[TEST] OfferDocument imported\n');
        console.log('[TEST] Creating React element...');
        
        // Try to create the element
        const element = React.createElement(OfferDocument, {
            offer: mockOffer,
            generationDate: new Date().toLocaleString('pl-PL')
        });

        console.log('[TEST] ✓ Element created successfully\n');
        console.log('[TEST] Attempting to render to buffer...');

        // Try to render
        const buffer = await renderToBuffer(element);

        console.log(`[TEST] ✅ SUCCESS! PDF generated: ${buffer.length} bytes\n`);
        
        // Save it for verification
        const outputPath = path.join(__dirname, 'test-output.pdf');
        fs.writeFileSync(outputPath, buffer);
        console.log(`[TEST] Saved to: ${outputPath}\n`);
        
        process.exit(0);

    } catch (error) {
        console.error('[TEST] ❌ FAILED!\n');
        console.error('[TEST] Error:', error.message);
        console.error('[TEST] Name:', error.name);
        console.error('[TEST] Stack:', error.stack);
        process.exit(1);
    }
})();
