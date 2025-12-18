// LEGACY PROXY - DO NOT ADD NEW LOGIC HERE
// USE src/lib/email/sender.ts INSTEAD
import { sendEmail as unifiedSendEmail } from './email/sender';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    const result = await unifiedSendEmail({ to, subject, html });
    return result.success;
}
