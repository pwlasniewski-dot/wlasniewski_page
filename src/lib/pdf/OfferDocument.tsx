import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register custom fonts (optional, for premium look)
// Font.register({
//   family: 'Montserrat',
//   src: 'https://fonts.gstatic.com/s/montserrat/v25/... .ttf'
// });

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontFamily: 'Helvetica',
    },
    header: {
        backgroundColor: '#0f172a', // slate-900
        padding: 40,
        color: 'white',
    },
    headerB2B: {
        backgroundColor: '#1e3a8a', // blue-900
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        opacity: 0.9,
    },
    content: {
        padding: 40,
    },
    sectionHeader: {
        backgroundColor: '#f1f5f9', // slate-100
        padding: 12,
        marginTop: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        textTransform: 'uppercase',
    },
    sectionDescription: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 4,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    itemTitle: {
        fontSize: 12,
        flex: 3,
    },
    itemQty: {
        fontSize: 12,
        flex: 1,
        textAlign: 'center',
    },
    itemPrice: {
        fontSize: 12,
        flex: 1,
        textAlign: 'right',
    },
    totalSection: {
        marginTop: 30,
        borderTopWidth: 2,
        borderTopColor: '#0f172a',
        paddingTop: 20,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        marginRight: 20,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#d4af37', // gold
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 9,
        color: '#94a3b8',
    },
});

interface OfferDocumentProps {
    offer: {
        title: string;
        type: string;
        category?: string;
        client_email?: string;
        total_price: number;
        sections: Array<{
            title: string;
            description?: string;
            items: Array<{
                title: string;
                description?: string;
                price: number;
                quantity: number;
                is_optional?: boolean;
            }>;
        }>;
    };
}

export const OfferDocument: React.FC<OfferDocumentProps> = ({ offer }) => {
    const isB2B = offer.type === 'b2b';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={[styles.header, isB2B && styles.headerB2B]}>
                    <Text style={styles.title}>{offer.title}</Text>
                    <Text style={styles.subtitle}>
                        {isB2B ? 'OFERTA BIZNESOWA' : 'OFERTA INDYWIDUALNA'}
                        {offer.category && ` • ${offer.category.toUpperCase()}`}
                    </Text>
                    {offer.client_email && (
                        <Text style={[styles.subtitle, { marginTop: 12 }]}>
                            Przygotowano dla: {offer.client_email}
                        </Text>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {offer.sections.map((section, index) => (
                        <View key={index}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                {section.description && (
                                    <Text style={styles.sectionDescription}>{section.description}</Text>
                                )}
                            </View>

                            {section.items.map((item, itemIndex) => (
                                <View key={itemIndex} style={styles.itemRow}>
                                    <View style={styles.itemTitle}>
                                        <Text>{item.title}</Text>
                                        {item.description && (
                                            <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
                                                {item.description}
                                            </Text>
                                        )}
                                        {item.is_optional && (
                                            <Text style={{ fontSize: 8, color: '#f59e0b', marginTop: 2 }}>
                                                [OPCJONALNIE]
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={styles.itemQty}>{item.quantity} szt.</Text>
                                    <Text style={styles.itemPrice}>{item.price.toLocaleString()} PLN</Text>
                                </View>
                            ))}
                        </View>
                    ))}

                    {/* Total */}
                    <View style={styles.totalSection}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>SUMA:</Text>
                            <Text style={styles.totalValue}>
                                {offer.total_price.toLocaleString('pl-PL')} PLN
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Przemysław Właśniewski Fotografia • wlasniewski.pl • +48 530 788 694
                </Text>
            </Page>
        </Document>
    );
};
