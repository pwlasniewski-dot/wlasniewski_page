import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

function getParentJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('[SECURITY] JWT_SECRET must be configured and contain at least 32 characters.');
  }
  return new TextEncoder().encode(secret);
}

export interface ParentTokenPayload {
  participant_id: number;
  gallery_id: number;
  parent_identifier: string;
}

/**
 * Generate JWT token for parent after registration
 */
export async function generateParentToken(payload: ParentTokenPayload): Promise<string> {
  const token = await new SignJWT({ ...payload } as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // Token valid for 30 days
    .sign(getParentJwtSecret());

  return token;
}

/**
 * Verify parent JWT token
 */
export async function verifyParentToken(token: string): Promise<ParentTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getParentJwtSecret());
    if (typeof payload.participant_id !== 'number' || typeof payload.gallery_id !== 'number' || typeof payload.parent_identifier !== 'string') {
      return null;
    }
    return payload as unknown as ParentTokenPayload;
  } catch (error) {
    console.error('Parent token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}
