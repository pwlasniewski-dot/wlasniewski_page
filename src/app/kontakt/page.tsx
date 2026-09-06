import React from 'react';
import prisma from '@/lib/db/prisma';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageRenderer from '@/components/PageRenderer';
import dynamic from 'next/dynamic';
import { Metadata } from 'next';

const ContactForm = dynamic(() => import('@/components/ContactForm'), { 
    loading: () => (
        <div className="max-w-4xl mx-auto text-center py-20">
            <div className="animate-pulse">
                <div className="h-8 bg-zinc-800 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-zinc-800 rounded w-1/2 mx-auto"></div>
            </div>
        </div>
    )
});

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata(): Promise<Metadata> {
    const page = await prisma.page.findUnique({
        where: { slug: 'kontakt' },
        select: {
            meta_title: true,
            meta_description: true
        }
    });

    return {
        title: page?.meta_title || 'Kontakt | Fotograf Toruń — Przemysław Właśniewski ☎ 530 788 694',
        description: page?.meta_description || 'Skontaktuj się z fotografem w Toruniu. Pytania o sesje fotograficzne, terminy i ofertę? Zadzwoń: 530 788 694 lub wyślij wiadomość — odpowiadam szybko.',
        alternates: {
            canonical: 'https://wlasniewski.pl/kontakt',
        },
    };
}

export default async function ContactPage() {
    const page = await prisma.page.findUnique({
        where: { slug: 'kontakt' },
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
            console.error('Failed to parse kontakt sections', e);
        }
    }

    /* 
       SYNC INTEGRITY (Zero Flower)
       Jeśli w panelu admina nie dodano żadnych sekcji (np. po wipe bazy), 
       zapewniamy fallback do standardowego formularza kontaktowego.
    */
    const hasSections = sections && sections.length > 0;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20">
                {hasSections ? (
                    <>
                        <h1 className="sr-only">Kontakt — Fotograf Toruń Przemysław Właśniewski</h1>
                        <PageRenderer sections={sections} />
                    </>
                ) : (
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto text-center mb-12">
                            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
                                Skontaktuj się z fotografem w Toruniu
                            </h1>
                            <p className="text-zinc-400 text-lg">
                                Masz pytania? Chcesz zarezerwować termin? Napisz do mnie!
                            </p>
                        </div>
                        <ContactForm />
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
