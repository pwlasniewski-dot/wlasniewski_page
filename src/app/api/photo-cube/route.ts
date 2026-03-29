import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'photo_cube_3d';

// GET — public read (needed for homepage rendering)
export async function GET() {
  try {
    const row = await prisma.setting.findFirst({
      where: { setting_key: SETTING_KEY },
    });

    if (!row || !row.setting_value) {
      return NextResponse.json({ success: true, settings: null });
    }

    const settings = JSON.parse(row.setting_value);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Failed to fetch photo-cube settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST — admin only, save settings
export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const body = await request.json();

      // Validate critical fields
      const settings = {
        enabled: Boolean(body.enabled),
        mode: body.mode === 'intro' ? 'intro' : 'section',
        cube_size: Math.max(80, Math.min(800, Number(body.cube_size) || 280)),
        image_fit: body.image_fit === 'contain' ? 'contain' : 'cover',
        rotation_speed: Math.max(0.05, Math.min(3, Number(body.rotation_speed) || 0.4)),
        smoothness: Math.max(0.5, Math.min(0.999, Number(body.smoothness) || 0.95)),
        entry_speed: Math.max(300, Math.min(10000, Number(body.entry_speed) || 2200)),
        entry_direction: body.entry_direction === 'right' ? 'right' : 'left',
        background_color: typeof body.background_color === 'string' ? body.background_color.slice(0, 20) : '#ffffff',
        title: typeof body.title === 'string' ? body.title.slice(0, 200) : '',
        subtitle: typeof body.subtitle === 'string' ? body.subtitle.slice(0, 200) : '',
        images: Array.isArray(body.images)
          ? body.images.filter((u: unknown) => typeof u === 'string').slice(0, 6)
          : [],
      };

      // Upsert: use the key-value pattern already in the project
      await prisma.setting.upsert({
        where: { setting_key: SETTING_KEY },
        update: {
          setting_value: JSON.stringify(settings),
          updated_at: new Date(),
        },
        create: {
          setting_key: SETTING_KEY,
          setting_value: JSON.stringify(settings),
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Failed to save photo-cube settings:', error);
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }
  });
}
