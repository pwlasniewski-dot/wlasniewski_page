import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import path from 'path';

// Use local paths for fonts to avoid 500 errors on Vercel/serverless environments
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
        console.log(`[FontLoader][Contract] Found at localPath: ${localPath}`);
        return localPath;
    }

    // 2. Try the bundled location inside the Netlify function
    const netlifyPath = path.resolve(__dirname, '..', '..', '..', 'public', 'fonts', fileName);
    if (fs.existsSync(netlifyPath)) {
        console.log(`[FontLoader][Contract] Found at netlifyPath: ${netlifyPath}`);
        return netlifyPath;
    }

    const netlifyPathAlt = path.resolve(__dirname, '..', 'public', 'fonts', fileName);
    if (fs.existsSync(netlifyPathAlt)) {
        console.log(`[FontLoader][Contract] Found at netlifyPathAlt: ${netlifyPathAlt}`);
        return netlifyPathAlt;
    }

    // 3. Fallback to public URL (for development or if local read fails)
    console.warn(`[FontLoader][Contract] Falling back to remote URL for ${fileName}`);
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

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Montserrat',
        fontSize: 10,
        lineHeight: 1.5,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        fontWeight: 700,
        textAlign: 'center',
    },
    headerInfo: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    content: {
        fontSize: 10,
        textAlign: 'justify',
        marginBottom: 30,
    },
    signatureBox: {
        marginTop: 40,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#c5a059',
        width: '50%',
        alignSelf: 'flex-end',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 5,
    }
});

export const ContractDocument: React.FC<{
    contract: any;
    clientName?: string;
    eventDate?: string;
    generationDate?: string;
}> = ({ contract, clientName, eventDate, generationDate }) => {
    const isSigned = contract?.status === 'signed' || contract?.status === 'SIGNED';
    const contractTitle = contract?.contract_number ? `Umowa nr ${contract.contract_number}` : 'Umowa o dzieło fotograficzne';
    return (
        <Document>
            <Page style={styles.page}>
                <Text style={styles.title}>{contractTitle}</Text>

                <View style={styles.headerInfo}>
                    <Text>Dotyczy Klienta: {clientName || 'N/A'}</Text>
                    {eventDate && <Text>Data wydarzenia: {eventDate}</Text>}
                </View>

                {contract?.content && (
                    <Text style={styles.content}>
                        {contract.content}
                    </Text>
                )}

                {isSigned && (
                    <View style={styles.signatureBox}>
                        <Text style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 5 }}>PODPISANO ELEKTRONICZNIE</Text>
                        <Text style={{ fontSize: 9, color: '#475569' }}>Przez klienta w systemie online</Text>
                        {contract.updated_at && <Text style={{ fontSize: 9, color: '#475569' }}>Data podpisu: {new Date(contract.updated_at).toLocaleString('pl-PL')}</Text>}
                    </View>
                )}

                {generationDate && (
                    <Text style={styles.footer} fixed>
                        Dokument pobrany/wygenerowany poprzez strefę klienta: {generationDate}
                    </Text>
                )}
            </Page>
        </Document>
    );
};
