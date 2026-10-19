// Share concurrent reads only: no stale payment or promotion settings survive
// a completed request, and each consumer gets its own readable response body.
let pending: Promise<Response> | null = null;

export async function fetchPublicSettings(options: { signal?: AbortSignal } = {}): Promise<Response> {
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!pending) {
        pending = fetch('/api/settings/public', { cache: 'no-store' })
            .finally(() => { pending = null; });
    }
    const response = await pending;
    // Cancelling one component must not abort the request for other consumers.
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    return response.clone();
}
