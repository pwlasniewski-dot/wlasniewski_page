
import React from 'react';
import ContactForm from '@/components/ContactForm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Kontakt | Przemysław Właśniewski Fotografia',
    description: 'Skontaktuj się ze mną. Zapytaj o termin sesji, ofertę lub napisz po prostu cześć.',
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20">
                <div className="container mx-auto px-4">
                    <ContactForm />
                </div>
            </main>

            <Footer />
        </div>
    );
}
