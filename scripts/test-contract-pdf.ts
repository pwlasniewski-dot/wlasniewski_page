import { generateContractPDF } from '../src/lib/services/pdf';
import fs from 'fs';

async function testContract() {
    try {
        console.log('Generating Contract PDF...');
        const dummyContract = {
            id: 'test-contract-1',
            content: 'Dummy contract content for verification.'
        };
        const buffer = await generateContractPDF(dummyContract, 'Jan Kowalski', '2026-05-30');
        fs.writeFileSync('test-contract.pdf', buffer);
        console.log('Contract PDF generated successfully: test-contract.pdf');
    } catch (error) {
        console.error('FAILED TO GENERATE CONTRACT PDF:');
        console.error(error);
    }
}

testContract();
