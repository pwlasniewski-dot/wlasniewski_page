# 🎂 Birthday Photography Offer Template System

Professional, editable offer generator for birthday photography services with client panel integration.

## Features

✅ **Professional Design** - Modern, gradient-based UI with smooth animations  
✅ **Fully Editable** - All offer details can be edited inline  
✅ **Image Gallery** - Add and showcase portfolio photos  
✅ **Smart Pricing** - Automatic travel cost calculations  
✅ **Client Panel** - Clients can view, like, and accept offers  
✅ **Multi-Format Export** - PDF download and email delivery  
✅ **Responsive Design** - Works on desktop and mobile  
✅ **Status Tracking** - Monitor offer status (draft, sent, viewed, accepted)  

## Installation

### 1. Components Created

- **BirthdayOfferTemplate** (`src/components/admin/BirthdayOfferTemplate.tsx`)
  - Main editable offer template component
  - Handles all package customization
  - Image upload and gallery management

### 2. Pages Created

- **Admin Generator** (`src/app/admin/generator-ofert/oferta-urodzinowa/page.tsx`)
  - Client selection interface
  - Offer management dashboard
  - Send/download/copy link functionality

- **Client Preview** (`src/app/oferta/[offerId]/page.tsx`)
  - Public offer preview page
  - Accept/reject functionality
  - Status tracking

### 3. Types & Utilities

- **Types** (`src/types/birthday-offer.ts`)
  - TypeScript interfaces for type safety
  
- **Utilities** (`src/utils/birthday-offer.ts`)
  - Price calculations
  - Status formatting
  - Offer validation
  - Email formatting

- **Hook** (`src/hooks/useBirthdayOffer.ts`)
  - `useBirthdayOffer` - Complete offer management state

## Usage

### For Admin (Creating Offers)

```bash
# Navigate to offer generator
/admin/generator-ofert/oferta-urodzinowa
```

1. **Select Client** - Choose from your client database
2. **Set Event Date** - Pick the birthday date
3. **Edit Offer** - Click "Edytuj" to customize packages
4. **Add Photos** - Upload portfolio album photos
5. **Save** - Save the offer
6. **Send** - Download PDF or send via email

### For Clients (Viewing Offers)

```bash
# Client receives link
/oferta/[offerId]
```

1. **View Offer** - Beautiful presentation of all packages
2. **Like** - Mark favorite packages
3. **Accept** - Accept the offer and confirm booking
4. **Download** - Save PDF for records

## Package Structure

Each package includes:
- **Name** - Package title (e.g., "Pakiet Premium")
- **Price** - Base price in PLN
- **Duration** - Photography duration
- **Photos** - Number of edited photos
- **Prints** - Number of physical prints included
- **Video** - Optional video duration
- **Features** - List of included features
- **Highlighted** - Mark as recommended package

## Example Package

```typescript
{
  id: 'premium',
  name: 'Pakiet Premium',
  price: 1700,
  duration: '6 godzin',
  photos: 200,
  prints: 50,
  video: 'do 15 minut',
  features: ['Filmik HD', 'Galeria online', 'Pendrive z materiałami'],
  highlighted: true
}
```

## API Endpoints (To Implement)

### Create Offer
```
POST /api/admin/offers/birthday/create
Headers: Authorization: Bearer {token}
Body: CreateOfferPayload
```

### Get Offer
```
GET /api/admin/offers/birthday/{offerId}
Headers: Authorization: Bearer {token}
```

### List Offers
```
GET /api/admin/offers/birthday/list?clientId={clientId}
Headers: Authorization: Bearer {token}
```

### Update Offer
```
PATCH /api/admin/offers/birthday/{offerId}
Headers: Authorization: Bearer {token}
Body: Partial<CreateOfferPayload>
```

### Send Offer
```
POST /api/admin/offers/birthday/{offerId}/send
Headers: Authorization: Bearer {token}
Body: { email: string }
```

