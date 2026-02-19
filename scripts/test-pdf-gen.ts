import prisma from '../src/lib/db/prisma';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

async function test() {
    try {
        // Get first available offer
        const offer = await prisma.offer.findFirst({
            include: {
                sections: {
                    include: { items: true },
                },
            },
        });

        if (!offer) {
            console.error('No offers found in database');
            return;
        }

        console.log(`Testing PDF generation for offer: ${offer.id} - ${offer.title}`);

        const tempIn = path.join(os.tmpdir(), `offer-in-test.json`);
        const tempOut = path.join(os.tmpdir(), `offer-out-test.pdf`);

        fs.writeFileSync(tempIn, JSON.stringify(offer));

        const localTsx = path.join(process.cwd(), 'node_modules', '.bin', 'tsx');
        const scriptPath = path.join(process.cwd(), 'scripts', 'isolated-pdf-gen.ts');
        const cmd = `"${localTsx}" "${scriptPath}" "${tempIn}" "${tempOut}" "offer"`;

        console.log('Running command:', cmd);
        execSync(cmd, {
            cwd: process.cwd(),
            timeout: 30000,
            stdio: 'inherit'
        });

        if (fs.existsSync(tempOut)) {
            const stat = fs.statSync(tempOut);
            console.log(`✅ PDF generated successfully! Size: ${stat.size} bytes`);
            // Copy to project dir for inspection
            fs.copyFileSync(tempOut, `test-offer-${offer.id}.pdf`);
            console.log(`PDF saved to: test-offer-${offer.id}.pdf`);
        } else {
            console.error('❌ PDF file was not created');
        }

        // Cleanup
        if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
        if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);

    } catch (error) {
        console.error('FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
