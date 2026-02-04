import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 50,
        fontFamily: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.6,
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 30,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1e3a8a',
    },
    paragraph: {
        marginBottom: 8,
        textAlign: 'justify',
    },
    clause: {
        marginBottom: 12,
    },
    signatureSection: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '45%',
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        marginTop: 50,
        paddingTop: 8,
        textAlign: 'center',
        fontSize: 9,
    },
    metadata: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#f1f5f9',
        fontSize: 8,
        color: '#64748b',
    },
});

interface ContractDocumentProps {
    contract: {
        offer: {
            title: string;
            type: string;
            client_email?: string;
            total_price: number;
            sections: any[];
        };
        content?: string;
        signed_at?: string;
        signature_data?: string;
    };
    clientName?: string;
    eventDate?: string;
}

export const ContractDocument: React.FC<ContractDocumentProps> = ({
    contract,
    clientName,
    eventDate,
}) => {
    const today = new Date().toLocaleDateString('pl-PL');
    const isB2B = contract.offer.type === 'b2b';

    // Variable interpolation
    const interpolate = (text: string) => {
        return text
            .replace(/{{ClientName}}/g, clientName || contract.offer.client_email || '[KLIENT]')
            .replace(/{{TotalPrice}}/g, contract.offer.total_price.toLocaleString())
            .replace(/{{EventDate}}/g, eventDate || '[DATA]')
            .replace(/{{OfferTitle}}/g, contract.offer.title)
            .replace(/{{TodayDate}}/g, today);
    };

    const defaultContent = isB2B
        ? `UMOWA WSPÓŁPRACY BIZNESOWEJ

Zawarta w dniu {{TodayDate}} w Toruniu, pomiędzy:

Zamawiającym: {{ClientName}}
a
Wykonawcą: Przemysław Właśniewski, prowadzącym działalność gospodarczą pod nazwą "Przemysław Właśniewski Fotografia", NIP: 8781430365

§1 PRZEDMIOT UMOWY
1. Wykonawca zobowiązuje się do wykonania dzieła: {{OfferTitle}}.
2. Zakres prac został szczegółowo określony w ofercie stanowiącej załącznik do niniejszej umowy.

§2 WYNAGRODZENIE
1. Wynagrodzenie całkowite wynosi: {{TotalPrice}} PLN netto.
2. Płatność: przelewem na rachunek bankowy Wykonawcy w terminie 14 dni od daty wystawienia faktury.

§3 PRAWA AUTORSKIE
1. Wykonawca pozostaje właścicielem praw autorskich do wykonanych materiałów.
2. Zamawiający nabywa prawo do użytku zgodnie z zakresem określonym w ofercie.

§4 ODPOWIEDZIALNOŚĆ
1. Strony ponoszą odpowiedzialność zgodnie z obowiązującymi przepisami prawa.

§5 POSTANOWIENIA KOŃCOWE
1. W sprawach nieuregulowanych niniejszą umową mają zastosowanie przepisy Kodeksu Cywilnego.
2. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze stron.`
        : `UMOWA O DZIEŁO FOTOGRAFICZNE

Zawarta w dniu {{TodayDate}}, pomiędzy:

Klientem: {{ClientName}}
a
Fotografem: Przemysław Właśniewski

§1 ZAKRES USŁUGI
1. Fotograf wykona zdjęcia w ramach pakietu: {{OfferTitle}}.
2. Szczegółowy zakres usługi został określony w ofercie stanowiącej integralną część tej umowy.

§2 TERMIN I MIEJSCE
1. Data sesji: {{EventDate}}.
2. Miejsce: do uzgodnienia z Klientem najpóźniej 7 dni przed sesją.

§3 PŁATNOŚĆ
1. Łączna kwota za usługę: {{TotalPrice}} PLN.
2. Zaliczka 30% płatna przy podpisaniu umowy.
3. Pozostała kwota płatna przed sesją.

§4 MATERIAŁY I ODBIÓR
1. Fotograf dostarczy zdjęcia w formie elektronicznej (Galeria Online) w terminie do 30 dni od daty sesji.
2. Klient potwierdza odbiór materiałów w ciągu 7 dni od powiadomienia.

§5 PRAWA DO WIZERUNKU (RODO)
1. Klient wyraża zgodę na wykorzystanie zdjęć przez Fotografa w celach promocyjnych (portfolio, social media).
2. Klient może w każdej chwili odwołać zgodę, kontaktując się z Fotografem.

§6 POSTANOWIENIA KOŃCOWE
1. Umowa wchodzi w życie z chwilą podpisania przez obie strony.
2. Wszelkie zmiany umowy wymagają formy pisemnej.`;

    const contentToDisplay = contract.content
        ? interpolate(contract.content)
        : interpolate(defaultContent);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>Umowa</Text>

                <View style={styles.section}>
                    <Text style={styles.paragraph}>{contentToDisplay}</Text>
                </View>

                {/* Signature Section */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>Podpis Klienta</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>Podpis Fotografa</Text>
                    </View>
                </View>

                {/* Metadata (if signed) */}
                {contract.signed_at && (
                    <View style={styles.metadata}>
                        <Text>Podpisano cyfrowo: {new Date(contract.signed_at).toLocaleString('pl-PL')}</Text>
                        <Text>Identyfikator dokumentu: {contract.offer.title.substring(0, 20)}</Text>
                    </View>
                )}
            </Page>
        </Document>
    );
};
