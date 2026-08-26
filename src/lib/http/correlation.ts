import { NextResponse } from 'next/server';

export function jsonWithCorrelation(
    body: unknown,
    correlationId: string,
    status = 200,
): NextResponse {
    return NextResponse.json(body, {
        status,
        headers: { 'X-Correlation-ID': correlationId },
    });
}
