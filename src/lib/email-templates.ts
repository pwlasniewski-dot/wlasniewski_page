// ============================================================
// PREMIUM EMAIL TEMPLATES — Przemysław Właśniewski Fotografia
// Wszystkie szablony z polskimi znakami, ciemny motyw premium
// ============================================================

// ─── BRAND (eksportowane dla sender.ts) ──────────────────────

export const brandColors = {
  gold: '#c5a059',
  goldLight: '#d4b87a',
  black: '#0a0a0a',
  darkGray: '#111111',
  cardBg: '#161616',
  border: '#2a2a2a',
  borderGold: 'rgba(197,160,89,0.35)',
  lightGray: '#888888',
  white: '#f5f5f5',
  green: '#4ade80',
};

// Formatuje kwotę (złote, może być float) na polski format „500,00 zł”
function formatPLN(value: number | string | null | undefined): string {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
  if (!isFinite(n)) return '0,00 zł';
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
}

// baseStyles eksportowane dla sender.ts (challenge templates)
export const baseStyles = `
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #0a0a0a; }
    .container { max-width: 600px; margin: 0 auto; background-color: #111111; }
    .header { background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid #c5a059; }
    .logo { font-size: 24px; font-weight: 700; color: #f5f5f5; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 5px; }
    .logo-accent { color: #c5a059; }
    .tagline { color: #888; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; }
    .content { padding: 40px 30px; color: #f5f5f5; }
    .greeting { font-size: 22px; font-weight: 300; margin-bottom: 20px; color: #f5f5f5; }
    .message { color: #888; font-size: 15px; line-height: 1.7; margin-bottom: 30px; }
    .details-box { background: rgba(197,160,89,0.07); border: 1px solid rgba(197,160,89,0.3); border-radius: 10px; padding: 24px; margin: 24px 0; }
    .details-title { color: #c5a059; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; font-weight: 600; }
    .cta-section { text-align: center; padding: 28px 0; }
    .cta-button { display: inline-block; background: #c5a059; color: #000; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; }
    .footer { background: #0a0a0a; padding: 24px; text-align: center; border-top: 1px solid #222; }
    .footer-text { color: #555; font-size: 11px; line-height: 1.6; }
`;

// ─── TYPY ────────────────────────────────────────────────────

export interface BookingEmailData {
  clientName: string;
  service: string;
  packageName: string;
  date: string;
  time?: string;
  location?: string;
  price: number;
  originalPrice?: number;
  promoCode?: string;
  giftCardCode?: string;
  notes?: string;
  phone?: string;
  email: string;
  dronePackageName?: string;
  droneGoal?: string;
  flightCheckStatus?: string;
  paymentStatusLabel?: string;
}

export interface OfferEmailData {
  clientName: string;
  offerNumber: string;
  offerTitle: string;
  offerCategory?: string;
  totalPrice: number | string;
  validUntil?: string;
  offerUrl?: string;
  type?: 'b2b' | 'b2c';
  summaryHtml?: string;
  hasPdf?: boolean; // Added this
}

export interface ContractEmailData {
  clientName: string;
  contractNumber: string;
  offerTitle: string;
  portalUrl: string;
  hasPdf?: boolean; // Added this
}

export interface GalleryEmailData {
  clientName: string;
  accessCode: string;
  galleryUrl: string;
  primaryUrl?: string;
  primaryCtaLabel?: string;
  groupPassword?: string;
  expiresAt: string;
  standardCount?: number;
}

// ─── INTERNAL BRAND CONSTANTS ────────────────────────────────

// ─── SHARED LAYOUT ───────────────────────────────────────────

