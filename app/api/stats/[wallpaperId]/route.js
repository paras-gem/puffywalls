import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Favorite from '../../../../models/Favorite';
import Comment from '../../../../models/Comment';
import Engagement from '../../../../models/Engagement';

/**
 * @route   GET /api/stats/[wallpaperId]
 * @desc    Get aggregated stats for a wallpaper: Likes, Rating, Dislikes
 * @access  Public
 */
export async function GET(request, { params }) {
  try {
    const { wallpaperId } = await params;

    if (!wallpaperId) {
      return NextResponse.json({ error: 'wallpaperId is required' }, { status: 400 });
    }

    await dbConnect();

    // 1. Get Like count
    const likesCount = await Favorite.countDocuments({ wallpaperId });

    // 2. Get Average Rating from Comments
    // Only count comments that have a rating > 0, or just aggregate all ratings?
    // Let's aggregate all ratings greater than 0
    const ratingAggregation = await Comment.aggregate([
      { $match: { wallpaperId, rating: { $gt: 0 }, deleted: false } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } }
    ]);
    const averageRating = ratingAggregation.length > 0 ? Number(ratingAggregation[0].averageRating.toFixed(1)) : 0;
    const totalRatings = ratingAggregation.length > 0 ? ratingAggregation[0].totalRatings : 0;

    // 3. Get Dislike count from Engagement
    const dislikesCount = await Engagement.countDocuments({ 
      eventType: 'dislike',
      'metadata.wallpaperId': wallpaperId 
    });

    return NextResponse.json({
      likes: likesCount,
      dislikes: dislikesCount,
      rating: averageRating,
      totalRatings: totalRatings
    });
  } catch (error) {
    console.error('>>> Stats GET failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
