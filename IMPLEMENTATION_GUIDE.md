# 🎯 Implementation & Integration Guide

## Overview

This guide shows how to integrate the Birthday Offer Template system with your existing Next.js photography website.

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── generator-ofert/
│   │       └── oferta-urodzinowa/
│   │           └── page.tsx           ✅ Admin offer generator
│   ├── oferta/
│   │   └── [offerId]/
│   │       └── page.tsx               ✅ Client offer preview
│   ├── api/
│   │   └── admin/
│   │       └── offers/
│   │           └── birthday/
│   │               ├── create/
│   │               ├── [offerId]/
│   │               ├── [offerId]/send/
│   │               └── [offerId]/accept/
│   │               (TODO: Implement these)
│
├── components/
│   └── admin/
│       └── BirthdayOfferTemplate.tsx  ✅ Main template component
│
├── types/
│   └── birthday-offer.ts              ✅ TypeScript types
│
├── utils/
│   └── birthday-offer.ts              ✅ Helper functions
│
└── hooks/
    └── useBirthdayOffer.ts            ✅ React hook
```

## Getting Started (Step-by-Step)

### Step 1: Run the Application

```bash
npm run dev
# or
yarn dev
```

Navigate to: `http://localhost:3000/admin/generator-ofert/oferta-urodzinowa`

### Step 2: Test with Mock Data

The system works with your existing client database. To test:

1. Go to Admin panel
2. Create or select a client
3. Edit offer template
4. Upload test images
5. Click "Zapisz"

### Step 3: Implement API Endpoints

Create these API routes (see `API_ENDPOINTS_TEMPLATE.ts` for details):

```
POST   /api/admin/offers/birthday/create
GET    /api/admin/offers/birthday/list
GET    /api/admin/offers/birthday/[offerId]
PATCH  /api/admin/offers/birthday/[offerId]
DELETE /api/admin/offers/birthday/[offerId]
POST   /api/admin/offers/birthday/[offerId]/send
GET    /api/admin/offers/birthday/[offerId]/download
POST   /api/admin/offers/birthday/[offerId]/accept
```

### Step 4: Setup Database

Add to your `prisma/schema.prisma`:

```prisma
model BirthdayOffer {
  id              String    @id @default(cuid())
  clientId        Int
  client          Client    @relation(fields: [clientId], references: [id])
  clientName      String
  eventDate       DateTime
  travelDistance  Float
  packages        Json
  images          String[]
  notes           String?   @db.Text
  totalPrice      Float
  status          String    @default("draft")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  sentAt          DateTime?
  viewedAt        DateTime?
  acceptedAt      DateTime?
  expiresAt       DateTime
  
  @@index([clientId])
  @@index([status])
}
```

Then run:
```bash
npx prisma migrate dev --name add_birthday_offer
```

### Step 5: Setup Email Service

Add to your `.env.local`:

```env
# Option A: EmailJS (Recommended)
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key

# Option B: Nodemailer
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Option C: SendGrid
SENDGRID_API_KEY=your_api_key
```

### Step 6: Setup S3 Image Upload

Add to `.env.local`:

```env
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=eu-central-1
```

## Integration Examples

### Example 1: Create Offer Programmatically

```typescript
// In your component or page
import { useBirthdayOffer } from '@/hooks/useBirthdayOffer';

export function CreateOfferButton() {
  const { createOffer, loading } = useBirthdayOffer();

  const handleCreate = async () => {
    try {
      const offer = await createOffer({
        clientId: 123,
        clientName: 'Jan Kowalski',
        eventDate: '2026-06-15',
        travelDistance: 15,
        packages: [
          {
            id: 'premium',
            name: 'Pakiet Premium',
            price: 1700,
            duration: '6 godzin',
            photos: 200,
            prints: 50,
            video: 'do 15 minut',
            features: ['Filmik HD', 'Galeria online', 'Pendrive'],
            highlighted: true,
          },
        ],
        images: ['s3://bucket/photo1.jpg', 's3://bucket/photo2.jpg'],
        notes: 'Specjalne życzenia...',
      });
      
      console.log('Offer created:', offer.id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <button onClick={handleCreate} disabled={loading}>
      {loading ? 'Tworzę...' : 'Utwórz ofertę'}
    </button>
  );
}
```

