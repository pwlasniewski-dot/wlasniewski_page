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
    | 'offer_note_added'
    | 'contract_note_added'
    | 'contract_scan_uploaded'
    | 'gallery_viewed'
    | 'gallery_photo_selected'
    | 'gallery_order_placed'
    | 'password_reset_requested'
    | 'offer_sent'
    | 'offer_superseded'
    | 'contract_sent'
    | 'gallery_access_sent'
    | 'welcome_email_sent'
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
 * Log a CRM activity. Can be awaited for critical flows (e.g. login).
 */
export async function logCrmActivity(params: LogActivityParams): Promise<void> {
    try {
        await logCrmActivityStrict(params);
    } catch (err: any) {
        console.error('[CRM_ACTIVITY] Failed to log:', params.action, err?.message || String(err));
    }
}

/** Critical variant: persistence errors are deliberately propagated. */
export async function logCrmActivityStrict(params: LogActivityParams): Promise<void> {
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

    await prisma.crmActivity.create({
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
    });
}

export function logClientActivityStrict(
    decoded: { id?: number; email?: string } | null,
    action: CrmAction,
    opts?: {
        entityType?: 'offer' | 'contract' | 'gallery' | 'order';
        entityId?: number;
        details?: Record<string, any>;
        request?: NextRequest;
    },
): Promise<void> {
    return logCrmActivityStrict({
        clientId: decoded?.id,
        clientEmail: decoded?.email,
        action,
        entityType: opts?.entityType,
        entityId: opts?.entityId,
        details: opts?.details,
        request: opts?.request,
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
): Promise<void> {
    return logCrmActivity({
        clientId: decoded?.id,
        clientEmail: decoded?.email,
        action,
        entityType: opts?.entityType,
        entityId: opts?.entityId,
        details: opts?.details,
        request: opts?.request,
    });
}
