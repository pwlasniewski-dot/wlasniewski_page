"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    published_at: string;
    category: string;
    cover_image?: string;
}

export default function BlogIndex() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await fetch(getApiUrl('blog'));
                const data = await res.json();
                if (data.success) {
                    setPosts(data.posts.filter((p: any) => p.status === 'published'));
                }
            } catch (error) {
                console.error('Failed to fetch blog posts');
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <main className="min-h-screen bg-zinc-950">
            <div className="mx-auto max-w-6xl px-4 py-20">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 font-display">
                        Blog
                    </h1>
                    <p className="text-zinc-300 text-lg max-w-2xl mx-auto">
                        Porady, inspiracje i za kulisami mojej pracy fotografa
                    </p>
                </div>

                {/* Blog Grid */}
                {loading ? (
                    <div className="text-center text-zinc-400 py-12">Ładowanie...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center text-zinc-400 py-12">
                        <p>Brak opublikowanych wpisów.</p>
                        <p className="text-sm mt-2">Wkrótce pojawią się tu nowe artykuły!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        {posts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="group bg-white/5 hover:bg-white/10 rounded-2xl overflow-hidden border border-zinc-700 hover:border-amber-500 transition-all duration-300"
                            >
                                <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                                    {post.cover_image ? (
                                        <img
                                            src={post.cover_image}
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-60" />
                                    <div className="absolute bottom-4 left-4">
                                        <span className="bg-amber-500 text-zinc-900 px-3 py-1 rounded-full text-xs font-bold">
                                            {post.category || 'Blog'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <time className="text-zinc-500 text-sm">
                                        {new Date(post.published_at).toLocaleDateString('pl-PL')}
                                    </time>
                                    <h2 className="text-xl font-bold text-white mt-2 mb-3 group-hover:text-amber-400 transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-zinc-400 text-sm line-clamp-2">
                                        {post.excerpt}
                                    </p>

                                    <div className="mt-4 inline-flex items-center text-amber-400 font-semibold text-sm">
                                        Czytaj więcej
                                        <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Info box */}
                <div className="text-center bg-white/5 rounded-2xl p-8 border border-zinc-700">
                    <p className="text-zinc-400 mb-4">
                        Szukasz więcej inspiracji?
                    </p>
                    <Link
                        href="/portfolio"
                        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold px-6 py-3 rounded-xl transition-colors"
                    >
                        Zobacz portfolio
                    </Link>
                </div>
            </div>
        </main>
    );
}
