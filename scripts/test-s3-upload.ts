import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function testUpload() {
    try {
        console.log('--- RE-IMPORTING S3 ---');
        const { uploadToS3 } = await import('../src/lib/storage/s3');

        console.log('Testing S3 upload...');
        const buffer = Buffer.from('Hello S3 Test ' + Date.now());
        const url = await uploadToS3(buffer, 'test-upload.txt', 'text/plain');
        console.log('SUCCESS: Uploaded to', url);
    } catch (e: any) {
        console.error('UPLOAD TEST FAILED:', e.message);
        if (e.stack) console.error(e.stack);
    }
}

testUpload();
