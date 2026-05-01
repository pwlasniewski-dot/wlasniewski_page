/**
 * SMS sender — abstrakcja providera.
 *
 * W produkcji: ustaw env SMS_PROVIDER=twilio + TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM.
 * Domyślnie (dev / brak konfiguracji): loguje wiadomość do konsoli + system log,
 * dzięki czemu przepływ działa bez zewnętrznej integracji.
 */
import { logSystem } from '@/lib/logger';

export type SmsResult = { ok: boolean; provider: string; messageId?: string; error?: string };

/**
 * Normalizuje polski numer do formatu E.164 (+48XXXXXXXXX).
 * Akceptuje: "+48 123 456 789", "48123456789", "123456789", "123-456-789".
 * Zwraca null jeśli nie da się przerobić na 9-cyfrowy PL.
 */
export function normalizePolishPhone(input: string): string | null {
    if (!input) return null;
    let digits = input.replace(/\D+/g, '');
    if (digits.startsWith('0048')) digits = digits.slice(4);
    else if (digits.startsWith('48') && digits.length === 11) digits = digits.slice(2);
    if (digits.length !== 9) return null;
    if (!/^[4-9]\d{8}$/.test(digits)) return null;
    return `+48${digits}`;
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
    const provider = (process.env.SMS_PROVIDER || 'mock').toLowerCase();

    if (provider === 'twilio') {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        const from = process.env.TWILIO_FROM;
        if (!sid || !token || !from) {
            await logSystem('ERROR', 'SYSTEM', 'SMS Twilio config missing', { sid: !!sid, token: !!token, from: !!from });
            return { ok: false, provider: 'twilio', error: 'CONFIG_MISSING' };
        }
        try {
            const auth = Buffer.from(`${sid}:${token}`).toString('base64');
            const params = new URLSearchParams({ To: to, From: from, Body: body });
            const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
                method: 'POST',
                headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });
            const data: any = await res.json().catch(() => ({}));
            if (!res.ok) {
                await logSystem('ERROR', 'SYSTEM', `SMS Twilio failed: ${res.status}`, { to: maskPhone(to), msg: data?.message });
                return { ok: false, provider: 'twilio', error: data?.message || `HTTP ${res.status}` };
            }
            return { ok: true, provider: 'twilio', messageId: data?.sid };
        } catch (e: any) {
            await logSystem('ERROR', 'SYSTEM', `SMS Twilio exception: ${e.message}`, { to: maskPhone(to) });
            return { ok: false, provider: 'twilio', error: e.message };
        }
    }

    // mock: log do systemu (czytelne w panelu admina) + console
    console.log(`[SMS:mock] ${to} :: ${body}`);
    await logSystem('INFO', 'SYSTEM', `SMS_MOCK to=${maskPhone(to)} body=${body}`);
    return { ok: true, provider: 'mock', messageId: `mock-${Date.now()}` };
}

function maskPhone(phone: string): string {
    if (!phone || phone.length < 6) return phone;
    return phone.slice(0, 3) + '***' + phone.slice(-3);
}
