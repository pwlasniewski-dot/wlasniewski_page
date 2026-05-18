import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';

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

    // Find gallery by group_access_code
    const gallery = await prisma.clientGallery.findFirst({
      where: {
        group_access_code: access_code.trim().toUpperCase(),
        gallery_mode: 'GROUP',
        is_active: true,
      },
      select: {
        id: true,
        client_name: true,
        description: true,
        group_password: true,
        max_photos_for_print: true,
        expires_at: true,
      },
    });

    if (!gallery) {
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

    // Verify password if set
    if (gallery.group_password) {
      if (!password) {
        return NextResponse.json(
          { error: 'Hasło jest wymagane' },
          { status: 401 }
        );
      }

      if (password.trim() !== gallery.group_password) {
        return NextResponse.json(
          { error: 'Nieprawidłowe hasło' },
          { status: 401 }
        );
      }
    }

    // Return gallery info
    return NextResponse.json({
      gallery_id: gallery.id,
      gallery_name: gallery.client_name,
      description: gallery.description,
      max_photos_for_print: gallery.max_photos_for_print || 5,
      expires_at: gallery.expires_at,
    });

  } catch (error) {
    console.error('Group auth error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas uwierzytelniania' },
      { status: 500 }
    );
  }
}
