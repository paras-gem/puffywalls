import { Schema, models, model } from 'mongoose';

// Defines the blueprint for an analytics event log entry
const EngagementSchema = new Schema(
  {
    // The ID of the user performing the action. Indexed to review user history trails.
    userId: { type: String, required: true, index: true },
    
    // The type of action taken (e.g., 'download', 'wallpaper_share', 'view'). Whitespace is trimmed.
    eventType: { type: String, required: true, trim: true },
    
    // Flexible object field to store dynamic contextual data (e.g., resolution downloaded)
    metadata: { type: Schema.Types.Mixed, default: {} },
    
    // Where the event originated from (e.g., 'web', 'ios_app', 'android_app')
    source: { type: String, default: 'web' },
  },
  {
    // Timestamps dictate exactly when the action took place
    timestamps: true,
  }
);

/**
 * Engagement model schema for MongoDB.
 * Stores user actions and events for analytics and activity tracking.
 */
const Engagement = models.Engagement || model('Engagement', EngagementSchema);
export default Engagement;