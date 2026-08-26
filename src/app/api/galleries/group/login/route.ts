import { NextResponse } from 'next/server';

/**
 * Legacy name + identifier login was knowledge-based authentication and could
 * expose another parent's selections. It is intentionally retired.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Logowanie identyfikatorem zostało zastąpione bezpiecznym, jednorazowym linkiem wysyłanym na email.',
      code: 'MAGIC_LINK_REQUIRED',
    },
    { status: 410 },
  );
}
