/**
 * CRM Activity Tracker
 * 
 * Logs every client action in the CRM flow:
 * offers, contracts, signing, downloads, selections, errors
 */

import prisma from '@/lib/db/prisma';
import { NextRequest } from 'next/server';

export type CrmAction =
    | 'login'
    | 'offer_viewed'
    | 'offer_pdf_downloaded'
    | 'offer_selection_changed'
    | 'offer_accepted'
    | 'offer_rejected'
    | 'offer_negotiate'
    | 'contract_viewed'
    | 'contract_pdf_downloaded'
    | 'contract_signed'
    | 'contract_note_added'
    | 'contract_scan_uploaded'
    | 'gallery_viewed'
    | 'gallery_photo_selected'
    | 'gallery_order_placed'
    | 'password_reset_requested'
    | 'profile_updated'
    | 'error';

interface LogActivityParams {
    clientId?: number | null;
    clientEmail?: string | null;
    action: CrmAction;
    entityType?: 'offer' | 'contract' | 'gallery' | 'order' | null;
    entityId?: number | null;
    details?: Record<string, any> | null;
    request?: NextRequest | null;
}

/**
 * Log a CRM activity. Fire-and-forget (non-blocking).
 */
export function logCrmActivity(params: LogActivityParams): void {
    const {
        clientId,
        clientEmail,
        action,
        entityType,
        entityId,
        details,
        request,
    } = params;

    // Extract request metadata
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (request) {
        ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            request.headers.get('cf-connecting-ip') ||
            null;
        userAgent = request.headers.get('user-agent') || null;
    }

    // Fire-and-forget — don't await, don't block the response
    prisma.crmActivity.create({
        data: {
            client_id: clientId ?? null,
            client_email: clientEmail ?? null,
            action,
            entity_type: entityType ?? null,
            entity_id: entityId ?? null,
            details: details ? JSON.stringify(details) : null,
            ip_address: ipAddress,
            user_agent: userAgent ? userAgent.substring(0, 500) : null,
        }
    }).catch((err) => {
        console.error('[CRM_ACTIVITY] Failed to log:', action, err.message);
    });
}

/**
 * Helper: extract client info from decoded JWT + log activity
 */
export function logClientActivity(
    decoded: { id?: number; email?: string } | null,
    action: CrmAction,
    opts?: {
        entityType?: 'offer' | 'contract' | 'gallery' | 'order';
        entityId?: number;
        details?: Record<string, any>;
        request?: NextRequest;
    }
): void {
    logCrmActivity({
        clientId: decoded?.id,
        clientEmail: decoded?.email,
        action,
        entityType: opts?.entityType,
        entityId: opts?.entityId,
        details: opts?.details,
        request: opts?.request,
    });
}
