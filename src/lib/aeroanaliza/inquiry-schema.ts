import { z } from 'zod';

export const aeroInquirySchema = z.object({
    requestId: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    company: z.string().trim().max(160).optional().default(''),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(40).optional().default(''),
    serviceType: z.string().trim().min(2).max(120),
    location: z.string().trim().min(2).max(240),
    objectType: z.string().trim().max(160).optional().default(''),
    timeframe: z.string().trim().max(100).optional().default('Do uzgodnienia'),
    preferredContact: z.string().trim().max(80).optional().default('Telefon lub e-mail'),
    message: z.string().trim().min(20).max(5000),
    website: z.string().max(200).optional().default(''),
    sourcePage: z.string().max(500).optional().default(''),
    landingPage: z.string().max(1000).optional().default(''),
    referrer: z.string().max(1000).optional().default(''),
    utmSource: z.string().max(120).optional().default(''),
    utmMedium: z.string().max(120).optional().default(''),
    utmCampaign: z.string().max(120).optional().default(''),
});
