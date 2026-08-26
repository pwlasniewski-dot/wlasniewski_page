import { NextRequest } from 'next/server';
import { handleClientLogin } from '@/lib/auth/client-login';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    return handleClientLogin(request, 'client-legacy');
}
