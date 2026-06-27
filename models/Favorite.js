import { Schema, models, model } from 'mongoose';

// Defines the blueprint for tracking user-favorited wallpapers
const FavoriteSchema = new Schema(
  {
    // Links to the User who liked the wallpaper. Indexed for quick 'My Favorites' queries.
    userId: { type: String, required: true, index: true },
    
    // Links to the specific Wallpaper that was liked. Indexed to find total favorites per image.
    wallpaperId: { type: String, required: true, index: true },
    
    // Flexible field for additional situational data (e.g., device used to favorite)
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    // Captures the precise moment a user hits the "Favorite" button
    timestamps: true,
  }
);

/**
 * Favorite model schema for MongoDB.
 * Stores wallpapers that a user has favorited or saved explicitly.
 */
const Favorite = models.Favorite || model('Favorite', FavoriteSchema);
export default Favorite;