import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET all posts or single post by slug/id
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');
        const id = searchParams.get('id');

        // Fetch single post
        if (slug || id) {
            const post = await prisma.blogPost.findFirst({
                where: slug ? { slug } : { id: parseInt(id!) },
                include: {
                    featured_image: true
                }
            });

            if (!post) {
                return NextResponse.json({ error: 'Post not found' }, { status: 404 });
            }

            const serializedPost = {
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: post.content,
                cover_image: post.featured_image?.file_path || null,
                featured_image_id: post.featured_image_id,
                author_id: post.author_id,
                category: post.category,
                tags: post.tags,
                keywords: post.keywords,
                status: post.status,
                is_published: post.status === 'published',
                published_at: post.published_at?.toISOString() || null,
                meta_title: post.meta_title,
                meta_description: post.meta_description,
                created_at: post.created_at.toISOString(),
                updated_at: post.updated_at.toISOString(),
            };

            return NextResponse.json({ success: true, post: serializedPost });
        }

        // Fetch all posts
        const posts = await prisma.blogPost.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                featured_image: true
            }
        });

        // Serialize dates
        const serializedPosts = posts.map(post => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            cover_image: post.featured_image?.file_path || null,
            featured_image_id: post.featured_image_id,
            author_id: post.author_id,
            category: post.category,
            tags: post.tags,
            keywords: post.keywords,
            status: post.status,
            is_published: post.status === 'published',
            published_at: post.published_at?.toISOString() || null,
            meta_title: post.meta_title,
            meta_description: post.meta_description,
            created_at: post.created_at.toISOString(),
            updated_at: post.updated_at.toISOString(),
        }));

        return NextResponse.json({ success: true, posts: serializedPosts });
    } catch (error) {
        console.error('GET posts error:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

// CREATE new post
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();

            // Basic validation
            if (!body.title || !body.slug) {
                return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
            }

            const post = await prisma.blogPost.create({
                data: {
                    title: body.title,
                    slug: body.slug,
                    excerpt: body.excerpt || '',
                    content: body.content || '',
                    featured_image_id: body.featured_image_id || null,
                    status: body.is_published ? 'published' : 'draft',
                    published_at: body.is_published ? new Date() : null,
                    meta_title: body.meta_title || body.title,
                    meta_description: body.meta_description || body.excerpt || '',
                    author_id: req.user?.id,
                },
            });

            // Serialize response
            const serializedPost = {
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: post.content,
                featured_image_id: post.featured_image_id,
                author_id: post.author_id,
                category: post.category,
                tags: post.tags,
                keywords: post.keywords,
                status: post.status,
                published_at: post.published_at?.toISOString() || null,
                meta_title: post.meta_title,
                meta_description: post.meta_description,
                created_at: post.created_at.toISOString(),
                updated_at: post.updated_at.toISOString(),
            };

            return NextResponse.json({ success: true, post: serializedPost });
        } catch (error: any) {
            console.error('Create post error:', error);
            return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
        }
    });
}

// UPDATE existing post
export async function PUT(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();

            if (!body.id) {
                return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
            }

            const post = await prisma.blogPost.update({
                where: { id: parseInt(body.id) },
                data: {
                    title: body.title,
                    slug: body.slug,
                    excerpt: body.excerpt || '',
                    content: body.content || '',
                    category: body.category || null,
                    featured_image_id: body.featured_image_id || null,
                    status: body.is_published ? 'published' : 'draft',
                    published_at: body.is_published ? (body.published_at ? new Date(body.published_at) : new Date()) : null,
                    meta_title: body.meta_title || body.title,
                    meta_description: body.meta_description || body.excerpt || '',
                },
            });

            return NextResponse.json({ success: true, post });
        } catch (error: any) {
            console.error('Update post error:', error);
            return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
        }
    });
}

// DELETE post
export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get('id');

            if (!id) {
                return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
            }

            await prisma.blogPost.delete({
                where: { id: parseInt(id) }
            });

            return NextResponse.json({ success: true });
        } catch (error: any) {
            console.error('Delete post error:', error);
            return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
        }
    });
}