### Example 2: Send Offer to Client

```typescript
import { useBirthdayOffer } from '@/hooks/useBirthdayOffer';

export function SendOfferForm({ offerId, clientEmail }) {
  const { sendOffer, loading, error } = useBirthdayOffer();

  const handleSend = async () => {
    try {
      await sendOffer(offerId, clientEmail);
      alert('Oferta wysłana!');
    } catch (error) {
      alert('Błąd wysyłania: ' + error.message);
    }
  };

  return (
    <div>
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Wysyłam...' : 'Wyślij ofertę'}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
```

### Example 3: List Client Offers

```typescript
import { useBirthdayOffer } from '@/hooks/useBirthdayOffer';

export function ClientOfferList({ clientId }) {
  const { offers, listOffers, loading } = useBirthdayOffer();

  useEffect(() => {
    listOffers(clientId);
  }, [clientId]);

  return (
    <div>
      {loading ? (
        <p>Ładuję...</p>
      ) : (
        <ul>
          {offers.map(offer => (
            <li key={offer.id}>
              <a href={`/oferta/${offer.id}`}>
                {offer.clientName} - {new Date(offer.eventDate).toLocaleDateString()}
              </a>
              <span className={`status-${offer.status}`}>
                {offer.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Example 4: Add to Existing Admin Menu

```typescript
// In your admin layout/navigation component
export function AdminNav() {
  return (
    <nav>
      {/* ... existing navigation */}
      
      <div className="section">
        <h3>Oferty</h3>
        <ul>
          <li>
            <a href="/admin/generator-ofert">Generator ofert</a>
          </li>
          <li>
            <a href="/admin/generator-ofert/oferta-urodzinowa" className="highlight">
              🎂 Oferty urodzinowe
            </a>
          </li>
          <li>
            <a href="/admin/offers">Wszystkie oferty</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
```

### Example 5: Client Dashboard Integration

```typescript
// Add to client account page
export function ClientDashboard({ clientId }) {
  const { offers } = useBirthdayOffer();

  useEffect(() => {
    fetch(`/api/admin/offers/birthday/list?clientId=${clientId}`)
      .then(r => r.json())
      .then(data => setOffers(data.offers));
  }, []);

  return (
    <section className="client-offers">
      <h2>Twoje oferty fotograficzne</h2>
      <div className="offers-grid">
        {offers.map(offer => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </section>
  );
}

function OfferCard({ offer }) {
  const daysLeft = Math.ceil(
    (new Date(offer.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="offer-card">
      <h3>Oferta z {new Date(offer.eventDate).toLocaleDateString()}</h3>
      <p className="status">{offer.status}</p>
      {daysLeft > 0 && <p className="expires">Ważna przez {daysLeft} dni</p>}
      <a href={`/oferta/${offer.id}`} className="btn btn-primary">
        Przejrzyj ofertę
      </a>
    </div>
  );
}
```

## Customization

### Change Package Templates

Edit `defaultPackages` in `BirthdayOfferTemplate.tsx`:

```typescript
const defaultPackages: Package[] = [
  {
    id: 'basic',
    name: 'Pakiet Podstawowy',
    price: 600,
    duration: '3 godziny',
    photos: 100,
    prints: 30,
    features: ['Galeria online', 'Pendrive'],
  },
  // Add more packages...
];
```

### Change Colors/Branding

Search and replace in `BirthdayOfferTemplate.tsx`:
- `amber-*` → Your primary color
- `green-*` → Your success color

### Add Custom Fields

1. Add to `BirthdayPackage` interface:
```typescript
interface BirthdayPackage {
  // ... existing fields
  customField: string;
}
```

2. Update component to handle new field:
```typescript
{isEditing && (
  <input
    value={pkg.customField}
    onChange={(e) => 
      handlePackageUpdate(pkg.id, { customField: e.target.value })
    }
  />
)}
```

## Performance Optimization

### Image Optimization

```typescript
import Image from 'next/image';

// Use Next.js Image component
<Image
  src={img}
  alt="Gallery"
  width={300}
  height={300}
  priority={idx === 0}
/>
```

### Lazy Loading Gallery

```typescript
const [visibleImages, setVisibleImages] = useState(3);

{previewImages.slice(0, visibleImages).map(...)}

{visibleImages < previewImages.length && (
  <button onClick={() => setVisibleImages(prev => prev + 3)}>
    Pokaż więcej
  </button>
)}
```

## Security Best Practices

### Protected Routes

```typescript
// Add auth check to API routes
import { verifyAdminToken } from '@/lib/auth';

export async function POST(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token || !verifyAdminToken(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... proceed with logic
}
```

### Input Validation

```typescript
import { z } from 'zod';

const OfferSchema = z.object({
  clientId: z.number().positive(),
  clientName: z.string().min(2).max(100),
  eventDate: z.string().datetime(),
  travelDistance: z.number().min(0).max(500),
});

// Validate before processing
const validated = OfferSchema.parse(data);
```

## Testing

### Unit Tests

```typescript
import { calculateOfferTotal, formatPrice } from '@/utils/birthday-offer';

describe('Birthday Offer Utils', () => {
  it('should calculate total with travel cost', () => {
    const packages = [{ id: '1', price: 1000, ... }];
    const total = calculateOfferTotal(packages, '1', 25);
    expect(total).toBe(1022.5); // 1000 + (25-10)*1.5
  });

  it('should format price correctly', () => {
    expect(formatPrice(1700)).toBe('1700.00 zł');
  });
});
```

### E2E Tests

```typescript
// With Cypress
describe('Birthday Offer Generator', () => {
  it('should create and send offer', () => {
    cy.visit('/admin/generator-ofert/oferta-urodzinowa');
    cy.contains('Wybierz klienta').click();
    cy.get('[data-testid="client-item"]').first().click();
    cy.get('[data-testid="edit-btn"]').click();
    cy.contains('Zapisz').click();
    cy.contains('Mail').click();
    cy.contains('wysłana').should('be.visible');
  });
});
```

## Deployment

### Production Checklist

- [ ] API endpoints implemented and tested
- [ ] Database migrations applied
- [ ] Email service configured
- [ ] S3 bucket setup
- [ ] Environment variables set
- [ ] SSL/HTTPS enabled
- [ ] Admin authentication working
- [ ] Client pages accessible
- [ ] PDF generation tested
- [ ] Email templates created
- [ ] Error logging setup
- [ ] Performance monitoring enabled

### Environment Setup

```bash
# Build
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel deploy
```

## Troubleshooting

### Offer not saving to database

1. Check Prisma migration: `npx prisma migrate status`
2. Verify admin token in localStorage
3. Check API endpoint: `curl http://localhost:3000/api/admin/offers/birthday/create`

### Email not sending

1. Verify EmailJS keys in `.env.local`
2. Check email template ID exists
3. Test with: `console.log()` in API route

### Images not uploading

1. Verify S3 credentials
2. Check bucket permissions
3. Test with: `aws s3 ls s3://your-bucket`

### PDF not generating

1. Install `react-pdf`: `npm install @react-pdf/renderer`
2. Check PDF dependencies
3. Test with sample PDF generation

## Support & Resources

- 📚 [Next.js Documentation](https://nextjs.org/docs)
- 🔐 [Prisma ORM](https://www.prisma.io/docs/)
- 🎨 [Tailwind CSS](https://tailwindcss.com/docs)
- 📧 [EmailJS](https://www.emailjs.com/)
- ☁️ [AWS S3](https://docs.aws.amazon.com/s3/)

## Version History

- **v1.0.0** (2026-04-25) - Initial release
  - Birthday offer template
  - Admin generator
  - Client preview page
  - Basic utilities and hooks

---

Last Updated: 2026-04-25 | Created for Photography Business Management