function emailShell(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    a { color: #c5a059; }
    img { border: 0; display: block; }
    table { border-collapse: collapse; }
    @media only screen and (max-width: 600px) {
      .email-body { padding: 16px !important; }
      .card { padding: 24px 20px !important; }
      .btn { padding: 14px 28px !important; font-size: 13px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;min-height:100vh;">
    <tr>
      <td align="center" class="email-body" style="padding:32px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;">

          <!-- LOGO HEADER -->
          <tr>
            <td style="padding-bottom:0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px 16px 0 0;border:1px solid #2a2a2a;border-bottom:none;">
                <tr>
                  <td style="padding:32px 40px 28px;text-align:center;border-bottom:2px solid #c5a059;">
                    <div style="font-size:22px;font-weight:700;color:#f5f5f5;letter-spacing:3px;text-transform:uppercase;">PRZEMYSŁAW WŁAŚNIEWSKI</div>
                    <div style="font-size:10px;color:#888;letter-spacing:5px;text-transform:uppercase;margin-top:6px;">Fotografia</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" class="card" style="background:#161616;border:1px solid #2a2a2a;border-top:none;border-radius:0 0 16px 16px;padding:40px;">
                <tr><td>${content}</td></tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="color:#444;font-size:11px;margin:0 0 8px;line-height:1.6;">
                Przemysław Właśniewski · Fotografia · Toruń<br>
                Tel: <a href="tel:+48530788694" style="color:#666;text-decoration:none;">+48 530 788 694</a> ·
                <a href="https://wlasniewski.pl" style="color:#666;text-decoration:none;">wlasniewski.pl</a>
              </p>
              <p style="color:#333;font-size:10px;margin:0;">
                © ${new Date().getFullYear()} Przemysław Właśniewski. Wszelkie prawa zastrzeżone.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function goldDivider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr><td style="height:1px;background:linear-gradient(90deg,transparent,#c5a059,transparent);"></td></tr>
    </table>`;
}

function detailRow(label: string, value: string, highlight = false): string {
  return `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #222;color:#888;font-size:13px;font-weight:400;">${label}</td>
      <td style="padding:12px 0;border-bottom:1px solid #222;text-align:right;color:${highlight ? '#c5a059' : '#f5f5f5'};font-size:13px;font-weight:${highlight ? '600' : '500'};">${value}</td>
    </tr>`;
}

function ctaButton(text: string, url: string, color = '#c5a059'): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:32px auto 0;">
      <tr>
        <td style="border-radius:8px;background:${color};">
          <a href="${url}" class="btn" style="display:inline-block;padding:16px 40px;color:#000;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:1px;text-transform:uppercase;border-radius:8px;">${text}</a>
        </td>
      </tr>
    </table>`;
}

function infoBox(content: string, borderColor = '#c5a059'): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#1a1a1a;border:1px solid ${borderColor};border-radius:10px;">
      <tr><td style="padding:24px;">${content}</td></tr>
    </table>`;
}

function heading(text: string): string {
  return `<h2 style="color:#f5f5f5;font-size:22px;font-weight:600;margin:0 0 8px;line-height:1.3;">${text}</h2>`;
}

function subtext(text: string): string {
  return `<p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 24px;">${text}</p>`;
}

// ─── 1. WELCOME — NOWY KLIENT ────────────────────────────────

export function generateWelcomeClientEmail(data: { name: string; email: string; password?: string; loginUrl?: string; isExistingAccess?: boolean }): string {
  const loginUrl = data.loginUrl || `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl'}/logowanie`;

  const content = `
      ${heading(data.isExistingAccess ? `Cześć, ${data.name}!` : `Witaj, ${data.name}! 👋`)}
      ${subtext(data.isExistingAccess
        ? 'Na Twoją prośbę przygotowałem nowy, jednorazowy link do ustawienia hasła i odzyskania dostępu do panelu klienta.'
        : 'Utworzyłem dla Ciebie konto klienta. Ustaw własne hasło, a od razu przejdziesz do prywatnego panelu z ofertami, umowami i galeriami.')}

      ${infoBox(`
        <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Dane do logowania</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow('Adres e-mail', data.email)}
          ${data.password ? detailRow('Hasło tymczasowe', `<code style="background:#222;padding:3px 8px;border-radius:4px;font-family:monospace;color:#c5a059;">${data.password}</code>`) : ''}
        </table>
        ${data.password ? `<p style="color:#555;font-size:11px;margin:12px 0 0;font-style:italic;">Zalecamy zmianę hasła po pierwszym logowaniu.</p>` : ''}
      `)}

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#111;border-radius:10px;border:1px dashed rgba(197,160,89,0.3);">
        <tr><td style="padding:20px 24px;">
          <div style="color:#c5a059;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Co znajdziesz w panelu?</div>
          <table cellpadding="0" cellspacing="0">
            ${['📋 Dedykowane oferty cenowe', '📄 Umowy do podpisania online', '🖼️ Prywatne galerie zdjęć', '📅 Status Twoich rezerwacji'].map(item =>
    `<tr><td style="padding:5px 0;color:#aaa;font-size:13px;">${item}</td></tr>`
  ).join('')}
          </table>
        </td></tr>
      </table>

      ${ctaButton('Ustaw hasło i otwórz panel →', loginUrl)}

      ${goldDivider()}
      <p style="color:#555;font-size:12px;text-align:center;margin:0;">Cieszę się na naszą współpracę! W razie pytań — odpowiedz na tego maila.</p>
    `;

  return emailShell(content, `Witaj ${data.name}! Twoje konto klienta jest gotowe.`);
}

// ─── 2. OFERTA — EMAIL DO KLIENTA ────────────────────────────

export function generateOfferEmail(data: OfferEmailData): string {
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl'}/konto`;
  const content = `
      <div style="display:inline-block;background:rgba(197,160,89,0.1);border:1px solid rgba(197,160,89,0.3);border-radius:6px;padding:6px 14px;margin-bottom:20px;">
        <span style="color:#c5a059;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Nowa Oferta · ${data.offerNumber}</span>
      </div>

      ${heading(data.offerTitle)}
      ${subtext(`Przygotowałem dla Ciebie dedykowaną ofertę fotograficzną. Poniżej znajdziesz szczegóły${data.hasPdf ? ' — pełna wersja w załączonym pliku PDF' : ''}.`)}

      ${infoBox(`
        <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Szczegóły oferty</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow('Numer oferty', data.offerNumber)}
          ${detailRow('Zakres', data.offerCategory || (data.type === 'b2b' ? 'Oferta biznesowa' : 'Fotografia'))}
          ${data.validUntil ? detailRow('Ważna do', data.validUntil) : ''}
        </table>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #2a2a2a;text-align:center;">
          <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Wartość inwestycji</div>
          <div style="color:#c5a059;font-size:32px;font-weight:700;letter-spacing:1px;">${data.totalPrice} PLN</div>
          <div style="color:#555;font-size:11px;margin-top:4px;">Kwota brutto</div>
        </div>
      `)}

      ${data.summaryHtml ? `
        <div style="margin:24px 0;padding:24px;background:#111;border-radius:10px;border:1px solid #222;">
          <div style="color:#c5a059;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Zakres usług</div>
          ${data.summaryHtml}
        </div>
      ` : ''}

      ${data.hasPdf ? `
      <div style="background:#111;border-radius:10px;border:1px solid rgba(197,160,89,0.2);padding:20px;margin:24px 0;text-align:center;">
        <div style="color:#888;font-size:12px;margin-bottom:8px;">📎 Pełna oferta dostępna w załączniku PDF</div>
        <div style="color:#555;font-size:11px;">Otwórz załącznik, aby zobaczyć kompletne zestawienie pakietów i warunki współpracy.</div>
      </div>
      ` : ''}

      ${ctaButton('Przejdź do Panelu Klienta →', data.offerUrl || portalUrl)}

      ${goldDivider()}
      <p style="color:#555;font-size:12px;text-align:center;margin:0;">Masz pytania? Zadzwoń: <a href="tel:+48530788694" style="color:#c5a059;text-decoration:none;">530 788 694</a> lub odpowiedz na tego maila.</p>
    `;

  return emailShell(content, `Oferta ${data.offerNumber}: ${data.offerTitle} — ${data.totalPrice} PLN`);
}

