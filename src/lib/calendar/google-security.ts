import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
export const GOOGLE_REDIRECT = 'https://wlasniewski.pl/api/admin/google-calendar/callback';
export const GOOGLE_SCOPE = 'openid email https://www.googleapis.com/auth/calendar.events.owned';
export const OAUTH_COOKIE = 'fotodron_google_oauth';
export function googleConfigured() {
 return !!(process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() && process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() && /^[a-f\d]{64}$/i.test(process.env.GOOGLE_CALENDAR_TOKEN_KEY || ''));
}
function key() {
 if (!googleConfigured()) throw new Error('not_configured');
 return Buffer.from(process.env.GOOGLE_CALENDAR_TOKEN_KEY!, 'hex');
}
export function encryptGoogleSecret(value: string) {
 const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key(), iv);
 cipher.setAAD(Buffer.from('fotodron-google-calendar-v1'));
 const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
 return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');
}
export function decryptGoogleSecret(value: string) {
 const data = Buffer.from(value, 'base64url');
 const decipher = createDecipheriv('aes-256-gcm', key(), data.subarray(0,12));
 decipher.setAAD(Buffer.from('fotodron-google-calendar-v1')); decipher.setAuthTag(data.subarray(12,28));
 return Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString('utf8');
}
export function createGoogleOAuth(adminId: number) {
 const state = randomBytes(32).toString('base64url'); const verifier = randomBytes(48).toString('base64url');
 const cookie = encryptGoogleSecret(JSON.stringify({state,verifier,adminId,expires:Date.now()+600_000}));
 const params = new URLSearchParams({client_id:process.env.GOOGLE_CALENDAR_CLIENT_ID!,redirect_uri:GOOGLE_REDIRECT,response_type:'code',scope:GOOGLE_SCOPE,access_type:'offline',prompt:'consent',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'});
 return {cookie,url:`https://accounts.google.com/o/oauth2/v2/auth?${params}`};
}
export function verifyGoogleOAuth(cookie: string, state: string, adminId: number) {
 const data = JSON.parse(decryptGoogleSecret(cookie));
 const a=Buffer.from(String(data.state)); const b=Buffer.from(state);
 if (a.length!==b.length || !timingSafeEqual(a,b) || data.adminId!==adminId || !Number.isFinite(data.expires) || data.expires<Date.now() || data.expires>Date.now()+600_000) throw new Error('invalid_state');
 return String(data.verifier);
}
export class GoogleCalendarError extends Error { constructor(public code: string, public status = 502) { super(code); } }
export async function googleRequest(url: string, init: RequestInit = {}, timeoutMs=10000) {
 let response: Response;
 try { response = await fetch(url,{...init,cache:'no-store',signal:AbortSignal.timeout(Math.max(1,timeoutMs))}); }
 catch { throw new GoogleCalendarError('google_unavailable'); }
 if (!response.ok) throw new GoogleCalendarError(response.status===401?'reconnect_required':response.status===429?'google_rate_limit':'google_request_failed',response.status);
 if (response.status===204) return {};
 const body=await response.text();
 return body?JSON.parse(body):{};
}
export function googleTokenRequest(params: Record<string,string>, timeoutMs=10000) {
 return googleRequest('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...params,client_id:process.env.GOOGLE_CALENDAR_CLIENT_ID!,client_secret:process.env.GOOGLE_CALENDAR_CLIENT_SECRET!})},timeoutMs);
}
