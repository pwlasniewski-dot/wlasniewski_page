// API Route: GET/POST /api/photo-challenge/settings
// Pobiera i aktualizuje ustawienia modułu

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const settings = await prisma.challengeSetting.findMany();

        // Convert array to object
        const settingsMap = settings.reduce((acc, curr) => {
            let value: any = curr.setting_value;

            // Type conversion
            if (curr.setting_type === 'boolean') {
                value = value === 'true';
            } else if (curr.setting_type === 'number') {
                value = Number(value);
            } else if (curr.setting_type === 'json') {
                try {
                    value = JSON.parse(value || '{}');
                } catch (e) {
                    value = {};
                }
            }

            acc[curr.setting_key] = value;
            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json({
            success: true,
            settings: settingsMap,
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się pobrać ustawień' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Update each setting
        for (const [key, value] of Object.entries(body)) {
            let type = 'text';
            let stringValue = String(value);

            if (typeof value === 'boolean') {
                type = 'boolean';
            } else if (typeof value === 'number') {
                type = 'number';
            } else if (typeof value === 'object') {
                type = 'json';
                stringValue = JSON.stringify(value);
            }

            await prisma.challengeSetting.upsert({
                where: { setting_key: key },
                update: {
                    setting_value: stringValue,
                    setting_type: type,
                },
                create: {
                    setting_key: key,
                    setting_value: stringValue,
                    setting_type: type,
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Ustawienia zaktualizowane',
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się zaktualizować ustawień' },
            { status: 500 }
        );
    }
}