// ─── 3. UMOWA — EMAIL DO KLIENTA ─────────────────────────────

export function generateContractEmail(data: ContractEmailData): string {
  // data.portalUrl powinno być: https://wlasniewski.pl/konto
  const content = `
      <div style="display:inline-block;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.25);border-radius:6px;padding:6px 14px;margin-bottom:20px;">
        <span style="color:#4ade80;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">📄 Umowa gotowa · ${data.contractNumber}</span>
      </div>

      ${heading(`Cześć, ${data.clientName}!`)}
      ${subtext(`Twoja umowa do oferty <strong style="color:#f5f5f5;">${data.offerTitle}</strong> jest gotowa. Możesz ją przejrzeć i pobrać w swoim panelu klienta.${data.hasPdf ? ' Umowa w formacie PDF znajduje się w załączniku do tej wiadomości.' : ''}`)}

      ${infoBox(`
        <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Szczegóły umowy</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow('Numer umowy', `<span style="font-family:monospace;color:#c5a059;">${data.contractNumber}</span>`, true)}
          ${detailRow('Dotyczy oferty', data.offerTitle)}
          ${detailRow('Status', '<span style="color:#4ade80;">Oczekuje na akceptację</span>')}
        </table>
      `, 'rgba(74,222,128,0.25)')}

      <div style="background:#111;border-radius:10px;border:1px solid rgba(74,222,128,0.15);padding:20px;margin:24px 0;text-align:center;">
        <div style="color:#888;font-size:12px;margin-bottom:8px;">📎 Umowa dostępna w załączniku PDF</div>
        <div style="color:#555;font-size:11px;">Otwórz załącznik, aby zapoznać się z treścią umowy.</div>
      </div>

      ${ctaButton('Przejdź do Panelu Klienta →', data.portalUrl, '#4ade80')}

      ${goldDivider()}
      <p style="color:#555;font-size:12px;text-align:center;margin:0;">Masz pytania do umowy? Odpowiedz na tego maila lub zadzwoń: <a href="tel:+48530788694" style="color:#c5a059;text-decoration:none;">530 788 694</a></p>
    `;

  return emailShell(content, `Umowa ${data.contractNumber} gotowa do podpisania`);
}

