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
    const photoUrl = `${origin.replace(/\/$/, '')}${themePhotos[theme]}`;
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
    body{margin:0;background:#f4f0e8;color:#f8f2e7;font-family:Arial,sans-serif;display:grid;min-height:100vh;place-items:center}
    .sheet{width:100%;display:grid;place-items:center}.voucher{width:254mm;height:160mm;max-width:100%;position:relative;overflow:hidden;border-radius:8mm;background:#090909;box-shadow:0 8mm 22mm rgba(0,0,0,.22);display:grid;grid-template-columns:39% 61%;print-color-adjust:exact;-webkit-print-color-adjust:exact}
    .photo{background-image:linear-gradient(rgba(4,4,4,.16),rgba(4,4,4,.22)),url('${escapeVoucherHtml(photoUrl)}');background-size:cover;background-position:center;border-right:.35mm solid #d8b15e}
    .content{padding:13mm 14mm 11mm;display:flex;flex-direction:column;min-width:0}.brand{display:flex;justify-content:space-between;gap:10mm;color:#d8b15e;font-size:8pt;font-weight:700;letter-spacing:2.8px;text-transform:uppercase}.brand span:last-child{color:#aaa39a;font-weight:400;letter-spacing:2px}
    h1{font-family:Georgia,serif;font-size:30pt;line-height:1.05;font-weight:400;margin:17mm 0 4mm;letter-spacing:-.6px}.type{color:#d8b15e;font-size:8pt;letter-spacing:3px;text-transform:uppercase;font-weight:700;margin-bottom:8mm}.recipient{font-family:Georgia,serif;font-size:23pt;font-weight:700}.description{font-size:9pt;color:#bdb6aa;letter-spacing:1.2px;margin-top:3mm;line-height:1.55}.message{border-top:.25mm solid #3d382f;margin-top:9mm;padding-top:7mm;color:#eee7dc;font-size:10pt;line-height:1.55;min-height:22mm}.meta{margin-top:auto;display:flex;align-items:end;justify-content:space-between;gap:9mm}.price-label{font-size:7pt;color:#a9a196;letter-spacing:2px;text-transform:uppercase}.price{font-size:23pt;font-weight:700;margin-top:1.5mm}.service-value{font-family:Georgia,serif;font-size:17pt;color:#f4eddf}.code{text-align:right;border:1px solid #5b5245;border-radius:999px;padding:4mm 6mm}.code-label{font-size:6.5pt;color:#aaa196;letter-spacing:2px;text-transform:uppercase}.code-value{font-family:monospace;font-size:12pt;letter-spacing:2px;font-weight:700;margin-top:1mm}.footer{display:flex;justify-content:space-between;color:#aaa196;font-size:7pt;margin-top:7mm;letter-spacing:.7px}
    .controls{margin-top:7mm;display:flex;gap:3mm}.controls button{border:0;border-radius:999px;padding:3mm 7mm;font-size:10pt;font-weight:700;cursor:pointer}.print{background:#d8b15e;color:#090909}.close{background:#26231f;color:#fff}
    @media print{body{background:#fff}.voucher{box-shadow:none}.controls{display:none}}
    @media(max-width:760px){body{display:block;padding:12px}.voucher{width:100%;height:auto;min-height:620px;grid-template-columns:1fr}.photo{height:210px;border-right:0;border-bottom:1px solid #d8b15e}.content{padding:28px}.brand{font-size:7px}h1{font-size:34px;margin-top:42px}.recipient{font-size:28px}.meta{margin-top:45px}.controls{justify-content:center}}
  </style>
</head>
<body>
  <main class="sheet">
    <article class="voucher">
      <div class="photo" aria-hidden="true"></div>
      <div class="content">
        <div class="brand"><span>Właśniewski.pl</span><span>Fotografia plenerowa</span></div>
        <h1>${title}</h1>
        <div class="type">${description}</div>
        <div class="recipient">Dla ${recipient}</div>
        <div class="description">Od ${sender}</div>
        <div class="message">${message}</div>
        <div class="meta"><div>${price}</div><div class="code"><div class="code-label">Kod vouchera</div><div class="code-value">${code}</div></div></div>
        <div class="footer"><span>${escapeVoucherHtml(formatValidity(data.validUntil))}</span><span>+48 530 788 694 • wlasniewski.pl/rezerwacja</span></div>
      </div>
    </article>
    <div class="controls"><button class="print" onclick="window.print()">Drukuj / zapisz PDF</button><button class="close" onclick="window.close()">Zamknij</button></div>
  </main>
</body>
</html>`;
}
