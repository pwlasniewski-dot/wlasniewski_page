'use client';

import { useEffect, useState } from 'react';
import { Star, Gift, Cake, Heart, Users, Camera, Share2, MessageCircle, Copy, Check, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  formatGalleryDiscount,
  formatGalleryOfferExpiry,
  GalleryLoyaltyOffer,
  normalizeGoogleReviewUrl,
  resolveGalleryLoyaltyOffer,
} from '@/lib/marketing/gallery-trust';
import {
  DEFAULT_PHOTO_FUNNEL_CONFIG,
  formatPhotoFunnelTemplate,
  parsePhotoFunnelConfig,
  type GalleryOfferValue,
  type PhotoFunnelConfig,
} from '@/lib/marketing/photo-funnel';

interface PostGalleryUpsellProps {
  /** Imię klienta (do personalizacji) */
  clientName?: string;
  /** Link do rezerwacji sesji */
  bookingUrl?: string;
  /** Theme tła sekcji */
  theme?: 'dark' | 'light';
}

const DEFAULT_BOOKING = '/rezerwacja';

interface GalleryTrustSettings {
  loaded: boolean;
  googleReviewUrl: string | null;
  loyaltyOffer: GalleryLoyaltyOffer | null;
  funnelConfig: PhotoFunnelConfig;
}

let galleryTrustRequest: Promise<Omit<GalleryTrustSettings, 'loaded'>> | null = null;

function loadGalleryTrustSettings(): Promise<Omit<GalleryTrustSettings, 'loaded'>> {
  if (!galleryTrustRequest) {
    galleryTrustRequest = fetch('/api/settings/public', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Public settings unavailable');
        const payload = await response.json();
        const settings = payload?.settings || null;

        return {
          googleReviewUrl: normalizeGoogleReviewUrl(settings?.gbp_review_link),
          loyaltyOffer: resolveGalleryLoyaltyOffer(settings?.gallery_loyalty_offer),
          funnelConfig: parsePhotoFunnelConfig(settings?.photo_funnel_config),
        };
      })
      .catch(() => ({
        googleReviewUrl: null,
        loyaltyOffer: null,
        funnelConfig: parsePhotoFunnelConfig(DEFAULT_PHOTO_FUNNEL_CONFIG),
      }));
  }

  return galleryTrustRequest;
}

