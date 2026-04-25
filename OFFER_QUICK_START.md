## 🚀 Quick Start Guide - Birthday Offer Template

### Step 1: Access the Generator

Navigate to your admin panel:
```
http://localhost:3000/admin/generator-ofert/oferta-urodzinowa
```

### Step 2: Select a Client

1. Click **"Wybierz klienta"** button
2. Type to search for existing client
3. Click client name to select

### Step 3: Set Event Details

1. **Data imprezy** - Select birthday date using date picker
2. **Dystans dojazdu** - Enter travel distance in km (auto-calculated from postcode)

### Step 4: Customize Offer

Click **"Edytuj"** button to edit:

#### Edit Package Details
- Click on package name to rename
- Edit duration (e.g., "6 godzin")
- Adjust photo count
- Update print quantities
- Modify video length

#### Modify Features
- Each bullet point is editable
- Add new features with input field
- Delete by clearing text

#### Change Pricing
- Edit price directly
- Set as "Pakiet Polecany" (recommended)
- Travel costs calculated automatically

#### Add Gallery Photos
1. Click upload area or drag & drop
2. Select multiple images
3. Images appear in grid
4. Click **X** to remove

#### Add Notes
- Add terms, conditions, or special notes
- Visible to client in final offer

### Step 5: Preview

Toggle **"Pokaż/Ukryj"** to see client view

### Step 6: Save

Click **"Zapisz"** to save all changes

### Step 7: Send to Client

Choose delivery method:

**Option A: Download PDF**
- Click **"PDF"** button
- PDF with all details downloads
- Send manually via email

**Option B: Email Directly**
- Click **"Mail"** button
- Automatically sends to client's email
- Includes link to online offer

**Option C: Share Link**
- Click **"Link"** button
- Copy link to clipboard
- Share via WhatsApp, SMS, etc.

---

## 📋 What Client Sees

When client opens offer link (`/oferta/[offerId]`):

1. **Top Bar**
   - Like package ♥️
   - Share offer
   - Download PDF
   - Accept offer ✓

2. **Package Cards**
   - Professional layout
   - All features listed
   - Clear pricing
   - "Polecany" badge on recommended

3. **Photo Gallery**
   - Your portfolio images
   - Builds trust
   - Shows quality of work

4. **Terms & Conditions**
   - Travel costs
   - Deposit policy
   - Offer validity (30 days)
   - Event type limitations

5. **Action Button**
   - Accept - locks in booking
   - Download - saves PDF
   - Share - spreads to family

---

## 💡 Pro Tips

### Make Offers Stand Out
✨ **Add Portfolio Photos**
- 3-5 best birthday event photos
- Shows actual work quality
- Increases acceptance rate

### Pricing Strategy
💰 **Highlight One Package**
- Mark best value as "Polecany"
- Positioned prominently
- Gets more clicks

### Customization
🎨 **Personalize Notes**
- Add "Dear [Name]" greeting
- Reference specific event details
- Show you listened to their needs

### Timing
⏰ **Send Within 24 Hours**
- Create after consultation
- Send same day while fresh
- Follow up in 7 days if no response

### Follow-up
📧 **Track Client Action**
- Know when client viewed offer
- Notice if package is liked
- Send reminder before expiration

---

## 🔧 Common Tasks

### Change All Package Prices
1. Click "Edytuj"
2. Edit each price field
3. Click "Zapisz"

### Add New Package
⚠️ **Currently:** Edit `defaultPackages` in component code

### Update Travel Cost Rate
⚠️ **Currently:** Fixed at 1.5 zł/km (10km free)  
Edit in: `BirthdayOfferTemplate.tsx` line ~210

### Change Color Scheme
Edit Tailwind classes in component:
- Header: `from-amber-600 to-amber-800`
- Buttons: `bg-amber-500`
- Accents: `text-amber-500`

### Modify Terms & Conditions
Scroll to "Informacje dodatkowe" section  
Edit bullet points

---

## 📊 Tracking Offers

### Admin Dashboard
After implementation, you'll see:
- Offers created: 12
- Accepted: 8 (67%)
- Pending: 3 (25%)
- Expired: 1 (8%)

### Per-Client Tracking
- All offers sent to client
- Which offer was accepted
- When offer was accepted
- Offer validity status

---

## 🎯 Performance Metrics

Track success with these metrics:

| Metric | Target |
|--------|--------|
| View Rate | >80% |
| Acceptance Rate | >60% |
| Avg. Days to Accept | 3-5 |
| PDF Downloads | >50% |

---

## 🆘 Troubleshooting

### "Client not found"
→ Create client profile first in `/admin/clients`

### Photos not uploading
→ Check file format (JPG/PNG) and size (<5MB each)

### Email not sending
→ Verify EmailJS API keys in `.env`

### Offer not saving
→ Check console for errors  
→ Verify you're logged in as admin

### Prices not calculating
→ Ensure travel distance is filled in
→ Check numeric format

---

## 📱 Mobile Viewing

Offer is fully responsive:
- ✅ View on phone/tablet
- ✅ Accept from mobile
- ✅ Download PDF on mobile
- ✅ Share via social apps

---

## 🔐 Security Notes

- Admin login required to create offers
- Clients see only their own offers
- Offers expire after 30 days
- Rejection notifications send to admin

---

## 📞 Contact

Need help? Contact: pwlasniewski@gmail.com

Version: 1.0.0 | Last Updated: 2026-04-25
