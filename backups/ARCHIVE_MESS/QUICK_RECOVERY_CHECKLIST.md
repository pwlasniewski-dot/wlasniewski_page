# ✅ QUICK RECOVERY CHECKLIST
## wlasniewski.pl - Szybki Plan Przywrócenia (do zapamiętania)

**Data**: 21 grudnia 2025  
**Czas**: ~14:35 CET  
**Status**: RECOVERY IN PROGRESS  
**Czytaj**: Przeczytaj najpierw EMERGENCY_RECOVERY.md, potem wykonuj to

---

## 🚨 IMMEDIATE ACTIONS (FIRST 5 MINUTES)

```
□ STOP - Don't make more changes
□ Deep breath - You've got this
□ Read EMERGENCY_RECOVERY.md - Full procedures
□ Open terminal
□ Navigate: cd c:\Strona-fotografa
```

---

## 📋 STEP-BY-STEP RECOVERY

### STEP 1: Verify Database is Responding (2 min)

```bash
# Terminal 1:
npm run dev

# Expected output:
# ✓ ready - started server on 0.0.0.0:3000

# If error: DATABASE CONNECTION FAILED
# → Check .env contains DATABASE_URL
# → Check DATABASE_URL points to Neon
```

### STEP 2: Create AdminUser (3 min)

```bash
# Terminal 2:
node create_admin.js

# Expected output:
# Admin user created/updated: {
#   id: 1,
#   email: 'pwlasniewski@gmail.com',
#   name: 'Przemysław Właśniewski',
#   role: 'ADMIN',
#   created_at: '2025-12-21T...'
# }

# 🔐 LOGIN CREDENTIALS (SAVE SECURELY):
# Email:    pwlasniewski@gmail.com
# Password: Fotograf2025!

# Test login:
# 1. Open browser: http://localhost:3000/logowanie
# 2. Click "Admin Login"
# 3. Enter credentials above
# 4. Should redirect to /admin/dashboard
```

### STEP 3: Restore ServiceType & Package (5 min)

```bash
# Check if seed script exists:
ls scripts/seed*

# Run seed:
npm run seed

# OR manually via prisma studio:
# 1. Go to "service_types" table
# 2. Add records:
#    - name: "Sesja Portretowa"
#    - icon: "camera"
#    - order: 1
#    - is_active: true
#
# 3. Go to "packages" table
# 4. Add records for each service

# Verify:
curl http://localhost:3000/api/packages
# Should return JSON array
```

### STEP 4: Test Locally (10 min)

```bash
# Check homepage
curl http://localhost:3000

# Check admin login page
curl http://localhost:3000/logowanie

# Check API
curl http://localhost:3000/api/settings
curl http://localhost:3000/api/packages

# All should return data (no 500 errors)
```

### STEP 5: Build Production Version (10 min)

```bash
npm run build

# Expected: ✓ Successfully compiled
# If errors: FIX THEM BEFORE DEPLOYING

# Check build size:
du -sh .next/
```

### STEP 6: Deploy (10 min)

```bash
# Commit recovery changes
git add -A
git commit -m "recovery: restore database after catastrophe"
git push origin main

# Monitor deployment:
# https://app.netlify.com → watch live logs

# Wait for: Deploy complete
```

### STEP 7: Verify Production (10 min)

```bash
# Wait 2 minutes for deploy to complete

# Check homepage
curl https://wlasniewski.pl

# Check admin
curl https://wlasniewski.pl/logowanie

# Check API
curl https://wlasniewski.pl/api/packages

# All should work!
```

---

## 🎯 SUCCESS CHECKLIST

After each step, verify:

```
□ npm run dev starts (no DB errors)
□ localhost:3000 loads
□ /logowanie page shows
□ /rezerwacja page shows
□ /api/packages returns data
□ /api/settings returns data
□ npm run build completes
□ No TypeScript errors
□ Deployed to production
□ Production homepage loads
□ Production API responds
```

---

## 🆘 IF SOMETHING GOES WRONG

### Problem: Database Connection Error

```bash
# Check .env
cat .env | grep DATABASE_URL

# Should show:
# DATABASE_URL=postgresql://...

# If empty:
# 1. Go to Neon console
# 2. Copy connection string
# 3. Paste into .env
# 4. Try again
```

### Problem: AdminUser Won't Authenticate

```bash
# Verify admin exists:
npx prisma studio → admin_users table

# If empty:
node scripts/create_admin.js

# If doesn't exist:
# Create manually via prisma studio
```

### Problem: Packages Empty

```bash
# Verify packages exist:
curl http://localhost:3000/api/packages

# If empty array:
npm run seed

# If seed script missing:
# Create manually in prisma studio
```

### Problem: npm run build Fails

```bash
# Check the error:
npm run build 2>&1 | tail -50

# Common fixes:
- Clear node_modules: rm -rf node_modules && npm install
- Clear .next: rm -rf .next
- Check TypeScript: npx tsc --noEmit
```

### Problem: Deploy to Netlify Failed

```bash
# Check deployment logs:
# https://app.netlify.com → Deploys → Latest

# If build failed:
npm run build (locally)
# Fix errors locally first

# If deploy failed:
git revert HEAD
git push
# Roll back to previous version
```

---

## ⏱️ TIMING ESTIMATE

```
Step 1 (Verify DB):      2 min
Step 2 (AdminUser):      3 min
Step 3 (ServiceType):    5 min
Step 4 (Test Local):     10 min
Step 5 (Build):          10 min
Step 6 (Deploy):         10 min
Step 7 (Verify Prod):    10 min
────────────────────────────
TOTAL:                   ~50 min
```

---

## 📞 IF ALL ELSE FAILS

```
Option A: Revert to Last Working Commit
git revert HEAD
git push
# → Netlify auto-deploys old version

Option B: Manual Database Restore
# Via Neon console SQL editor
# → Restore from backup (if exists)

Option C: Nuclear Option
node cleanup-database-full.js
npm run seed
npm run build
git push
# → Fresh start (all data reset)
```

---

## 🎓 WHAT TO REMEMBER

```
✅ Always test locally first
✅ Always build before deploying
✅ Always read error messages
✅ Always backup before changes
✅ Always wait after deployment
✅ Always monitor first hour after deploy

❌ Never force push
❌ Never trust AI agents with prod DB
❌ Never skip testing
❌ Never deploy without review
❌ Never ignore errors
❌ Never rush recovery
```

---

## 📚 RELATED DOCUMENTS

- **DEVELOPMENT_GUIDELINES.md** - Full procedures
- **EMERGENCY_RECOVERY.md** - Detailed recovery
- **DISASTER_AUDIT_REPORT.md** - What went wrong
- **PROJECT_HISTORIA.md** - Change log

---

## ✨ YOU'VE GOT THIS!

```
Remember:
- This is reversible (if you follow procedures)
- You're not the first to have this problem
- Every programmer has been here
- Stay calm and follow steps
- Ask for help if stuck

The database will be recovered. 💪
```

---

**Good luck! Document everything in PROJECT_HISTORIA.md when done. 🚀**
