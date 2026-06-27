'use client';

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import { Download, FolderPlus, Heart, Share } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useShareModal } from "../lib/ShareModalContext";
import { toast } from "sonner";
import { fetchFavorites, postFavorite, deleteFavorite } from "@/lib/api";
import './home.css'; 

const CATEGORIES = ["All", "Anime", "Nature"];

// Memoized Wallpaper Card Component to isolate state updates
const WallpaperCard = memo(({ wallpaper, isLiked, onToggleLike, onOpenModal }) => {
    return (
        <div 
            className="wallpaper-card"
            onClick={() => onOpenModal(wallpaper)}
            style={{ cursor: 'pointer', position: 'relative' }}
        >
            <div style={{ position: 'relative', width: '100%', height: '400px' }}>
                <Image 
                    src={wallpaper.src.large} 
                    alt={wallpaper.alt || 'Wallpaper'} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="wallpaper-img" 
                    style={{ objectFit: 'cover' }}
                    priority={false}
                />
            </div>
            
            <div className="wallpaper-overlay">
                <div className="wallpaper-info">
                    <h3>{wallpaper.alt || 'Untitled Artwork'}</h3>
                    <p className="photographer-name">📸 {wallpaper.photographer}</p>
                </div>
                <div className="wallpaper-actions">
                    {/* LIKE BUTTON */}
                    <button 
                        className={`wallpaper-btn ${isLiked ? 'liked' : ''}`} 
                        title="Like" 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(wallpaper.id);
                        }}
                    > 
                        <Heart 
                            size={20} 
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
                            e.stopPropagation();
                            onOpenModal(wallpaper);
                        }}
                    > 
                        <Share size={20}/> 
                    </button>
                </div>
            </div>
        </div>
    );
});

WallpaperCard.displayName = "WallpaperCard";

export default function Page() {
    const { user } = useAuth();
    const [wallpapers, setWallpapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuery, setCurrentQuery] = useState('All'); 
    const [likedIds, setLikedIds] = useState(new Set());
    const [favoriteIdByWallpaper, setFavoriteIdByWallpaper] = useState({});
    const { openModal } = useShareModal();

    // Fetch wallpapers data array
    const fetchWallpapers = async (queryToFetch) => {
        setLoading(true); 
        try {
            const response = await fetch(`/api/wallpapers?query=${queryToFetch}&per_page=30`);
            const data = await response.json();
            setWallpapers(data.photos || []);
        } catch(error) {
            console.error("Failed to load wallpapers:", error);
            toast.error("Could not retrieve latest items.");
        } finally {
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchWallpapers(currentQuery);
    }, [currentQuery]); 

    // Sync remote profile favorites 
    useEffect(() => {
        if (!user) {
            setLikedIds(new Set());
            setFavoriteIdByWallpaper({});
            return;
        }

        const loadFavorites = async () => {
            try {
                const favorites = await fetchFavorites({ userId: user.uid });
                if (Array.isArray(favorites)) {
                    const ids = new Set();
                    const idMap = {};
                    favorites.forEach((favorite) => {
                        if (favorite.wallpaperId) {
                            ids.add(favorite.wallpaperId);
                            idMap[favorite.wallpaperId] = favorite._id;
                        }
                    });
                    setLikedIds(ids);
                    setFavoriteIdByWallpaper(idMap);
                }
            } catch (error) {
                console.error('Failed to load favorites:', error);
            }
        };

        loadFavorites();
    }, [user]);

    const handleCategoryClick = (category) => {
        setCurrentQuery(category);
    };

    const toggleLike = async (id) => {
        if (!id) return;

        if (!user) {
            toast.error("Please login to save favorite wallpapers!");
            return;
        }

        if (likedIds.has(id)) {
            const favoriteId = favoriteIdByWallpaper[id];
            try {
                await deleteFavorite({ favoriteId, userId: user.uid, wallpaperId: id });
                setLikedIds(prev => {
                    const newLiked = new Set(prev);
                    newLiked.delete(id);
                    return newLiked;
                });
                setFavoriteIdByWallpaper(prev => {
                    const updated = { ...prev };
                    delete updated[id];
                    return updated;
                });
                toast.success('Removed from favorites.');
            } catch (error) {
                console.error('Failed to remove favorite:', error);
                toast.error('Could not remove favorite.');
            }
            return;
        }

        try {
            const favorite = await postFavorite({ userId: user.uid, wallpaperId: id, metadata: {} });
            setLikedIds(prev => {
                const newLiked = new Set(prev);
                newLiked.add(id);
                return newLiked;
            });
            setFavoriteIdByWallpaper(prev => ({ ...prev, [id]: favorite._id }));
            toast.success('Added to favorites.');
        } catch (error) {
            console.error('Failed to favorite wallpaper:', error);
            toast.error('Could not add to favorites.');
        }
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
                ) : wallpapers.length === 0 ? (
                    /* EMPTY STATE GUARD */
                    <div style={{ textAlign: 'center', padding: '4rem 0', color: '#888' }}>
                        <p>No wallpapers found for this category. Check back later!</p>
                    </div>
                ) : (
                    /* STANDARD GRID MAPPED FROM API */
                    <section className="wallpapers-grid">
                        {wallpapers.map((wallpaper) => (
                            <WallpaperCard 
                                key={wallpaper.id}
                                wallpaper={wallpaper}
                                isLiked={likedIds.has(wallpaper.id)}
                                onToggleLike={toggleLike}
                                onOpenModal={openModal}
                            />
                        ))}
                    </section>
                )}
            </div>
        </main>    
    );
}