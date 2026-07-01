import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Collection from '../../../../models/Collection';

/**
 * @route   GET /api/collections/[id]
 * @desc    Retrieve a single collection by its unique MongoDB ID
 * @access  Protected - User must own the collection
 */
export async function GET(request, { params }) {
  try {
    // In Next.js 15+, dynamic route params are a Promise and must be awaited
    const { id } = await params;

    // Extract ownerId from query parameters for ownership verification
    const url = new URL(request.url);
    const ownerId = url.searchParams.get('ownerId');

    // Establish a connection to the MongoDB database
    await dbConnect();

    // Query the database for the collection and return a plain JavaScript object via .lean()
    const collection = await Collection.findById(id).lean();

    // If no document is found, return a 404 response
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Verify ownership: if ownerId is provided, ensure it matches
    if (ownerId && collection.ownerId !== ownerId) {
      return NextResponse.json({ error: 'Unauthorized access to this collection' }, { status: 403 });
    }

    // Return the found document as JSON with a default 200 status
    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

/**
 * @route   PUT /api/collections/[id]
 * @desc    Update an existing collection's details by its ID
 * @access  Protected - User must own the collection
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    // Parse the incoming JSON payload from the request body
    const body = await request.json();
    const { ownerId } = body;

    // Validate ownership
    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId is required for updates' }, { status: 400 });
    }

    await dbConnect();

    // Fetch the collection first to verify ownership
    const existingCollection = await Collection.findById(id).lean();
    if (!existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Verify ownership before allowing update
    if (existingCollection.ownerId !== ownerId) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this collection' }, { status: 403 });
    }

    // Find and update the collection. 
    // { new: true } returns the modified document rather than the original.
    // { runValidators: true } ensures the payload adheres to the Mongoose Schema rules.
    const collection = await Collection.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();

    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 400 });
  }
}

/**
 * @route   DELETE /api/collections/[id]
 * @desc    Permanently delete a collection by its ID
 * @access  Protected - User must own the collection
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Extract ownerId from query parameters for ownership verification
    const url = new URL(request.url);
    const ownerId = url.searchParams.get('ownerId');

    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId is required for deletion' }, { status: 400 });
    }

    await dbConnect();

    // Fetch the collection first to verify ownership
    const existingCollection = await Collection.findById(id).lean();
    if (!existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Verify ownership before allowing deletion
    if (existingCollection.ownerId !== ownerId) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this collection' }, { status: 403 });
    }

    // Delete the document matching the given ID
    const deletedCollection = await Collection.findByIdAndDelete(id);

    // Return a success state upon removal
    return NextResponse.json({ success: true, message: 'Collection successfully deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Deletion failed', details: error.message }, { status: 500 });
  }
}