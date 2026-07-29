import Image from 'next/image';
import Link from 'next/link';
import prisma from '@/lib/db/prisma';

export const revalidate = 3600;

export default async function BlogIndex() {
    const posts = await prisma.blogPost.findMany({
        where: {
            status: 'published',
            published_at: { lte: new Date() },
        },
        orderBy: { published_at: 'desc' },
        select: {
            title: true,
            slug: true,
            excerpt: true,
            published_at: true,
            category: true,
            featured_image: { select: { file_path: true, alt_text: true } },
        },
    });

    return (
        <main className="min-h-screen bg-zinc-950">
            <div className="mx-auto max-w-6xl px-4 py-20">
                <header className="mb-16 text-center">
                    <h1 className="mb-4 font-display text-4xl font-extrabold text-white md:text-6xl">
                        Porady przed sesją i historie z realizacji
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-zinc-300">
                        Konkretne wskazówki dla rodzin i par oraz historie ze zdjęć wykonanych w Toruniu, Płużnicy i okolicach.
                    </p>
                </header>

                {posts.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400">Wkrótce pojawią się tu nowe artykuły.</div>
                ) : (
                    <div className="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {posts.map(post => (
                            <Link
                                key={post.slug}
                                href={`/blog/${encodeURIComponent(post.slug)}`}
                                className="group overflow-hidden rounded-2xl border border-zinc-700 bg-white/5 transition-all duration-300 hover:border-amber-500 hover:bg-white/10"
                            >
                                <div className="relative aspect-video overflow-hidden bg-zinc-900">
                                    {post.featured_image?.file_path ? (
                                        <Image
                                            src={post.featured_image.file_path}
                                            alt={post.featured_image.alt_text || post.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-60" />
                                    <span className="absolute bottom-4 left-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-zinc-900">
                                        {post.category || 'Blog'}
                                    </span>
                                </div>
                                <div className="p-6">
                                    {post.published_at && (
                                        <time dateTime={post.published_at.toISOString()} className="text-sm text-zinc-500">
                                            {post.published_at.toLocaleDateString('pl-PL')}
                                        </time>
                                    )}
                                    <h2 className="mb-3 mt-2 text-xl font-bold text-white transition-colors group-hover:text-amber-400">
                                        {post.title}
                                    </h2>
                                    <p className="line-clamp-2 text-sm text-zinc-400">{post.excerpt}</p>
                                    <span className="mt-4 inline-flex text-sm font-semibold text-amber-400">Czytaj więcej →</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="rounded-2xl border border-zinc-700 bg-white/5 p-8 text-center">
                    <p className="mb-4 text-zinc-400">Chcesz zobaczyć ceny i dostępne terminy?</p>
                    <Link href="/rezerwacja?source=blog&service=Sesja" className="inline-flex rounded-xl bg-amber-500 px-6 py-3 font-bold text-zinc-900 transition-colors hover:bg-amber-600">
                        Sprawdź pakiety i wolne terminy
                    </Link>
                </div>
            </div>
        </main>
    );
}
