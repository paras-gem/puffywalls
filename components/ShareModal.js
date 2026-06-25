'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
    X, Copy, Check, Download, 
    MessageCircle, Star, 
    ThumbsDown, FolderPlus, Smartphone, Heart, Trash2, Send, XCircle,
    Flag // 1. Added missing icon import
} from 'lucide-react';
import './ShareModal.css';

// The ShareModal component is a modal dialog used for sharing wallpapers.  

export default function ShareModal({ wallpaper, onClose, isClosing }) {
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [orientation, setOrientation] = useState('original'); 

    // Dynamic Interaction States — no fallback counts, starts at 0
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    
    const [isDisliked, setIsDisliked] = useState(false);
    const [dislikeCount, setDislikeCount] = useState(0);

    const [userRating, setUserRating] = useState(0);
    const [showRatingSelector, setShowRatingSelector] = useState(false);

    // Comments State
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [commentsList, setCommentsList] = useState([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && wallpaper) {
            const url = new URL(`${window.location.origin}/wallpapers/${wallpaper.id}`);
            if (orientation !== 'original') {
                url.searchParams.set('orientation', orientation);
            }
            setShareUrl(url.toString());
        }
    }, [wallpaper, orientation]);

    // handling copy logic
    const handleCopy = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };  

    // activating the native windows share sheet
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: wallpaper?.alt || 'PuffyWalls Wallpaper',
                    text: `Check out this awesome wallpaper by ${wallpaper?.photographer || 'PuffyWalls'}!`,
                    url: shareUrl
                });
                toast.success('Shared successfully!');
            } catch (err) {
                console.error('Error sharing', err);
            }
        }
    };

    // Interaction Handlers
    const handleLikeToggle = () => {
        if (isLiked) {
            setLikeCount(prev => prev - 1);
        } else {
            setLikeCount(prev => prev + 1);
            if (isDisliked) {
                setIsDisliked(false);
                setDislikeCount(prev => Math.max(0, prev - 1));
            }
        }
        setIsLiked(!isLiked);
        toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites! ❤️');
    };

    const handleDislikeToggle = () => {
        if (isDisliked) {
            setDislikeCount(prev => prev - 1);
        } else {
            setDislikeCount(prev => prev + 1);
            if (isLiked) {
                setIsLiked(false);
                setLikeCount(prev => Math.max(0, prev - 1));
            }
        }
        setIsDisliked(!isDisliked);
        toast.success(isDisliked ? 'Dislike removed' : 'Feedback noted. We will adjust your feed.');
    };

    // handling the rating system 
    const handleSelectRating = (score) => {
        setUserRating(score);
        setShowRatingSelector(false);
        toast.success(`Rated ${score} stars! Thanks for your input.`);
    };

    // handling the comment section with clearing and deleting comments
    const handleAddComment = (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        const newComment = {
            id: Date.now(),
            text: commentText.trim(),
            user: "You",
            time: "Just now"
        };

        setCommentsList([newComment, ...commentsList]);
        setCommentText('');
        toast.success('Comment published! ✨');
    };

    const handleClearComment = () => {
        setCommentText('');
    };

    const handleDeleteComment = (id) => {
        setCommentsList(prev => prev.filter(item => item.id !== id));
        toast.error('Comment deleted.');
    };

    // 2. Fixed Function Scope: Placed triggerReport at the top level of the component
    const triggerReport = () => {
        toast.loading("Reporting this wallpaper...");
        setTimeout(() => {
            toast.dismiss();
            toast.success("Wallpaper reported successfully!");
        }, 2000);
    };

    // the download logic
    const triggerDownload = async () => {
        try {
            toast.loading("Preparing high-res download payload...");
            const targetUrl = getPreviewUrl();
            const response = await fetch(targetUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `puffywalls-${wallpaper.id}-${orientation}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.dismiss();
            toast.success("Download initialized successfully! 🚀");
        } catch (err) {
            toast.dismiss();
            toast.error("Download route restriction failure.");
        }
    };

    // the preview window handling using if condition 
    const getPreviewUrl = () => {
        if (!wallpaper?.src) return '';
        if (orientation === 'portrait') return wallpaper.src.portrait;
        if (orientation === 'landscape') return wallpaper.src.landscape;
        return wallpaper.src.original || wallpaper.src.large;
    };

    if (!wallpaper) return null;

    return (
        <div className={`share-backdrop ${isClosing ? 'closing' : ''}`} onClick={onClose}>
            <div className={`share-modal ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
                <button className="share-close-btn" onClick={onClose}><X size={20} /></button>
                
                {/* Preview Image — large enough to show orientation transitions */}
                <div className="share-preview-area">
                    <img
                        src={getPreviewUrl()}
                        alt="Wallpaper preview"
                        className={`share-preview-img ${orientation}`}
                    />
                </div>

                <div className="share-header">
                    <div className="share-title-group">
                        <h2>Share Wallpaper</h2>
                        <p className="share-photographer">📸 By {wallpaper.photographer || 'Unknown'}</p>
                    </div>
                </div>

                {/* Orientation Selector with a ternary operator */}
                <div className="share-orientation-selector">
                    <div className="share-section-label">Orientation Options</div>
                    <div className="orientation-options">
                        <button className={`orientation-btn ${orientation === 'portrait' ? 'active' : ''}`} onClick={() => setOrientation('portrait')}>Portrait</button>
                        <button className={`orientation-btn ${orientation === 'landscape' ? 'active' : ''}`} onClick={() => setOrientation('landscape')}>Landscape</button>
                        <button className={`orientation-btn ${orientation === 'original' ? 'active' : ''}`} onClick={() => setOrientation('original')}>Original</button>
                    </div>
                </div>

                {/* Actions Grid */}
                <div className="share-section-label">Actions</div>
                <div className="share-actions-grid">
                    <button className={`action-btn ${isLiked ? 'liked-active' : ''}`} onClick={handleLikeToggle}>
                        <Heart size={18} fill={isLiked ? "#f43f5e" : "none"} />
                        Like{likeCount > 0 ? ` (${likeCount})` : ''}
                    </button>

                    <button className="action-btn download-btn" onClick={triggerDownload}>
                        <Download size={18} /> Download
                    </button>
                    
                    <button className="action-btn" onClick={() => toast.success('Saved to collections!')}>
                        <FolderPlus size={18} /> Save Board
                    </button>

                    <button className={`action-btn ${showComments ? 'comments-active' : ''}`} onClick={() => setShowComments(!showComments)}>
                        <MessageCircle size={18} />
                        Comments{commentsList.length > 0 ? ` (${commentsList.length})` : ''}
                    </button>

                    <div style={{ position: 'relative' }}>
                        <button className={`action-btn ${userRating > 0 ? 'rated-active' : ''}`} onClick={() => setShowRatingSelector(!showRatingSelector)}>
                            <Star size={18} fill={userRating > 0 ? "#eab308" : "none"} />
                            {userRating > 0 ? `Rated: ${userRating}/5` : 'Rate'}
                        </button>
                        {showRatingSelector && (
                            <div className="rating-popup-drawer">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <Star key={num} size={24} className="interactive-star" onClick={() => handleSelectRating(num)} fill={num <= userRating ? "#eab308" : "none"} />
                                ))}
                            </div>
                        )}
                    </div>

                    <button className={`action-btn danger ${isDisliked ? 'danger-active' : ''}`} onClick={handleDislikeToggle}>
                        <ThumbsDown size={18} />
                        Dislike{dislikeCount > 0 ? ` (${dislikeCount})` : ''}
                    </button>
                </div>

                {/* 3. Fixed Button Syntax: Passing the correct function directly to onClick */}
                <button className="report-btn" onClick={triggerReport}>
                    <Flag size={18} /> Report
                </button>

                {/* Expanded Comments Section */}
                {showComments && (
                    <div className="modal-comments-drawer">
                        <div className="share-section-label">Community Board</div>

                        <form onSubmit={handleAddComment} className="comments-form">
                            <textarea
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="comment-textarea"
                                rows={4}
                            />
                            <div className="comments-form-actions">
                                <button
                                    type="button"
                                    className="comment-clear-btn"
                                    onClick={handleClearComment}
                                    disabled={!commentText.trim()}
                                >
                                    <XCircle size={16} /> Clear
                                </button>
                                <button
                                    type="submit"
                                    className="comment-submit-btn"
                                    disabled={!commentText.trim()}
                                >
                                    <Send size={16} /> Submit
                                </button>
                            </div>
                        </form>

                        <div className="comments-scroll-box">
                            {commentsList.length === 0 && (
                                <p className="comments-empty">No comments yet. Be the first!</p>
                            )}
                            {commentsList.map(comment => (
                                <div key={comment.id} className="comment-bubble">
                                    <div className="comment-meta">
                                        <span className="comment-user">@{comment.user}</span>
                                        <span className="comment-time">{comment.time}</span>
                                    </div>
                                    <div className="comment-body-wrapper">
                                        <p className="comment-payload">{comment.text}</p>
                                        <button className="delete-comment-trigger" onClick={() => handleDeleteComment(comment.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="share-divider"></div>

                <div className="share-section-label">Share via</div>
                {typeof navigator !== 'undefined' && navigator.share && (
                    <button className="share-native-btn" onClick={handleNativeShare}>
                        <Smartphone size={18} /> Share to Native Apps...
                    </button>
                )}
                
                <div className="share-platforms-grid">
                    <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="share-platform-btn" onClick={() => toast.success('Redirecting to WhatsApp...')}>
                        <svg className="platform-svg whatsapp" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                        WhatsApp
                    </a>
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="share-platform-btn" onClick={() => toast.success('Redirecting to Twitter...')}>
                        <svg className="platform-svg twitter" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Twitter
                    </a>
                </div>

                <div className="share-divider"></div>

                <div className="share-section-label">Copy Link</div>
                <div className="share-copy-row">
                    <input type="text" readOnly value={shareUrl} className="share-url-input" />
                    <button className={`share-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                        {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
                    </button>
                </div>
            </div>
        </div>
    );
}