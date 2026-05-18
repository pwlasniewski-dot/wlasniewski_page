import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import crypto from 'crypto';
import { generateParentToken } from '@/lib/auth/parent-jwt';
import { AVAILABLE_AVATARS } from '@/lib/gallery/avatars';

/**
 * Generate initials from full name
 * Examples:
 * - "Jan Kowalski" → "JK"
 * - "Anna Maria Nowak" → "AMN"
 * - "Jan" → "J"
 */
function generateInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  return words
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

/**
 * Generate unique parent identifier (initials + 4 digits)
 * Examples: "JK-4729", "AMN-1823"
 */
async function generateParentIdentifier(
  galleryId: number,
  parentName: string
): Promise<string> {
  const initials = generateInitials(parentName);
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate 4 random digits
    const digits = crypto.randomInt(1000, 9999).toString();
    const identifier = `${initials}-${digits}`;

    // Check if unique within this gallery
    const existing = await prisma.galleryParticipant.findFirst({
      where: {
        gallery_id: galleryId,
        parent_identifier: identifier,
      },
    });

    if (!existing) {
      return identifier;
    }

    attempts++;
  }

  // Fallback: use timestamp if all attempts failed
  const timestamp = Date.now().toString().slice(-4);
  return `${initials}-${timestamp}`;
}

/**
 * POST /api/galleries/group/register
 * Register a parent in GROUP mode gallery
 */
export async function POST(request: NextRequest) {
  try {
    const { gallery_id, access_code, parent_name, avatar, parent_email, parent_phone } = await request.json();

    if (!gallery_id || !access_code || !parent_name || !avatar) {
      return NextResponse.json(
        { error: 'ID galerii, kod dostępu, imię rodzica i awatar są wymagane' },
        { status: 400 }
      );
    }

    // SECURITY: Validate avatar is in allowed list (prevents XSS via emoji injection)
    if (!AVAILABLE_AVATARS.includes(avatar)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy awatar' },
        { status: 400 }
      );
    }

    // SECURITY: Validate input lengths to prevent DoS
    if (parent_name.length > 100) {
      return NextResponse.json(
        { error: 'Imię jest za długie (max 100 znaków)' },
        { status: 400 }
      );
    }

    // SECURITY: Validate email format if provided
    if (parent_email && parent_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(parent_email.trim()) || parent_email.length > 200) {
        return NextResponse.json(
          { error: 'Nieprawidłowy format email' },
          { status: 400 }
        );
      }
    }

    // SECURITY: Validate phone format if provided (digits, spaces, +, -)
    if (parent_phone && parent_phone.trim()) {
      const phoneRegex = /^[\d\s\-+()]{6,20}$/;
      if (!phoneRegex.test(parent_phone.trim())) {
        return NextResponse.json(
          { error: 'Nieprawidłowy format numeru telefonu' },
          { status: 400 }
        );
      }
    }

    // Verify gallery exists, is in GROUP mode, and access_code matches
    const gallery = await prisma.clientGallery.findFirst({
      where: {
        id: gallery_id,
        group_access_code: access_code.trim().toUpperCase(),
        gallery_mode: 'GROUP',
        is_active: true,
      },
      select: {
        id: true,
        max_photos_for_print: true,
        group_password: true,
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Nieprawidłowy kod dostępu lub galeria nie istnieje' },
        { status: 404 }
      );
    }

    // SECURITY: Check if avatar is still available (race condition protection)
    const avatarTaken = await prisma.galleryParticipant.findFirst({
      where: {
        gallery_id: gallery_id,
        avatar: avatar,
      },
      select: { id: true },
    });

    if (avatarTaken) {
      return NextResponse.json(
        { error: 'Ten awatar został już wybrany przez innego rodzica. Wybierz inny.' },
        { status: 409 }
      );
    }

    // Generate unique parent identifier
    const parentIdentifier = await generateParentIdentifier(gallery_id, parent_name);

    // Create participant record
    const participant = await prisma.galleryParticipant.create({
      data: {
        gallery_id: gallery_id,
        parent_identifier: parentIdentifier,
        avatar: avatar,
        parent_name: parent_name.trim(),
        parent_email: parent_email?.trim() || null,
        parent_phone: parent_phone?.trim() || null,
        first_login_at: new Date(),
        name: parent_name.trim(), // Pole wymagane przez schemę - używamy imienia rodzica
        max_selections: gallery.max_photos_for_print || 5,
        publication_consent: false,
      },
    });

    // Generate JWT token for parent authorization
    const token = await generateParentToken({
      participant_id: participant.id,
      gallery_id: gallery_id,
      parent_identifier: parentIdentifier,
    });

    return NextResponse.json({
      participant_id: participant.id,
      parent_identifier: parentIdentifier,
      parent_name: participant.parent_name,
      avatar: avatar,
      max_selections: participant.max_selections,
      token: token,
    });

  } catch (error) {
    console.error('Group register error:', error);
    
    // Handle unique constraint violation
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Ten identyfikator jest już zajęty. Spróbuj ponownie.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas rejestracji' },
      { status: 500 }
    );
  }
}
