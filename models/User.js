import { Schema, models, model } from 'mongoose';

// Defines the blueprint for a User document in the database
const UserSchema = new Schema(
  {
    // The auth service being used (e.g., 'firebase', 'google', 'github')
    provider: { type: String, default: 'firebase' },
    
    // The unique identification string provided by the auth service. 
    // 'index: true' makes searching for users by this ID incredibly fast.
    providerId: { type: String, index: true },
    
    // The user's email address. 'lowercase' forces it to lowercase, 'trim' removes accidental spaces.
    email: { type: String, required: true, lowercase: true, trim: true },
    
    // The user's chosen public name
    displayName: { type: String, default: '' },
    
    // Link to the user's avatar image
    photoURL: { type: String, default: '' },
    
    // Access control level (e.g., 'user', 'moderator', 'admin') to secure backend routes
    role: { type: String, default: 'user' },
    
    // Flexible object field for storing arbitrary user settings or data variations
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    // Automatically tracks when the user signed up and when their profile last changed
    timestamps: true,
  }
);

/**
 * User model schema for MongoDB.
 * Stores authentication identity metadata and optional application profile fields.
 */
const User = models.User || model('User', UserSchema);
export default User;