'use client';

import Script from 'next/script';

interface AnalyticsIntegrationProps {
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
    facebookPixelId?: string;
    b2bGoogleAnalyticsId?: string;
    b2bGoogleTagManagerId?: string;
    b2bFacebookPixelId?: string;
    isB2B?: boolean;
}

export default function AnalyticsIntegration({
    googleAnalyticsId,
    googleTagManagerId,
    facebookPixelId,
    b2bGoogleAnalyticsId,
    b2bGoogleTagManagerId,
    b2bFacebookPixelId,
    isB2B,
}: AnalyticsIntegrationProps) {
    // Use B2B-specific IDs when on B2B domain, fallback to main
    const activeGAId = isB2B ? (b2bGoogleAnalyticsId || googleAnalyticsId) : googleAnalyticsId;
    const activeGTMId = isB2B ? (b2bGoogleTagManagerId || googleTagManagerId) : googleTagManagerId;
    const activePixelId = isB2B ? (b2bFacebookPixelId || facebookPixelId) : facebookPixelId;
    const googleAdsId = 'AW-17548893646';
    const googleLoaderId = activeGAId || googleAdsId;

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${googleLoaderId}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics-ads" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    ${activeGAId ? `gtag('config', '${activeGAId}');` : ''}
                    gtag('config', '${googleAdsId}');
                `}
            </Script>

            {/* Google Tag Manager */}
            {activeGTMId && (
                <>
                    <Script id="google-tag-manager" strategy="afterInteractive">
                        {`
                            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                            })(window,document,'script','dataLayer','${activeGTMId}');
                        `}
                    </Script>
                    {/* GTM noscript fallback */}
                    <noscript>
                        <iframe
                            src={`https://www.googletagmanager.com/ns.html?id=${activeGTMId}`}
                            height="0"
                            width="0"
                            style={{ display: 'none', visibility: 'hidden' }}
                        />
                    </noscript>
                </>
            )}

            {/* Facebook Pixel */}
            {activePixelId && (
                <Script id="facebook-pixel" strategy="afterInteractive">
                    {`
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${activePixelId}');
                        fbq('track', 'PageView');
                    `}
                </Script>
            )}
        </>
    );
}
