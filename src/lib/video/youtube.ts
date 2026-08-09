export function youtubeVideoId(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
        const url = new URL(value);
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        let id = '';
        if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
        if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
            if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
            else id = url.pathname.match(/^\/(?:embed|shorts)\/([^/?#]+)/)?.[1] || '';
        }
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    } catch {
        return null;
    }
}

export function youtubeNoCookieEmbedUrl(value: string | null | undefined): string | null {
    const id = youtubeVideoId(value);
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}
