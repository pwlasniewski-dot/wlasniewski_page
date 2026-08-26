import React from 'react';
import { formatPlnAmount, parsePlnAmount } from '@/lib/money/pln';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import path from 'path';

// Use local paths for fonts to avoid 500 errors on Vercel/serverless environments
// (Serverless functions often cannot fetch from their own public URL during execution)
// Bulletproof font loader for Netlify / Serverless environments
const getFontPath = (fileName: string) => {
    if (typeof window !== 'undefined') {
        return `https://wlasniewski.pl/fonts/${fileName}`;
    }

    const fs = require('fs');
    const path = require('path');

    // 1. Try standard public path (works locally)
    const localPath = path.join(process.cwd(), 'public', 'fonts', fileName);
    if (fs.existsSync(localPath)) {
        console.log(`[FontLoader] Found at localPath: ${localPath}`);
        return localPath;
    }

    // 2. Try the bundled location inside the Netlify function
    // In Netlify, included_files end up in different places depending on the runtime
    const netlifyPath = path.resolve(__dirname, '..', '..', '..', 'public', 'fonts', fileName);
    if (fs.existsSync(netlifyPath)) {
        console.log(`[FontLoader] Found at netlifyPath: ${netlifyPath}`);
        return netlifyPath;
    }

    const netlifyPathAlt = path.resolve(__dirname, '..', 'public', 'fonts', fileName);
    if (fs.existsSync(netlifyPathAlt)) {
        console.log(`[FontLoader] Found at netlifyPathAlt: ${netlifyPathAlt}`);
        return netlifyPathAlt;
    }

    // 3. Fallback to public URL (for development or if local read fails)
    console.warn(`[FontLoader] Falling back to remote URL for ${fileName}`);
    return `https://wlasniewski.pl/fonts/${fileName}`;
};

Font.register({
    family: 'Montserrat',
    fonts: [
        { src: getFontPath('Montserrat-Regular.ttf'), fontWeight: 400 },
        { src: getFontPath('Montserrat-SemiBold.ttf'), fontWeight: 600 },
        { src: getFontPath('Montserrat-Bold.ttf'), fontWeight: 700 },
    ]
});

// No longer using Playfair Display as the font file was corrupted (1.6KB)
// Switching all to Montserrat for better reliability.

