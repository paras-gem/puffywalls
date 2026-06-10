import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const id = params.id;
  return NextResponse.json({ message: `Wallpaper API endpoint for id: ${id}` });
}
