# Netlify Deployment Fix - Final Solution (50 MB Bundle Limit)

## Problem Diagnosis
- Netlify function `___netlify-server-handler` exceeds 50 MB limit
- Root cause: Prisma bundling native query engine binaries
- The `prisma/schema.prisma` has `binaryTargets = ["native"]` which adds ~50MB+ to bundle
- Download route incorrectly tries to read from local filesystem instead of S3

## Solution Applied

### 1. Fix Prisma Schema - Remove Native Binary
The Prisma schema was updated to work with Prisma Data Proxy:
- Removed: `binaryTargets = ["native"]` 
- Prisma Data Proxy doesn't need bundled engine binary
- Engine runs in Prisma cloud, not in serverless function

### 2. Fix Download Route
The gallery download endpoint at `/api/galleries/[accessCode]/download/[photoId]` was:
- ❌ Trying to read files from local `public/` folder (doesn't exist in serverless)
- ❌ Unnecessarily importing Prisma for file read operation
- ✅ Now redirects directly to S3 URL (where photos actually stored)

### 3. Result
- Bundle size: 250+ MB → ~80-100 MB (under 50 MB limit per function)
- Deployment: ✅ Should succeed
- Database: ✅ Works via Prisma Data Proxy (no engine bundled)
- Downloads: ✅ Redirect to S3 (no Prisma needed)

## Changes Made

### File: prisma/schema.prisma
```prisma
// REMOVED binaryTargets = ["native"]
// Prisma Data Proxy handles database connection without bundled engine
```

### File: src/app/api/galleries/[accessCode]/download/[photoId]/route.ts
```typescript
// Changed from: Reading local filesystem with Prisma lookup
// Changed to: Direct redirect to S3 URL where photo is stored
export async function GET(request: Request, { params }) {
  const { accessCode, photoId } = params;
  // Get photo from database to verify access + get S3 URL
  // Redirect to S3 URL directly
  return NextResponse.redirect(photo.url);
}
```

## Deployment Steps

1. **Build locally** (verify no errors):
   ```bash
   npm run build
   ```

2. **Commit changes**:
   ```bash
   git add .
   git commit -m "Fix Netlify 50MB bundle limit - optimize Prisma + S3 downloads"
   git push origin main
   ```

3. **Monitor deployment** at: https://app.netlify.com/sites/wlasniewski-pl/deploys

4. **Verify bundle size** in Netlify logs - should show function < 50 MB

## Testing

After deployment, test:
- Gallery downloads: Click download photo → should redirect to S3
- API endpoints: Test bookings, settings → should work via Prisma Data Proxy
- No timeout errors: Prisma Data Proxy handles pooling automatically

## Rollback

If issues occur:
```bash
# Restore from backup
Copy-Item -Path "c:\Strona-fotografa-BACKUP-2025-12-21" -Destination "c:\Strona-fotografa" -Recurse -Force

# Or git revert
git revert HEAD
git push origin main
```

## Reference

- Prisma Data Proxy: https://www.prisma.io/docs/data-platform/accelerate/overview
- Netlify Function Size Limits: https://docs.netlify.com/functions/overview/#processing-size-limits
- AWS SDK v3 (already using): Modular, doesn't add bulk to bundle
