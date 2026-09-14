import { ShopValidationError } from '@/lib/galleries/merchandise';

/** InPost's authenticated Points API; its token never reaches the browser. */
export async function fetchInpostPoints(params: URLSearchParams) {
 const environment = process.env.INPOST_ENVIRONMENT || 'sandbox';
 const token = process.env.INPOST_POINTS_TOKEN?.trim() || process.env.INPOST_API_TOKEN?.trim();
 if (!token || !['sandbox','production'].includes(environment)) throw new ShopValidationError('Wyszukiwarka InPost wymaga konfiguracji połączenia.',503);
 const base = environment === 'production' ? 'https://api.inpost.pl/v1/points' : 'https://sandbox-api-gateway-pl.easypack24.net/v1/points';
 const response = await fetch(`${base}?${params}`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(6000), redirect: 'error', cache: 'no-store' });
 if (!response.ok) throw new ShopValidationError(`API punktów InPost odrzuciło zapytanie (HTTP ${response.status}). Sprawdź uprawnienia tokenu do API Points.`,503);
 const data = await response.json();
 if (!Array.isArray(data.items)) throw new ShopValidationError('InPost zwrócił nieprawidłową listę punktów.',503);
 return data;
}
