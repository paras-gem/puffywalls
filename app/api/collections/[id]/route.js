import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Collection from '../../../../models/Collection';

/**
 * @route   GET /api/collections/[id]
 * @desc    Retrieve a single collection by its unique MongoDB ID
 * @access  Public (or protected depending on your auth setup)
 */
export async function GET(request, { params }) {
  try {
    // In Next.js 15+, dynamic route params are a Promise and must be awaited
    const { id } = await params;

    // Establish a connection to the MongoDB database
    await dbConnect();

    // Query the database for the collection and return a plain JavaScript object via .lean()
    const collection = await Collection.findById(id).lean();

    // If no document is found, return a 404 response
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
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
 * @access  Public
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    // Parse the incoming JSON payload from the request body
    const body = await request.json();

    await dbConnect();

    // Find and update the collection. 
    // { new: true } returns the modified document rather than the original.
    // { runValidators: true } ensures the payload adheres to the Mongoose Schema rules.
    const collection = await Collection.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 400 });
  }
}

/**
 * @route   DELETE /api/collections/[id]
 * @desc    Permanently delete a collection by its ID
 * @access  Public
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await dbConnect();

    // Delete the document matching the given ID
    const deletedCollection = await Collection.findByIdAndDelete(id);

    if (!deletedCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Return a success state upon removal
    return NextResponse.json({ success: true, message: 'Collection successfully deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Deletion failed', details: error.message }, { status: 500 });
  }
}