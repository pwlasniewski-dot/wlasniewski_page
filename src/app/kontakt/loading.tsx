import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Loading() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />
            
            <main className="flex-grow pt-32 pb-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Title skeleton */}
                        <div className="text-center mb-12 animate-pulse">
                            <div className="h-12 bg-zinc-800 rounded w-2/3 mx-auto mb-6"></div>
                            <div className="h-6 bg-zinc-800 rounded w-1/2 mx-auto"></div>
                        </div>
                        
                        {/* Form skeleton */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 md:p-10">
                            <div className="animate-pulse space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2"></div>
                                        <div className="h-12 bg-zinc-800 rounded"></div>
                                    </div>
                                    <div>
                                        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2"></div>
                                        <div className="h-12 bg-zinc-800 rounded"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="h-4 bg-zinc-800 rounded w-1/4 mb-2"></div>
                                    <div className="h-32 bg-zinc-800 rounded"></div>
                                </div>
                                <div className="h-12 bg-zinc-800 rounded w-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
}
