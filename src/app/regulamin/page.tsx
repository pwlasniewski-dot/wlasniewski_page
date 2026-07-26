import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db/prisma';
import PageRenderer from '@/components/PageRenderer';
import { Metadata } from 'next';

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata(): Promise<Metadata> {
    const page = await prisma.page.findUnique({
        where: { slug: 'regulamin' },
        select: {
            meta_title: true,
            meta_description: true
        }
    });

    return {
        title: page?.meta_title || 'Regulamin | Przemysław Właśniewski',
        description: page?.meta_description || 'Regulamin świadczenia usług fotograficznych i sprzedaży kart podarunkowych przez wlasniewski.pl.',
        alternates: { canonical: 'https://wlasniewski.pl/regulamin' },
        robots: { index: false, follow: true },
    };
}

export default async function TermsPage() {
    const page = await prisma.page.findUnique({
        where: { slug: 'regulamin' },
        select: {
            sections: true
        }
    });

    // Parse sections
    let sections = [];
    if (page?.sections) {
        try {
            sections = JSON.parse(page.sections);
        } catch (e) {
            console.error('Failed to parse regulamin sections', e);
        }
    }

    /* 
       SYNC INTEGRITY (Zero Flower)
       Jeśli w panelu admina nie dodano sekcji, wyświetlamy standardową treść prawną.
    */
    const hasSections = sections && sections.length > 0;

    return (
        <main className="min-h-screen bg-black text-white pt-32 pb-20 px-6 selection:bg-gold-400 selection:text-black">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center text-zinc-500 hover:text-gold-400 mb-8 transition-colors group font-sans text-sm tracking-widest uppercase"
                >
                    <svg className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    Powrót
                </Link>

                {hasSections ? (
                    <PageRenderer sections={sections} />
                ) : (
                    <>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-gold-400 mb-8">
                            Regulamin Świadczenia Usług
                        </h1>

                        <div className="prose prose-invert prose-lg max-w-none space-y-8 text-zinc-300">
                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">I. Informacje o Sprzedawcy</h2>
                                <p>
                                    Właścicielem serwisu internetowego działającego pod adresem <strong>wlasniewski.pl</strong> jest:
                                </p>
                                <p className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                                    <strong>FOTO-DRON Przemysław Właśniewski</strong><br />
                                    Adres: <span className="text-gold-400">Płużnica 47g, 87-214 Płużnica</span><br />
                                    NIP: <span className="text-gold-400">8781430365</span><br />
                                    REGON: <span className="text-gold-400">871237704</span><br />
                                    <br />
                                    <strong>Kontakt:</strong><br />
                                    E-mail: <a href="mailto:pwlasniewski@gmail.com" className="text-gold-400 hover:underline">pwlasniewski@gmail.com</a><br />
                                    Telefon: <a href="tel:+48530788694" className="text-gold-400 hover:underline">+48 530 788 694</a>
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">II. Rodzaje i zakres usług</h2>
                                <p>
                                    Sprzedawca oferuje za pośrednictwem serwisu:
                                </p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Usługi fotograficzne (sesje zdjęciowe, reportaże).</li>
                                    <li>Sprzedaż produktów cyfrowych w postaci Kart Podarunkowych (voucherów).</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-white mb-4">III. Płatności i realizacja zamówień</h2>
                                <ol className="list-decimal list-inside space-y-4">
                                    <li>
                                        <strong>Metody płatności:</strong> Klient może dokonać płatności za pomocą:
                                        <ul className="list-disc list-inside ml-6 mt-2 text-zinc-400">
                                            <li>Systemu płatności online PayU (karty płatnicze, szybkie przelewy).</li>
                                            <li>Przelewu tradycyjnego na konto bankowe.</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <strong>Realizacja:</strong> Voucher elektroniczny wysyłany jest niezwłocznie po zaksięgowaniu wpłaty na podany adres e-mail.
                                    </li>
                                </ol>
                            </section>

                            <section className="border-t border-zinc-800 pt-8 mt-12">
                                <h2 className="text-2xl font-semibold text-white mb-4">IV. Postanowienia końcowe</h2>
                                <p>
                                    W sprawach nieuregulowanych niniejszym regulaminem stosuje się przepisy Kodeksu Cywilnego oraz Ustawy o prawach konsumenta.
                                </p>
                            </section>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
