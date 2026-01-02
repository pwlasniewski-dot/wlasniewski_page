
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getApiUrl } from "@/lib/api-config";

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    published_at: string;
    category: string;
    cover_image?: string;
    status: string;
}

interface BlogFeedSectionProps {
    title?: string;
    subtitle?: string;
    category?: string;
    limit?: number;
    show_button?: boolean;
    button_text?: string;
    button_url?: string;
}

export default function BlogFeedSection({
    title = "Najnowsze wpisy",
    subtitle,
    category,
    limit = 6,
    show_button = false,
    button_text = "Zobacz wszystkie",
    button_url = "/blog"
}: BlogFeedSectionProps) {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                let url = getApiUrl('blog');
                const params = new URLSearchParams();
                if (category) params.append('category', category);

                const fullUrl = `${url}?${params.toString()}`;

                const res = await fetch(fullUrl);
                const data = await res.json();

                if (data.success) {
                    let filteredPosts = data.posts.filter((p: BlogPost) => p.status === 'published');
                    if (limit) {
                        filteredPosts = filteredPosts.slice(0, limit);
                    }
                    setPosts(filteredPosts);
                }
            } catch (error) {
                console.error('Failed to fetch blog posts', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [category, limit]);

    if (!loading && posts.length === 0) return null;

    return (
        <section className="py-20 px-4 bg-zinc-950 relative">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    {subtitle && (
                        <span className="text-gold-500 font-bold uppercase tracking-wider text-sm mb-2 block">
                            {subtitle}
                        </span>
                    )}
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white font-display">
                        {title}
                    </h2>
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white/5 rounded-2xl h-[400px] animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        {posts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="group bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-gold-500/10 flex flex-col h-full"
                            >
                                <div className="aspect-video relative overflow-hidden bg-zinc-800">
                                    {post.cover_image ? (
                                        <Image
                                            src={post.cover_image}
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                            <span className="text-zinc-700">Brak zdjęcia</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-transparent to-transparent opacity-60" />
                                    <div className="absolute top-4 right-4">
                                        <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                                            {post.category || 'Blog'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col flex-grow">
                                    <time className="text-zinc-500 text-xs font-mono mb-3 block">
                                        {new Date(post.published_at).toLocaleDateString('pl-PL')}
                                    </time>
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gold-400 transition-colors leading-tight">
                                        {post.title}
                                    </h3>
                                    <p className="text-zinc-400 text-sm line-clamp-3 mb-6 flex-grow">
                                        {post.excerpt}
                                    </p>

                                    <div className="flex items-center text-gold-500 font-bold text-sm mt-auto">
                                        Czytaj więcej
                                        <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {show_button && !loading && (
                    <div className="text-center mt-12">
                        <Link
                            href={button_url}
                            className="inline-flex items-center gap-2 bg-transparent border border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black font-bold px-8 py-4 rounded-xl transition-all duration-300"
                        >
                            {button_text}
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
