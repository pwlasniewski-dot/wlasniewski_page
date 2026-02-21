import React from 'react';
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

// Helper to safely render text
const S = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
};

export const OfferDocument: React.FC<{ offer: any, generationDate?: string }> = ({ offer, generationDate }) => {
    // If we have template_data, use it. Otherwise fallback to top-level properties.
    // The previous implementation used OfferData interface.
    const data = offer.template_data || {
        // Fallback or "migration" if template_data is missing but old fields exist
        title: offer.title || 'Oferta',
        subtitle: '',
        contactName: '',
        contactLocation: '',
        contactPhone: '',
        contactEmail: '',
        contactZip: '',
        contactAddress: '',
        eventLocation: '',
        eventDate: '',
        eventCount: '',
        eventTeam: '',
        preparations: { before: '', dayOf: '' },
        features: [],
        pricingHeaders: [],
        pricingRows: [],
        footerPrices: [],
        albumDescription: '',
        deliveryTerms: { t1: '', t2: '', t3: '' },
        footerCompany: '',
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
    };

    // If data is missing sectionVisibility or labels, provide defaults
    const sectionVisibility = data.sectionVisibility || {
        eventInfo: true,
        preparations: true,
        features: true,
        pricing: true,
        album: true,
        delivery: true
    };

    const labels = data.labels || {
        location: 'Lokalizacja',
        date: 'Data',
        count: 'Liczba gości',
        team: 'Zespół',
        prepBefore: 'Przed ślubem',
        prepDay: 'W dniu ślubu',
        albumAdvantage: 'Albumy',
        footerDisclaimer: '',
    };

    const sectionTitles = data.sectionTitles || {
        preparations: 'Przygotowania',
        standards: 'Standardy',
        delivery: 'Dostarczenie',
    };

    const contactName = data.contactName === 'undefined undefined' ? '' : data.contactName;

    const isCommunion = offer.category?.toLowerCase() === 'komunia';
    const isAccepted = offer.status === 'accepted';
    const clientSelection = offer.client_selection || null;

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.h1}>{S(data.title)}</Text>
                        <Text style={styles.accent}>{S(data.subtitle)}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.headerName}>{S(contactName)}</Text>
                        <Text>{S(data.contactLocation)}</Text>
                        <Text>Tel: {S(data.contactPhone)}</Text>
                        <Text>{S(data.contactEmail)}</Text>
                    </View>
                </View>

                {/* Event Info */}
                {sectionVisibility.eventInfo ? (
                    <View style={styles.eventInfo}>
                        <View style={styles.eventItem}>
                            <Text><Text style={styles.bold}>{S(labels.location)}:</Text> {S(data.eventLocation)}</Text>
                        </View>
                        <View style={styles.eventItem}>
                            <Text><Text style={styles.bold}>{S(labels.date)}:</Text> {S(data.eventDate)}</Text>
                        </View>
                        <View style={styles.eventItem}>
                            <Text><Text style={styles.bold}>{S(labels.count)}:</Text> {S(data.eventCount)}</Text>
                        </View>
                        <View style={styles.eventItem}>
                            <Text><Text style={styles.bold}>{S(labels.team)}:</Text> {S(data.eventTeam)}</Text>
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
                                <Text>{S(data.preparations?.before)}</Text>
                            </View>
                            <View style={styles.gridCol}>
                                <Text style={styles.bold}>{S(labels.prepDay)}:</Text>
                                <Text>{S(data.preparations?.dayOf)}</Text>
                            </View>
                        </View>
                    </View>
                ) : null}

                {/* Features / Standards */}
                {sectionVisibility.features ? (
                    <View>
                        <Text style={styles.h2}>{S(sectionTitles.standards)}</Text>
                        <View style={styles.list}>
                            {data.features?.map((f: any, i: number) => {
                                const str = String(f || '');
                                const parts = str.split(':');
                                const label = parts.length > 1 ? parts[0] + ':' : '';
                                const content = parts.length > 1 ? parts.slice(1).join(':') : str;

                                return (
                                    <View key={i} style={styles.listItem}>
                                        <Text style={styles.bullet}>✓</Text>
                                        <Text>
                                            {label ? <Text style={styles.bold}>{S(label)}</Text> : null}
                                            {S(content)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

                {/* Pricing Table */}
                {sectionVisibility.pricing ? (
                    <View style={styles.table}>
                        {/* Headers */}
                        <View style={styles.tableRow}>
                            {data.pricingHeaders?.map((header: any, idx: number) => {
                                const isRec = idx === data.recommendationColumnIndex;
                                return (
                                    <View
                                        key={idx}
                                        style={[
                                            styles.tableCell,
                                            styles.tableHeader,
                                            idx === 0 ? styles.leftAlign : {},
                                            isRec ? styles.recHeader : {},
                                            { width: `${100 / (data.pricingHeaders?.length || 1)}%` }
                                        ]}
                                    >
                                        {isRec ? <Text style={styles.recLabel}>{S(data.recommendationLabel)}</Text> : null}
                                        <Text style={{ fontWeight: 700 }}>{S(header)}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Rows */}
                        {data.pricingRows?.map((row: any, i: number) => (
                            <View key={i} style={styles.tableRow}>
                                {(row.values || []).map((val: any, colIdx: number) => {
                                    const isRec = colIdx === data.recommendationColumnIndex;
                                    const isHeader = row.isHeader;
                                    return (
                                        <View
                                            key={colIdx}
                                            style={[
                                                styles.tableCell,
                                                colIdx === 0 ? styles.leftAlign : {},
                                                isRec ? styles.recCell : {},
                                                { width: `${100 / (data.pricingHeaders?.length || 1)}%` }
                                            ]}
                                        >
                                            <Text style={isHeader ? styles.bold : {}}>{S(val)}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}

                        {/* Footer Prices */}
                        <View style={styles.tableRow}>
                            {data.footerPrices?.map((price: any, idx: number) => {
                                const isRec = idx === data.recommendationColumnIndex;
                                return (
                                    <View
                                        key={idx}
                                        style={[
                                            styles.tableCell,
                                            idx === 0 ? styles.leftAlign : {},
                                            isRec ? styles.recCell : {},
                                            { width: `${100 / (data.pricingHeaders?.length || 1)}%` }
                                        ]}
                                    >
                                        {idx === 0 ? <Text>{S(price)}</Text> : <Text style={styles.priceTag}>{S(price)}</Text>}
                                    </View>
                                );
                            })}
                        </View>

                        {/* Communion Client Selection Row */}
                        {isCommunion && clientSelection && clientSelection.splitPackageCounts && (
                            <View style={[styles.tableRow, { backgroundColor: '#e0f2fe' }]}>
                                <View style={[styles.tableCell, styles.leftAlign, { width: `${100 / (data.pricingHeaders?.length || 1)}%`, borderTopWidth: 2, borderTopColor: '#bae6fd' }]}>
                                    <Text style={[styles.bold, { color: '#0369a1' }]}>Wybrana liczba dzieci</Text>
                                </View>
                                {data.footerPrices?.slice(1).map((_: any, idx: number) => {
                                    const actualIdx = idx + 1;
                                    const count = clientSelection.splitPackageCounts[actualIdx] || 0;
                                    const priceStr = data.footerPrices[actualIdx] || '0';
                                    const priceNum = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
                                    const subtotal = count * priceNum;

                                    return (
                                        <View key={actualIdx} style={[styles.tableCell, { width: `${100 / (data.pricingHeaders?.length || 1)}%`, borderTopWidth: 2, borderTopColor: '#bae6fd' }]}>
                                            <Text style={[styles.bold, { color: '#0369a1', fontSize: 12 }]}>{count} os.</Text>
                                            {count > 0 && <Text style={{ fontSize: 8, color: '#0284c7', marginTop: 2 }}>Razem: {subtotal.toLocaleString('pl-PL')} PLN</Text>}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                ) : null}

                {/* Final Price Summary for Accepted Offers */}
                {isAccepted && clientSelection?.totalPrice && (
                    <View style={{ backgroundColor: '#f0fdf4', padding: 10, borderColor: '#16a34a', borderWidth: 2, borderRadius: 4, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Montserrat', fontWeight: 600, color: '#166534', fontSize: 12 }}>ZAAKCEPTOWANA WARTOŚĆ KOŃCOWA OFERTY:</Text>
                        <Text style={{ fontFamily: 'Montserrat', fontWeight: 700, color: '#166534', fontSize: 16 }}>{clientSelection.totalPrice.toLocaleString('pl-PL')} PLN</Text>
                    </View>
                )}

                {/* Album */}
                {sectionVisibility.album ? (
                    <View style={styles.descBox}>
                        <Text style={styles.bold}>{S(labels.albumAdvantage)}:</Text>
                        <Text>{S(data.albumDescription)}</Text>
                    </View>
                ) : null}

                {/* Delivery */}
                {sectionVisibility.delivery ? (
                    <View>
                        <Text style={styles.h2}>{S(sectionTitles.delivery)}</Text>
                        <View style={styles.list}>
                            {Object.values(data.deliveryTerms || {}).map((t: any, i: number) => {
                                const str = String(t || '');
                                const parts = str.split(':');
                                const label = parts.length > 1 ? parts[0] + ':' : '';
                                const content = parts.length > 1 ? parts.slice(1).join(':') : str;
                                return (
                                    <View key={i} style={styles.listItem}>
                                        <Text style={styles.bullet}>✓</Text>
                                        <Text>
                                            {label ? <Text style={styles.bold}>{S(label)}</Text> : null}
                                            {S(content)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>{S(labels.footerDisclaimer)}</Text>
                    <Text style={styles.bold}>{S(data.footerCompany)}</Text>
                    {generationDate && (
                        <Text style={{ marginTop: 6, fontSize: 8, color: '#94a3b8' }}>Dokument wygenerowany z systemu dnia: {generationDate}</Text>
                    )}
                </View>

            </Page>
        </Document>
    );
};
