import { Schema, models, model } from 'mongoose';

// Defines the blueprint for user-generated feedback and ratings on a wallpaper
const CommentSchema = new Schema(
  {
    // Links this comment directly to a specific wallpaper. Indexed for fast comment section loading.
    wallpaperId: { type: String, required: true, index: true },
    
    // Links to the User who wrote it. Set to null if your app allows anonymous guest comments.
    userId: { type: String, default: null },
    
    // Display name used for the comment author (fallback if userId is null)
    authorName: { type: String, default: 'Guest' },
    
    // The actual text content of the comment
    text: { type: String, required: true },
    
    // A numerical review score. Enforced to stay between 0 and 5 stars.
    rating: { type: Number, min: 0, max: 5, default: 0 },
    
    // Soft deletion flag. Instead of destroying the database row, we toggle this to 'true' 
    // to hide it visually while keeping logs intact.
    deleted: { type: Boolean, default: false },
  },
  {
    // Timestamps handle comment sorting (e.g., "Show most recent comments first")
    timestamps: true,
  }
);

/**
 * Comment model schema for MongoDB.
 * Stores wallpaper-specific comments and ratings.
 */
const Comment = models.Comment || model('Comment', CommentSchema);
export default Comment;