// ─── 4. GALERIA — EMAIL DO KLIENTA ───────────────────────────

export function generateGalleryEmail(data: GalleryEmailData): string {
  // data.galleryUrl powinno być: https://wlasniewski.pl/galeria/[accessCode]
  const content = `
      <div style="display:inline-block;background:rgba(197,160,89,0.1);border:1px solid rgba(197,160,89,0.3);border-radius:6px;padding:6px 14px;margin-bottom:20px;">
        <span style="color:#c5a059;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">🖼️ Twoja Galeria jest gotowa!</span>
      </div>

      ${heading(`Cześć, ${data.clientName}!`)}
      ${subtext('Zdjęcia z Twojej sesji są gotowe! Możesz teraz przeglądać galerię i wybrać zdjęcia, które chcesz zachować w wersji premium.')}

      ${infoBox(`
        <div style="text-align:center;padding:8px 0;">
          <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:3px;margin-bottom:12px;">Kod dostępu do galerii</div>
          <div style="font-family:monospace;font-size:36px;font-weight:700;color:#c5a059;letter-spacing:6px;padding:12px 0;">${data.accessCode}</div>
          ${data.groupPassword ? `<div style="color:#888;font-size:12px;margin-top:8px;">Hasło: <strong style="color:#f5f5f5;">${data.groupPassword}</strong></div>` : ''}
          <div style="color:#555;font-size:11px;margin-top:8px;">Galeria dostępna do: <span style="color:#888;">${data.expiresAt}</span></div>
        </div>
      `)}

      ${data.standardCount ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#111;border-radius:10px;border:1px dashed rgba(197,160,89,0.2);">
          <tr><td style="padding:20px 24px;">
            <div style="color:#c5a059;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Co zawiera Twoja galeria?</div>
            <table cellpadding="0" cellspacing="0">
              <tr><td style="padding:5px 0;color:#aaa;font-size:13px;">✅ ${data.standardCount} zdjęć w standardzie (w cenie)</td></tr>
              <tr><td style="padding:5px 0;color:#aaa;font-size:13px;">⭐ Możliwość zakupu dodatkowych zdjęć premium</td></tr>
              <tr><td style="padding:5px 0;color:#aaa;font-size:13px;">📥 Pobieranie wybranych zdjęć w wysokiej rozdzielczości</td></tr>
            </table>
          </td></tr>
        </table>
      ` : ''}

      ${ctaButton(data.primaryCtaLabel || 'Otwórz Galerię →', data.primaryUrl || data.galleryUrl)}

      <p style="color:#555;font-size:12px;text-align:center;margin:16px 0 0;">Bezpośredni adres galerii: <a href="${data.galleryUrl}" style="color:#c5a059;word-break:break-all;">${data.galleryUrl}</a></p>

      ${goldDivider()}
      <p style="color:#555;font-size:12px;text-align:center;margin:0;">Masz pytania? Odpowiedz na tego maila lub zadzwoń: <a href="tel:+48530788694" style="color:#c5a059;text-decoration:none;">530 788 694</a></p>
    `;

  return emailShell(content, `Twoja galeria zdjęć jest gotowa! Kod: ${data.accessCode}`);
}

// ─── 5. REZERWACJA — POTWIERDZENIE (KLIENT) ──────────────────

export function generateClientEmail(data: BookingEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
  const hasDiscount = data.originalPrice && data.originalPrice > data.price;

  const content = `
      ${heading(`Cześć, ${data.clientName}! 👋`)}
      ${subtext('Dziękuję za zaufanie i rezerwację sesji fotograficznej! Otrzymałem Twoje zgłoszenie i wkrótce skontaktuję się z Tobą, aby potwierdzić wszystkie szczegóły.')}

      ${infoBox(`
        <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">✨ Szczegóły rezerwacji</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow('Usługa', data.service)}
          ${detailRow('Pakiet', data.packageName)}
          ${data.dronePackageName ? detailRow('Dron', data.dronePackageName) : ''}
          ${data.droneGoal ? detailRow('Cel materiału z drona', data.droneGoal) : ''}
          ${detailRow('📅 Data', data.date, true)}
          ${data.time ? detailRow('🕐 Godzina', data.time) : ''}
          ${data.location ? detailRow('📍 Miejsce', data.location) : ''}
          ${data.promoCode ? detailRow('🏷️ Kod rabatowy', data.promoCode) : ''}
          ${data.giftCardCode ? detailRow('🎁 Karta podarunkowa', data.giftCardCode) : ''}
        </table>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #2a2a2a;text-align:right;">
          ${hasDiscount ? `<span style="color:#555;text-decoration:line-through;font-size:14px;margin-right:12px;">${formatPLN(data.originalPrice)}</span>` : ''}
          <span style="color:#c5a059;font-size:28px;font-weight:700;">${formatPLN(data.price)}</span>
        </div>
      `)}

      ${data.notes ? `
        <div style="background:#111;border-left:3px solid #c5a059;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
          <div style="color:#c5a059;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">📝 Twoje uwagi</div>
          <div style="color:#888;font-size:13px;line-height:1.6;">${data.notes}</div>
        </div>
      ` : ''}

      ${goldDivider()}
      <p style="color:#888;font-size:13px;text-align:center;margin:0 0 20px;">W przypadku pytań, śmiało napisz lub zadzwoń. Z niecierpliwością czekam na naszą sesję!</p>
      ${ctaButton('📞 Zadzwoń: 530 788 694', 'tel:+48530788694')}
      <p style="color:#555;font-size:12px;text-align:center;margin:16px 0 0;">Lub zaloguj się do panelu: <a href="${appUrl}/konto" style="color:#c5a059;">${appUrl}/konto</a></p>
    `;

  return emailShell(content, `Rezerwacja przyjęta: ${data.service} · ${data.date}`);
}

// ─── 6. REZERWACJA — POTWIERDZONA (KLIENT) ───────────────────

export function generateBookingConfirmedEmail(data: BookingEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
  const content = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:rgba(74,222,128,0.1);border:2px solid rgba(74,222,128,0.4);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;">✅</div>
      </div>

      ${heading(`${data.clientName}, Twoja rezerwacja jest POTWIERDZONA!`)}
      ${subtext('Świetne wieści! Oficjalnie potwierdziłem Twój termin. Wszystko jest już przygotowane na nasze spotkanie.')}

      ${infoBox(`
        <div style="color:#4ade80;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">✅ Potwierdzone szczegóły</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow('Usługa', data.service)}
          ${detailRow('Pakiet', data.packageName)}
          ${data.dronePackageName ? detailRow('Dron', data.dronePackageName) : ''}
          ${data.droneGoal ? detailRow('Cel materiału z drona', data.droneGoal) : ''}
          ${detailRow('📅 Data', `<span style="color:#4ade80;font-weight:600;">${data.date}</span>`)}
          ${data.time ? detailRow('🕐 Godzina', data.time) : ''}
          ${data.location ? detailRow('📍 Miejsce', data.location) : ''}
          ${detailRow('💳 Status płatności', `<span style="color:#4ade80;">${data.paymentStatusLabel || 'Termin potwierdzony — rozliczenie według ustaleń'}</span>`)}
        </table>
      `, 'rgba(74,222,128,0.3)')}

      ${data.dronePackageName ? subtext('Możliwość lotu zostanie potwierdzona po sprawdzeniu miejsca, aktualnych stref i pogody. Jeżeli lot nie będzie możliwy, ustalimy zmianę terminu albo zwrot za część dronową.') : ''}

      ${goldDivider()}
      <p style="color:#888;font-size:13px;text-align:center;margin:0 0 20px;">Do zobaczenia! Jeśli masz pytania przed sesją, jestem do dyspozycji.</p>
      ${ctaButton('📞 Kontakt: 530 788 694', 'tel:+48530788694')}
      <p style="color:#555;font-size:12px;text-align:center;margin:16px 0 0;">Panel klienta: <a href="${appUrl}/konto" style="color:#c5a059;">${appUrl}/konto</a></p>
    `;

  return emailShell(content, `Rezerwacja potwierdzona: ${data.service} · ${data.date}`);
}

