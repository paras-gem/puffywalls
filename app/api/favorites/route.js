import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Favorite from '../../../models/Favorite';

/**
 * @route   GET /api/favorites?userId=...&wallpaperId=...
 * @desc    Retrieve a user's favorites list or check if a specific wallpaper is favorited
 * @access  Public / Protected
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const wallpaperId = searchParams.get('wallpaperId');

    // Validation: userId is strictly required to locate user records
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Connect to database and verify active connection state
    const conn = await dbConnect();
    if (!conn) {
      return NextResponse.json(
        { error: 'Database is unavailable. Check MONGODB_URI and network access.' },
        { status: 503 }
      );
    }

    // Build query context dynamically based on incoming query strings
    const query = { userId };
    if (wallpaperId) query.wallpaperId = wallpaperId; // Filters down to a specific wallpaper entry if provided

    // Execute lookup sorted by most recently favorited items first
    const favorites = await Favorite.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(favorites);
  } catch (error) {
    console.error('>>> Favorites GET failed:', error);
    return NextResponse.json(
      { error: 'Unable to load favorites right now.', details: error.message },
      { status: 503 }
    );
  }
}

/**
 * @route   POST /api/favorites
 * @desc    Favorite a wallpaper for a specific user profile
 * @access  Public / Protected
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, wallpaperId, metadata = {} } = body;

    // Validation: Ensure entity linkage details exist
    if (!userId || !wallpaperId) {
      return NextResponse.json(
        { error: 'userId and wallpaperId are required' },
        { status: 400 }
      );
    }

    const conn = await dbConnect();
    if (!conn) {
      return NextResponse.json(
        { error: 'Database is unavailable. Check MONGODB_URI and network access.' },
        { status: 503 }
      );
    }

    // Check for duplicate records to avoid redundancy
    const existing = await Favorite.findOne({ userId, wallpaperId }).lean();
    if (existing) {
      return NextResponse.json({ error: 'Favorite already exists' }, { status: 409 });
    }

    // Create the favorite link schema document
    const favorite = await Favorite.create({
      userId,
      wallpaperId,
      metadata,
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('>>> Favorites POST failed:', error);
    return NextResponse.json(
      { error: 'Unable to save favorite right now.', details: error.message },
      { status: 503 }
    );
  }
}

/**
 * @route   DELETE /api/favorites?favoriteId=... OR /api/favorites?userId=...&wallpaperId=...
 * @desc    Unfavorite / delete a record either by unique Favorite ID or user-wallpaper combinations
 * @access  Public / Protected
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const favoriteId = searchParams.get('favoriteId');
    const userId = searchParams.get('userId');
    const wallpaperId = searchParams.get('wallpaperId');

    // Validation: Must have either the exact document id OR the compound reference keys
    if (!favoriteId && (!userId || !wallpaperId)) {
      return NextResponse.json(
        { error: 'favoriteId or userId+wallpaperId are required' },
        { status: 400 }
      );
    }

    const conn = await dbConnect();
    if (!conn) {
      return NextResponse.json(
        { error: 'Database is unavailable. Check MONGODB_URI and network access.' },
        { status: 503 }
      );
    }

    // Determine query context criteria dynamically
    const query = favoriteId ? { _id: favoriteId } : { userId, wallpaperId };
    const result = await Favorite.deleteOne(query);

    // If no row matches, return a 404 state response
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('>>> Favorites DELETE failed:', error);
    return NextResponse.json(
      { error: 'Unable to remove favorite right now.', details: error.message },
      { status: 503 }
    );
  }
}