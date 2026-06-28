'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { X, Share2, Download, Copy, Mail, MessageCircle, Heart, Globe, Link, FolderPlus, ImageOff, ThumbsDown, Flag, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { fetchComments, postComment, fetchFavorites, postFavorite, deleteFavorite, fetchUserCollections, createCollection, updateCollection, logEngagement, fetchWallpaperStats, postFeedback } from '@/lib/api';
import './ShareModal.css';

const socialPlatforms = [
  {
    label: 'Twitter',
    icon: Link,
    href: (url, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    label: 'Facebook',
    icon: Globe,
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    label: 'Email',
    icon: Mail,
    href: (url, text) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
  },
];

export default function ShareModal({ wallpaper, onClose, isClosing }) {
  const { user } = useAuth();

  const [orientation, setOrientation] = useState('original');
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  
  // Global stats state
  const [stats, setStats] = useState({ likes: 0, dislikes: 0, rating: 0, totalRatings: 0 });

  // Save to collection panel tracking
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [collectionNames, setCollectionNames] = useState([]);
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');

  const normalizedWallpaper = wallpaper?.metadata || wallpaper;
  const imageUrl = normalizedWallpaper?.src?.large2x || normalizedWallpaper?.src?.large || normalizedWallpaper?.src?.original || normalizedWallpaper?.src?.medium || normalizedWallpaper?.url || '';
  const title = normalizedWallpaper?.alt || 'Wallpaper';
  const photographer = normalizedWallpaper?.photographer || 'Unknown Artist';
  const wallpaperId = normalizedWallpaper?.id ? String(normalizedWallpaper.id) : normalizedWallpaper?.wallpaperId ? String(normalizedWallpaper.wallpaperId) : '';
  const canPreview = Boolean(imageUrl);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (!wallpaperId) return;

    const loadData = async () => {
      try {
        const [serverComments, serverStats] = await Promise.all([
          fetchComments(wallpaperId),
          fetchWallpaperStats(wallpaperId)
        ]);
        if (Array.isArray(serverComments)) {
          setComments(serverComments);
        }
        if (serverStats) {
          setStats(serverStats);
        }
      } catch (error) {
        console.warn('Unable to load data from server.', error);
      }
    };

    loadData();
  }, [wallpaperId]);

  useEffect(() => {
    if (!user || !wallpaperId) return;

    const loadFavoriteStatus = async () => {
      try {
        const favoriteRecords = await fetchFavorites({ userId: user.uid, wallpaperId });
        if (Array.isArray(favoriteRecords) && favoriteRecords.length > 0) {
          setLiked(true);
          setFavoriteId(favoriteRecords[0]._id);
        } else {
          setLiked(false);
          setFavoriteId(null);
        }
      } catch (error) {
        console.error('Unable to load favorite status:', error);
      }
    };

    loadFavoriteStatus();
  }, [user, wallpaperId]);

  const selectedImageClass = useMemo(() => {
    return orientation === 'portrait' ? 'portrait' : orientation === 'landscape' ? 'landscape' : 'original';
  }, [orientation]);

  const handleNativeShare = async () => {
    if (!navigator.share) return;

    try {
      await navigator.share({
        title,
        text: `Check out this wallpaper by ${photographer}`,
        url: imageUrl,
      });
    } catch (error) {
      console.error('Native share failed:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) {
      toast.error('No downloadable image is available for this wallpaper.');
      return;
    }

    const filename = `${title.replace(/\s+/g, '-').toLowerCase() || 'wallpaper'}.jpg`;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    const trimmedComment = commentText.trim();
    if (!trimmedComment) return;

    try {
      const postedComment = await postComment({
        wallpaperId,
        userId: user?.uid || null,
        authorName: user?.displayName || 'Guest',
        text: trimmedComment,
        rating: rating,
      });

      setComments((prev) => [postedComment, ...prev]);
      setCommentText('');
      setRating(0);
      toast.success('Comment posted successfully!');
      
      // Refresh stats to include new rating
      const updatedStats = await fetchWallpaperStats(wallpaperId);
      setStats(updatedStats);
    } catch (error) {
      console.error('Comment submit failed:', error);
      toast.error('Unable to post your comment right now.');
    }
  };

  const toggleLike = async () => {
    if (!wallpaperId) return;

    if (!user) {
      setLiked((prev) => !prev);
      toast.success('Toggled locally. Sign in to sync your likes permanently.');
      return;
    }

    if (liked && favoriteId) {
      try {
        await deleteFavorite({ favoriteId, userId: user.uid, wallpaperId });
        setLiked(false);
        setFavoriteId(null);
        setStats(prev => ({ ...prev, likes: Math.max(0, prev.likes - 1) }));
        toast.success('Removed from favorites.');
      } catch (error) {
        console.error('Failed to remove favorite:', error);
        toast.error('Could not remove favorite.');
      }
      return;
    }

    try {
      const favorite = await postFavorite({ userId: user.uid, wallpaperId, metadata: normalizedWallpaper });
      setLiked(true);
      setFavoriteId(favorite._id);
      setStats(prev => ({ ...prev, likes: prev.likes + 1 }));
      toast.success('Added to favorites.');
    } catch (error) {
      console.error('Failed to favorite wallpaper:', error);
      toast.error('Could not add to favorites.');
    }
  };

  const handleDislike = async () => {
    if (!wallpaperId) return;
    if (!user) {
      toast.error('Please sign in to dislike.');
      return;
    }
    
    try {
      await logEngagement({ userId: user.uid, eventType: 'dislike', metadata: { wallpaperId } });
      setStats(prev => ({ ...prev, dislikes: prev.dislikes + 1 }));
      toast.success('Feedback recorded.');
    } catch (error) {
      console.error('Failed to dislike:', error);
      toast.error('Could not record feedback.');
    }
  };

  const handleReport = async () => {
    if (!wallpaperId) return;
    
    try {
      await postFeedback({ 
        userId: user?.uid || null, 
        email: user?.email || '', 
        category: 'report', 
        message: `Reported wallpaper ID: ${wallpaperId}` 
      });
      toast.success('Wallpaper reported. Our team will review it.');
    } catch (error) {
      console.error('Failed to report:', error);
      toast.error('Could not submit report.');
    }
  };

  const openSocialShare = (platform) => {
    const shareText = `Check out this wallpaper by ${photographer}`;
    const shareUrl = imageUrl;
    const href = platform.href(shareUrl, shareText);
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const loadCollections = useCallback(async () => {
    if (user) {
      try {
        const data = await fetchUserCollections(user.uid);
        if (Array.isArray(data)) {
          setCollections(data);
          setCollectionNames(data.map((collection) => collection.name));
          return data;
        }
      } catch (error) {
        console.error('Error loading collections from server', error);
        toast.error('Unable to load your collections.');
      }
    }

    try {
      const raw = window.localStorage.getItem('user_collections');
      if (raw) {
        const parsed = JSON.parse(raw);
        const arrayCollections = Object.entries(parsed).map(([name, wallpapers]) => ({
          _id: name,
          name,
          wallpapers,
          isLocal: true,
        }));
        setCollections(arrayCollections);
        setCollectionNames(arrayCollections.map((collection) => collection.name));
        return arrayCollections;
      }
    } catch (err) {
      console.error('Error reading collections', err);
    }

    const seed = [{ _id: 'Favorites', name: 'Favorites', wallpapers: [], isLocal: true }];
    window.localStorage.setItem('user_collections', JSON.stringify({ Favorites: [] }));
    setCollections(seed);
    setCollectionNames(['Favorites']);
    return seed;
  }, [user]);

  const openSavePanel = async () => {
    const vault = await loadCollections();
    setCollectionNames(vault.map((collection) => collection.name));
    setShowSaveModal(true);
  };

  const closeSavePanel = () => {
    setShowSaveModal(false);
    setNewCollectionName('');
  };

  const saveToCollection = async (name) => {
    if (!normalizedWallpaper || !wallpaperId) return;

    const currentCollections = collections.length ? collections : await loadCollections();
    const targetCollection = currentCollections.find((collection) => collection.name === name);

    if (!targetCollection) {
      toast.error('Collection not found');
      closeSavePanel();
      return;
    }

    const alreadySaved = targetCollection.wallpapers?.some((item) => String(item.wallpaperId || item.id) === wallpaperId);
    if (alreadySaved) {
      toast.error(`Already saved to ${name}`);
      closeSavePanel();
      return;
    }

    if (user && !targetCollection.isLocal) {
      try {
        const updatedWallpapers = [
          ...(targetCollection.wallpapers || []),
          {
            wallpaperId,
            addedAt: new Date().toISOString(),
            metadata: normalizedWallpaper,
          },
        ];
        await updateCollection(targetCollection._id, { wallpapers: updatedWallpapers });
        logEngagement({ userId: user.uid, eventType: 'save_wallpaper', metadata: { wallpaperId, collectionName: name } });
        const refreshed = await fetchUserCollections(user.uid);
        setCollections(refreshed);
        setCollectionNames(refreshed.map((collection) => collection.name));
        toast.success(`Saved to ${name}`);
      } catch (err) {
        console.error('Save failed', err);
        toast.error('Could not save wallpaper');
      }
      closeSavePanel();
      return;
    }

    try {
      const raw = window.localStorage.getItem('user_collections');
      const vault = raw ? JSON.parse(raw) : {};
      const coll = vault[name] || [];
      vault[name] = [...coll, normalizedWallpaper];
      window.localStorage.setItem('user_collections', JSON.stringify(vault));
      toast.success(`Saved to ${name}`);
    } catch (err) {
      console.error('Save failed', err);
      toast.error('Could not save wallpaper');
    }

    closeSavePanel();
  };

  const handleCreateAndSave = async (e) => {
    e.preventDefault();
    const trimmed = newCollectionName.trim();
    if (!trimmed || !normalizedWallpaper || !wallpaperId) return;

    if (collections.some((collection) => collection.name === trimmed)) {
      toast.error('A collection with this name already exists.');
      return;
    }

    if (user) {
      try {
        const created = await createCollection({
          ownerId: user.uid,
          name: trimmed,
          wallpapers: [
            {
              wallpaperId,
              addedAt: new Date().toISOString(),
              metadata: normalizedWallpaper,
            },
          ],
        });
        logEngagement({ userId: user.uid, eventType: 'create_collection_and_save', metadata: { wallpaperId, collectionName: trimmed } });
        setCollections((prev) => [created, ...prev]);
        setCollectionNames((prev) => [created.name, ...prev]);
        setNewCollectionName('');
        setShowSaveModal(false);
        toast.success(`Created ${trimmed} and saved wallpaper.`);
      } catch (err) {
        console.error('Create collection failed', err);
        toast.error('Could not create collection');
      }
      return;
    }

    try {
      const raw = window.localStorage.getItem('user_collections');
      const vault = raw ? JSON.parse(raw) : {};
      if (vault[trimmed]) {
        toast.error('A collection with this name already exists.');
        return;
      }
      vault[trimmed] = [normalizedWallpaper];
      window.localStorage.setItem('user_collections', JSON.stringify(vault));
      setCollectionNames(Object.keys(vault));
      setNewCollectionName('');
      setShowSaveModal(false);
      toast.success(`Created ${trimmed} and saved wallpaper.`);
    } catch (err) {
      console.error(err);
      toast.error('Could not create collection');
    }
  };

  if (!wallpaper) return null;

  return (
    <div className={`share-backdrop ${isClosing ? 'closing' : ''}`} onClick={onClose}>
      <div className={`share-modal ${isClosing ? 'closing' : ''}`} onClick={(event) => event.stopPropagation()}>
        <button className="share-close-btn" onClick={onClose} aria-label="Close share modal">
          <X size={18} />
        </button>

        <div className="share-preview-area">
          {canPreview ? (
            <div className={`share-preview-frame ${selectedImageClass}`}>
              <Image
                className="share-preview-img"
                src={imageUrl}
                alt={title}
                fill
                sizes="(max-width: 768px) 92vw, 680px"
                style={{ objectFit: orientation === 'landscape' ? 'cover' : 'contain' }}
              />
            </div>
          ) : (
            <div className="share-preview-empty">
              <ImageOff size={34} />
              <span>Preview unavailable</span>
            </div>
          )}
        </div>

        <div className="share-header">
          <div className="share-title-group">
            <h2>{title}</h2>
            <p className="share-photographer">Photo by {photographer}</p>
            <div className="share-global-stats" style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.85rem', color: '#a1a1aa' }}>
              <span title="Total Likes" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Heart size={14} color="#ff4757" /> {stats.likes}
              </span>
              <span title="Average Rating" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={14} color="#eab308" /> {stats.rating} ({stats.totalRatings})
              </span>
              <span title="Total Dislikes" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ThumbsDown size={14} color="#6b7280" /> {stats.dislikes}
              </span>
            </div>
          </div>
        </div>

        <div className="share-orientation-selector">
          <p className="share-section-label">Orientation</p>
          <div className="orientation-options">
            {['portrait', 'landscape', 'original'].map((option) => (
              <button
                key={option}
                type="button"
                className={`orientation-btn ${orientation === option ? 'active' : ''}`}
                onClick={() => setOrientation(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="share-actions-grid">
          <button className={`action-btn ${liked ? 'liked-active' : ''}`} type="button" onClick={toggleLike}>
            <Heart size={18} /> {liked ? 'Liked' : 'Like'}
          </button>
          <button className="action-btn" type="button" onClick={() => openSavePanel()}>
            <FolderPlus size={16} /> Save
          </button>
          <button className="action-btn" type="button" onClick={handleCopyLink}>
            <Copy size={18} /> Copy Link
          </button>
          <button className="action-btn download-btn" type="button" onClick={handleDownload}>
            <Download size={18} /> Download
          </button>
          
          <button className="action-btn" type="button" onClick={handleDislike}>
            <ThumbsDown size={18} /> Dislike
          </button>
          <button className="action-btn report-btn" type="button" onClick={handleReport} style={{ color: '#ef4444' }}>
            <Flag size={18} /> Report
          </button>
        </div>

        <div className="share-platforms-grid">
          {socialPlatforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <button key={platform.label} type="button" className="share-native-btn" onClick={() => openSocialShare(platform)}>
                <Icon size={18} /> Share to {platform.label}
              </button>
            );
          })}
          <button type="button" className="share-native-btn" onClick={handleNativeShare}>
            <Share2 size={18} /> Share via System
          </button>
        </div>

        <div className="share-comments-section">
          <p className="share-section-label">Comments ({comments.length})</p>
          <form className="comment-form" onSubmit={handleCommentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="comment-input-wrapper">
              <input
                id="share-comment-input"
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              {commentText && (
                <button type="button" className="clear-comment" onClick={() => setCommentText('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="rating-selector" style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    type="button" 
                    onClick={() => setRating(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Star size={18} color={star <= rating ? "#eab308" : "#4b5563"} fill={star <= rating ? "#eab308" : "none"} />
                  </button>
                ))}
              </div>
              <button type="submit" className="post-comment-btn" disabled={!commentText.trim()}>
                Post
              </button>
            </div>
          </form>

          <div className="comments-list">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment._id} className="comment-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="comment-author">{comment.authorName}</div>
                    {comment.rating > 0 && (
                      <div className="comment-rating" style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#eab308', fontSize: '0.8rem' }}>
                        <Star size={12} fill="#eab308" /> {comment.rating}
                      </div>
                    )}
                  </div>
                  <div className="comment-text">{comment.text}</div>
                  <div className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</div>
                </div>
              ))
            ) : (
              <div className="no-comments">No comments yet. Be the first to share your thoughts!</div>
            )}
          </div>
        </div>

        {showSaveModal && (
          <div className="save-collection-overlay" onClick={closeSavePanel}>
            <div className="save-collection-panel" onClick={(e) => e.stopPropagation()}>
              <div className="panel-header">
                <h3>Save to Collection</h3>
                <button className="panel-close" onClick={closeSavePanel}>
                  <X size={18} />
                </button>
              </div>

              <div className="collection-list">
                {collectionNames.map((name) => (
                  <button key={name} className="collection-item" onClick={() => saveToCollection(name)}>
                    <FolderPlus size={16} /> {name}
                  </button>
                ))}
              </div>

              <form className="create-collection-form" onSubmit={handleCreateAndSave}>
                <input
                  type="text"
                  placeholder="New collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  maxLength={24}
                  required
                />
                <button type="submit" className="create-btn">
                  Create & Save
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
