# Prisma Data Proxy Setup - Fix Netlify Deployment

## ✅ What This Does
- Removes Prisma engine binary from serverless bundle (saves 100+ MB)
- Uses connection pooling instead of embedding engine
- Industry standard for serverless deployments
- Fixes the 250 MB Netlify function size limit

## 📝 Step-by-Step Setup

### 1. Sign Up for Prisma Accelerate (Free Tier Available)
- Go to: https://www.prisma.io/accelerate
- Sign in with GitHub / email
- Create new project or use existing

### 2. Get Your Data Proxy URL
1. In Prisma Dashboard, click "Create API Key"
2. Copy the connection string that looks like:
   ```
   prisma://aws-us-east-1.provider.prisma.io/?api_key=xxxxxxx...
   ```

### 3. Update .env.production
Replace your DATABASE_URL with the proxy connection string:

```bash
# OLD (with direct database connection)
DATABASE_URL="postgresql://user:pass@neon.tech/dbname"

# NEW (with Prisma Data Proxy)
DATABASE_URL="prisma://aws-us-east-1.provider.prisma.io/?api_key=xxxxx..."
```

### 4. Update .env (development)
Add the proxy connection for local testing:
```bash
DATABASE_URL="prisma://aws-us-east-1.provider.prisma.io/?api_key=xxxxx..."
```

### 5. Rebuild and Test Locally
```bash
npm run build
npm run dev
```

### 6. Check Bundle Size
```bash
du -sh .netlify/functions/__netlify-server-handler
```
- Expected: <150 MB (was 250+ MB)

### 7. Deploy to Netlify
```bash
git add .
git commit -m "Enable Prisma Data Proxy for serverless deployment"
git push origin main
```

## ⚠️ Important Notes

### Prisma Accelerate Plans
- **Free Tier**: 50,000 queries/month - sufficient for most projects
- **Pro**: Unlimited queries, custom regions, priority support

### Edge Cases
- If you hit query limits, upgrade to Pro ($10/month)
- Data Proxy adds ~5-10ms latency (usually imperceptible)
- All connections use pooling (more efficient than direct connections)

## 🔍 Verify It's Working

After deployment, check logs:
```bash
curl https://wlasniewski.pl/api/settings/public
```

Should return settings JSON without errors.

## 🔄 Rollback Instructions
If something goes wrong:
1. Revert DATABASE_URL to direct connection
2. Restore from backup: `c:\Strona-fotografa-BACKUP-2025-12-21`
3. Run `npm run build` and redeploy

## 📚 Learn More
- Prisma Data Proxy Docs: https://www.prisma.io/docs/data-platform/accelerate/overview
- Prisma Serverless Guide: https://www.prisma.io/docs/guides/performance-and-optimization/connection-pooling

---

**Status**: Ready for deployment once DATABASE_URL is updated with your Prisma API key
