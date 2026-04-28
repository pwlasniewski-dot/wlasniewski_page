import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';

const data = new Uint8Array(fs.readFileSync('demo-screens/voucher.pdf'));
const doc = await getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise;
console.log('pages', doc.numPages);
const page = await doc.getPage(1);
const viewport = page.getViewport({ scale: 2 });
const canvas = createCanvas(viewport.width, viewport.height);
const ctx = canvas.getContext('2d');
await page.render({ canvasContext: ctx, viewport, canvas }).promise;
fs.writeFileSync('demo-screens/voucher.png', canvas.toBuffer('image/png'));
console.log('wrote demo-screens/voucher.png', viewport.width, 'x', viewport.height);
