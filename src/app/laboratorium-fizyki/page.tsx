import Link from 'next/link';
import { Atom, FlaskConical, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';

export default function PhysicsLabEntryPage() {
    return (
        <main className="physics-lab lab-entry-page">
            <div className="lab-cosmic-grid" aria-hidden="true" />
            <div className="lab-ambient lab-ambient-one" aria-hidden="true" />
            <section className="lab-entry-card">
                <div className="lab-entry-mark" aria-hidden="true"><Atom /></div>
                <span className="lab-section-label"><Sparkles /> Interaktywna nauka przez doświadczenia</span>
                <h1>Laboratorium Fizyki</h1>
                <p>Każde dziecko otrzymuje własny, bezpieczny link z misjami wybranymi przez rodzica. W linku zapisuje się postęp, wyniki minitestów i test końcowy.</p>
                <div className="lab-entry-portals">
                    <article>
                        <FlaskConical />
                        <h2>Strefa dziecka</h2>
                        <p>Otwórz osobisty link otrzymany od rodzica. Nie potrzebujesz loginu ani hasła.</p>
                        <span><LockKeyhole /> Link jest indywidualny</span>
                    </article>
                    <article>
                        <ShieldCheck />
                        <h2>Strefa rodzica</h2>
                        <p>Wybierz doświadczenia, uruchom test i sprawdzaj postępy w panelu administratora.</p>
                        <Link href="/admin/fizyka">Przejdź do panelu</Link>
                    </article>
                </div>
            </section>
        </main>
    );
}
