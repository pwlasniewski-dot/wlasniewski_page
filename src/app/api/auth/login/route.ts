import { NextRequest } from 'next/server';
import { handleClientLogin } from '@/lib/auth/client-login';

export async function POST(req: NextRequest) {
    return handleClientLogin(req, 'primary');
}
