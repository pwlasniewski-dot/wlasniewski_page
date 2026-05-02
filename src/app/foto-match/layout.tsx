import FotoMatchBottomNav from './_components/FotoMatchBottomNav';

export default function FotoMatchLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <div className="pb-20 sm:pb-24">{children}</div>
            <FotoMatchBottomNav />
        </>
    );
}
