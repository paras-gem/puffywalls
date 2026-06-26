'use client';



import { useEffect, useMemo, useState } from 'react';
import { X, Share2, Download, Copy, Mail, MessageCircle, Heart, Globe, Link, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
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
  const [orientation, setOrientation] = useState('original');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState(false);

  const imageUrl = wallpaper?.src?.large || wallpaper?.src?.original || wallpaper?.src?.medium || '';
  const title = wallpaper?.alt || 'Wallpaper';
  const photographer = wallpaper?.photographer || 'Unknown Artist';
  const wallpaperId = wallpaper?.id || 'unknown-wallpaper';

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
    try {
      const rawComments = window.localStorage.getItem(`puffywalls_comments_${wallpaperId}`) || '[]';
      setComments(JSON.parse(rawComments));
    } catch (error) {
      setComments([]);
    }
  }, [wallpaperId]);

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
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
    }
  };

  const handleDownload = () => {
    const filename = `${title.replace(/\s+/g, '-').toLowerCase() || 'wallpaper'}.jpg`;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommentSubmit = (event) => {
    event.preventDefault();
    const trimmedComment = commentText.trim();
    if (!trimmedComment) return;

    const nextComments = [
      {
        id: Date.now(),
        body: trimmedComment,
        createdAt: new Date().toISOString(),
      },
      ...comments,
    ];

    setComments(nextComments);
    window.localStorage.setItem(`puffywalls_comments_${wallpaperId}`, JSON.stringify(nextComments));
    setCommentText('');
  };

  const handleClearComments = () => {
    setCommentText('');
  };

  const toggleLike = () => {
    setLiked((prev) => !prev);
  };

  const openSocialShare = (platform) => {
    const shareText = `Check out this wallpaper by ${photographer}`;
    const shareUrl = imageUrl;
    const href = platform.href(shareUrl, shareText);
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  // --- Save to collection state & helpers ---
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [collectionNames, setCollectionNames] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');

  const loadCollections = () => {
    try {
      const raw = window.localStorage.getItem('user_collections');
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading collections', err);
    }
    const seed = { Favorites: [] };
    window.localStorage.setItem('user_collections', JSON.stringify(seed));
    return seed;
  };

  const openSavePanel = () => {
    const vault = loadCollections();
    setCollectionNames(Object.keys(vault));
    setShowSaveModal(true);
  };

  const closeSavePanel = () => {
    setShowSaveModal(false);
    setNewCollectionName('');
  };

  const saveToCollection = (name) => {
    if (!wallpaper) return;
    try {
      const vault = loadCollections();
      const coll = vault[name] || [];
      if (coll.some((it) => it.id === wallpaper.id)) {
        toast.error(`Already saved to ${name}`);
        closeSavePanel();
        return;
      }
      vault[name] = [...coll, wallpaper];
      window.localStorage.setItem('user_collections', JSON.stringify(vault));
      toast.success(`Saved to ${name}`);
      closeSavePanel();
    } catch (err) {
      console.error('Save failed', err);
      toast.error('Could not save wallpaper');
    }
  };

  const handleCreateAndSave = (e) => {
    e.preventDefault();
    const trimmed = newCollectionName.trim();
    if (!trimmed || !wallpaper) return;
    try {
      const vault = loadCollections();
      if (vault[trimmed]) {
        toast.error('A collection with this name already exists.');
        return;
      }
      vault[trimmed] = [wallpaper];
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
          <img className={`share-preview-img ${selectedImageClass}`} src={imageUrl} alt={title} />
        </div>

        <div className="share-header">
          <div className="share-title-group">
            <h2>{title}</h2>
            <p className="share-photographer">Photo by {photographer}</p>
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
          <button className="action-btn comments-active" type="button" onClick={() => document.getElementById('share-comment-input')?.focus()}>
            <MessageCircle size={18} /> Comment
          </button>
          <button className="action-btn" type="button" onClick={handleCopyLink}>
            <Copy size={18} /> Copy Link
          </button>
          <button className="action-btn download-btn" type="button" onClick={handleDownload}>
            <Download size={18} /> Download
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
            <Share2 size={18} /> Use Device Share
          </button>
        </div>

        {/* Save-to-collection panel (inside modal) */}
        {showSaveModal && (
          <div className="save-panel">
            <div className="save-panel-header">
              <h3>Save to Collection</h3>
              <button className="btn-close-save" onClick={() => closeSavePanel()}>Close</button>
            </div>

            <div className="save-choices">
              {collectionNames.length === 0 ? (
                <p className="save-empty">No collections found.</p>
              ) : (
                collectionNames.map((name) => (
                  <button key={name} className="collection-choice" onClick={() => saveToCollection(name)}>{name}</button>
                ))
              )}
            </div>

            <form className="save-create-form" onSubmit={handleCreateAndSave}>
              <input value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} placeholder="New collection name" maxLength={24} />
              <button type="submit" className="create-save-btn">Create & Save</button>
            </form>
          </div>
        )}

        <div className="comments-section">
          <p className="share-section-label">Community Comments</p>
          <form className="comments-form" onSubmit={handleCommentSubmit}>
            <textarea
              id="share-comment-input"
              className="comment-textarea"
              rows={4}
              placeholder="Share what you love about this wallpaper..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
            />
            <div className="comments-form-actions">
              <button type="button" className="comment-clear-btn" onClick={handleClearComments}>
                Clear
              </button>
              <button type="submit" className="comment-submit-btn">
                Post Comment
              </button>
            </div>
          </form>

          <div className="comments-scroll-box">
            {comments.length === 0 ? (
              <p className="comments-empty">No comments yet. Be the first to say something nice.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment-bubble">
                  <div className="comment-meta">
                    <span className="comment-user">Guest</span>
                    <span className="comment-time">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="comment-body-wrapper">
                    <p className="comment-payload">{comment.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
