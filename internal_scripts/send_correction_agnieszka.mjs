/**
 * Wyślij mail korekcyjny do Pani Agnieszki i do admina po błędnej kwocie w pierwszym mailu.
 */
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// --- Pobierz SMTP z bazy ---
const settings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
if (!settings?.smtp_host || !settings?.smtp_user || !settings?.smtp_password) {
  console.error('Brak konfiguracji SMTP w bazie!');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: settings.smtp_host,
  port: settings.smtp_port ?? 587,
  secure: (settings.smtp_port ?? 587) === 465,
  auth: { user: settings.smtp_user, pass: settings.smtp_password },
  tls: { rejectUnauthorized: false },
});

const ADMIN_EMAIL = settings.smtp_from || settings.smtp_user;
const CLIENT_EMAIL = 'agnieszkakawczyk@interia.pl';
const CLIENT_NAME = 'Agnieszka';

const subject = 'Potwierdzenie rezerwacji — sesja Złoty, 20 czerwca 2026';

const clientHtml = `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;max-width:600px;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#0a0a0a,#161616);padding:40px 40px 32px;text-align:center;border-bottom:2px solid #c5a059;">
        <div style="color:#c5a059;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin-bottom:12px;">📸 Przemysław Właśniewski · Fotografia</div>
        <h1 style="color:#f5f5f5;font-size:26px;font-weight:700;margin:0;">Potwierdzenie rezerwacji</h1>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:40px;">

        <p style="color:#ccc;font-size:15px;line-height:1.7;margin:0 0 24px;">
          Droga Pani Agnieszko,<br><br>
          dziękuję za zaufanie i dokonanie rezerwacji — bardzo się cieszę, że będę mieć przyjemność sfotografować Panią i bliskich.
        </p>
        <p style="color:#ccc;font-size:15px;line-height:1.7;margin:0 0 28px;">
          W automatycznym potwierdzeniu, które Pani otrzymała, omyłkowo wyświetliła się nieprawidłowa kwota.
          Chciałem to niezwłocznie sprostować. <strong style="color:#f5f5f5;">Prawidłowa cena za wybrany pakiet Złoty wynosi <span style="color:#4ade80;">500,00 zł</span></strong> — zgodnie z cennikiem i złożonym zamówieniem. Płatność w tej kwocie została zaksięgowana prawidłowo.
        </p>

        <!-- Booking box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#161616;border:1px solid rgba(197,160,89,0.3);border-radius:10px;margin-bottom:32px;">
          <tr><td style="padding:20px 24px;">
            <div style="color:#c5a059;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin-bottom:16px;">✅ Szczegóły rezerwacji</div>
            <table width="100%" cellpadding="4" cellspacing="0">
              <tr><td style="color:#888;font-size:13px;width:40%;">Usługa</td><td style="color:#f5f5f5;font-size:13px;font-weight:600;">Sesja fotograficzna</td></tr>
              <tr><td style="color:#888;font-size:13px;">Pakiet</td><td style="color:#f5f5f5;font-size:13px;font-weight:600;">Złoty</td></tr>
              <tr><td style="color:#888;font-size:13px;">📅 Data</td><td style="color:#4ade80;font-size:13px;font-weight:700;">sobota, 20 czerwca 2026</td></tr>
              <tr><td style="color:#888;font-size:13px;">🕐 Godzina</td><td style="color:#f5f5f5;font-size:13px;font-weight:600;">12:00 – 14:00</td></tr>
              <tr><td style="color:#888;font-size:13px;">💳 Kwota</td><td style="color:#4ade80;font-size:15px;font-weight:700;">500,00 zł ✅ opłacona</td></tr>
            </table>
          </td></tr>
        </table>

        <p style="color:#ccc;font-size:15px;line-height:1.7;margin:0 0 28px;">
          Termin jest zarezerwowany i potwierdzony. Na kilka dni przed sesją skontaktuję się z Panią, żeby ustalić szczegóły miejsca i stylistyki.
          W razie jakichkolwiek pytań proszę śmiało pisać lub dzwonić.
        </p>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:8px 0;">
            <a href="tel:+48530788694" style="display:inline-block;background:#c5a059;color:#000;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:0.5px;">📞 +48 530 788 694</a>
          </td></tr>
        </table>

      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#0d0d0d;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a;">
        <p style="color:#555;font-size:12px;margin:0;">Przemysław Właśniewski · Fotografia · Toruń</p>
        <p style="color:#555;font-size:12px;margin:6px 0 0;"><a href="https://wlasniewski.pl" style="color:#c5a059;text-decoration:none;">wlasniewski.pl</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

const adminHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#222;padding:20px;">
<h2>📋 Kopia — mail korekcyjny do Agnieszki Kawczyk</h2>
<p>Wysłano do: <strong>${CLIENT_EMAIL}</strong></p>
<p>Treść: sprostowanie kwoty (było "50000 zł", powinno być "500,00 zł") + pełne potwierdzenie rezerwacji</p>
<hr>
<p><strong>Rezerwacja #15</strong> · Sesja Złoty · 20.06.2026 12:00–14:00 · 500,00 zł · status: confirmed</p>
</body></html>`;

// Wyślij tylko do admina (kopia maila który dostała Pani Agnieszka)
await transporter.sendMail({
  from: `"Przemysław Właśniewski Fotografia" <${ADMIN_EMAIL}>`,
  to: ADMIN_EMAIL,
  subject: `[KOPIA DLA CIEBIE] ${subject}`,
  html: clientHtml,
});
console.log(`✅ Kopia wysłana do: ${ADMIN_EMAIL}`);

await prisma.$disconnect();
