import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET all service types
export async function GET(request: NextRequest) {
    try {
        const serviceTypes = await prisma.serviceType.findMany({
            include: {
                packages: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { order: 'asc' }
        });

        return NextResponse.json({ success: true, serviceTypes });
    } catch (error) {
        console.error('Failed to fetch service types:', error);
        return NextResponse.json({ error: 'Failed to fetch service types' }, { status: 500 });
    }
}

// POST - Create or update service type
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const {
                id,
                name,
                icon,
                description,
                order,
                is_active
            } = body;

            if (!name) {
                return NextResponse.json(
                    { error: 'Name is required' },
                    { status: 400 }
                );
            }

            if (id) {
                // Update
                const serviceType = await prisma.serviceType.update({
                    where: { id: parseInt(id) },
                    data: {
                        name,
                        icon,
                        description,
                        order: order ?? 0,
                        is_active: is_active !== undefined ? is_active : true
                    },
                    include: {
                        packages: { orderBy: { order: 'asc' } }
                    }
                });
                return NextResponse.json({ success: true, serviceType });
            } else {
                // Create
                const serviceType = await prisma.serviceType.create({
                    data: {
                        name,
                        icon,
                        description,
                        order: order ?? 0,
                        is_active: is_active !== undefined ? is_active : true
                    },
                    include: {
                        packages: { orderBy: { order: 'asc' } }
                    }
                });
                return NextResponse.json({ success: true, serviceType });
            }
        } catch (error) {
            console.error('Error updating service type:', error);
            return NextResponse.json({ error: 'Failed to save service type' }, { status: 500 });
        }
    });
}

// DELETE service type
export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req) => {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Service type ID is required' }, { status: 400 });
        }

        try {
            await prisma.serviceType.delete({
                where: { id: parseInt(id) }
            });
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('Error deleting service type:', error);
            return NextResponse.json({ error: 'Failed to delete service type' }, { status: 500 });
        }
    });
}
