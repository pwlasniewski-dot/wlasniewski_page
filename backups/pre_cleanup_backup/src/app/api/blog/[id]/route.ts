import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET single post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const postId = parseInt(id);

        if (isNaN(postId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const post = await prisma.blogPost.findUnique({
            where: { id: postId },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Serialize
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
    } catch (error) {
        console.error('GET post error:', error);
        return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
    }
}

// PUT (Update post)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const { id } = await params;
            const postId = parseInt(id);
            const body = await request.json();

            if (isNaN(postId)) {
                return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
            }

            const post = await prisma.blogPost.update({
                where: { id: postId },
                data: {
                    title: body.title,
                    slug: body.slug,
                    excerpt: body.excerpt,
                    content: body.content,
                    featured_image_id: body.featured_image_id,
                    status: body.is_published ? 'published' : 'draft',
                    published_at: body.is_published ? (body.published_at ? new Date(body.published_at) : new Date()) : null,
                    meta_title: body.meta_title,
                    meta_description: body.meta_description,
                    category: body.category,
                    tags: body.tags,
                    keywords: body.keywords,
                },
            });

            return NextResponse.json({ success: true, post });
        } catch (error) {
            console.error('Update post error:', error);
            return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
        }
    });
}

// DELETE post
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const { id } = await params;
            const postId = parseInt(id);

            if (isNaN(postId)) {
                return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
            }

            await prisma.blogPost.delete({
                where: { id: postId },
            });

            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('Delete post error:', error);
            return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
        }
    });
}
