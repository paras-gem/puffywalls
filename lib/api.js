// The prefix appended to any error messages thrown by these functions
const API_ERROR_PREFIX = 'API request failed:';

/**
 * Core Helper: Parses the raw network response into JSON and checks for HTTP errors.
 * @param {Response} response - The raw Response object from the fetch API
 */
async function parseJson(response) {
  // Read the raw body text from the response
  const text = await response.text();
  let json;

  try {
    // If there is text content, convert it from a JSON string into a JavaScript object
    json = text ? JSON.parse(text) : null;
  } catch (error) {
    // If the backend sent unparseable junk (like an HTML crash page), throw an error
    throw new Error(`${API_ERROR_PREFIX} Unable to parse response body`);
  }

  // Check if the HTTP status code is NOT in the 200-299 range (meaning something went wrong)
  if (!response.ok) {
    // Try to extract a specific error message from the JSON backend payload, 
    // fall back to standard text (e.g., "Not Found"), or default to 'Unknown error'
    const message = json?.error || response.statusText || 'Unknown error';
    throw new Error(`${API_ERROR_PREFIX} ${message}`);
  }

  // If everything went smoothly, return the parsed data object
  return json;
}

/**
 * Core Helper: Wraps the standard 'fetch' method to inject default JSON headers 
 * and automatically pass the response through our error handler (parseJson).
 */
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json', // Signals to the server that we are sending JSON data
    },
    ...options, // Spreads extra configurations like method (POST/PUT/DELETE) and body payloads
  });
  return parseJson(response);
}

/* ==========================================================================
   COLLECTION API METHODS
   ========================================================================== */

/**
 * Retrieves all custom wallpaper collections belonging to a specific user.
 * Sends a GET request to: /api/collections?ownerId=XYZ
 */
export async function fetchUserCollections(ownerId) {
  if (!ownerId) {
    throw new Error('ownerId is required to fetch collections');
  }

  // encodeURIComponent safely handles spaces/special characters in the user ID string
  return apiFetch(`/api/collections?ownerId=${encodeURIComponent(ownerId)}`);
}

/**
 * Submits a payload to create a brand new user collection folder.
 * Sends a POST request to: /api/collections
 */
export async function createCollection({ ownerId, name, description = '', isPublic = false, wallpapers = [] }) {
  if (!ownerId || !name) {
    throw new Error('ownerId and name are required to create a collection');
  }

  return apiFetch('/api/collections', {
    method: 'POST',
    body: JSON.stringify({ ownerId, name, description, isPublic, wallpapers }),
  });
}

/**
 * Modifies an existing collection (e.g., changing its name, description, or privacy).
 * Sends a PUT request to: /api/collections/COLLECTION_ID
 */
