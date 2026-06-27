import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Engagement from '../../../models/Engagement';

/**
 * @route   POST /api/engagement
 * @desc    Log user analytics and engagement events (clicks, views, downloads, etc.)
 * @access  Public / Protected
 */
export async function POST(request) {
  try {
    // Parse the incoming JSON payload from the request body
    const body = await request.json();
    const { userId, eventType, metadata, source } = body;

    // Validation: Ensure mandatory identity and event data are provided
    if (!userId || !eventType) {
      return NextResponse.json(
        { error: 'userId and eventType are required' },
        { status: 400 }
      );
    }

    // Debugging assistance: Log the connection URI to verify environment setup
    console.log(">>> URI being used:", process.env.MONGODB_URI);

    // Establish connection to MongoDB
    await dbConnect();

    // Store the tracked engagement metric inside the database
    const engagement = await Engagement.create({
      userId,
      eventType,
      metadata: metadata || {},       // Default to empty object if no extra metadata is supplied
      source: source || 'web',        // Default to 'web' client if source isn't specified
    });

    // Return the successfully created event record with a 201 Created status
    return NextResponse.json(engagement, { status: 201 });

  } catch (err) {
    // Error Logging: Catch configuration errors, network dropouts, or validation schema issues
    console.error(">>> FULL ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}