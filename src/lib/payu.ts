import prisma from '@/lib/db/prisma';
import { headers } from "next/headers";
import { PAYU_ORDER_VALIDITY_SECONDS } from '@/lib/paymentPolicy';
import { resolvePayUNotifyUrl } from '@/lib/payments/payuNotification';

interface PayUSettings {
    merchantPosId: string;
    clientId: string;
    clientSecret: string;
    md5Key: string;
    notifyUrl: string;
    environment: 'sandbox' | 'secure';
}

async function getPayUSettings(): Promise<PayUSettings | null> {
    const settings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
    if (!settings || !settings.payu_merchant_pos_id || !settings.payu_client_id || !settings.payu_client_secret || !settings.payu_md5_key) {
        return null;
    }
    return {
        merchantPosId: settings.payu_merchant_pos_id,
        clientId: settings.payu_client_id,
        clientSecret: settings.payu_client_secret,
        md5Key: settings.payu_md5_key || '',
        notifyUrl: resolvePayUNotifyUrl(settings.payu_notify_url, process.env.NEXT_PUBLIC_APP_URL),
        environment: (settings.payu_environment as 'sandbox' | 'secure') || 'sandbox',
    };
}

async function getAccessToken(settings: PayUSettings): Promise<string> {
    const domain = settings.environment === 'secure' ? 'secure.payu.com' : 'secure.snd.payu.com';
    const url = `https://${domain}/pl/standard/user/oauth/authorize`;

    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PayU Auth Failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * PayU rejects request when customerIp is missing, an IP list ("a, b"),
 * empty, or IPv6 with brackets. This extracts the first valid IPv4
 * from raw forwarded-headers and falls back to a safe loopback.
 */
export function extractClientIpv4(raw: string | null | undefined): string {
    if (!raw) return '127.0.0.1';
    const ipv4Re = /^(\d{1,3}\.){3}\d{1,3}$/;
    const candidates = raw.split(',').map((s) => s.trim()).filter(Boolean);
    for (const c of candidates) {
        if (ipv4Re.test(c)) return c;
    }
    return '127.0.0.1';
}

export interface OrderRequest {
    description: string;
    currencyCode: string;
    totalAmount: number; // in pennies (grosze)
    extOrderId: string; // unique ID from our DB
    buyer: {
        email: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
        language?: string;
    };
    products: {
        name: string;
        unitPrice: number;
        quantity: number;
    }[];
    continueUrl: string; // where to redirect user after payment
}

export async function createPayUOrder(orderData: OrderRequest, clientIp: string) {
    const settings = await getPayUSettings();
    if (!settings) throw new Error("PayU settings not configured");

    const token = await getAccessToken(settings);

    // Correct PayU URLs
    // Sandbox: secure.snd.payu.com
    // Production: secure.payu.com
    const domain = settings.environment === 'secure' ? 'secure.payu.com' : 'secure.snd.payu.com';
    const url = `https://${domain}/api/v2_1/orders`;

    const payload = {
        notifyUrl: settings.notifyUrl, // Our backend webhook
        customerIp: extractClientIpv4(clientIp),
        merchantPosId: settings.merchantPosId,
        validityTime: PAYU_ORDER_VALIDITY_SECONDS,
        ...orderData,
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        redirect: 'manual', // Prevent auto-following redirects if any
    });

    // PayU V2.1 API returns 302 (Found) when redirecting to payment page.
    // The redirect URL is in the Location header (for manual redirect mode).
    // OR it returns 201 with a JSON body containing redirectUri.
    if (response.status === 302) {
        const location = response.headers.get('location');
        if (!location) {
            throw new Error('PayU returned 302 but no Location header');
        }
        const orderId = new URL(location).searchParams.get('orderId');
        if (!orderId) throw new Error('PayU returned redirect without orderId');
        return { redirectUri: location, orderId };
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error("PayU Order Create Error:", errorText);
        throw new Error(`PayU Order Failed: ${response.status} ${errorText}`);
    }

    return await response.json();

}

export async function retrievePayUOrder(orderId: string) {
    const settings = await getPayUSettings();
    if (!settings) throw new Error('PayU settings not configured');
    const token = await getAccessToken(settings);
    const domain = settings.environment === 'secure' ? 'secure.payu.com' : 'secure.snd.payu.com';
    const response = await fetch(`https://${domain}/api/v2_1/orders/${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`PayU Order Retrieve Failed: ${response.status} ${text}`);
    const data = text ? JSON.parse(text) : {};
    return data?.orders?.[0] || null;
}

export async function cancelPayUOrder(orderId: string) {
    const settings = await getPayUSettings();
    if (!settings) throw new Error('PayU settings not configured');
    const token = await getAccessToken(settings);
    const domain = settings.environment === 'secure' ? 'secure.payu.com' : 'secure.snd.payu.com';
    const response = await fetch(`https://${domain}/api/v2_1/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`PayU Order Cancel Failed: ${response.status} ${text}`);
    return text ? JSON.parse(text) : {};
}

/**
 * PayU Refund: POST /api/v2_1/orders/{orderId}/refunds
 * amount in grosze (1 PLN = 100). Pełny zwrot, jeśli amount nieokreślony.
 */
export async function refundPayUOrder(orderId: string, amount: number | undefined, description: string) {
    const settings = await getPayUSettings();
    if (!settings) throw new Error('PayU settings not configured');
    const token = await getAccessToken(settings);
    const domain = settings.environment === 'secure' ? 'secure.payu.com' : 'secure.snd.payu.com';
    const url = `https://${domain}/api/v2_1/orders/${encodeURIComponent(orderId)}/refunds`;

    const payload: any = { refund: { description } };
    if (typeof amount === 'number' && amount > 0) payload.refund.amount = String(amount);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
    const text = await response.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch { /* not json */ }
    if (!response.ok) {
        throw new Error(`PayU Refund Failed: ${response.status} ${text}`);
    }
    return data;
}
