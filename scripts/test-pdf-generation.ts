import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { OfferDocument } from './src/lib/services/OfferDocument';

async function testPDFGeneration() {
    console.log('[TEST] Starting PDF render test...\n');

    try {
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

        console.log('[TEST] Creating React element...');
        
        const element = React.createElement(OfferDocument, {
            offer: mockOffer,
            generationDate: new Date().toLocaleString('pl-PL')
        });

        console.log('[TEST] ✓ Element created successfully\n');
        console.log('[TEST] Attempting to render to buffer...');

        const buffer = await renderToBuffer(element as any);

        console.log(`[TEST] ✅ SUCCESS! PDF generated: ${buffer.length} bytes\n`);
        process.exit(0);

    } catch (error: any) {
        console.error('[TEST] ❌ FAILED!\n');
        console.error('[TEST] Error:', error.message);
        console.error('[TEST] Name:', error.name);
        console.error('[TEST] Stack:', error.stack);
        process.exit(1);
    }
}

testPDFGeneration();
