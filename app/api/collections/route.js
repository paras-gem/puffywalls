import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Collection from '../../../models/Collection';

/**
 * @route   GET /api/collections?ownerId=...
 * @desc    Fetch all collections owned by a specific user, sorted by newest first
 * @access  Public / Protected
 */
export async function GET(request) {
  try {
    // Parse the query parameters from the request URL
    const url = new URL(request.url);
    const ownerId = url.searchParams.get('ownerId');

    // Validation: ownerId query parameter must be present
    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId is required' }, { status: 400 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Query for collections matching ownerId, sorted by creation date descending
    const collections = await Collection.find({ ownerId }).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json(collections);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

/**
 * @route   POST /api/collections
 * @desc    Create a new unique collection for a specific user
 * @access  Public / Protected
 */
export async function POST(request) {
  try {
    // Parse the incoming JSON payload from the request body
    const body = await request.json();
    const { ownerId, name, description, isPublic, wallpapers } = body;

    // Validation: Ensure mandatory fields are provided
    if (!ownerId || !name) {
      return NextResponse.json({ error: 'ownerId and name are required' }, { status: 400 });
    }

    await dbConnect();

    // Check if the user already has a collection with the exact same name
    const existing = await Collection.findOne({ ownerId, name }).lean();
    if (existing) {
      return NextResponse.json({ error: 'Collection already exists with this name for this user' }, { status: 409 });
    }

    // Instantiate and save the new collection into the database
    const collection = await Collection.create({
      ownerId,
      name,
      description: description || '',
      isPublic: Boolean(isPublic),
      wallpapers: Array.isArray(wallpapers) ? wallpapers : [],
    });

    // Return the newly created document with a 201 Created status
    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create collection', details: error.message }, { status: 400 });
  }
}

/**
 * @route   DELETE /api/collections?collectionId=...&ownerId=...
 * @desc    Permanently delete a specific collection using its query string ID
 * @access  Protected - User must own the collection
 */
export async function DELETE(request) {
  try {
    // Parse the query parameters from the request URL
    const url = new URL(request.url);
    const collectionId = url.searchParams.get('collectionId');
    const ownerId = url.searchParams.get('ownerId');

    // Validation: collectionId query parameter must be present
    if (!collectionId) {
      return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
    }

    // Validation: ownerId query parameter must be present for ownership verification
    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId is required for deletion' }, { status: 400 });
    }

    await dbConnect();

    // Fetch the collection first to verify ownership
    const collection = await Collection.findById(collectionId).lean();
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Verify ownership before allowing deletion
    if (collection.ownerId !== ownerId) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this collection' }, { status: 403 });
    }

    // Attempt to locate and remove the collection document
    const deletedCollection = await Collection.findByIdAndDelete(collectionId);

    if (!deletedCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Collection successfully deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Deletion failed', details: error.message }, { status: 500 });
  }
}