import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

// GET /api/users?userId=xxx or ?email=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json({ error: 'userId or email is required' }, { status: 400 });
    }

    await dbConnect();

    const query = userId ? { providerId: userId } : { email: email.toLowerCase() };
    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    console.error('>>> GET /api/users error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/users - create or update user
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, email, displayName, photoURL, provider, metadata } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email are required' }, { status: 400 });
    }

    await dbConnect();

    // Upsert — update if exists, create if not
    const user = await User.findOneAndUpdate(
      { providerId: userId },
      {
        providerId: userId,
        email: email.toLowerCase(),
        displayName: displayName || '',
        photoURL: photoURL || '',
        provider: provider || 'firebase',
        metadata: metadata || {},
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error('>>> POST /api/users error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}