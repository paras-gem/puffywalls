'use client';

import { useState } from 'react';
import './trending.css';
// Fixed component names to start with capital letters (React requirement)
import { Heart, Download, Plus, Flame, MessageCircle, Share } from 'lucide-react';
import { useShareModal } from '../../lib/ShareModalContext';

// Dummy wallpapers array (You can later replace this with API fetching logic like in Explore/Home)
const wallpapers = [
    {
        id: 'dummy-1',
        url: 'https://images.pexels.com/photos/161154/stained-glass-spiral-circle-pattern-161154.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Trending Abstract',
        photographer: 'Pexels User',
        src: {
            large: 'https://images.pexels.com/photos/161154/stained-glass-spiral-circle-pattern-161154.jpeg?auto=compress&cs=tinysrgb&w=800',
            original: 'https://images.pexels.com/photos/161154/stained-glass-spiral-circle-pattern-161154.jpeg'
        }
    }
];

export default function Trending() {
    // We use a Set to keep track of which wallpapers the user has 'liked'.
    // A Set is fast and efficient for checking existence (e.g., likedIds.has(id)).
    const [likedIds, setLikedIds] = useState(new Set());

    // Hook from our custom ShareModalContext to globally trigger the share modal overlay
    const { openModal } = useShareModal();

    // Toggles the 'liked' state of a wallpaper by its ID.
    // If it's already liked, we remove it from the Set; otherwise, we add it.
    const toggleLike = (id) => {
        setLikedIds(prev => {
            const newLiked = new Set(prev);
            if (newLiked.has(id)) {
                newLiked.delete(id);
            } else {
                newLiked.add(id);
            }
            return newLiked;
        });
    };

    return (
        <div>
            <div>
                <div className="trendingWallpaperCards">
                    {wallpapers.slice(0, 6).map((wallpaper, index) => {
                        // Check if this specific wallpaper is currently liked
                        // We use index as fallback if id doesn't exist in dummy data
                        const currentId = wallpaper.id || index;
                        const isLiked = likedIds.has(currentId);

                        return (
                            <div 
                                key={currentId} 
                                className="wallpaperCard"
                                // Clicking anywhere on the card opens the Share modal globally
                                onClick={() => openModal(wallpaper)}
                                style={{ cursor: 'pointer' }}
                            >
                                <img src={wallpaper.src?.large || wallpaper.url} alt={wallpaper.alt} />

                                <div className="cardIcons">
                                    {/* LIKE BUTTON */}
                                    <button 
                                        title="Like" 
                                        onClick={(e) => {
                                            // Stop propagation to prevent the card click event (which opens the share modal) from firing
                                            e.stopPropagation();
                                            toggleLike(currentId);
                                        }}
                                    >
                                        <Heart 
                                            // Fill the heart with red if liked, otherwise keep it transparent
                                            fill={isLiked ? "#ff4757" : "transparent"} 
                                            color={isLiked ? "#ff4757" : "currentColor"}
                                        />
                                    </button>
                                    
                                    {/* DOWNLOAD BUTTON */}
                                    <button 
                                        title="Download"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Download />
                                    </button>
                                    
                                    {/* ADD/SAVE BUTTON */}
                                    <button 
                                        title="Add to collection"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Plus />
                                    </button>
                                    
                                    {/* FLAME BUTTON */}
                                    <button 
                                        title="Trending"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Flame />
                                    </button>
                                    
                                    {/* COMMENT BUTTON */}
                                    <button 
                                        title="Comment"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MessageCircle />
                                    </button>
                                    
                                    {/* SHARE BUTTON */}
                                    <button 
                                        title="Share" 
                                        onClick={(e) => {
                                            // Stop propagation so we don't trigger the card's onClick twice
                                            e.stopPropagation();
                                            openModal(wallpaper);
                                        }}
                                    >
                                        <Share />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
