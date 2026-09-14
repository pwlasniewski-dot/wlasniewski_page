import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const scope = new URL(request.url).searchParams.get('scope') || 'client';
    if (scope !== 'client' && scope !== 'admin') {
        return NextResponse.json({ error: 'Nieprawidłowa sesja.' }, { status: 400 });
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set(scope === 'admin' ? 'admin_token' : 'client_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
    });
    return response;
}
