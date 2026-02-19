import { pdf, Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';
import fs from 'fs';

const MyComp = ({ text }: { text: string }) => (
    <Document>
    <Page size= "A4" >
    <View>
    <Text>{ text } </Text>
    </View>
    </Page>
    </Document>
);

async function testComp() {
    try {
        console.log('Generating COMP PDF...');
        // Use React.createElement to be safe
        const element = React.createElement(MyComp, { text: 'Hello from MyComp' });

        const buffer = await pdf(element as any).toBuffer();
        console.log('COMP PDF returned type:', typeof buffer);
        console.log('COMP PDF object:', buffer.constructor.name);
    } catch (error) {
        console.error('FAILED TO GENERATE COMP PDF:');
        console.error(error);
    }
}

testComp();
