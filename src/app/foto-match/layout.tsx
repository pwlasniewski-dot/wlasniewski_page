import FotoMatchTopNav from './_components/FotoMatchTopNav';

export default function FotoMatchLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <FotoMatchTopNav />
            <div>{children}</div>
        </>
    );
}
