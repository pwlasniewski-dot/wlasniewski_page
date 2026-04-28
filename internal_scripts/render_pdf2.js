// Use pdfjs-dist directly with @napi-rs/canvas
const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs').then(async (pdfjs) => {
  const fs = require('fs');
  const data = new Uint8Array(fs.readFileSync('demo-screens/voucher.pdf'));
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise;
  console.log('pages', doc.numPages);
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  console.log('viewport', viewport.width, viewport.height);

  const { createCanvas } = require('@napi-rs/canvas');
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  fs.writeFileSync('demo-screens/voucher.png', canvas.toBuffer('image/png'));
  console.log('wrote demo-screens/voucher.png');
});
