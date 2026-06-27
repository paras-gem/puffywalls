import { Schema, models, model } from 'mongoose';

// Defines the blueprint for a Wallpaper document in the database
const WallpaperSchema = new Schema(
  {
    // The unique ID assigned by the external provider (e.g., Pexels API). Prevents duplicates.
    sourceId: { type: String, required: true, unique: true },
    
    // Alternative text description used for image accessibility (SEO/Screen readers)
    alt: { type: String, default: '' },
    
    // Name of the person who took the photo
    photographer: { type: String, default: 'Unknown' },
    
    // URL linking back to the original source page of the image
    url: { type: String, default: '' },
    
    // Nested object storing URLs for various image dimensions and crop formats
    src: {
      original: { type: String, default: '' },
      large: { type: String, default: '' },
      medium: { type: String, default: '' },
      portrait: { type: String, default: '' },
      tiny: { type: String, default: '' },
    },
    
    // Dimensions of the original image in pixels
    width: { type: Number },
    height: { type: Number },
    
    // Array of descriptive keywords used for categorizing and searching wallpapers
    tags: { type: [String], default: [] },
    
    // A flexible "catch-all" object field to store any extra data without updating the schema
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    // Automatically creates 'createdAt' and 'updatedAt' timestamp fields for every entry
    timestamps: true,
  }
);

/**
 * Wallpaper model schema for MongoDB.
 * Stores canonical wallpaper metadata synchronized from the Pexels API or user-saved assets.
 */
const Wallpaper = models.Wallpaper || model('Wallpaper', WallpaperSchema);
export default Wallpaper;