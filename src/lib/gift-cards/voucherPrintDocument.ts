export type VoucherPrintData = {
    code: string;
    value: number;
    theme?: string | null;
    recipientName?: string | null;
    senderName?: string | null;
    message?: string | null;
    cardTitle?: string | null;
    cardDescription?: string | null;
    showPrice?: boolean;
    validUntil?: string | Date | null;
};

const themePhotos: Record<string, string> = {
    christmas: '/gift-cards/velvet-premium.webp',
    wosp: '/gift-cards/celebration-premium.webp',
    valentines: '/gift-cards/wedding-premium.webp',
    easter: '/gift-cards/family-premium.webp',
    halloween: '/gift-cards/celebration-premium.webp',
    'mothers-day': '/gift-cards/family-premium.webp',
    'childrens-day': '/gift-cards/family-premium.webp',
    wedding: '/gift-cards/wedding-premium.webp',
    birthday: '/gift-cards/celebration-premium.webp',
    gold: '/gift-cards/velvet-premium.webp',
    blue: '/gift-cards/celebration-premium.webp',
    green: '/gift-cards/family-premium.webp',
};

export function escapeVoucherHtml(value: unknown): string {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatValidity(value: string | Date | null | undefined): string {
    if (!value) return 'Termin realizacji ustalany indywidualnie';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Termin realizacji ustalany indywidualnie';
    return `Ważny do ${new Intl.DateTimeFormat('pl-PL').format(date)}`;
}

export function buildVoucherPrintDocument(data: VoucherPrintData, origin: string): string {
    const theme = data.theme && themePhotos[data.theme] ? data.theme : 'gold';
    const normalizedOrigin = origin.replace(/\/$/, '');
    const photoUrl = `${normalizedOrigin}${themePhotos[theme]}`;
    const logoUrl = `${normalizedOrigin}/assets/brand/voucher-logo.svg`;
    const palette = theme === 'green' || theme === 'easter' || theme === 'mothers-day' || theme === 'childrens-day'
        ? { paper: '#f5f1e9', panel: '#dfeae3', accent: '#5f7e70', ink: '#2f2927', muted: '#554c48' }
        : theme === 'valentines' || theme === 'wedding'
            ? { paper: '#f7f0ed', panel: '#f0dfdc', accent: '#a96860', ink: '#332a28', muted: '#5c4c48' }
            : theme === 'blue' || theme === 'wosp' || theme === 'birthday' || theme === 'halloween'
                ? { paper: '#f3f3f0', panel: '#dfe9ed', accent: '#607f8b', ink: '#283238', muted: '#4c5c62' }
                : { paper: '#f5f0ed', panel: '#eadfe5', accent: '#80677a', ink: '#302a2f', muted: '#564a53' };
    const title = escapeVoucherHtml(data.cardTitle || 'Voucher podarunkowy');
    const description = escapeVoucherHtml(data.cardDescription || 'Sesja fotograficzna pełna naturalnych emocji');
    const recipient = escapeVoucherHtml(data.recipientName || 'Wyjątkowej osoby');
    const sender = escapeVoucherHtml(data.senderName || 'Bliskich');
    const message = escapeVoucherHtml(data.message || 'Podarujmy sobie wspólny czas i fotografie, które zostaną na lata.');
    const code = escapeVoucherHtml(data.code);
    const price = data.showPrice === false
        ? '<div class="service-value">Sesja fotograficzna</div>'
        : `<div class="price-label">Wartość</div><div class="price">${Math.round(data.value)} zł</div>`;

    return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Voucher ${code}</title>
  <style>
    *{box-sizing:border-box} @page{size:A4 landscape;margin:12mm}
    body{margin:0;background:${palette.paper};color:${palette.ink};font-family:Arial,sans-serif;display:grid;min-height:100vh;place-items:center}
    .sheet{width:100%;display:grid;place-items:center}.voucher{width:254mm;height:160mm;max-width:100%;position:relative;overflow:hidden;border-radius:7mm;background:${palette.panel};box-shadow:0 8mm 22mm rgba(81,72,68,.16);display:grid;grid-template-columns:43% 57%;print-color-adjust:exact;-webkit-print-color-adjust:exact}
    .photo{background-image:linear-gradient(rgba(255,255,255,.08),rgba(255,255,255,.18)),url('${escapeVoucherHtml(photoUrl)}');background-size:cover;background-position:center;border-right:.45mm solid rgba(255,255,255,.72)}
    .content{padding:12mm 13mm 10mm;display:flex;flex-direction:column;min-width:0}.brand{display:flex;justify-content:space-between;align-items:center;gap:10mm;color:${palette.ink};font-size:7.5pt;font-weight:700;letter-spacing:2.5px;text-transform:uppercase}.brand span:last-child{color:${palette.muted};font-weight:400;letter-spacing:1.8px}
    h1{font-family:Georgia,serif;font-size:32pt;line-height:1.04;font-weight:700;margin:13mm 0 3mm;letter-spacing:-.5px}.type{color:${palette.accent};font-size:9pt;letter-spacing:2.3px;text-transform:uppercase;font-weight:700;margin-bottom:6mm}.recipient{font-family:Georgia,serif;font-size:24pt;font-style:italic;font-weight:700}.description{font-size:10pt;color:${palette.muted};font-weight:700;letter-spacing:.8px;margin-top:3mm;line-height:1.5}.message{border-top:.25mm solid rgba(47,41,39,.22);margin-top:7mm;padding-top:5mm;color:${palette.ink};font-family:Georgia,serif;font-size:12pt;font-weight:700;line-height:1.5;min-height:18mm}.meta{margin-top:auto;display:flex;align-items:end;justify-content:space-between;gap:9mm}.price-label{font-size:8pt;color:${palette.muted};font-weight:700;letter-spacing:1.8px;text-transform:uppercase}.price{font-family:Georgia,serif;font-size:24pt;font-weight:700;margin-top:1.5mm}.service-value{font-family:Georgia,serif;font-size:18pt;font-weight:700;color:${palette.ink}}.code{text-align:right;border:1px solid rgba(47,41,39,.3);border-radius:999px;padding:3.5mm 5.5mm;background:rgba(255,255,255,.35)}.code-label{font-size:7pt;color:${palette.muted};font-weight:700;letter-spacing:1.6px;text-transform:uppercase}.code-value{font-family:monospace;font-size:13pt;letter-spacing:2px;font-weight:700;margin-top:1mm}.footer{display:flex;align-items:flex-end;justify-content:space-between;color:${palette.muted};font-size:8pt;font-weight:700;margin-top:5mm;letter-spacing:.4px}.footer-logo{width:53mm;height:auto;display:block}
    .controls{margin-top:7mm;display:flex;gap:3mm}.controls button{border:0;border-radius:999px;padding:3mm 7mm;font-size:10pt;font-weight:700;cursor:pointer}.print{background:${palette.accent};color:${palette.ink}}.close{background:${palette.ink};color:#fff}
    @media print{body{background:#fff}.voucher{box-shadow:none}.controls{display:none}}
    @media(max-width:760px){body{display:block;padding:12px}.voucher{width:100%;height:auto;min-height:620px;grid-template-columns:1fr}.photo{height:210px;border-right:0;border-bottom:1px solid rgba(81,72,68,.12)}.content{padding:28px}.brand{font-size:7px}h1{font-size:34px;margin-top:42px}.recipient{font-size:28px}.meta{margin-top:45px}.footer-logo{width:150px}.controls{justify-content:center}}
  </style>
</head>
<body>
  <main class="sheet">
    <article class="voucher">
      <div class="photo" aria-hidden="true"></div>
      <div class="content">
        <div class="brand"><span>WWW.WLASNIEWSKI.PL</span><span>Fotografia plenerowa</span></div>
        <h1>${title}</h1>
        <div class="type">${description}</div>
        <div class="recipient">Dla ${recipient}</div>
        <div class="description">Od ${sender}</div>
        <div class="message">${message}</div>
        <div class="meta"><div>${price}</div><div class="code"><div class="code-label">Kod vouchera</div><div class="code-value">${code}</div></div></div>
        <div class="footer"><span>${escapeVoucherHtml(formatValidity(data.validUntil))}<br>Kontakt: +48 530 788 694</span><img class="footer-logo" src="${escapeVoucherHtml(logoUrl)}" alt="Przemysław Właśniewski Fotografia"></div>
      </div>
    </article>
    <div class="controls"><button class="print" onclick="window.print()">Drukuj / zapisz PDF</button><button class="close" onclick="window.close()">Zamknij</button></div>
  </main>
</body>
</html>`;
}
