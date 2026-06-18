import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        // extract parameters from the urls
        const {searchParams} = new URL(request.url);
        const page = searchParams.get('page') || 1;
        const perPage = searchParams.get('perPage') || 30;

        // this query if the user searched for something or clicked a category
        const query = searchParams.get("query");

        // decides which pexels endpoint to hit based on whether we have a query
        let pexelsUrl= `https://api.pexels.com/v1/curated?page=${page}&per_page=${perPage}`;
        
        // if there is a query use the search endpoint
        if(query){
            pexelsUrl = `https://api.pexels.com/v1/search?query=${query}&page=${page}&per_page=${perPage}`;
        }

        // fetch the photos from pexels securely
        const response = await fetch(pexelsUrl, {
            headers:{
                Authorization: process.env.PEXELS_API_KEY,
            },
        });
        
        // handle errors
        if(!response.ok){
            throw new Error(`Pexels API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // return formatted json back to the frontend
        return NextResponse.json(data);

    } catch (error) {
        console.log("Error fetching wallpapers:", error);
        return NextResponse.json({ error: "Failed to fetch wallpapers" }, { status: 500 });
    }
}
