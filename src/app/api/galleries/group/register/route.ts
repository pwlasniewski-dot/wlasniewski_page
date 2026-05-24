import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import crypto from 'crypto';
import { generateParentToken } from '@/lib/auth/parent-jwt';
import { AVAILABLE_AVATARS } from '@/lib/gallery/avatars';
import { getAdminEmail, sendEmail } from '@/lib/email/sender';

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

    if (!gallery_id || !access_code || !parent_name || !avatar || !parent_email) {
      return NextResponse.json(
        { error: 'ID galerii, kod dostępu, imię rodzica, email i awatar są wymagane' },
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

    const normalizedEmail = String(parent_email || '').trim().toLowerCase();

    // SECURITY: Validate email format (required)
    {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 200) {
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
        client_name: true,
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

    // One parent profile per email in a gallery to simplify cross-device login.
    let existingByEmail = await prisma.galleryParticipant.findFirst({
      where: {
        gallery_id: gallery_id,
        parent_email: normalizedEmail,
      },
      select: { id: true, parent_identifier: true },
    });

    if (!existingByEmail) {
      existingByEmail = await prisma.galleryParticipant.findFirst({
        where: {
          gallery_id: gallery_id,
          parent_email: { equals: normalizedEmail, mode: 'insensitive' },
        },
        select: { id: true, parent_identifier: true },
      });
    }

    if (existingByEmail) {
      return NextResponse.json(
        {
          error: 'Ten email ma już profil w tej galerii. Użyj logowania po emailu.',
          code: 'EMAIL_ALREADY_REGISTERED',
          parent_identifier: existingByEmail.parent_identifier,
        },
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
        parent_email: normalizedEmail,
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

    // Send identifier summary email (best-effort).
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
      const galleryUrl = `${appUrl}/galeria/grupowa?code=${encodeURIComponent(String(access_code).trim().toUpperCase())}`;
      await sendEmail({
        to: normalizedEmail,
        subject: `Twój dostęp do galerii grupowej: ${participant.parent_identifier}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:640px;margin:0 auto;padding:24px;">
            <h2 style="margin:0 0 12px;">Twój profil rodzica został utworzony</h2>
            <p>Cześć ${participant.parent_name || 'Rodzicu'},</p>
            <p>zapisaliśmy Twój dostęp do galerii grupowej.</p>
            <div style="background:#f5f5f5;border:1px solid #e5e5e5;border-radius:10px;padding:14px 16px;margin:16px 0;">
              <p style="margin:0 0 6px;"><strong>Twój identyfikator rodzica:</strong></p>
              <p style="margin:0;font-size:22px;letter-spacing:1px;"><strong>${participant.parent_identifier}</strong></p>
            </div>
            <p>Możesz logować się na innym urządzeniu po emailu lub po identyfikatorze.</p>
            <p><a href="${galleryUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;">Przejdź do galerii</a></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send group participant identifier email:', emailError);
    }

    // Notify admin about new parent profile in group gallery (best-effort).
    try {
      const adminEmail = await getAdminEmail();
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `Nowy rodzic w galerii grupowej: ${participant.parent_identifier}`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:680px;margin:0 auto;padding:24px;">
              <h2 style="margin:0 0 12px;">Nowa rejestracja rodzica</h2>
              <p>Rodzic właśnie założył profil w galerii grupowej.</p>
              <table style="width:100%;border-collapse:collapse;margin-top:12px;">
                <tr><td style="padding:6px 0;color:#666;">Galeria</td><td style="padding:6px 0;"><strong>${gallery.client_name || `#${gallery.id}`}</strong></td></tr>
                <tr><td style="padding:6px 0;color:#666;">ID galerii</td><td style="padding:6px 0;">${gallery.id}</td></tr>
                <tr><td style="padding:6px 0;color:#666;">Rodzic</td><td style="padding:6px 0;">${participant.parent_name || '-'}</td></tr>
                <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;">${participant.parent_email || '-'}</td></tr>
                <tr><td style="padding:6px 0;color:#666;">Telefon</td><td style="padding:6px 0;">${participant.parent_phone || '-'}</td></tr>
                <tr><td style="padding:6px 0;color:#666;">Identyfikator</td><td style="padding:6px 0;"><strong>${participant.parent_identifier || '-'}</strong></td></tr>
                <tr><td style="padding:6px 0;color:#666;">Awatar</td><td style="padding:6px 0;">${participant.avatar || '-'}</td></tr>
              </table>
            </div>
          `,
        });
      }
    } catch (adminNotifyError) {
      console.error('Failed to send admin notification about group parent registration:', adminNotifyError);
    }

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