function useGalleryTrustSettings(): GalleryTrustSettings {
  const [state, setState] = useState<GalleryTrustSettings>({
    loaded: false,
    googleReviewUrl: null,
    loyaltyOffer: null,
    funnelConfig: parsePhotoFunnelConfig(DEFAULT_PHOTO_FUNNEL_CONFIG),
  });

  useEffect(() => {
    let active = true;
    void loadGalleryTrustSettings().then((settings) => {
      if (active) setState({ loaded: true, ...settings });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function TopReviewNudge({
  theme = 'dark',
}: {
  theme?: 'dark' | 'light';
}) {
  const isDark = theme === 'dark';
  const { loyaltyOffer, funnelConfig } = useGalleryTrustSettings();
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!loyaltyOffer) return;

    try {
      await navigator.clipboard.writeText(loyaltyOffer.code);
      setCopied(true);
      toast.success(formatPhotoFunnelTemplate(funnelConfig.galleryCopy.copySuccessTemplate, { code: loyaltyOffer.code }));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(funnelConfig.galleryCopy.copyFailure);
    }
  };

  if (!funnelConfig.display.galleryTopNudgeEnabled) return null;

  return (
    <div className={`w-full border-y ${isDark ? 'border-zinc-800 bg-zinc-950/90' : 'border-zinc-200 bg-white/95'}`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-500 text-black font-bold">
            <Gift className="w-3.5 h-3.5" />
            {funnelConfig.galleryCopy.topBadge}
          </span>
          <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
            {loyaltyOffer ? funnelConfig.galleryCopy.topOfferAvailable : funnelConfig.galleryCopy.topNoOffer}
          </span>
          {loyaltyOffer && (
            <span className={`font-mono font-bold ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>
              {loyaltyOffer.code} · {formatGalleryDiscount(loyaltyOffer)}
            </span>
          )}
        </div>

        {loyaltyOffer && (
          <button
            type="button"
            onClick={copyCode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              copied ? 'bg-emerald-500 text-white' : 'bg-white text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? funnelConfig.galleryCopy.copiedLabel : funnelConfig.galleryCopy.copyLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Sekcja "Co dalej?" — upsell na kolejne sesje + prośba o opinię (boost SEO/social proof).
 * Pokazywana na dole galerii (klienta i rodzica).
 */
export default function PostGalleryUpsell({
  clientName,
  bookingUrl = DEFAULT_BOOKING,
  theme = 'dark',
}: PostGalleryUpsellProps) {
  const [copied, setCopied] = useState(false);
  const [reviewClicked, setReviewClicked] = useState(false);
  const { googleReviewUrl, loyaltyOffer, funnelConfig } = useGalleryTrustSettings();

  const isDark = theme === 'dark';
  const expiryLabel = loyaltyOffer ? formatGalleryOfferExpiry(loyaltyOffer.validUntil) : null;

  const copyCode = async () => {
    if (!loyaltyOffer) return;

    try {
      await navigator.clipboard.writeText(loyaltyOffer.code);
      setCopied(true);
      toast.success(formatPhotoFunnelTemplate(funnelConfig.galleryCopy.copySuccessTemplate, { code: loyaltyOffer.code }));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(funnelConfig.galleryCopy.copyFailure);
    }
  };

  const share = async () => {
    const url = window.location.origin;
    const text = funnelConfig.galleryCopy.shareText;
    if (navigator.share) {
      try {
        await navigator.share({ title: funnelConfig.galleryCopy.shareDialogTitle, text, url });
        toast.success(funnelConfig.galleryCopy.shareSuccess);
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success(funnelConfig.galleryCopy.shareCopied);
      } catch {
        toast.error(funnelConfig.galleryCopy.copyFailure);
      }
    }
  };

  const offerPresentation: Record<GalleryOfferValue, { icon: typeof Cake; accent: string }> = {
    birthday: { icon: Cake, accent: 'from-pink-500 to-rose-500' },
    portrait: { icon: Heart, accent: 'from-amber-500 to-yellow-500' },
    family: { icon: Users, accent: 'from-emerald-500 to-teal-500' },
    event: { icon: Camera, accent: 'from-violet-500 to-fuchsia-500' },
  };
  const offers = funnelConfig.galleryOffers
    .filter((offer) => offer.enabled)
    .map((offer) => ({ ...offer, ...offerPresentation[offer.value] }));

  return (
    <section className={`relative w-full ${isDark ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
      {/* Subtelny gradient u góry */}
      <div className={`h-32 bg-gradient-to-b ${isDark ? 'from-black to-transparent' : 'from-zinc-50 to-transparent'}`} />

      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 -mt-32 relative">
        {/* --- BLOK 1: BENEFIT LOJALNOŚCIOWY --- */}
        {funnelConfig.display.galleryLoyaltyEnabled && (loyaltyOffer ? (
          <>
            <div className="text-center mb-12">
              <span className={`inline-block text-[10px] tracking-[0.4em] uppercase mb-4 ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>
                <Sparkles className="w-3 h-3 inline mr-2" />
                {funnelConfig.galleryCopy.loyaltyEyebrow}
              </span>
              <h2 className={`font-serif text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {clientName
                  ? formatPhotoFunnelTemplate(funnelConfig.galleryCopy.loyaltyTitleTemplate, { name: clientName })
                  : funnelConfig.galleryCopy.loyaltyFallbackTitle}
              </h2>
              <p className={`text-base md:text-lg max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {funnelConfig.galleryCopy.loyaltyDescription}
              </p>
            </div>

            <div className={`mb-12 rounded-2xl border-2 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 ${
              isDark ? 'border-gold-500/40 bg-gradient-to-br from-gold-500/10 to-amber-500/5' : 'border-gold-500/60 bg-gradient-to-br from-gold-50 to-amber-50'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gold-500/20' : 'bg-gold-500/30'}`}>
                  <Gift className="w-7 h-7 text-gold-500" />
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-widest mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {formatPhotoFunnelTemplate(funnelConfig.galleryCopy.promoLabelTemplate, { discount: formatGalleryDiscount(loyaltyOffer) })}
                  </p>
                  <p className={`font-mono text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    {loyaltyOffer.code}
                  </p>
                  {expiryLabel && (
                    <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {formatPhotoFunnelTemplate(funnelConfig.galleryCopy.expiryTemplate, { date: expiryLabel })}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gold-500 text-black hover:bg-gold-400'
                }`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? funnelConfig.galleryCopy.copiedLabel : funnelConfig.galleryCopy.copyLabel}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
              {offers.map((o) => {
                const Icon = o.icon;
                return (
                  <a
                    key={o.title}
                    href={bookingUrl}
                    data-analytics="gallery-loyalty-booking-cta"
                    className={`group relative rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-2xl ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-800 hover:border-gold-500/50'
                        : 'bg-zinc-50 border-zinc-200 hover:border-gold-500/60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${o.accent} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-gold-500 text-black">
                        −{formatGalleryDiscount(loyaltyOffer)}
                      </span>
                    </div>
                    <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      {o.title}
                    </h3>
                    <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {o.description}
                    </p>
                    <div className={`flex items-center gap-1 text-sm font-semibold transition-all ${isDark ? 'text-gold-400 group-hover:text-gold-300' : 'text-gold-600 group-hover:text-gold-700'}`}>
                      {funnelConfig.galleryCopy.offerCtaLabel}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </a>
                );
              })}
            </div>
          </>
        ) : (
          <div className={`mb-16 rounded-2xl border p-8 text-center ${
            isDark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-zinc-50'
          }`}>
            <Gift className="w-8 h-8 mx-auto mb-4 text-gold-500" />
            <h2 className={`font-serif text-2xl md:text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              {clientName
                ? formatPhotoFunnelTemplate(funnelConfig.galleryCopy.noOfferTitleTemplate, { name: clientName })
                : funnelConfig.galleryCopy.noOfferFallbackTitle}
            </h2>
            <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
              {funnelConfig.galleryCopy.noOfferDescription}
            </p>
          </div>
        ))}

        {/* --- BLOK 2: NIEZALEŻNA, NEUTRALNA PROŚBA O OPINIĘ --- */}
        {funnelConfig.display.galleryReviewEnabled && googleReviewUrl && (
          <div className={`relative rounded-3xl overflow-hidden p-8 md:p-12 ${
            isDark
              ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-zinc-800'
              : 'bg-gradient-to-br from-zinc-50 to-white border border-zinc-200 shadow-xl'
          }`}>
            <div className="relative text-center mb-8">
              <MessageCircle className="w-10 h-10 mx-auto mb-4 text-gold-500" />
              <h2 className={`font-serif text-3xl md:text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {funnelConfig.galleryCopy.reviewTitle}
              </h2>
              <p className={`text-base md:text-lg max-w-2xl mx-auto ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {funnelConfig.galleryCopy.reviewDescription}{' '}
                <strong>Opinia jest całkowicie dobrowolna i nie wpływa na żaden rabat ani korzyść.</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-3xl mx-auto">
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setReviewClicked(true)}
                data-analytics="gallery-google-review-cta"
                className="group relative flex flex-col items-center text-center p-6 rounded-2xl bg-white text-zinc-900 hover:scale-[1.02] transition-all shadow-xl border border-zinc-200 hover:border-blue-500"
              >
                <div className="w-14 h-14 mb-3 rounded-full bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                  G
                </div>
                <h3 className="font-bold text-lg mb-1">{funnelConfig.galleryCopy.googleTitle}</h3>
                <p className="text-xs text-zinc-600 mb-4">
                  {funnelConfig.galleryCopy.googleDescription}
                </p>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold group-hover:bg-blue-700 transition-colors">
                  <Star className="w-4 h-4" />
                  {funnelConfig.galleryCopy.googleCtaLabel}
                </span>
                {reviewClicked && (
                  <span className="absolute top-2 right-2 text-xs text-emerald-600 font-bold">{funnelConfig.galleryCopy.reviewThankYou}</span>
                )}
              </a>

              {funnelConfig.display.galleryShareEnabled && (
                <button
                  type="button"
                  onClick={share}
                  data-analytics="gallery-share-cta"
                  className="group flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-br from-gold-500 to-amber-600 text-black hover:scale-[1.02] transition-all shadow-xl"
                >
                  <div className="w-14 h-14 mb-3 rounded-full bg-black/20 flex items-center justify-center shadow-lg">
                    <Share2 className="w-7 h-7 text-black" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{funnelConfig.galleryCopy.shareTitle}</h3>
                  <p className="text-xs text-black/70 mb-4">
                    {funnelConfig.galleryCopy.shareDescription}
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-full text-sm font-bold group-hover:bg-zinc-800 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    {funnelConfig.galleryCopy.shareCtaLabel}
                  </span>
                </button>
              )}
            </div>

            <p className={`text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {funnelConfig.galleryCopy.reviewFooter}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
