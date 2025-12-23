# 🚀 Photo Challenge Quick Start Guide

## Getting Started (5 minutes)

### 1. Admin Setup

**Login to admin panel:** `http://localhost:3000/admin`

**Navigate to:** Admin → Challenges → Dashboard

### 2. Create Your First Packages

**Go to:** Packages section  
**Click:** Add Package button

```
Package Example:
├── Name: "Standard Session"
├── Price: 500 PLN
└── Description: "1 hour session, 100+ photos"
```

### 3. Create Locations

**Go to:** Locations section  
**Click:** Add Location button

```
Location Example:
├── Name: "Park Narodowy Pieniny"
├── Address: "Dunajec River Gorge"
├── Google Maps: [Link to location]
└── Image: [Upload hero image]
```

### 4. Test the Flow

#### Create Challenge (Inviter)
```
1. Go to: http://localhost:3000/foto-wyzwanie/create
2. Fill form:
   ├── Your name: "Jan Kowalski"
   ├── Friend's name: "Anna Nowak"
   ├── Friend's email: "anna@example.com"
   ├── Select package
   ├── Select location
   └── Click "Przejdź do płatności"

3. Get unique_link from response
```

#### Send Invitation (Invitee)
```
1. Navigate to: http://localhost:3000/foto-wyzwanie/invite/{unique_link}
2. View invitation details
3. Click "Przyjmij"
```

#### Accept & Book (Invitee)
```
1. Fill Step 1: Confirm name
2. Fill Step 2: Select date from calendar
3. Fill Step 3: Select hour from grid
4. Click "Potwierdź rezerwację"
5. See success page with confetti
```

#### View Gallery
```
1. Click gallery link from success page
2. View photos in lightbox
3. Share on social media
```

#### Manage in Admin
```
1. Go to: http://localhost:3000/admin/challenges/dashboard
2. See all challenges with filters
3. Click gallery icon to manage photos
4. Upload photos from gallery management
```

---

## Email Configuration

### Local Development

For testing emails without real SMTP:

```bash
# Option 1: Use Mailtrap (Temporary testing)
npm install mailtrap

# Set env variables:
SMTP_HOST=send.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-id
SMTP_PASSWORD=your-mailtrap-pass
```

### Production Setup

See detailed guide: [EMAIL_SETUP.md](EMAIL_SETUP.md)

Quick commands:
```bash
# Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Not regular password!

# Brevo (recommended)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-brevo-api-key
```

---

## Seasonal Effects

### Enable Effects

**Admin Panel → Settings → Dekoracje Sezonowe**

