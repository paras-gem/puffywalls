import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Comment from '../../../../models/Comment';

/**
 * @route   GET /api/comments/[wallpaperId]?includeDeleted=false
 * @desc    Fetch comments for a specific wallpaper, option to filter out soft-deleted items
 * @access  Public
 */
export async function GET(request, { params }) {
  try {
    // In Next.js 15+, dynamic route parameters are asynchronous and must be awaited
    const { wallpaperId } = await params;

    // Parse the query parameters from the request URL
    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

    // Establish database connection
    await dbConnect();

    // Construct the database query filter
    const query = { wallpaperId };
    if (!includeDeleted) {
      query.deleted = false; // Only fetch active comments unless explicitly requested otherwise
    }

    // Retrieve comments matching the wallpaperId, sorted by newest first
    const comments = await Comment.find(query).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

/**
 * @route   POST /api/comments/[wallpaperId]
 * @desc    Post a new comment/rating to a specific wallpaper
 * @access  Public (Guest) / Protected (Logged-in user)
 */
export async function POST(request, { params }) {
  try {
    const { wallpaperId } = await params;
    
    // Parse the incoming request payload body
    const body = await request.json();
    const { userId, authorName, text, rating } = body;

    // Validation: Ensure comment text exists
    if (!text) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    await dbConnect();

    // Create and save the new comment to the database
    const comment = await Comment.create({
      wallpaperId,
      userId: userId || null,              // Fallback to null if it's an anonymous/guest post
      authorName: authorName || 'Guest',    // Default display name if none is provided
      text,
      rating: typeof rating === 'number' ? rating : 0, // Enforce a number or fallback to 0
    });

    // Return the newly created comment object with a 201 Created status
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to post comment', details: error.message }, { status: 400 });
  }
}