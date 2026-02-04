import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 30 },
    title: { fontSize: 24, marginBottom: 20 },
    section: { marginBottom: 10 },
});

export const OfferDocument: React.FC<{ offer: any }> = ({ offer }) => (
    <Document>
        <Page style={styles.page}>
            <Text style={styles.title}>Oferta</Text>
            <View style={styles.section}>
                <Text>{offer?.title || 'Untitled Offer'}</Text>
            </View>
        </Page>
    </Document>
);
