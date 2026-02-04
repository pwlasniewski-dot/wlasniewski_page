import { google } from 'googleapis';
import prisma from '@/lib/db/prisma';

interface GoogleDriveCredentials {
    client_id: string;
    client_secret: string;
    refresh_token?: string;
    access_token?: string;
}

export async function getGoogleDriveCredentials(): Promise<GoogleDriveCredentials | null> {
    try {
        // Fetch credentials from Settings table
        const clientIdSetting = await prisma.setting.findUnique({
            where: { setting_key: 'google_drive_client_id' },
        });

        const clientSecretSetting = await prisma.setting.findUnique({
            where: { setting_key: 'google_drive_client_secret' },
        });

        const refreshTokenSetting = await prisma.setting.findUnique({
            where: { setting_key: 'google_drive_refresh_token' },
        });

        if (!clientIdSetting?.setting_value || !clientSecretSetting?.setting_value) {
            console.warn('Google Drive credentials not configured');
            return null;
        }

        return {
            client_id: clientIdSetting.setting_value,
            client_secret: clientSecretSetting.setting_value,
            refresh_token: refreshTokenSetting?.setting_value,
        };
    } catch (error) {
        console.error('Error fetching Google Drive credentials:', error);
        return null;
    }
}

export async function uploadPDFToGoogleDrive(
    pdfBuffer: Buffer,
    fileName: string,
    mimeType: string = 'application/pdf'
): Promise<string | null> {
    try {
        const credentials = await getGoogleDriveCredentials();

        if (!credentials) {
            console.warn('Google Drive not configured');
            return null;
        }

        const auth = new google.auth.OAuth2(
            credentials.client_id,
            credentials.client_secret
        );

        if (credentials.refresh_token) {
            auth.setCredentials({
                refresh_token: credentials.refresh_token,
            });
        }

        const drive = google.drive({ version: 'v3', auth });

        // Create file
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: mimeType,
                parents: ['appDataFolder'], // Store in app-specific folder
            },
            media: {
                mimeType: mimeType,
                body: pdfBuffer as any,
            },
        });

        if (!response.data.id) {
            throw new Error('Failed to get file ID from Google Drive response');
        }

        // Generate public URL
        const fileId = response.data.id;
        const fileUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

        return fileUrl;
    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        return null;
    }
}

export async function getGoogleDriveFileUrl(fileId: string): Promise<string> {
    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}

export async function deleteFromGoogleDrive(fileId: string): Promise<boolean> {
    try {
        const credentials = await getGoogleDriveCredentials();

        if (!credentials) {
            return false;
        }

        const auth = new google.auth.OAuth2(
            credentials.client_id,
            credentials.client_secret
        );

        if (credentials.refresh_token) {
            auth.setCredentials({
                refresh_token: credentials.refresh_token,
            });
        }

        const drive = google.drive({ version: 'v3', auth });

        await drive.files.delete({
            fileId: fileId,
        });

        return true;
    } catch (error) {
        console.error('Error deleting from Google Drive:', error);
        return false;
    }
}

export async function updateGoogleDriveCredentials(
    clientId: string,
    clientSecret: string,
    refreshToken?: string
): Promise<boolean> {
    try {
        // Update or create settings
        await prisma.setting.upsert({
            where: { setting_key: 'google_drive_client_id' },
            update: { setting_value: clientId },
            create: { setting_key: 'google_drive_client_id', setting_value: clientId },
        });

        await prisma.setting.upsert({
            where: { setting_key: 'google_drive_client_secret' },
            update: { setting_value: clientSecret },
            create: { setting_key: 'google_drive_client_secret', setting_value: clientSecret },
        });

        if (refreshToken) {
            await prisma.setting.upsert({
                where: { setting_key: 'google_drive_refresh_token' },
                update: { setting_value: refreshToken },
                create: { setting_key: 'google_drive_refresh_token', setting_value: refreshToken },
            });
        }

        return true;
    } catch (error) {
        console.error('Error updating Google Drive credentials:', error);
        return false;
    }
}
