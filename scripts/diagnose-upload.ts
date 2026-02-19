
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { uploadToS3 } from '../src/lib/storage/s3';

dotenv.config();

const prisma = new PrismaClient();

async function diagnose() {
    console.log("--- Gallery Upload Diagnosis ---");

    // 1. Check DB Connection and Tables
    try {
        console.log("1. Testing Database connection...");
        const count = await prisma.clientGallery.count();
        console.log(`   Success: Found ${count} galleries.`);

        console.log("2. Checking gallery_photos table...");
        const photoCount = await prisma.galleryPhoto.count();
        console.log(`   Success: Found ${photoCount} photos.`);
    } catch (err: any) {
        console.error("   DB Error:", err.message);
    }

    // 2. Check S3 Config
    console.log("3. Checking S3 Configuration...");
    console.log("   S3_BUCKET:", process.env.S3_BUCKET || "MISSING");
    console.log("   S3_REGION:", process.env.S3_REGION || "MISSING");
    console.log("   AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "SET" : "MISSING");
    console.log("   AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "SET" : "MISSING");

    // 3. Test S3 Upload with dummy buffer
    try {
        console.log("4. Testing S3 Upload...");
        const dummyBuffer = Buffer.from("test content");
        const url = await uploadToS3(dummyBuffer, "test/diagnose.txt", "text/plain");
        console.log("   Success: Uploaded to", url);
    } catch (err: any) {
        console.error("   S3 Error:", err.message);
    }

    await prisma.$disconnect();
}

diagnose();