const styles = StyleSheet.create({
    page: {
        padding: '10mm 15mm',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Montserrat',
        color: '#333333',
        fontSize: 10,
        lineHeight: 1.4,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 3,
        borderBottomColor: '#c5a059',
        paddingBottom: 15,
        marginBottom: 20,
    },
    headerLeft: {
        maxWidth: '65%',
    },
    h1: {
        fontFamily: 'Montserrat',
        fontWeight: 700,
        fontSize: 24,
        color: '#1a1a1a',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        lineHeight: 1.2,
    },
    accent: {
        color: '#c5a059',
        fontWeight: 600,
        letterSpacing: 1,
        fontSize: 12,
        fontFamily: 'Montserrat',
    },
    headerRight: {
        textAlign: 'right',
        fontSize: 9, // ~8pt
        color: '#7f8c8d',
    },
    headerName: {
        color: '#1a1a1a',
        fontSize: 12, // ~10pt
        fontWeight: 700,
        marginBottom: 2,
    },
    // Event Info
    eventInfo: {
        backgroundColor: '#f4efe6',
        padding: 8,
        borderRadius: 4,
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    eventItem: {
        width: '50%',
        marginBottom: 4,
        fontSize: 10, // ~9pt
    },
    bold: {
        fontWeight: 700,
        color: '#1a1a1a',
    },
    // Sections
    h2: {
        fontFamily: 'Montserrat',
        fontWeight: 600,
        fontSize: 16, // ~12pt
        color: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 4,
        marginTop: 12,
        marginBottom: 6,
    },
    // Grid (Preparations)
    grid: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 5,
    },
    gridCol: {
        width: '50%',
        fontSize: 10, // ~8.5pt
    },
    // List
    list: {
        marginLeft: 0,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 3,
        fontSize: 10, // ~8.5pt
    },
    bullet: {
        color: '#c5a059',
        fontWeight: 700,
        marginRight: 6,
    },
    // Table
    table: {
        width: '100%',
        marginVertical: 15,
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableCell: {
        padding: 6,
        borderWidth: 1,
        borderColor: '#eee',
        fontSize: 10, // ~8.5pt
        textAlign: 'center',
        justifyContent: 'center',
    },
    tableHeader: {
        backgroundColor: '#f8f8f8',
        fontSize: 10,
        // verticalAlign: 'bottom' is not a valid react-pdf property for View/Text usually, 
        // or it expects specific types. Let's use flexbox or remove if not needed.
        // alignItems: 'flex-end',
    },
    leftAlign: {
        textAlign: 'left',
        paddingLeft: 8,
    },
    recCell: {
        backgroundColor: '#f4efe6',
        borderLeftWidth: 2,
        borderLeftColor: '#c5a059',
        borderRightWidth: 2,
        borderRightColor: '#c5a059',
    },
    recHeader: {
        backgroundColor: '#f4efe6',
        borderTopWidth: 2,
        borderTopColor: '#c5a059',
        borderLeftWidth: 2,
        borderLeftColor: '#c5a059',
        borderRightWidth: 2,
        borderRightColor: '#c5a059',
        paddingTop: 16,
    },
    recLabel: {
        position: 'absolute',
        top: 4,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#c5a059',
        fontSize: 8, // ~6.5pt
        fontWeight: 700,
        textTransform: 'uppercase',
    },
    priceTag: {
        fontSize: 14, // ~11pt
        fontWeight: 700,
        color: '#1a1a1a',
        marginTop: 2,
    },
    // Communion selection row
    communionSelectionRow: {
        backgroundColor: '#e0f2fe',
        borderTopWidth: 2,
        borderTopColor: '#bae6fd'
    },
    communionSelectionLabel: {
        color: '#0369a1',
        fontWeight: 700,
        fontSize: 12
    },
    communionSubtotal: {
        fontSize: 8,
        color: '#0284c7',
        marginTop: 2
    },
    // Accepted offer final price
    acceptedFinalPrice: {
        backgroundColor: '#f0fdf4',
        borderColor: '#16a34a',
        borderWidth: 2,
        borderRadius: 4,
        padding: 10,
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    acceptedFinalLabel: {
        fontFamily: 'Montserrat',
        fontWeight: 600,
        color: '#166534',
        fontSize: 12
    },
    acceptedFinalValue: {
        fontFamily: 'Montserrat',
        fontWeight: 700,
        color: '#166534',
        fontSize: 16
    },
    generationDateText: {
        marginTop: 6,
        fontSize: 8,
        color: '#94a3b8'
    },
    tableWidthDynamic: {
        width: '50%' // Will be calculated dynamically
    },
    tableWidthQuarter: {
        width: '25%' // Will be calculated dynamically
    },
    // Album Box
    descBox: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        padding: 10,
        marginTop: 10,
        fontSize: 11, // ~9pt
        borderLeftWidth: 4,
        borderLeftColor: '#c5a059',
    },
    // Footer
    footer: {
        textAlign: 'center',
        fontSize: 9, // ~7.5pt
        color: '#7f8c8d',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
        marginTop: 'auto',
    },
});

// Helper to safely render text - CRITICAL: Must never return objects or React elements
const S = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    // For objects, convert to string safely
    try {
        return String(val);
    } catch (e) {
        return '';
    }
};

