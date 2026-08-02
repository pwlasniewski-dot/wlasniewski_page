import { renderToStaticMarkup } from 'react-dom/server';
import GuidePage from '../../src/app/jak-sie-ubrac/page';
import ProductPreviewPage from '../../src/app/sklep/poradnik-jak-sie-ubrac-i-pozowac/page';

async function main() {
    process.stdout.write(JSON.stringify({
        guide: renderToStaticMarkup(await GuidePage()),
        product: renderToStaticMarkup(ProductPreviewPage()),
    }));
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
