import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Feedback from '../../../models/Feedback';

/**
 * @route   GET /api/feedback?userId=...
 * @desc    Retrieve submitted feedback records (optionally filtered by a specific user)
 * @access  Admin (or restricted to current user depending on auth)
 */
export async function GET(request) {
  try {
    // Parse the query parameters from the request URL
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    // Connect to the database
    await dbConnect();

    // If a userId is provided, filter records by it; otherwise, fetch all feedback
    const query = userId ? { userId } : {};

    // Retrieve feedback records from the database, sorted from newest to oldest
    const feedback = await Feedback.find(query).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json(feedback);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

/**
 * @route   POST /api/feedback
 * @desc    Submit a new user feedback, issue report, or feature request
 * @access  Public (Guest) / Protected (Logged-in user)
 */
export async function POST(request) {
  try {
    // Parse the incoming JSON request body payload
    const body = await request.json();
    const { userId, email, category, message } = body;

    // Validation: The feedback message itself is strictly required
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    await dbConnect();

    // Instantiate and save the new feedback document to the collection
    const feedback = await Feedback.create({
      userId: userId || null,             // Fallback to null if submitted by an unauthenticated guest
      email: email || '',                 // Optional contact information
      category: category || 'general',   // Defaults to 'general' (e.g., 'bug', 'feature', 'general')
      message,
    });

    // Return the newly created record with a 201 Created status
    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit feedback', details: error.message }, { status: 400 });
  }
}