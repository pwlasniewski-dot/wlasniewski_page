import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/galleries/group/participant/[id]/consent
 * Submit publication consent for GROUP mode participant
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const participantId = parseInt(params.id);
    const { consent, scope } = await request.json();

    if (isNaN(participantId)) {
      return NextResponse.json(
        { error: 'Nieprawidłowe ID uczestnika' },
        { status: 400 }
      );
    }

    if (typeof consent !== 'boolean') {
      return NextResponse.json(
        { error: 'Parametr consent jest wymagany' },
        { status: 400 }
      );
    }

    // Validate scope if consent is given
    if (consent && !['ALL', 'SELECTED'].includes(scope)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy zakres zgody. Użyj: ALL lub SELECTED' },
        { status: 400 }
      );
    }

    // Get participant
    const participant = await prisma.galleryParticipant.findUnique({
      where: { id: participantId },
      include: {
        gallery: {
          select: {
            gallery_mode: true,
          },
        },
      },
    });

    if (!participant || participant.gallery.gallery_mode !== 'GROUP') {
      return NextResponse.json(
        { error: 'Uczestnik nie istnieje' },
        { status: 404 }
      );
    }

    // Verify parent data exists before accepting consent
    if (consent && !participant.parent_name) {
      return NextResponse.json(
        { error: 'Dane rodzica są wymagane przed wyrażeniem zgody' },
        { status: 400 }
      );
    }

    // Update consent
    const updated = await prisma.galleryParticipant.update({
      where: { id: participantId },
      data: {
        publication_consent: consent,
        consent_scope: consent ? scope : null,
        consent_given_at: consent ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      publication_consent: updated.publication_consent,
      consent_scope: updated.consent_scope,
      consent_given_at: updated.consent_given_at,
      consent_given_by: updated.parent_name,
    });

  } catch (error) {
    console.error('Consent error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas zapisywania zgody' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/galleries/group/participant/[id]/consent
 * Get current consent status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const participantId = parseInt(params.id);

    if (isNaN(participantId)) {
      return NextResponse.json(
        { error: 'Nieprawidłowe ID uczestnika' },
        { status: 400 }
      );
    }

    const participant = await prisma.galleryParticipant.findUnique({
      where: { id: participantId },
      select: {
        publication_consent: true,
        consent_scope: true,
        consent_given_at: true,
        parent_name: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Uczestnik nie istnieje' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      publication_consent: participant.publication_consent,
      consent_scope: participant.consent_scope,
      consent_given_at: participant.consent_given_at,
      consent_given_by: participant.parent_name,
    });

  } catch (error) {
    console.error('Get consent error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania zgody' },
      { status: 500 }
    );
  }
}