### Download PDF
```
GET /api/admin/offers/birthday/{offerId}/download
Headers: Authorization: Bearer {token}
```

## Customization

### Colors
Edit the gradient colors in `BirthdayOfferTemplate.tsx`:
```tsx
bg-gradient-to-r from-amber-600 to-amber-800  // Header
bg-amber-500 hover:bg-amber-600              // Buttons
```

### Pricing Formula
Travel cost calculation (adjustable):
```typescript
// Over 10km: 1.5 zł per km
const travelCost = Math.max(0, (travelDistance - 10) * 1.5);
```

### Default Packages
Edit `defaultPackages` array in component:
```typescript
const defaultPackages: Package[] = [
  // Your packages here
];
```

### Terms & Conditions
Modify in the Footer Info section:
```tsx
• Dojazd: powyżej 10 km - 1,5 zł za km
• Zaliczka: 30% kwoty bezzwrotnej...
```

## Data Schema (Prisma)

Add to your schema.prisma:

```prisma
model BirthdayOffer {
  id            String   @id @default(cuid())
  clientId      Int
  client        Client   @relation(fields: [clientId], references: [id])
  
  clientName    String
  eventDate     DateTime
  travelDistance Float
  
  packages      Json     // BirthdayPackage[]
  images        String[] // Array of image URLs from S3
  notes         String?
  
  totalPrice    Float
  status        String   @default("draft") // draft|sent|viewed|accepted|rejected
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  sentAt        DateTime?
  acceptedAt    DateTime?
  viewedAt      DateTime?
  expiresAt     DateTime // 30 days from creation
  
  @@index([clientId])
  @@index([status])
}
```

## Features to Implement

- [ ] PDF generation with images
- [ ] Email sending integration
- [ ] S3 image upload optimization
- [ ] Offer expiration notifications
- [ ] Client rejection handling
- [ ] Admin offer history
- [ ] Client offer archive
- [ ] QR code for mobile sharing
- [ ] Digital signature on acceptance
- [ ] Payment integration

## Hooks Usage

```typescript
import { useBirthdayOffer } from '@/hooks/useBirthdayOffer';

export function MyOfferComponent() {
  const {
    offers,
    selectedOffer,
    loading,
    error,
    createOffer,
    sendOffer,
    listOffers,
  } = useBirthdayOffer();

  // Use these functions to manage offers
}
```

## Utilities Usage

```typescript
import { calculateOfferTotal, formatPrice, isOfferExpired } from '@/utils/birthday-offer';

// Calculate price with travel costs
const total = calculateOfferTotal(packages, packageId, 15); // 15km distance

// Format for display
console.log(formatPrice(1700)); // "1700.00 zł"

// Check expiration
if (isOfferExpired(offer.expiresAt)) {
  console.log('Offer expired');
}
```

## Styling Guide

Built with Tailwind CSS. Key color classes:
- `amber-*` - Primary (warm gold)
- `green-*` - Success/Accept
- `blue-*` - Info/Send
- `red-*` - Danger/Reject
- `gray-*` - Neutral

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Lazy image loading
- Animation performance optimized (Framer Motion)
- Responsive image sizing
- Client-side image compression ready

## Security Considerations

- [ ] Token validation on all API endpoints
- [ ] Client data validation
- [ ] Image upload restrictions (size, type)
- [ ] Offer access control (client can only view own offers)
- [ ] Admin authentication required

## Troubleshooting

### Images Not Uploading
- Check file size limits
- Verify image format (JPG, PNG)
- Check browser console for errors

### Offer Not Saving
- Verify admin token in localStorage
- Check network tab in DevTools
- Ensure all required fields are filled

### Email Not Sending
- Verify EmailJS configuration
- Check client email address
- Review email provider settings

## Support

For issues or feature requests, contact: pwlasniewski@gmail.com

---

Created for Przemysław Właśniewski Photography | 2026
