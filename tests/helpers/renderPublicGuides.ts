import { renderToStaticMarkup } from 'react-dom/server';
import GuidePage from '../../src/app/jak-sie-ubrac/page';
import ProductPreviewPage from '../../src/app/sklep/poradnik-jak-sie-ubrac-i-pozowac/page';

process.stdout.write(JSON.stringify({
    guide: renderToStaticMarkup(GuidePage()),
    product: renderToStaticMarkup(ProductPreviewPage()),
}));
