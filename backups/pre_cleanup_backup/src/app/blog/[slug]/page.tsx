"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";
import { ArrowLeft, Calendar, Tag } from "lucide-react";

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    published_at: string;
    category: string;
    author: string;
    cover_image?: string;
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const [resolvedParams, setResolvedParams] = useState<{ slug: string } | null>(null);
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        params.then(p => setResolvedParams(p));
    }, [params]);

    useEffect(() => {
        if (!resolvedParams) return;

        const fetchPost = async () => {
            try {
                const res = await fetch(`${getApiUrl('blog')}?slug=${resolvedParams.slug}`);
                const data = await res.json();
                if (data.success && data.post) {
                    setPost(data.post);
                }
            } catch (error) {
                console.error('Failed to fetch blog post');
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [resolvedParams]);

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-zinc-400">Ładowanie...</div>
            </main>
        );
    }

    if (!post) {
        return (
            <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Wpis nie znaleziony</h1>
                    <Link href="/blog" className="text-amber-400 hover:text-amber-300">
                        ← Wróć do bloga
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950">
            <article className="mx-auto max-w-4xl px-4 py-20">
                {/* Back button */}
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-400 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Wróć do bloga
                </Link>

                {/* Header */}
                <header className="mb-12">
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <time>
                                {new Date(post.published_at).toLocaleDateString('pl-PL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </time>
                        </div>
                        {post.category && (
                            <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                <span className="text-amber-400">{post.category}</span>
                            </div>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 font-display leading-tight">
                        {post.title}
                    </h1>

                    {post.cover_image && (
                        <div className="mb-8 rounded-2xl overflow-hidden aspect-video relative">
                            <img
                                src={post.cover_image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {post.excerpt && (
                        <p className="text-xl text-zinc-400 leading-relaxed">
                            {post.excerpt}
                        </p>
                    )}
                </header>

                {/* Content */}
                <div
                    className="prose prose-invert prose-lg max-w-none
                        prose-headings:font-display prose-headings:text-white
                        prose-p:text-zinc-300 prose-p:leading-relaxed
                        prose-a:text-amber-400 prose-a:no-underline hover:prose-a:text-amber-300
                        prose-strong:text-white
                        prose-ul:text-zinc-300 prose-ol:text-zinc-300
                        prose-li:marker:text-amber-400
                        prose-img:rounded-xl prose-img:shadow-2xl
                        prose-code:text-amber-400 prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    "
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Author & CTA */}
                <footer className="mt-16 pt-8 border-t border-zinc-800">
                    {post.author && (
                        <p className="text-zinc-400 mb-8">
                            Autor: <span className="text-white font-semibold">{post.author}</span>
                        </p>
                    )}

                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center">
                        <h3 className="text-2xl font-bold text-white mb-4">
                            Podobał Ci się ten wpis?
                        </h3>
                        <p className="text-zinc-400 mb-6">
                            Zarezerwuj sesję zdjęciową już dziś!
                        </p>
                        <Link
                            href="/rezerwacja"
                            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold px-8 py-4 rounded-xl transition-colors"
                        >
                            Zarezerwuj termin →
                        </Link>
                    </div>
                </footer>
            </article>
        </main>
    );
}
