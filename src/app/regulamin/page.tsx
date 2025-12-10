import React from 'react';

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-gold-400 mb-8">
                    Regulamin
                </h1>

                <div className="prose prose-invert prose-lg max-w-none space-y-8 text-zinc-300">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Postanowienia ogólne</h2>
                        <p>
                            Niniejszy regulamin określa zasady korzystania z usług fotograficznych świadczonych przez Przemysław Właśniewski Fotografia.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Rezerwacja sesji</h2>
                        <p>
                            Rezerwacja terminu sesji następuje po wpłacie zadatku ustalonego indywidualnie lub określonego w ofercie (w tym Foto Wyzwania).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Realizacja usługi</h2>
                        <p>
                            Fotograf zobowiązuje się do wykonania usługi z należytą starannością oraz dostarczenia obrobionych zdjęć w terminie określonym w umowie.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Prawa autorskie</h2>
                        <p>
                            Autorskie prawa majątkowe do zdjęć przysługują Fotografowi. Klient otrzymuje licencję na wykorzysttek prywatny.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