// ─── 7. REZERWACJA — ADMIN ───────────────────────────────────

export function generateAdminEmail(data: BookingEmailData): string {
  const hasDiscount = data.originalPrice && data.originalPrice > data.price;
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl'}/admin/bookings`;

  const content = `
      <div style="display:inline-block;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.25);border-radius:6px;padding:6px 14px;margin-bottom:20px;">
        <span style="color:#4ade80;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">🎉 Nowa Rezerwacja!</span>
      </div>

      ${heading(`Klient: ${data.clientName}`)}

      ${infoBox(`
        <div style="color:#4ade80;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">📋 Dane kontaktowe</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow('Imię i nazwisko', data.clientName)}
          ${detailRow('📧 E-mail', `<a href="mailto:${data.email}" style="color:#60a5fa;text-decoration:none;">${data.email}</a>`)}
          ${data.phone ? detailRow('📞 Telefon', `<a href="tel:${data.phone}" style="color:#4ade80;text-decoration:none;">${data.phone}</a>`) : ''}
        </table>
      `, 'rgba(74,222,128,0.25)')}

      ${infoBox(`
        <div style="color:#c5a059;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">📸 Szczegóły sesji</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow('Usługa', data.service)}
          ${detailRow('Pakiet', data.packageName)}
          ${data.dronePackageName ? detailRow('Dron', data.dronePackageName) : ''}
          ${data.droneGoal ? detailRow('Cel materiału z drona', data.droneGoal) : ''}
          ${data.flightCheckStatus ? detailRow('Kontrola lotu', data.flightCheckStatus) : ''}
          ${detailRow('📅 Data', data.date, true)}
          ${data.time ? detailRow('🕐 Godzina', data.time) : ''}
          ${data.location ? detailRow('📍 Miejsce', data.location) : ''}
        </table>
      `)}

      ${(hasDiscount || data.promoCode || data.giftCardCode) ? infoBox(`
        <div style="color:#fbbf24;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">💰 Płatność</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${data.originalPrice ? detailRow('Cena bazowa', formatPLN(data.originalPrice)) : ''}
          ${data.promoCode ? detailRow('🏷️ Kod rabatowy', data.promoCode) : ''}
          ${data.giftCardCode ? detailRow('🎁 Karta podarunkowa', data.giftCardCode) : ''}
          ${detailRow('SUMA', `<span style="color:#4ade80;font-size:20px;font-weight:700;">${formatPLN(data.price)}</span>`)}
        </table>
      `, 'rgba(251,191,36,0.25)') : `
        <div style="text-align:center;padding:20px;background:#1a1a1a;border-radius:10px;margin:24px 0;">
          <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Kwota do zapłaty</div>
          <div style="color:#4ade80;font-size:36px;font-weight:700;margin-top:6px;">${formatPLN(data.price)}</div>
        </div>
      `}

      ${data.notes ? `
        <div style="background:#111;border-left:3px solid #c5a059;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
          <div style="color:#c5a059;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">📝 Uwagi klienta</div>
          <div style="color:#888;font-size:13px;line-height:1.6;">${data.notes}</div>
        </div>
      ` : ''}

      ${ctaButton('👉 Zarządzaj rezerwacją', adminUrl, '#4ade80')}
    `;

  return emailShell(content, `Nowa rezerwacja: ${data.clientName} · ${data.service} · ${data.date}`);
}

