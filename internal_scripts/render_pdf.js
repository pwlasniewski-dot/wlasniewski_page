const { pdfToPng } = require('pdf-to-png-converter');
const fs = require('fs');
(async () => {
  const pages = await pdfToPng('demo-screens/voucher.pdf', {
    viewportScale: 2.0,
    pdfFilePassword: '',
    useSystemFonts: true,
    enableXfa: false,
    cMapUrl: 'C:/Strona-fotografa/node_modules/pdfjs-dist/cmaps/',
  });
  for (const p of pages) {
    const out = `demo-screens/voucher-page-${p.pageNumber}.png`;
    fs.writeFileSync(out, p.content);
    console.log(out, p.content.length);
  }
})();
