import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { generateGroupGalleryAccessToken } from '@/lib/auth/group-gallery-access';
import { getGroupPrintPrices } from '@/lib/galleries/group-settings';

/**
 * POST /api/galleries/group/auth
 * Authenticate access to a GROUP mode gallery using shared access code and optional password
 * RATE LIMITED: 10 attempts per 15 minutes per IP
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting to prevent brute-force attacks
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`auth:${clientIp}`, 10, 15 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' },
        { status: 429 }
      );
    }

    const { access_code, password } = await request.json();

    if (!access_code) {
      return NextResponse.json(
        { error: 'Kod dostępu jest wymagany' },
        { status: 400 }
      );
    }

    // SECURITY: Validate input length
    if (access_code.length > 50 || (password && password.length > 200)) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane' },
        { status: 400 }
      );
    }

    const normalizedCode = access_code.trim().toUpperCase();

    // group_access_code is unique - use findUnique for index-friendly lookup
    const [gallery, printPrices] = await Promise.all([
      prisma.clientGallery.findUnique({
        where: {
          group_access_code: normalizedCode,
        },
        select: {
          id: true,
          client_name: true,
          description: true,
          group_password: true,
          max_photos_for_print: true,
          allow_extra_photo_purchase: true,
          price_per_premium: true,
          expires_at: true,
          gallery_mode: true,
          is_active: true,
        },
      }),
      getGroupPrintPrices(),
    ]);

    if (!gallery || gallery.gallery_mode !== 'GROUP' || !gallery.is_active) {
      return NextResponse.json(
        { error: 'Nieprawidłowy kod dostępu' },
        { status: 404 }
      );
    }

    // Check if gallery is expired
    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Galeria wygasła' },
        { status: 403 }
      );
    }

    // Verify password if set.
    // Trim the stored password too: an accidental trailing space/newline saved
    // during gallery creation must never make a correct password fail forever.
    const storedPassword = (gallery.group_password || '').trim();
    if (storedPassword) {
      if (!password) {
        return NextResponse.json(
          { error: 'Hasło jest wymagane' },
          { status: 401 }
        );
      }

      if (password.trim().toLowerCase() !== storedPassword.toLowerCase()) {
        return NextResponse.json(
          { error: 'Nieprawidłowe hasło' },
          { status: 401 }
        );
      }
    }

    const accessToken = await generateGroupGalleryAccessToken(gallery.id);

    // Return gallery info
    return NextResponse.json({
      gallery_id: gallery.id,
      gallery_name: gallery.client_name,
      description: gallery.description,
      max_photos_for_print: gallery.max_photos_for_print || 5,
      allow_extra_photo_purchase: gallery.allow_extra_photo_purchase,
      price_per_premium: gallery.price_per_premium,
      group_print_price_10x15: printPrices.price10x15,
      group_print_price_15x21: printPrices.price15x21,
      expires_at: gallery.expires_at,
      access_token: accessToken,
    });

  } catch (error) {
    console.error('Group auth error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas uwierzytelniania' },
      { status: 500 }
    );
  }
}