// ─── 8. CHALLENGE — ZAPROSZENIE ──────────────────────────────

interface ChallengeEmailData {
  inviterName: string;
  inviteeName: string;
  inviterEmail?: string;
  inviteeEmail?: string;
  link: string;
  packageName: string;
  locationName?: string;
  dates?: string[];
}

export function generateChallengeInviteEmail(data: ChallengeEmailData): string {
  const content = `
      <div style="display:inline-block;background:rgba(197,160,89,0.1);border:1px solid rgba(197,160,89,0.3);border-radius:6px;padding:6px 14px;margin-bottom:20px;">
        <span style="color:#c5a059;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">📸 Foto Wyzwanie!</span>
      </div>

      ${heading(`Hej, ${data.inviteeName}! 🎉`)}
      ${subtext(`<strong style="color:#f5f5f5;">${data.inviterName}</strong> rzucił Ci wyzwanie! Zaprasza Cię na wspólną sesję fotograficzną — to ma być prezent dla Was obojga.`)}

      ${infoBox(`
        <div style="color:#c5a059;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">📸 Szczegóły wyzwania</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow('Pakiet', data.packageName)}
          ${data.locationName ? detailRow('📍 Lokalizacja', data.locationName) : ''}
        </table>
      `)}

      ${ctaButton('👉 Zobacz i zaakceptuj wyzwanie', data.link)}
    `;

  return emailShell(content, `${data.inviterName} zaprasza Cię na sesję fotograficzną!`);
}

