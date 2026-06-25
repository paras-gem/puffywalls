import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        // ── 1. PARSE QUERY PARAMS FROM THE INCOMING REQUEST URL ────────────────
        const { searchParams } = new URL(request.url);
        const page    = searchParams.get('page')     || 1;
        const perPage = searchParams.get('per_page') || 30;

        // The category or search term typed/clicked by the user
        const query = searchParams.get('query');

        // ── 2. BUILD A WALLPAPER-SAFE SEARCH QUERY ─────────────────────────────
        // Appending "wallpaper background" forces Pexels to return full-screen
        // images instead of random unrelated photos (e.g. "Nature" alone might
        // return macro flower shots, not suitable desktop backgrounds).
        let searchQuery = query && query !== 'All'
            ? `${query} wallpaper background`
            : 'aesthetic beautiful wallpaper';

        // URL-encode spaces and special characters so the URL is valid
        const encodedQuery = encodeURIComponent(searchQuery);

        // ── 3. CALL PEXELS SEARCH API ──────────────────────────────────────────
        const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodedQuery}&page=${page}&per_page=${perPage}`;

        const response = await fetch(pexelsUrl, {
            headers: {
                // Authorization header is added HERE on the server — never sent to the browser
                Authorization: process.env.PEXELS_API_KEY,
            },
        });

        // ── 4. HANDLE PEXELS ERRORS ────────────────────────────────────────────
        if (!response.ok) {
            throw new Error(`Pexels API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // ── 5. RETURN PEXELS DATA TO THE FRONTEND ─────────────────────────────
        // The frontend receives the same shape as the Pexels API response.
        // Components access: data.photos[n].src.large / .original / .portrait
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching wallpapers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch wallpapers' },
            { status: 500 }
        );
    }
}
