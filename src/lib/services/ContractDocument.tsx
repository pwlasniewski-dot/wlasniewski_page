import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import path from 'path';

const fontsPath = path.join(process.cwd(), 'public', 'fonts');

// Use standard Windows system font for definitive Polish support in isolated process
const systemFont = 'C:/Windows/Fonts/arial.ttf';

Font.register({
    family: 'Montserrat',
    fonts: [
        { src: systemFont, fontWeight: 400 },
        { src: systemFont, fontWeight: 600 },
        { src: systemFont, fontWeight: 700 },
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Montserrat',
        fontSize: 10,
        lineHeight: 1.5,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        fontWeight: 700,
    },
    section: { marginBottom: 10 },
});

export const ContractDocument: React.FC<{
    contract: any;
    clientName?: string;
    eventDate?: string;
}> = ({ contract, clientName, eventDate }) => (
    <Document>
        <Page style={styles.page}>
            <Text style={styles.title}>Umowa</Text>
            <View style={styles.section}>
                <Text>Klient: {clientName || 'N/A'}</Text>
                <Text>Data: {eventDate || 'N/A'}</Text>
            </View>
        </Page>
    </Document>
);
