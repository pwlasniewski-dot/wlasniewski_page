import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import crypto from 'crypto';
import { generateParentToken } from '@/lib/auth/parent-jwt';

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
    const { gallery_id, access_code, parent_name, parent_email, parent_phone } = await request.json();

    if (!gallery_id || !access_code || !parent_name) {
      return NextResponse.json(
        { error: 'ID galerii, kod dostępu i imię rodzica są wymagane' },
        { status: 400 }
      );
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

    // Generate unique parent identifier
    const parentIdentifier = await generateParentIdentifier(gallery_id, parent_name);

    // Create participant record
    const participant = await prisma.galleryParticipant.create({
      data: {
        gallery_id: gallery_id,
        parent_identifier: parentIdentifier,
        parent_name: parent_name.trim(),
        parent_email: parent_email?.trim() || null,
        parent_phone: parent_phone?.trim() || null,
        first_login_at: new Date(),
        name: parent_name.trim(), // Use parent name as participant name
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
      max_selections: participant.max_selections,
      token: token, // JWT token for future requests
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
