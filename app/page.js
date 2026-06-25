'use client';

import { useEffect, useState } from "react";
import { Download, FolderPlus, Heart, Share } from "lucide-react";
import { useShareModal } from "../lib/ShareModalContext";
import './home.css'; // Using the styling from your homepage structure

const CATEGORIES = ["All", "Anime", "Nature"];

export default function Page() {
    // === STATE MANAGEMENT ===
    const [wallpapers, setWallpapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuery, setCurrentQuery] = useState('All'); 
    
    // We use a Set to keep track of which wallpapers the user has 'liked'.
    // A Set is efficient for checking existence (e.g., likedIds.has(id)).
    const [likedIds, setLikedIds] = useState(new Set());

    // Hook from our custom ShareModalContext to globally trigger the share modal.
    const { openModal } = useShareModal();

    // === API FETCHING ===
    const fetchWallpapers = async (queryToFetch) => {
        setLoading(true); 
        try {
            // Fetching wallpapers from the internal Next.js API route based on the selected category
            const response = await fetch(`/api/wallpapers?query=${queryToFetch}&per_page=30`);
            const data = await response.json();
            setWallpapers(data.photos || []);
        } catch(error) {
            console.error("Failed to load wallpapers:", error);
        } finally {
            setLoading(false); 
        }
    };

    // Correct dependency array: ensures it syncs if currentQuery updates
    useEffect(() => {
        fetchWallpapers(currentQuery);
    }, [currentQuery]); 

    // === EVENT HANDLERS ===
    
    // Updates the current query when a category pill is clicked
    const handleCategoryClick = (category) => {
        setCurrentQuery(category);
    };

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
        <main className='home-page'>
            {/* HERO SECTION */}
            <section className='hero'>
                <h1 className='hero-title'> Welcome To Puffywalls </h1>
                <p className='hero-subtitle'> Discover Stunning, Dreamy and high quality wallpapers.</p>

                {/* DYNAMIC CATEGORIES ROW */}
                <div className="categories-container">
                    {CATEGORIES.map((cat) => (
                        <button 
                            key={cat}
                            onClick={() => handleCategoryClick(cat)}
                            className={`category-btn ${currentQuery === cat ? 'active' : ''}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            {/* DYNAMIC WALLPAPERS SECTION */}
            <div className="explore-content" style={{ padding: '0 2rem' }}>
                <h3 className="query-title" style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                    Showing results for: <span style={{ color: '#ff69b4', fontWeight: 'bold' }}>{currentQuery}</span>
                </h3>

                {loading ? (
                    /* LOADING STATE */
                    <div className="loading-container" style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <div className="spinner"></div>
                        <p style={{ marginTop: '1rem', color: '#666' }}>Fetching beautiful wallpapers...</p>
                    </div>
                ) : (
                    /* STANDARD GRID MAPPED FROM API */
                    <section className="wallpapers-grid">
                        {wallpapers.map((wallpaper) => {
                            // Check if this specific wallpaper is currently liked
                            const isLiked = likedIds.has(wallpaper.id);
                            
                            return (
                                <div 
                                    key={wallpaper.id} 
                                    className="wallpaper-card"
                                    // Clicking anywhere on the card opens the Share modal as requested
                                    onClick={() => openModal(wallpaper)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <img 
                                        src={wallpaper.src.large} 
                                        alt={wallpaper.alt || 'Wallpaper'} 
                                        className="wallpaper-img" 
                                        loading="lazy" 
                                    />
                                    
                                    <div className="wallpaper-overlay">
                                        <div className="wallpaper-info">
                                            <h3>{wallpaper.alt || 'Untitled Artwork'}</h3>
                                            {/* Display photographer tag as requested */}
                                            <p className="photographer-name">📸 {wallpaper.photographer}</p>
                                        </div>
                                        <div className="wallpaper-actions">
                                            {/* LIKE BUTTON */}
                                            <button 
                                                className={`wallpaper-btn ${isLiked ? 'liked' : ''}`} 
                                                title="Like" 
                                                onClick={(e) => {
                                                    // Stop propagation to prevent the card click event (which opens the share modal) from firing
                                                    e.stopPropagation();
                                                    toggleLike(wallpaper.id);
                                                }}
                                            > 
                                                <Heart 
                                                    size={20} 
                                                    // Fill the heart with red if liked, otherwise keep it transparent
                                                    fill={isLiked ? "#ff4757" : "transparent"} 
                                                    color={isLiked ? "#ff4757" : "currentColor"}
                                                /> 
                                            </button>
                                            
                                            {/* SAVE BUTTON */}
                                            <button 
                                                className="wallpaper-btn" 
                                                title="Save"
                                                onClick={(e) => e.stopPropagation()}
                                            > 
                                                <FolderPlus size={20}/> 
                                            </button>
                                            
                                            {/* DOWNLOAD BUTTON */}
                                            <button 
                                                className="wallpaper-btn" 
                                                title="Download"
                                                onClick={(e) => e.stopPropagation()}
                                            > 
                                                <Download size={20}/> 
                                            </button>
                                            
                                            {/* SHARE BUTTON */}
                                            <button 
                                                className="wallpaper-btn" 
                                                title="Share" 
                                                onClick={(e) => {
                                                    // Stop propagation so we don't trigger the card's onClick twice
                                                    e.stopPropagation();
                                                    openModal(wallpaper);
                                                }}
                                            > 
                                                <Share size={20}/> 
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </section>
                )}
            </div>
        </main>    
    );
}