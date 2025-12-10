# Production Environment Setup

## 1. Neon Database (PostgreSQL)
- Create a project in Neon.tech
- Copy the Connection String (Pooled connection is best for serverless).
- Set `DATABASE_URL` in Netlify.

## 2. AWS S3 Storage
- Create a bucket named `wlasniewski-photo-storage` in `eu-central-1`.
- Create an IAM User with `Programmatic Access`.
- Attach a policy allowing `s3:PutObject`, `s3:GetObject` (and `s3:DeleteObject` if needed) on the bucket.
- Allow public read access to the bucket or objects if you want them directly accessible (e.g., via Bucket Policy).

**Required Variables**:
- `MY_AWS_ACCESS_KEY_ID`: Your IAM User Access Key
- `MY_AWS_SECRET_ACCESS_KEY`: Your IAM User Secret Key
- `S3_BUCKET`: `wlasniewski-photo-storage`
- `S3_REGION`: `eu-north-1`

## 3. General App Config
- `NEXT_PUBLIC_BASE_URL`: `https://wlasniewski.pl` (or your Netlify URL)
- `JWT_SECRET`: A long random string for admin sessions.

## 4. Netlify
- Build command: `npm run build`
- Publish directory: `.next`
- Add all the above Environment Variables in Site Settings.


# --- AWS S3 ---------------------------------------
AWS_ACCESS_KEY_ID=TU_WKLEJ_SWÓJ_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=TU_WKLEJ_SWÓJ_SECRET_ACCESS_KEY
AWS_REGION=eu-north-1
AWS_S3_BUCKET=wlasniewski-photo-storage

# --- Uprawnienia dla uploadu ----------------------
AWS_S3_UPLOAD_PATH=uploads/

# --- Next.js / Vercel token jeśli używasz ---------
VERCEL_OIDC_TOKEN=""
