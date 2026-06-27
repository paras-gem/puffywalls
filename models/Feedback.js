import { Schema, models, model } from 'mongoose';

// Defines the blueprint for a Feedback submission
const FeedbackSchema = new Schema(
  {
    // The ID of the user submitting feedback (if logged in). Can be null for guests.
    userId: { type: String, default: null },
    
    // Email address of the submitter (useful for getting back to guests)
    email: { type: String, default: '' },
    
    // The classification of feedback (e.g., 'bug', 'feature_request', 'general')
    category: { type: String, default: 'general' },
    
    // The main body text written by the user
    message: { type: String, required: true },
    
    // Administrative lifecycle state. 'enum' restricts entries strictly to these 3 options:
    status: { type: String, default: 'open', enum: ['open', 'resolved', 'archived'] },
    
    // Private text area for staff/admins to log internal follow-up notes
    adminNotes: { type: String, default: '' },
    
    // Flexible field for extra technical context (like browser version, screen size, etc.)
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    // Automatically logs when the feedback was created or updated
    timestamps: true,
  }
);

/**
 * Feedback model schema for MongoDB.
 * Stores user-submitted feedback, feature requests, and bug reports.
 */
const Feedback = models.Feedback || model('Feedback', FeedbackSchema);
export default Feedback;