'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface FamilyOfferVoucherPreviewProps {
    senderName: string;
    recipientName: string;
    packageName: string;
    packagePriceLabel: string;
    hidePrice?: boolean;
    sessionDate: string;
    sessionTime: string;
    location: string;
    qrTarget: string;
}

export default function FamilyOfferVoucherPreview({
    senderName,
    recipientName,
    packageName,
    packagePriceLabel,
    hidePrice = false,
    sessionDate,
    sessionTime,
    location,
    qrTarget,
}: FamilyOfferVoucherPreviewProps) {
    const [qrDataUrl, setQrDataUrl] = useState('');

    useEffect(() => {
        let active = true;
        QRCode.toDataURL(qrTarget, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 220,
            color: { dark: '#1a1a1a', light: '#ffffff' },
        }).then((dataUrl) => {
            if (active) setQrDataUrl(dataUrl);
        }).catch(() => {
            if (active) setQrDataUrl('');
        });
        return () => {
            active = false;
        };
    }, [qrTarget]);

    const rows = [
        { label: 'Pakiet', value: packageName || 'Do wyboru' },
        ...(!hidePrice ? [{ label: 'Cena', value: packagePriceLabel || 'Do ustalenia' }] : []),
        { label: 'Data sesji', value: sessionDate || 'Termin do uzgodnienia' },
        { label: 'Godzina', value: sessionTime || 'Godzina do uzgodnienia' },
        { label: 'Miejsce', value: location || 'Lokalizacja do uzgodnienia' },
    ];

    return (
        <div className="overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
            <div className="bg-[#1a1a1a] px-8 py-8 text-center">
                <p className="text-[#c5a059] text-sm font-semibold tracking-[0.35em] uppercase">Przemysław Właśniewski · Fotografia</p>
                <p className="mt-3 text-sm text-white/80">wlasniewski.pl</p>
                <p className="mt-4 text-[11px] tracking-[0.45em] uppercase text-[#c5a059]">Voucher sesji rodzinnej</p>
            </div>

            <div className="bg-[radial-gradient(circle_at_top,#ffffff_0%,#fcfbf8_42%,#f5efe2_100%)] px-8 py-10 text-[#1f1f1f]">
                <h3 className="text-center text-5xl font-black tracking-tight">Voucher na sesję</h3>

                <div className="mt-10 grid gap-6 md:grid-cols-2">
                    <div className="rounded-[20px] border border-[#e6d7b6] bg-white/80 px-5 py-5">
                        <p className="text-[11px] tracking-[0.35em] uppercase text-zinc-400">Od</p>
                        <p className="text-3xl font-bold mt-2">{senderName || 'Osoba zamawiająca'}</p>
                    </div>
                    <div className="rounded-[20px] border border-[#e6d7b6] bg-white/80 px-5 py-5">
                        <p className="text-[11px] tracking-[0.35em] uppercase text-zinc-400">Dla</p>
                        <p className="text-3xl font-bold mt-2">{recipientName || 'Rodzice'}</p>
                    </div>
                </div>

                <div className="mt-10 rounded-[24px] border border-[#d9bc84] bg-[#f8f4ea] px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <div className="space-y-5">
                        {rows.map((row) => (
                            <div key={row.label} className="grid grid-cols-[140px_1fr] gap-5 items-start">
                                <div className="text-[11px] tracking-[0.35em] uppercase text-zinc-400 pt-1">{row.label}</div>
                                <div className="text-xl font-semibold text-[#333]">{row.value}</div>
                            </div>
                        ))}
                    </div>

                </div>

                <div className="flex flex-col items-center mt-8">
                    {qrDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qrDataUrl} alt="QR voucher" className="h-36 w-36 rounded-[18px] border border-black/10 bg-white p-2 shadow-sm" />
                    ) : (
                        <div className="h-36 w-36 rounded-[18px] bg-zinc-200" />
                    )}
                    <p className="mt-3 text-center text-xs uppercase tracking-[0.18em] text-zinc-400">Zeskanuj, aby otworzyć wlasniewski.pl</p>
                </div>

                <div className="mt-8 rounded-[18px] bg-[#1a1a1a] px-6 py-5 text-white">
                    <div>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.35em] text-[#c5a059]">Sesja rodzinna</p>
                            <p className="mt-2 text-sm text-white/75">Voucher imienny do wykorzystania po kontakcie i potwierdzeniu dostępnego terminu.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}