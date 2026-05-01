// Instant skeleton podczas pobierania danych z DB — UX działa od pierwszej klatki
export default function Loading() {
    return (
        <div className="min-h-screen bg-[#FBF7EF] animate-pulse">
            <div className="h-12 bg-amber-100" />
            <div className="max-w-6xl mx-auto px-4 pt-28 pb-16">
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div>
                        <div className="h-8 w-64 bg-amber-200/60 rounded-full mb-6" />
                        <div className="h-16 md:h-20 w-full bg-stone-200 rounded mb-3" />
                        <div className="h-16 md:h-20 w-3/4 bg-amber-200/60 rounded mb-3" />
                        <div className="h-12 w-1/2 bg-stone-200 rounded mb-6" />
                        <div className="h-5 w-full bg-stone-200 rounded mb-2" />
                        <div className="h-5 w-5/6 bg-stone-200 rounded mb-2" />
                        <div className="h-5 w-4/6 bg-stone-200 rounded mb-8" />
                        <div className="h-12 w-48 bg-stone-200 rounded-full" />
                    </div>
                    <div>
                        <div className="bg-white rounded-3xl p-8 shadow-2xl">
                            <div className="h-10 w-3/4 bg-stone-200 rounded mb-6" />
                            <div className="space-y-3">
                                <div className="h-12 bg-stone-100 rounded-xl" />
                                <div className="h-12 bg-stone-100 rounded-xl" />
                                <div className="h-12 bg-stone-100 rounded-xl" />
                                <div className="h-12 bg-stone-100 rounded-xl" />
                                <div className="h-12 bg-stone-100 rounded-xl" />
                            </div>
                            <div className="h-14 bg-amber-200/60 rounded-xl mt-6" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