export const OfferDocument: React.FC<{ offer: any, generationDate?: string }> = ({ offer, generationDate }) => {
    console.log('[OfferDoc] Component rendering for offer:', offer.id);
    console.log('[OfferDoc] Has template_data:', !!offer.template_data);
    
    if (!offer.template_data) {
        console.error('[OfferDoc] ERROR: No template_data! Using fallback.');
    }
    
    // If we have template_data, use it. Otherwise fallback to top-level properties.
    // The previous implementation used OfferData interface.
    const data = offer.template_data || {};
    
    // ULTRA-DEFENSIVE: Ensure EVERY field has a safe default
    const safeData = {
        title: data.title || offer.title || 'Oferta',
        subtitle: data.subtitle || '',
        contactName: data.contactName || '',
        contactLocation: data.contactLocation || '',
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        contactZip: data.contactZip || '',
        contactAddress: data.contactAddress || '',
        eventLocation: data.eventLocation || '',
        eventDate: data.eventDate || '',
        eventCount: data.eventCount || '',
        eventTeam: data.eventTeam || '',
        preparations: data.preparations || { before: '', dayOf: '' },
        features: Array.isArray(data.features) ? data.features : [],
        pricingHeaders: Array.isArray(data.pricingHeaders) ? data.pricingHeaders : [],
        pricingRows: Array.isArray(data.pricingRows) ? data.pricingRows : [],
        footerPrices: Array.isArray(data.footerPrices) ? data.footerPrices : [],
        recommendationColumnIndex: data.recommendationColumnIndex ?? undefined,
        recommendationLabel: data.recommendationLabel || 'REKOMENDACJA',
        albumDescription: data.albumDescription || '',
        deliveryTerms: (data.deliveryTerms && typeof data.deliveryTerms === 'object') ? data.deliveryTerms : { t1: '', t2: '', t3: '' },
        footerCompany: data.footerCompany || '',
        labels: data.labels || {
            location: 'Lokalizacja',
            date: 'Data',
            count: 'Liczba gości',
            team: 'Zespół',
            prepBefore: 'Przed ślubem',
            prepDay: 'W dniu ślubu',
            albumAdvantage: 'Albumy',
            footerDisclaimer: '',
        },
        sectionTitles: data.sectionTitles || {
            preparations: 'Przygotowania',
            standards: 'Standardy',
            delivery: 'Dostarczenie',
        },
        sectionVisibility: data.sectionVisibility || {
            eventInfo: true,
            preparations: true,
            features: true,
            pricing: true,
            album: true,
            delivery: true
        }
    };
    
    console.log('[OfferDoc] Safe data prepared:', {
        title: safeData.title.substring(0, 20),
        featuresLen: safeData.features.length,
        headersLen: safeData.pricingHeaders.length,
        rowsLen: safeData.pricingRows.length,
        pricesLen: safeData.footerPrices.length,
        hasDelivery: !!safeData.deliveryTerms
    });
    
    // Validate and sanitize all arrays to avoid React #31 errors
    const safeFeaturesArray = Array.isArray(safeData.features) 
        ? safeData.features.filter((f: any) => f !== null && f !== undefined)
        : [];
    
    const safePricingHeaders = Array.isArray(safeData.pricingHeaders)
        ? safeData.pricingHeaders.filter((h: any) => h !== null && h !== undefined)
        : [];
    
    const safePricingRows = Array.isArray(safeData.pricingRows)
        ? safeData.pricingRows.filter((r: any) => r && Array.isArray(r.values))
        : [];
    
    const safeFooterPrices = Array.isArray(safeData.footerPrices)
        ? safeData.footerPrices.filter((p: any) => p !== null && p !== undefined)
        : [];

    const safeDeliveryTerms = safeData.deliveryTerms && typeof safeData.deliveryTerms === 'object'
        ? Object.entries(safeData.deliveryTerms)
            .filter(([_, v]: [string, any]) => v !== null && v !== undefined)
            .reduce((acc: any, [k, v]: [string, any]) => ({ ...acc, [k]: v }), {})
        : {};

    // If data is missing sectionVisibility or labels, provide defaults
    const sectionVisibility = safeData.sectionVisibility || {
        eventInfo: true,
        preparations: true,
        features: true,
        pricing: true,
        album: true,
        delivery: true
    };

    const labels = safeData.labels || {
        location: 'Lokalizacja',
        date: 'Data',
        count: 'Liczba gości',
        team: 'Zespół',
        prepBefore: 'Przed ślubem',
        prepDay: 'W dniu ślubu',
        albumAdvantage: 'Albumy',
        footerDisclaimer: '',
    };

    const sectionTitles = safeData.sectionTitles || {
        preparations: 'Przygotowania',
        standards: 'Standardy',
        delivery: 'Dostarczenie',
    };

    const contactName = safeData.contactName === 'undefined undefined' ? '' : safeData.contactName;

    const isCommunion = offer.category?.toLowerCase() === 'komunia';
    const isAccepted = offer.status === 'accepted';
    const clientSelection = offer.client_selection || null;

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.h1}>{S(safeData.title)}</Text>
                        <Text style={styles.accent}>{S(safeData.subtitle)}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.headerName}>{S(contactName)}</Text>
                        <Text>{S(safeData.contactLocation)}</Text>
                        <Text>Tel: {S(safeData.contactPhone)}</Text>
                        <Text>{S(safeData.contactEmail)}</Text>
                    </View>
                </View>

                {/* Event Info */}
                {sectionVisibility.eventInfo ? (
                    <View style={styles.eventInfo}>
                        <View style={styles.eventItem}>
                            <Text>{S(labels.location)}: {S(safeData.eventLocation)}</Text>
                        </View>
                        <View style={styles.eventItem}>
                            <Text>{S(labels.date)}: {S(safeData.eventDate)}</Text>
                        </View>
                        <View style={styles.eventItem}>
                            <Text>{S(labels.count)}: {S(safeData.eventCount)}</Text>
                        </View>
                        <View style={styles.eventItem}>
                            <Text>{S(labels.team)}: {S(safeData.eventTeam)}</Text>
                        </View>
                    </View>
                ) : null}

                {/* Preparations */}
                {sectionVisibility.preparations ? (
                    <View>
                        <Text style={styles.h2}>{S(sectionTitles.preparations)}</Text>
                        <View style={styles.grid}>
                            <View style={styles.gridCol}>
                                <Text style={styles.bold}>{S(labels.prepBefore)}:</Text>
                                <Text>{S(safeData.preparations?.before)}</Text>
                            </View>
                            <View style={styles.gridCol}>
                                <Text style={styles.bold}>{S(labels.prepDay)}:</Text>
                                <Text>{S(safeData.preparations?.dayOf)}</Text>
                            </View>
                        </View>
                    </View>
                ) : null}

                {/* Features / Standards */}
                {sectionVisibility.features && safeFeaturesArray.length > 0 ? (
                    <View>
                        <Text style={styles.h2}>{S(sectionTitles.standards)}</Text>
                        <View style={styles.list}>
                            {safeFeaturesArray.map((f: any, i: number) => {
                                const str = String(f || '');
                                const parts = str.split(':');
                                const label = parts.length > 1 ? parts[0] + ':' : '';
                                const content = parts.length > 1 ? parts.slice(1).join(':') : str;
                                const fullText = label ? `${S(label)} ${S(content)}` : S(content);

                                return (
                                    <View key={i} style={styles.listItem}>
                                        <Text style={styles.bullet}>✓</Text>
                                        <Text>{fullText}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

                {/* Pricing Table */}
                {sectionVisibility.pricing && safePricingHeaders.length > 0 ? (
                    <View style={styles.table}>
                        {/* Headers */}
                        <View style={styles.tableRow}>
                            {safePricingHeaders.map((header: any, idx: number) => {
                                const isRec = idx === safeData.recommendationColumnIndex;
                                const headerStyles = [
                                    styles.tableCell,
                                    styles.tableHeader,
                                ];
                                if (idx === 0) headerStyles.push(styles.leftAlign);
                                if (isRec) headerStyles.push(styles.recHeader);
                                
                                return (
                                    <View
                                        key={idx}
                                        style={[...headerStyles, { width: `${100 / (safePricingHeaders.length || 1)}%` }]}
                                    >
                                        {isRec ? <Text style={styles.recLabel}>{S(safeData.recommendationLabel)}</Text> : null}
                                        <Text style={styles.bold}>{S(header)}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Rows */}
                        {safePricingRows.map((row: any, i: number) => (
                            <View key={i} style={styles.tableRow}>
                                {(row.values || []).map((val: any, colIdx: number) => {
                                    const isRec = colIdx === safeData.recommendationColumnIndex;
                                    const isHeader = row.isHeader;
                                    const cellStyles = [styles.tableCell];
                                    if (colIdx === 0) cellStyles.push(styles.leftAlign);
                                    if (isRec) cellStyles.push(styles.recCell);
                                    
                                    return (
                                        <View
                                            key={colIdx}
                                            style={[...cellStyles, { width: `${100 / (safePricingHeaders.length || 1)}%` }]}
                                        >
                                            <Text style={isHeader ? styles.bold : undefined}>{S(val)}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}

                        {/* Footer Prices */}
                        <View style={styles.tableRow}>
                            {safeFooterPrices.map((price: any, idx: number) => {
                                const isRec = idx === safeData.recommendationColumnIndex;
                                const cellStyles = [styles.tableCell];
                                if (idx === 0) cellStyles.push(styles.leftAlign);
                                if (isRec) cellStyles.push(styles.recCell);
                                
                                return (
                                    <View
                                        key={idx}
                                        style={[...cellStyles, { width: `${100 / (safePricingHeaders.length || 1)}%` }]}
                                    >
                                        {idx === 0 ? <Text>{S(price)}</Text> : <Text style={styles.priceTag}>{S(price)}</Text>}
                                    </View>
                                );
                            })}
                        </View>

                        {/* Communion Client Selection Row */}
                        {isCommunion && clientSelection && clientSelection.splitPackageCounts ? (
                            <View style={[styles.tableRow, styles.communionSelectionRow]}>
                                <View style={[styles.tableCell, styles.leftAlign, { width: `${100 / (safePricingHeaders.length || 1)}%` }]}>
                                    <Text style={[styles.bold, styles.communionSelectionLabel]}>Wybrana liczba dzieci</Text>
                                </View>
                                {safeFooterPrices.slice(1).map((_: any, idx: number) => {
                                    const actualIdx = idx + 1;
                                    const count = clientSelection.splitPackageCounts[actualIdx] || 0;
                                    const priceStr = safeFooterPrices[actualIdx] || '0';
                                    const priceNum = parsePlnAmount(priceStr) ?? 0;
                                    const subtotal = count * priceNum;

                                    return (
                                        <View key={actualIdx} style={[styles.tableCell, { width: `${100 / (safePricingHeaders.length || 1)}%` }]}>
                                            <Text style={[styles.bold, styles.communionSelectionLabel]}>{count} os.</Text>
                                            {count > 0 ? <Text style={styles.communionSubtotal}>Razem: {formatPlnAmount(subtotal)}</Text> : null}
                                        </View>
                                    );
                                })}
                            </View>
                        ) : null}
                    </View>
                ) : null}

                {/* Final Price Summary for Accepted Offers */}
                {isAccepted && clientSelection?.totalPrice && (
                    <View style={styles.acceptedFinalPrice}>
                        <Text style={styles.acceptedFinalLabel}>ZAAKCEPTOWANA WARTOŚĆ KOŃCOWA OFERTY:</Text>
                        <Text style={styles.acceptedFinalValue}>{clientSelection.totalPrice.toLocaleString('pl-PL')} PLN</Text>
                    </View>
                )}

                {/* Album */}
                {sectionVisibility.album ? (
                    <View style={styles.descBox}>
                        <Text style={styles.bold}>{S(labels.albumAdvantage)}:</Text>
                        <Text>{S(safeData.albumDescription)}</Text>
                    </View>
                ) : null}

                {/* Delivery */}
                {sectionVisibility.delivery && Object.keys(safeDeliveryTerms).length > 0 ? (
                    <View>
                        <Text style={styles.h2}>{S(sectionTitles.delivery)}</Text>
                        <View style={styles.list}>
                            {Object.values(safeDeliveryTerms).map((t: any, i: number) => {
                                const str = String(t || '');
                                const parts = str.split(':');
                                const label = parts.length > 1 ? parts[0] + ':' : '';
                                const content = parts.length > 1 ? parts.slice(1).join(':') : str;
                                const fullText = label ? `${S(label)} ${S(content)}` : S(content);

                                return (
                                    <View key={i} style={styles.listItem}>
                                        <Text style={styles.bullet}>✓</Text>
                                        <Text>{fullText}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>{S(labels.footerDisclaimer)}</Text>
                    <Text style={styles.bold}>{S(safeData.footerCompany)}</Text>
                    {generationDate ? (
                        <Text style={styles.generationDateText}>Dokument wygenerowany z systemu dnia: {generationDate}</Text>
                    ) : null}
                </View>

            </Page>
        </Document>
    );
};
