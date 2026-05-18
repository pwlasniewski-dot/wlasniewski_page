'use client';

import { useState } from 'react';
import { Star, Gift, Cake, Heart, Users, Camera, Share2, ThumbsUp, MessageCircle, Copy, Check, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface PostGalleryUpsellProps {
  /** Imię klienta (do personalizacji) */
  clientName?: string;
  /** Kod rabatowy do pokazania */
  discountCode?: string;
  /** URL do dodania opinii na Google */
  googleReviewUrl?: string;
  /** URL do strony FB do opinii */
  facebookReviewUrl?: string;
  /** Link do rezerwacji sesji */
  bookingUrl?: string;
  /** Theme tła sekcji */
  theme?: 'dark' | 'light';
}

const DEFAULT_GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL
  || 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4';
const DEFAULT_FB = process.env.NEXT_PUBLIC_FB_REVIEW_URL
  || 'https://www.facebook.com/przemyslaw.wlasniewski.fotografia/reviews';
const DEFAULT_BOOKING = '/rezerwacja';

export function TopReviewNudge({
  discountCode = 'WRACAM15',
  googleReviewUrl = DEFAULT_GOOGLE,
  facebookReviewUrl = DEFAULT_FB,
  theme = 'dark',
}: {
  discountCode?: string;
  googleReviewUrl?: string;
  facebookReviewUrl?: string;
  theme?: 'dark' | 'light';
}) {
  const isDark = theme === 'dark';

  return (
    <div className={`w-full border-y ${isDark ? 'border-zinc-800 bg-zinc-950/90' : 'border-zinc-200 bg-white/95'}`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-500 text-black font-bold">
            <Gift className="w-3.5 h-3.5" />
            Opinia = rabat
          </span>
          <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
            Wystaw opinię i odbierz kod:
          </span>
          <span className={`font-mono font-bold ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>
            {discountCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-zinc-900 text-xs font-semibold hover:bg-zinc-100"
            title="Wystaw opinię na Google"
          >
            <span className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 text-white text-[10px] font-black inline-flex items-center justify-center">G</span>
            Google
            <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
          </a>

          <a
            href={facebookReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1877F2] text-white text-xs font-semibold hover:bg-[#1669d9]"
            title="Oceń na Facebooku"
          >
            <span className="w-4 h-4 rounded-full bg-white text-[#1877F2] text-[11px] font-black inline-flex items-center justify-center">f</span>
            Facebook
          </a>

          <span className={`hidden sm:inline text-[11px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            30 sek i gotowe
          </span>
        </div>
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
  discountCode = 'WRACAM10',
  googleReviewUrl = DEFAULT_GOOGLE,
  facebookReviewUrl = DEFAULT_FB,
  bookingUrl = DEFAULT_BOOKING,
  theme = 'dark',
}: PostGalleryUpsellProps) {
  const [copied, setCopied] = useState(false);
  const [reviewClicked, setReviewClicked] = useState<'google' | 'fb' | null>(null);

  const isDark = theme === 'dark';

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);
      toast.success(`Skopiowano kod: ${discountCode}`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Nie udało się skopiować');
    }
  };

  const share = async () => {
    const url = window.location.origin;
    const text = 'Polecam fotografa Przemka — super zdjęcia, sprawdź:';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Fotograf Przemek', text, url });
        toast.success('Dzięki za polecenie!');
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success('Link skopiowany — wklej znajomym!');
      } catch {
        toast.error('Nie udało się skopiować');
      }
    }
  };

  const offers = [
    {
      icon: Cake,
      title: 'Sesja urodzinowa',
      desc: 'Magiczne kadry na okrągłą rocznicę — w studio lub w plenerze.',
      badge: '−20%',
      accent: 'from-pink-500 to-rose-500',
    },
    {
      icon: Heart,
      title: 'Sesja indywidualna',
      desc: 'Portrety, które pokazują charakter. Idealne na pamiątkę.',
      badge: '−15%',
      accent: 'from-amber-500 to-yellow-500',
    },
    {
      icon: Users,
      title: 'Sesja rodzinna',
      desc: 'Cała rodzina razem. Sesja, którą będziesz oprawiać w ramki.',
      badge: '−15%',
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Camera,
      title: 'Plener / event',
      desc: 'Reportaż z urodzin, chrztu, jubileuszu — bez sztuczności.',
      badge: 'OFERTA',
      accent: 'from-violet-500 to-fuchsia-500',
    },
  ];

  return (
    <section className={`relative w-full ${isDark ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
      {/* Subtelny gradient u góry */}
      <div className={`h-32 bg-gradient-to-b ${isDark ? 'from-black to-transparent' : 'from-zinc-50 to-transparent'}`} />

      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 -mt-32 relative">
        {/* --- BLOK 1: OFERTY --- */}
        <div className="text-center mb-12">
          <span className={`inline-block text-[10px] tracking-[0.4em] uppercase mb-4 ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>
            <Sparkles className="w-3 h-3 inline mr-2" />
            Tylko dla Ciebie
          </span>
          <h2 className={`font-serif text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {clientName ? `${clientName}, zobaczmy się znowu` : 'Zobaczmy się znowu'}
          </h2>
          <p className={`text-base md:text-lg max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Specjalny rabat dla Klientów po sesji. Kolejna pamiątka czeka — komunia raz, ale życie idzie dalej.
          </p>
        </div>

        {/* Discount code banner */}
        <div className={`mb-12 rounded-2xl border-2 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 ${
          isDark ? 'border-gold-500/40 bg-gradient-to-br from-gold-500/10 to-amber-500/5' : 'border-gold-500/60 bg-gradient-to-br from-gold-50 to-amber-50'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gold-500/20' : 'bg-gold-500/30'}`}>
              <Gift className="w-7 h-7 text-gold-500" />
            </div>
            <div>
              <p className={`text-xs uppercase tracking-widest mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Twój kod rabatowy
              </p>
              <p className={`font-mono text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {discountCode}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Ważny <strong>30 dni</strong> — na sesję urodzinową lub indywidualną.
              </p>
            </div>
          </div>
          <button
            onClick={copyCode}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-gold-500 text-black hover:bg-gold-400'
            }`}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Skopiowano' : 'Skopiuj kod'}
          </button>
        </div>

        {/* Oferty grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {offers.map((o) => {
            const Icon = o.icon;
            return (
              <a
                key={o.title}
                href={bookingUrl}
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
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${isDark ? 'bg-gold-500 text-black' : 'bg-gold-500 text-black'}`}>
                    {o.badge}
                  </span>
                </div>
                <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {o.title}
                </h3>
                <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {o.desc}
                </p>
                <div className={`flex items-center gap-1 text-sm font-semibold transition-all ${isDark ? 'text-gold-400 group-hover:text-gold-300' : 'text-gold-600 group-hover:text-gold-700'}`}>
                  Zarezerwuj
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>

        {/* --- BLOK 2: OPINIE / SOCIAL PROOF --- */}
        <div className={`relative rounded-3xl overflow-hidden p-8 md:p-12 ${
          isDark
            ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-zinc-800'
            : 'bg-gradient-to-br from-zinc-50 to-white border border-zinc-200 shadow-xl'
        }`}>
          {/* Tło z gwiazdami */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
            <div className="absolute top-4 left-8 text-6xl">⭐</div>
            <div className="absolute bottom-8 right-12 text-8xl">⭐</div>
            <div className="absolute top-1/2 right-1/3 text-4xl">⭐</div>
          </div>

          <div className="relative text-center mb-8">
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-8 h-8 md:w-10 md:h-10 fill-gold-500 text-gold-500 drop-shadow-lg" />
              ))}
            </div>
            <h2 className={`font-serif text-3xl md:text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Pomóż innym mnie znaleźć
            </h2>
            <p className={`text-base md:text-lg max-w-2xl mx-auto ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
              Jedna szczera opinia to <strong className={isDark ? 'text-gold-400' : 'text-gold-600'}>największa pomoc</strong> dla małego fotografa.
              Wystarczy chwila, a kolejny rodzic znajdzie mnie i też będzie miał takie zdjęcia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Google */}
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setReviewClicked('google')}
              className="group relative flex flex-col items-center text-center p-6 rounded-2xl bg-white text-zinc-900 hover:scale-105 transition-all shadow-xl border border-zinc-200 hover:border-blue-500"
            >
              <div className="w-14 h-14 mb-3 rounded-full bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                G
              </div>
              <h3 className="font-bold text-lg mb-1">Opinia na Google</h3>
              <p className="text-xs text-zinc-600 mb-4">
                Najważniejsze dla SEO — pomaga mi pojawiać się wyżej.
              </p>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold group-hover:bg-blue-700 transition-colors">
                <Star className="w-4 h-4 fill-white" />
                Wystaw 5★
              </span>
              {reviewClicked === 'google' && (
                <span className="absolute top-2 right-2 text-xs text-emerald-600 font-bold">Dzięki!</span>
              )}
            </a>

            {/* Facebook */}
            <a
              href={facebookReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setReviewClicked('fb')}
              className="group relative flex flex-col items-center text-center p-6 rounded-2xl bg-[#1877F2] text-white hover:scale-105 transition-all shadow-xl"
            >
              <div className="w-14 h-14 mb-3 rounded-full bg-white flex items-center justify-center text-[#1877F2] font-black text-3xl shadow-lg">
                f
              </div>
              <h3 className="font-bold text-lg mb-1">Polub na Facebooku</h3>
              <p className="text-xs text-white/80 mb-4">
                Daj „Lubię to" i napisz parę słów — to robi ogromną różnicę.
              </p>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1877F2] rounded-full text-sm font-bold group-hover:bg-zinc-100 transition-colors">
                <ThumbsUp className="w-4 h-4" />
                Polub i oceń
              </span>
              {reviewClicked === 'fb' && (
                <span className="absolute top-2 right-2 text-xs text-yellow-300 font-bold">Dzięki!</span>
              )}
            </a>

            {/* Poleć znajomym */}
            <button
              onClick={share}
              className="group flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-br from-gold-500 to-amber-600 text-black hover:scale-105 transition-all shadow-xl"
            >
              <div className="w-14 h-14 mb-3 rounded-full bg-black/20 flex items-center justify-center shadow-lg">
                <Share2 className="w-7 h-7 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-1">Poleć znajomym</h3>
              <p className="text-xs text-black/70 mb-4">
                Znasz kogoś, kto ma komunię, chrzciny, urodziny? Wyślij link.
              </p>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-full text-sm font-bold group-hover:bg-zinc-800 transition-colors">
                <MessageCircle className="w-4 h-4" />
                Udostępnij
              </span>
            </button>
          </div>

          {/* Mała stopka motywacyjna */}
          <div className={`text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            <p>
              💛 Każda opinia ma realny wpływ — dziękuję, że jesteś częścią tej historii.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
