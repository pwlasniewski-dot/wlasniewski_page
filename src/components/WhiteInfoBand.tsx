"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";

interface WhiteInfoBandProps {
    image?: string;
    title?: string;
    content?: string;
    imagePosition?: 'left' | 'right' | 'center';
}

export default function WhiteInfoBand({ image, title, content, imagePosition }: WhiteInfoBandProps) {
    const [settings, setSettings] = useState({
        image: image || "",
        title: title || "Materiały, które budują Twój wizerunek",
        content: content || "",
        imagePosition: imagePosition || 'left'
    });

    useEffect(() => {
        // If props are provided, don't fetch settings
        if (image || title || content) {
            setSettings({
                image: image || "",
                title: title || "Materiały, które budują Twój wizerunek",
                content: content || "",
                imagePosition: imagePosition || 'left'
            });
            return;
        }

        const fetchSettings = async () => {
            try {
                const res = await fetch(getApiUrl('settings'));
                const data = await res.json();
                if (data.success) {
                    setSettings({
                        image: data.settings.info_band_image || "",
                        title: data.settings.info_band_title || "Materiały, które budują Twój wizerunek",
                        content: data.settings.info_band_content || "",
                        imagePosition: data.settings.info_band_position || 'left'
                    });
                }
            } catch (error) {
                console.error('Failed to fetch info band settings');
            }
        };
        fetchSettings();
    }, [image, title, content, imagePosition]);

    const defaultContent = (
        <div className="text-zinc-700 text-lg leading-relaxed space-y-6">
            <p>
                Tworzę <strong>profesjonalne i dopasowane treści wizualne</strong>, które
                wzmacniają markę i osobisty wizerunek.
            </p>
            <div>
                <h3 className="font-semibold text-zinc-800 mb-2">Fotografia biznesowa i eventowa</h3>
                <ul className="list-disc list-inside space-y-1 text-base">
                    <li>Spójne portrety zespołu</li>
                    <li>Materiały promocyjne do social media</li>
                    <li>Profesjonalne reportaże z konferencji i gal</li>
                </ul>
            </div>
            <div>
                <h3 className="font-semibold text-zinc-800 mb-2">Fotografia rodzinna i portretowa</h3>
                <ul className="list-disc list-inside space-y-1 text-base">
                    <li>Naturalne, autentyczne ujęcia</li>
                    <li>Wsparcie w doborze stylizacji i lokalizacji</li>
                    <li>Sesje w komfortowej, swobodnej atmosferze</li>
                </ul>
            </div>
            <div>
                <h3 className="font-semibold text-zinc-800 mb-2">
                    Dron i termowizja <span className="text-sm">(NSTS-01  / ITC Level 1)</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-base">
                    <li>Efektowne ujęcia promocyjne z powietrza</li>
                    <li>Precyzyjne inspekcje techniczne</li>
                    <li>Zaawansowane analizy termowizyjne</li>
                </ul>
            </div>
            <div className="pt-4">
                <Link
                    href="/rezerwacja"
                    className="inline-block bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-6 py-3 rounded-xl transition-colors"
                >
                    Zarezerwuj sesję
                </Link>
            </div>
        </div>
    );

    const isCenter = settings.imagePosition === 'center';
    const isRight = settings.imagePosition === 'right';

    return (
        <section className="bg-white">
            <div className={`mx-auto max-w-6xl px-6 py-16 ${isCenter ? 'text-center' : 'grid grid-cols-1 md:grid-cols-2 gap-10 items-center'}`}>

                {/* Image */}
                <figure className={`rounded-2xl overflow-hidden shadow-md border border-zinc-100 ${isRight ? 'md:order-2' : ''} ${isCenter ? 'mb-10 max-w-3xl mx-auto' : ''}`}>
                    {settings.image ? (
                        <img
                            src={settings.image}
                            alt={settings.title}
                            className="w-full h-auto object-cover min-h-[300px]"
                        />
                    ) : (
                        <div className="w-full h-72 md:h-96 bg-gradient-to-br from-zinc-200 to-zinc-300" />
                    )}
                </figure>

                {/* Content */}
                <div className={`${isRight ? 'md:order-1' : ''}`}>
                    <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 mb-6 font-display">
                        {settings.title}
                    </h2>

                    {settings.content ? (
                        <div className="text-zinc-700 text-lg leading-relaxed space-y-6">
                            <div dangerouslySetInnerHTML={{ __html: settings.content }} />
                            <div className="pt-4">
                                <Link
                                    href="/rezerwacja"
                                    className="inline-block bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-6 py-3 rounded-xl transition-colors"
                                >
                                    Zarezerwuj sesję
                                </Link>
                            </div>
                        </div>
                    ) : defaultContent}
                </div>
            </div>
        </section>
    );
}
