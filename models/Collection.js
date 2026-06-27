import { Schema, models, model } from 'mongoose';

// Defines the blueprint for a user-created Wallpaper album/folder
const CollectionSchema = new Schema(
  {
    // Links to the User who owns this folder. Indexed for fast 'My Collections' lookups.
    ownerId: { type: String, required: true, index: true },
    
    // The public name of the collection (e.g., 'Neon Aesthetics', 'Nature Minimalist'). Whitespace is trimmed.
    name: { type: String, required: true, trim: true },
    
    // A brief description summarizing the theme of the collection
    description: { type: String, default: '' },
    
    // Privacy flag. If true, other users can look up and view this collection.
    isPublic: { type: Boolean, default: false },
    
    // Array of objects representing the wallpapers stored inside this collection
    wallpapers: {
      type: [
        {
          // The ID of the wallpaper added to this collection
          wallpaperId: { type: String, required: true },
          
          // Timestamp recording when this specific image was added to the list
          addedAt: { type: Date, default: () => new Date() },
          
          // Flexible field for position settings or custom captions inside the folder
          metadata: { type: Schema.Types.Mixed, default: {} },
        },
      ],
      default: [], // Starts off as an empty folder
    },
  },
  {
    // Timestamps record when the folder was created and when its settings last changed
    timestamps: true,
  }
);

// Compound Unique Index: Ensures a single user cannot make two collections with the exact same name.
CollectionSchema.index({ ownerId: 1, name: 1 }, { unique: true });

/**
 * Collection model schema for MongoDB.
 * Represents a user folder/collection of saved wallpapers.
 */
const Collection = models.Collection || model('Collection', CollectionSchema);
export default Collection;