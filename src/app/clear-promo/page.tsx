'use client';

// TEMPORARY DEBUG - Clear localStorage for GiftCardPromoBar
// Visit http://localhost:3000/clear-promo to clear localStorage

import { useEffect, useState } from 'react';

export default function ClearPromoPage() {
    const [cleared, setCleared] = useState(false);

    useEffect(() => {
        const value = localStorage.getItem('giftCardPromoClosed');
        console.log('Before clear:', value);
        localStorage.removeItem('giftCardPromoClosed');
        console.log('After clear:', localStorage.getItem('giftCardPromoClosed'));
        setCleared(true);
    }, []);

    return (
        <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui' }}>
            <h1 style={{ color: cleared ? 'green' : 'orange' }}>
                {cleared ? '✅ LocalStorage Cleared!' : '⏳ Clearing...'}
            </h1>
            <p>giftCardPromoClosed has been removed from localStorage</p>
            <p><a href="/" style={{ color: 'blue', textDecoration: 'underline', fontSize: '18px' }}>← Go to Homepage</a></p>
            <hr style={{ margin: '30px 0' }} />
            <p style={{ fontSize: '12px', color: '#666' }}>
                After clicking the link above, do a hard refresh (Ctrl+Shift+R)<br />
                to see the Gift Card Promo Banner on the left side.
            </p>
        </div>
    );
}
