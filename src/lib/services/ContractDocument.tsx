import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 30 },
    title: { fontSize: 24, marginBottom: 20 },
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
