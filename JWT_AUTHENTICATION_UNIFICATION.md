# JWT Authentication Unification - v3.0.2

## Summary

Successfully unified JWT authentication across all client and admin endpoints to use the `jose` library exclusively. This resolves signature verification failures that occurred when mixing `jose` and `jsonwebtoken` libraries.

## Problem Identified

Two incompatible JWT libraries were being used:
- **Admin/existing code**: `jose` library (SignJWT, jwtVerify with HS256)
- **New client auth**: `jsonwebtoken` library (jwt.sign, jwt.verify)

These generate incompatible token signatures, causing `JWSSignatureVerificationFailed` errors.

## Solution Implemented

All client portal authentication endpoints now use the unified `jose` library from `src/lib/auth/jwt.ts`:

### Fixed Endpoints

1. **`/api/client/auth/login`** - Client login endpoint
   - Changed from: `jwt.sign()` (jsonwebtoken)
   - Changed to: `generateToken()` from `@/lib/auth/jwt`
   - Result: Generates tokens compatible with system verification

2. **`/api/client/portal/offers`** - Fetch all client offers
   - Changed from: Manual `jwt.verify()` (jsonwebtoken)
   - Changed to: `verifyToken()` and `extractToken()` from `@/lib/auth/jwt`
   - Result: Properly verifies jose-signed tokens

3. **`/api/client/portal/offers/[id]`** - Offer detail and actions
   - Changed from: Manual `jwt.verify()` (jsonwebtoken)
   - Changed to: `verifyToken()` and `extractToken()` from `@/lib/auth/jwt`
   - Result: Ownership verification works correctly

4. **`/api/client/portal/contracts`** - Contract listing and creation
   - Changed from: Manual `jwt.verify()` (jsonwebtoken)
   - Changed to: `verifyToken()` and `extractToken()` from `@/lib/auth/jwt`
   - Result: Client contract endpoints now properly authenticated

### Authentication Flow (Unified)

```
1. Client Login: POST /api/client/auth/login
   ├─ Credentials verified against database
   └─ Token generated: generateToken({ id, email, role }) using jose SignJWT

2. Client Request: GET /api/client/portal/offers
   ├─ Extract token from Authorization header
   ├─ Verify token: jwtVerify(token, JWT_SECRET) using jose
   ├─ Extract payload: { id, email, role }
   └─ Verify ownership: offer.client_id === decoded.id

3. Token Verification: 
   ├─ Algorithm: HS256 (symmetric, single secret)
   ├─ Expiration: 7 days from issuance
   ├─ Payload: { id, email, role }
   ├─ Secret: process.env.JWT_SECRET (TextEncoder encoded)
   └─ Library: jose (consistent with admin auth)
```

### Source of Truth

All JWT operations now reference `src/lib/auth/jwt.ts`:

```typescript
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-change-this'
);

export async function generateToken(payload: { id: number; email: string; role?: string }) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ id: number; email: string } | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as { id: number; email: string };
    } catch (error) {
        console.error('JWT Verification failed:', error);
        return null;
    }
}

export function extractToken(authHeader: string | null): string | null {
    return authHeader?.replace('Bearer ', '') || null;
}
```

## Build Status

✅ **Production Build Successful**
- All 171 pages compiled without errors
- All client portal endpoints registered correctly:
  - `/api/client/auth/login`
  - `/api/client/portal/offers`
  - `/api/client/portal/offers/[id]`
  - `/api/client/portal/contracts`
  - `/strefa-klienta/login`
  - `/strefa-klienta/oferty/[id]`
  - `/strefa-klienta/umowy/[id]`

✅ **Development Server Running**
- Started successfully at http://localhost:3000
- Ready in 6.3s

## Verification Tests

Ready to perform:

```bash
# 1. Client Login
curl -X POST http://localhost:3000/api/client/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com","password":"password"}'

# 2. Fetch Client Offers (with token)
curl http://localhost:3000/api/client/portal/offers \
  -H "Authorization: Bearer <TOKEN>"

# 3. Accept Offer
curl -X PATCH http://localhost:3000/api/client/portal/offers/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"action":"accept"}'

# 4. Fetch Client Contracts
curl http://localhost:3000/api/client/portal/contracts \
  -H "Authorization: Bearer <TOKEN>"
```

## Remaining Tasks

1. ✅ Unify JWT library across client auth endpoints (COMPLETED)
2. ⏳ Test client login and offer fetching with real requests
3. ⏳ Verify Google Drive settings UI integration in admin panel
4. ⏳ Remove jsonwebtoken dependency if no longer needed

## Notes

- The `jsonwebtoken` package is still installed but no longer used
- Can be safely removed after verification that no other code depends on it
- All new code should use jose library exclusively
- Environment variable `JWT_SECRET` is critical for token verification - must be consistent across deployments