export async function updateCollection(collectionId, payload) {
  if (!collectionId) {
    throw new Error('collectionId is required to update a collection');
  }

  return apiFetch(`/api/collections/${encodeURIComponent(collectionId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes a user collection entirely from the system.
 * Sends a DELETE request to: /api/collections/COLLECTION_ID
 */
export async function deleteCollection(collectionId) {
  if (!collectionId) {
    throw new Error('collectionId is required to delete a collection');
  }

  return apiFetch(`/api/collections/${encodeURIComponent(collectionId)}`, {
    method: 'DELETE',
  });
}

/**
 * Fetches the specific contents and configurations of a single collection.
 * Sends a GET request to: /api/collections/COLLECTION_ID
 */
export async function fetchCollectionById(collectionId) {
  if (!collectionId) {
    throw new Error('collectionId is required to fetch a collection');
  }

  return apiFetch(`/api/collections/${encodeURIComponent(collectionId)}`);
}

/**
 * Convenience method to insert a wallpaper object into a collection's list.
 * Sends a PUT request to: /api/collections/COLLECTION_ID
 */
export async function addWallpaperToCollection({ collectionId, wallpaper }) {
  if (!collectionId || !wallpaper) {
    throw new Error('collectionId and wallpaper are required to add wallpaper');
  }

  return apiFetch(`/api/collections/${encodeURIComponent(collectionId)}`, {
    method: 'PUT',
    // Backend logic interprets this payload to push this image into the array
    body: JSON.stringify({ wallpapers: wallpaper }),
  });
}

/* ==========================================================================
   FAVORITES API METHODS
   ========================================================================== */

/**
 * Fetches liked wallpapers for a user. Can optional check if a specific wallpaper is favorited.
 * Sends a GET request to: /api/favorites?userId=XYZ(&wallpaperId=ABC)
 */
export async function fetchFavorites({ userId, wallpaperId } = {}) {
  if (!userId) {
    throw new Error('userId is required to fetch favorites');
  }

  // URLSearchParams effortlessly formats query strings (e.g., ?userId=123&wallpaperId=456)
  const params = new URLSearchParams({ userId });
  if (wallpaperId) params.set('wallpaperId', wallpaperId);

  return apiFetch(`/api/favorites?${params.toString()}`);
}

/**
 * Saves a wallpaper to a user's absolute favorites list.
 * Sends a POST request to: /api/favorites
 */
export async function postFavorite({ userId, wallpaperId, metadata = {} }) {
  if (!userId || !wallpaperId) {
    throw new Error('userId and wallpaperId are required to post a favorite');
  }

  return apiFetch('/api/favorites', {
    method: 'POST',
    body: JSON.stringify({ userId, wallpaperId, metadata }),
  });
}

/**
 * Removes a wallpaper from a user's favorites list using either a row ID or user+wallpaper combo.
 * Sends a DELETE request to: /api/favorites?favoriteId=XYZ
 */
export async function deleteFavorite({ favoriteId, userId, wallpaperId } = {}) {
  if (!favoriteId && (!userId || !wallpaperId)) {
    throw new Error('favoriteId or userId+wallpaperId is required to delete a favorite');
  }

  const params = new URLSearchParams();
  if (favoriteId) params.set('favoriteId', favoriteId);
  if (userId) params.set('userId', userId);
  if (wallpaperId) params.set('wallpaperId', wallpaperId);

  return apiFetch(`/api/favorites?${params.toString()}`, {
    method: 'DELETE',
  });
}

/* ==========================================================================
   COMMENTS & COMMUNITY API METHODS
   ========================================================================== */

/**
 * Retrieves the public comment thread and review ratings for a single wallpaper image.
 * Sends a GET request to: /api/comments/WALLPAPER_ID
 */
export async function fetchComments(wallpaperId) {
  if (!wallpaperId) {
    return []; // Return empty array safely if no ID is passed down
  }

  return apiFetch(`/api/comments/${encodeURIComponent(wallpaperId)}`);
}

/**
 * Submits a new text comment and star rating attached to an image asset.
 * Sends a POST request to: /api/comments/WALLPAPER_ID
 */
export async function postComment({ wallpaperId, userId, authorName, text, rating = 0 }) {
  if (!wallpaperId || !text) {
    throw new Error('wallpaperId and text are required to post a comment');
  }

  return apiFetch(`/api/comments/${encodeURIComponent(wallpaperId)}`, {
    method: 'POST',
    body: JSON.stringify({ userId, authorName, text, rating }),
  });
}

/* ==========================================================================
   FEEDBACK & ANALYTICS API METHODS
   ========================================================================== */

/**
 * Sends bug reports, site suggestions, or customer tickets over to administrators.
 * Sends a POST request to: /api/feedback
 */
export async function postFeedback({ userId, email = '', category = 'general', message }) {
  if (!message) {
    throw new Error('message is required to submit feedback');
  }

  return apiFetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ userId, email, category, message }),
  });
}

/**
 * Records user interaction metrics (e.g., track image clicks, shared assets, downloads).
 * Sends a POST request to: /api/engagement
 */
export async function logEngagement({ userId, eventType, metadata = {} }) {
  if (!userId || !eventType) {
    throw new Error('userId and eventType are required to log engagement');
  }

  return apiFetch('/api/engagement', {
    method: 'POST',
    body: JSON.stringify({ userId, eventType, metadata }),
  });
}
export async function fetchWallpaperStats(wallpaperId) {
  if (!wallpaperId) return { likes: 0, dislikes: 0, rating: 0, totalRatings: 0 };
  return apiFetch(`/api/stats/${encodeURIComponent(wallpaperId)}`);
}
