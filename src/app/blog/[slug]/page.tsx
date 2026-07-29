import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import prisma from '@/lib/db/prisma';

export const revalidate = 3600;

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await prisma.blogPost.findFirst({
        where: {
            slug,
            status: 'published',
            published_at: { lte: new Date() },
        },
        include: {
            featured_image: { select: { file_path: true, alt_text: true } },
            author: { select: { name: true } },
        },
    });

    if (!post) notFound();

    // Tytuł strony jest jedynym H1. Historyczne H1 z edytora obniżamy do H2.
    const content = post.content
        .replace(/<h1(\s|>)/gi, '<h2$1')
        .replace(/<\/h1>/gi, '</h2>');
    const canonical = `https://wlasniewski.pl/blog/${encodeURIComponent(post.slug)}`;
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.meta_description || post.excerpt || undefined,
        image: post.featured_image?.file_path || undefined,
        datePublished: post.published_at?.toISOString(),
        dateModified: post.updated_at.toISOString(),
        author: { '@type': 'Person', name: post.author?.name || 'Przemysław Właśniewski' },
        publisher: {
            '@type': 'Organization',
            name: 'FOTO-DRON Przemysław Właśniewski',
            url: 'https://wlasniewski.pl',
        },
        mainEntityOfPage: canonical,
    };

    return (
        <main className="min-h-screen bg-zinc-950">
            <article className="mx-auto max-w-4xl px-4 py-20">
                <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-zinc-400 transition-colors hover:text-amber-400">
                    <ArrowLeft className="h-4 w-4" />
                    Wróć do bloga
                </Link>

                <header className="mb-12">
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                        {post.published_at && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <time dateTime={post.published_at.toISOString()}>
                                    {post.published_at.toLocaleDateString('pl-PL', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </time>
                            </div>
                        )}
                        {post.category && (
                            <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                <span className="text-amber-400">{post.category}</span>
                            </div>
                        )}
                    </div>

                    <h1 className="mb-6 font-display text-4xl font-extrabold leading-tight text-white md:text-5xl">
                        {post.title}
                    </h1>

                    {post.featured_image?.file_path && (
                        <div className="relative mb-8 aspect-video overflow-hidden rounded-2xl">
                            <Image
                                src={post.featured_image.file_path}
                                alt={post.featured_image.alt_text || post.title}
                                fill
                                sizes="(max-width: 896px) 100vw, 896px"
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    {post.excerpt && <p className="text-xl leading-relaxed text-zinc-400">{post.excerpt}</p>}
                </header>

                <div
                    className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:text-white prose-p:leading-relaxed prose-p:text-zinc-300 prose-a:text-amber-400 prose-strong:text-white prose-li:marker:text-amber-400 prose-img:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: content }}
                />

                <footer className="mt-16 border-t border-zinc-800 pt-8">
                    <p className="mb-8 text-zinc-400">
                        Autor: <span className="font-semibold text-white">{post.author?.name || 'Przemysław Właśniewski'}</span>
                    </p>
                    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 text-center">
                        <h2 className="mb-4 text-2xl font-bold text-white">Chcesz stworzyć własną historię?</h2>
                        <p className="mb-6 text-zinc-400">Sprawdź pakiety i wolne terminy sesji.</p>
                        <Link href="/rezerwacja?source=blog&service=Sesja" className="inline-flex rounded-xl bg-amber-500 px-8 py-4 font-bold text-zinc-900 transition-colors hover:bg-amber-600">
                            Sprawdź terminy →
                        </Link>
                    </div>
                </footer>

                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
                />
            </article>
        </main>
    );
}
