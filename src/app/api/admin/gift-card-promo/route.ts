import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

// GET - Fetch promo settings
export async function GET() {
    try {
        // Get the first settings record (where columns are stored)
        const settings = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });

        // Check if promo is enabled from column
        if (!settings?.gift_card_promo_enabled) {
            return NextResponse.json({ enabled: false, messages: [] });
        }

        // Fetch promo messages from kv storage
        const messagesData = await prisma.setting.findFirst({
            where: { setting_key: 'gift_card_promo_messages' }
        });

        let messages = [];
        if (messagesData?.setting_value) {
            try {
                messages = JSON.parse(messagesData.setting_value);
            } catch (e) {
                messages = getDefaultMessages();
            }
        } else {
            messages = getDefaultMessages();
        }

        return NextResponse.json({
            enabled: true,
            messages
        });
    } catch (error: any) {
        console.error('Error fetching promo settings:', error);
        return NextResponse.json(
            { enabled: false, messages: [], error: error.message },
            { status: 500 }
        );
    }
}

// POST - Save/Update promo settings
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();
            const { enabled, messages } = body;

            // Update enable/disable setting
            await prisma.setting.upsert({
                where: { setting_key: 'gift_card_promo_enabled' },
                update: { setting_value: enabled ? 'true' : 'false' },
                create: {
                    setting_key: 'gift_card_promo_enabled',
                    setting_value: enabled ? 'true' : 'false'
                }
            });

            // Update messages
            if (messages && Array.isArray(messages)) {
                await prisma.setting.upsert({
                    where: { setting_key: 'gift_card_promo_messages' },
                    update: { setting_value: JSON.stringify(messages) },
                    create: {
                        setting_key: 'gift_card_promo_messages',
                        setting_value: JSON.stringify(messages)
                    }
                });
            }

            return NextResponse.json({ success: true });
        } catch (error: any) {
            console.error('Error saving promo settings:', error);
            return NextResponse.json(
                { error: 'Failed to save promo settings', details: error.message },
                { status: 500 }
            );
        }
    });
}

function getDefaultMessages() {
    return [
        {
            id: 1,
            title: '🎁 Chcesz podarować sesję?',
            message: 'Kup kartę podarunkową na dowolną wartość',
            cta_text: 'Kup kartę',
            icon: '🎁',
            colors: { bg: '#DC143C', accent: '#FFD700' }
        },
        {
            id: 2,
            title: '💝 Karta dla ukochanej osoby',
            message: 'Spersonalizowana karta do wysłania mailem lub wydruku',
            cta_text: 'Wybierz kartę',
            icon: '💝',
            colors: { bg: '#C71585', accent: '#FFB6C1' }
        },
        {
            id: 3,
            title: '🎉 Na każdą okazję',
            message: 'Kartę możesz spersonalizować własnymi słowami',
            cta_text: 'Odkryj wzory',
            icon: '🎉',
            colors: { bg: '#1E90FF', accent: '#FFD700' }
        },
        {
            id: 4,
            title: '📸 Prezent dla fotografii',
            message: 'Idealne rozwiązanie na każde święto',
            cta_text: 'Przejdź do sklepu',
            icon: '📸',
            colors: { bg: '#9932CC', accent: '#FFD700' }
        }
    ];
}
