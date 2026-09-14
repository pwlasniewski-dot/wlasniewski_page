/** Optional isolated review database, scoped in Netlify to the review branch only. */
export function isShopQa() {
 return process.env.CONTEXT !== 'production' && Boolean(process.env.GALLERY_QA_DATABASE_URL?.trim());
}
export function shopDatabaseUrl() {
 if (!isShopQa()) return process.env.DATABASE_URL;
 if (process.env.CONTEXT !== 'deploy-preview' && !['development','test'].includes(process.env.NODE_ENV || '')) throw new Error('Review database requires an explicit preview or local test context.');
 const value=process.env.GALLERY_QA_DATABASE_URL!.trim();
 const qa=new URL(value);
 const production=process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
 const host=(url:URL|null)=>url?.hostname.replace(/-pooler(?=\.)/,'');
 if (!['postgres:','postgresql:'].includes(qa.protocol) || host(qa) === host(production)) throw new Error('Review database must be isolated from production.');
 return value;
}