Select from:
- ❄️ Snow (Winter)
- 💡 Lights (Christmas)
- ❤️ Hearts (Valentine's)
- 👻 Halloween (October)
- 🐰 Easter (Spring)
- ⛔ None

Effects will appear site-wide automatically.

---

## Payment Integration (P24)

### Setup Przelewy24

```
1. Register at: https://secure.przelewy24.pl/register
2. Get credentials:
   ├── Merchant ID
   ├── POS ID
   └── API Key

3. Add to .env:
   P24_MERCHANT_ID=xxxxx
   P24_POS_ID=xxxxx
   P24_API_KEY=xxxxx
   P24_ENVIRONMENT=sandbox  # Change to production later

4. Update /api/photo-challenge/create-with-payment:
   // Current returns mock URL
   // Replace with actual P24 API call

5. Test in sandbox environment
6. Deploy webhook handler for payment confirmation
```

### Test Payment Flow

```
1. Create challenge at /foto-wyzwanie/create
2. Click payment button
3. Should redirect to P24
4. Use test credentials provided by P24
5. Complete test transaction
6. Check PhotoChallenge status updates
```

---

## Common Tasks

### How to enable a challenge

```
Admin Dashboard → Challenge Card → Status Badge
Status changes automatically:
pending_payment → sent → viewed → accepted → completed
```

### How to upload photos to gallery

```
Admin Dashboard
  → Click gallery icon on challenge card
  → Photo Management section
  → Upload area (drag & drop or click)
  → Photos appear in grid
  → Optional: Edit title, couple names, testimonial
  → Publish gallery
```

### How to send reminder email

```
Admin Dashboard
  → Challenge card
  → Email icon (envelope)
  → Sends reminder to invitee
```

### How to delete a challenge

```
Admin Dashboard
  → Challenge card
  → Delete button (trash icon)
  → Confirm in dialog
  → Challenge removed from DB
```

### How to search challenges

```
Admin Dashboard
  → Search box
  → Type name or email
  → Results filter in real-time
```

### How to filter by status

```
Admin Dashboard
  → Status filter buttons
  → Click desired status
  → Shows only challenges with that status
```

---

## Database Queries (for debugging)

### Get all challenges for a user
```sql
SELECT * FROM photo_challenges 
WHERE inviter_name = 'Jan Kowalski' 
ORDER BY created_at DESC;
```

### Get challenges awaiting payment
```sql
SELECT * FROM photo_challenges 
WHERE status = 'pending_payment' 
AND created_at > NOW() - INTERVAL '30 days';
```

### Get availability for specific date
```sql
SELECT * FROM bookings 
WHERE date::date = '2024-12-20' 
ORDER BY start_time;
```

### Get blocked hours on specific date
```sql
SELECT service, start_time, end_time FROM bookings 
WHERE date::date = '2024-12-20' 
ORDER BY start_time;
```

---

## API Quick Reference

### Create Challenge
```bash
POST /api/photo-challenge/create-with-payment
{
  "inviter_name": "Jan",
  "invitee_name": "Anna",
  "invitee_email": "anna@example.com",
  "package_id": 1,
  "location_id": 1
}
```

### Get Challenge Details
```bash
GET /api/photo-challenge/{unique_link}
```

### Check Availability
```bash
GET /api/photo-challenge/availability?unique_link={uuid}&daysAhead=30
```

### Accept Challenge
```bash
POST /api/photo-challenge/{unique_link}/accept
{
  "name": "Anna Nowak",
  "date": "2024-12-20",
  "hour": 14
}
```

### Get Gallery
```bash
GET /api/photo-challenge/gallery/{challenge_id}
```

### List All Challenges (Admin)
```bash
GET /api/photo-challenge/admin/list
```

---

## Troubleshooting

### Challenge won't save
```
Check:
- Package exists in DB
- Location exists in DB
- Email is valid format
- unique_link is UUID v4
```

### Calendar not showing availability
```
Check:
- Booking records exist in DB
- Date format is ISO 8601
- Service type matches blocking rules:
  * 'Ślub' = full day block
  * 'Przyjęcie' = full day block
  * 'Event' = full day block
  * Other = hour-specific block
- daysAhead parameter not too large
```

### Emails not sending
```
Check:
1. SMTP credentials in .env
2. Test SMTP connection:
   node -e "require('nodemailer').createTransport({...}).verify()"
3. Check email is not in spam
4. Verify sender email whitelisted
5. Check console.error for details
```

### Payment not working
```
Check:
1. P24 credentials in .env
2. Amount converted to groszy (PLN * 100)
3. Redirect URL is absolute (with domain)
4. Test in P24 sandbox first
5. Check P24 documentation for errors
```

### Photos won't upload
```
Check:
1. public/uploads/galleries/ directory exists
2. Directory has write permissions (755)
3. File size < 10MB
4. MIME type starts with "image/"
5. Challenge ID exists in DB
```

### Gallery shows blank
```
Check:
1. Gallery created (auto-created on first photo upload)
2. Photos uploaded to correct challenge_id
3. is_published flag is true
4. MediaLibrary records have file_path set
```

---

## Performance Optimization

### Image Optimization
```typescript
// In gallery page component:
<Image 
  src={photo.file_url}
  alt={photo.caption}
  width={800}
  height={600}
  placeholder="blur"  // Show placeholder while loading
  loading="lazy"      // Lazy load images
/>
```

### Database Queries
```typescript
// Include relations only when needed
const gallery = await prisma.challengeGallery.findUnique({
  where: { challenge_id: id },
  include: {
    photos: {  // Only include if needed
      select: { id: true, caption: true }
    }
  }
});
```

### Caching
```typescript
// Cache availability for 5 minutes
const cacheKey = `availability:${unique_link}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

// Fetch fresh
const data = await fetchAvailability();
await cache.set(cacheKey, data, 300);  // 5 min
return data;
```

---

## Security Best Practices

✅ **Already Implemented:**
- UUID for unique challenge links (not sequential IDs)
- Email validation
- HTTPS in production
- Database input sanitization (Prisma)

🔒 **Consider Adding:**
- Rate limiting on API endpoints
- Gallery access tokens (time-limited)
- Admin panel authentication
- CSRF token validation
- Email verification for invitations
- IP whitelisting for admin

---

## Monitoring & Analytics

### Key Metrics to Track
1. **Challenges created per day**
2. **Invitation acceptance rate**
3. **Average time to acceptance**
4. **Payment success rate**
5. **Gallery view count**
6. **Social share clicks**

### Suggested Analytics Code
```typescript
// Track event in GA
gtag('event', 'challenge_created', {
  value: pkg.challenge_price,
  currency: 'PLN',
  package_name: pkg.package_name
});
```

---

## Need Help?

- 📖 Full documentation: [PHOTO_CHALLENGE.md](PHOTO_CHALLENGE.md)
- 📧 Email setup: [EMAIL_SETUP.md](EMAIL_SETUP.md)
- 💬 Ask in GitHub Issues
- 🐛 Report bugs with full stack trace

---

**Ready to go!** 🚀
