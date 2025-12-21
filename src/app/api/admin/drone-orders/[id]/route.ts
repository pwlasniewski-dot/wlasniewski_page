import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// PATCH single drone order (update status)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { status } = await req.json();
        
        const order = await prisma.droneOrder.update({
            where: { id: parseInt(id) },
            data: { status, updated_at: new Date() }
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Error updating drone order:', error);
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        );
    }
}

// DELETE single drone order
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.droneOrder.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting drone order:', error);
        return NextResponse.json(
            { error: 'Failed to delete order' },
            { status: 500 }
        );
    }
}