export function generateChallengeCreatedEmail(data: ChallengeEmailData): string {
  const content = `
      ${heading(`Cześć, ${data.inviterName}!`)}
      ${subtext(`Twoje wyzwanie dla <strong style="color:#f5f5f5;">${data.inviteeName}</strong> zostało utworzone. Wysłaliśmy zaproszenie na podany adres e-mail.`)}

      ${data.dates && data.dates.length > 0 ? infoBox(`
        <div style="color:#c5a059;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">📅 Proponowane terminy</div>
        ${data.dates.map(d => `<div style="padding:8px 0;border-bottom:1px solid #222;color:#aaa;font-size:13px;">📅 ${d}</div>`).join('')}
      `) : ''}

      ${ctaButton('📊 Sprawdź status wyzwania', data.link)}
    `;

  return emailShell(content, `Wyzwanie dla ${data.inviteeName} zostało wysłane`);
}

export function generateChallengeAcceptedEmail(data: ChallengeEmailData): string {
  const content = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:rgba(74,222,128,0.1);border:2px solid rgba(74,222,128,0.4);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;">🎉</div>
      </div>

      ${heading(`${data.inviteeName} przyjął wyzwanie!`)}
      ${subtext('Gratulacje! Wasza sesja wkrótce się odbędzie. Skontaktuję się z Wami, aby potwierdzić ostateczny termin.')}

      ${ctaButton('📊 Zobacz szczegóły', data.link)}
    `;

  return emailShell(content, `${data.inviteeName} zaakceptował zaproszenie na sesję!`);
}

// ─── 9. RESET HASŁA ──────────────────────────────────────────

export function generatePasswordResetEmail(data: { name: string; resetLink: string }): string {
  const content = `
      ${heading(`Cześć, ${data.name}!`)}
      ${subtext('Otrzymałem prośbę o zresetowanie hasła do Twojego konta w panelu klienta. Jeśli to Ty — kliknij poniższy przycisk.')}

      ${ctaButton('🔑 Ustaw nowe hasło', data.resetLink)}

      ${infoBox(`
        <p style="color:#555;font-size:12px;margin:0;line-height:1.6;">
          ⏰ Ten link wygaśnie za <strong style="color:#888;">1 godzinę</strong>.<br>
          Jeśli nie prosiłeś o reset hasła — zignoruj tę wiadomość. Twoje dane są bezpieczne.
        </p>
        <p style="color:#444;font-size:11px;margin:12px 0 0;">
          Jeśli przycisk nie działa, skopiuj link:<br>
          <span style="color:#c5a059;word-break:break-all;font-size:10px;">${data.resetLink}</span>
        </p>
      `, '#333')}
    `;

  return emailShell(content, `Reset hasła dla ${data.name}`);
}

// ─── 8. GOOGLE REVIEW REQUEST — po sesji ───────────────────────────
// Lokalne SEO: każda recenzja na GBP = pozycja wyżej w Google Maps.
// Wysyłane automatycznie 2 dni po oznaczeniu booking.status = "completed".
// Link prowadzi bezpośrednio do formularza recenzji GBP zapisanego jako gbp_review_link.

export function generateGoogleReviewRequestEmail(data: {
  clientName: string;
  service: string;
  reviewLink: string;
}): string {
  const content = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:rgba(255,193,7,0.1);border:2px solid rgba(255,193,7,0.4);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;">⭐</div>
      </div>

      ${heading(`${data.clientName}, czy podzielisz się opinią?`)}
      ${subtext(`Dziękuję za wspólną realizację „${data.service}”. Twoja szczera opinia — niezależnie od oceny — pomoże kolejnym osobom podjąć świadomą decyzję.`)}

      ${infoBox(`
        <p style="color:#aaa;font-size:14px;line-height:1.7;margin:0 0 12px;">
          Opisz proszę własne doświadczenie: co było pomocne, a co mogę zrobić lepiej. Nie oczekuję konkretnej liczby gwiazdek ani pozytywnej treści.
        </p>
        <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
          Kliknij przycisk, wybierz ocenę i — jeśli chcesz — dodaj kilka słów. Google może poprosić o zalogowanie do konta.
        </p>
      `, 'rgba(255,193,7,0.3)')}

      ${ctaButton('⭐ Dodaj opinię w Google', data.reviewLink)}

      ${goldDivider()}

      <p style="color:#666;font-size:12px;text-align:center;margin:0;line-height:1.7;">
        Jeśli chcesz dodatkowo omówić realizację bezpośrednio ze mną, możesz odpowiedzieć na ten email.<br>
        Nie ma to wpływu na możliwość opublikowania szczerej opinii.
      </p>
    `;

  return emailShell(content, `${data.clientName}, dziękuję za zaufanie — Przemysław Właśniewski`);
}
