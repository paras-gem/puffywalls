'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import SearchBar from '../../components/SearchBar'; 
import { Heart, Download, FolderPlus, Flame, Share } from 'lucide-react';
import { useShareModal } from '@/lib/ShareModalContext';
import { useImageFormat } from "@/hooks/useImageFormat";
import { useAuth } from '@/lib/AuthContext';
import { toast } from "sonner";
import { fetchFavorites, postFavorite, deleteFavorite, fetchUserCollections, createCollection, updateCollection, logEngagement } from '@/lib/api';
import './trending.css';

// Premium trend-focused categories to display in the filter row
const TRENDING_CATEGORIES = ["Cyberpunk", "Vaporwave", "Cosmic", "Surrealism", "Fluid Art", "Macro Tech"];

export default function Trending() {
    // === STATE MANAGEMENT ===
    const [wallpapers, setWallpapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuery, setCurrentQuery] = useState('Trending'); 
    
    // Tracks active user interactions safely with a high-performance memory Set
    const [likedIds, setLikedIds] = useState(new Set());
    const [favoriteIdByWallpaper, setFavoriteIdByWallpaper] = useState({});
    const { user } = useAuth();

    // Collection Modal States
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [selectedWallpaperForSave, setSelectedWallpaperForSave] = useState(null);
    const [collections, setCollections] = useState([]);
    const [collectionNames, setCollectionNames] = useState([]);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [collectionsLoading, setCollectionsLoading] = useState(false);

    // Context hooks for layout responsiveness and globally handled interactive elements
    const imageFormat = useImageFormat();
    const { openModal } = useShareModal();

    const loadLocalCollections = useCallback(() => {
        try {
            const saved = window.localStorage.getItem('user_collections');
            if (saved) {
                const parsed = JSON.parse(saved);
                setCollectionNames(Object.keys(parsed));
                return parsed;
            }
        } catch (error) {
            console.error('Fetch collections failed', error);
        }

        const seedData = {
            Favorites: [],
            'Aesthetic Themes': [],
            'Neon Horizon Setup': [],
        };

        window.localStorage.setItem('user_collections', JSON.stringify(seedData));
        setCollectionNames(Object.keys(seedData));
        return seedData;
    }, []);

    /**
     * 🌐 PEXELS LIVE DATA STREAMING
     */
    const fetchTrendingFeed = useCallback(async (queryToFetch) => {
        setLoading(true);
        try {
            // Limits to top 30 assets per page as configured
            const response = await fetch(`/api/wallpapers?query=${queryToFetch}&per_page=30`);
            const data = await response.json();
            setWallpapers(data.photos || []);
        } catch (error) {
            console.error("Failed to load trending assets:", error);
            toast.error("Unable to synchronize with trending asset databases.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Resolves initial API hydration cycles automatically upon view initialization
    useEffect(() => {
        fetchTrendingFeed(currentQuery);
    }, [currentQuery, fetchTrendingFeed]);

    // Handle account switch or signout for collections state
    useEffect(() => {
        if (!user) {
            const local = loadLocalCollections();
            setCollections([]);
            setCollectionNames(Object.keys(local));
            return;
        }

        const getCollections = async () => {
            setCollectionsLoading(true);
            setCollections([]);
            setCollectionNames([]);
            try {
                const data = await fetchUserCollections(user.uid);
                if (Array.isArray(data)) {
                    setCollections(data);
                    setCollectionNames(data.map((collection) => collection.name));
                }
            } catch (error) {
                console.error('Failed to load collections:', error);
            } finally {
                setCollectionsLoading(false);
            }
        };

        getCollections();
    }, [user, loadLocalCollections]);

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
                            ids.add(String(favorite.wallpaperId));
                            idMap[String(favorite.wallpaperId)] = favorite._id;
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

    // === INTERACTIVE EVENT PIPELINES ===

    // Re-routes custom search bar entry points into the asynchronous data loader
    const handleSearch = (searchTerm) => {
        setCurrentQuery(searchTerm);
    };

    // Controls tracking updates when choosing predefined trending layout pills
    const handleCategoryClick = (category) => {
        setCurrentQuery(category);
    };

    // Tracks like actions locally using a clean toggle state, with backend persistence for signed in users
    const toggleLike = async (id) => {
        if (!id) return;

        if (!user) {
            setLikedIds(prev => {
                const newLiked = new Set(prev);
                if (newLiked.has(id)) {
                    newLiked.delete(String(id));
                } else {
                    newLiked.add(String(id));
                }
                return newLiked;
            });
            toast.success('Liked locally! Sign in to sync across devices.');
            return;
        }

        if (likedIds.has(String(id))) {
            const favoriteId = favoriteIdByWallpaper[String(id)];
            try {
                await deleteFavorite({ favoriteId, userId: user.uid, wallpaperId: String(id) });
                setLikedIds(prev => {
                    const newLiked = new Set(prev);
                    newLiked.delete(String(id));
                    return newLiked;
                });
                setFavoriteIdByWallpaper(prev => {
                    const updated = { ...prev };
                    delete updated[String(id)];
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
            const favorite = await postFavorite({ userId: user.uid, wallpaperId: String(id), metadata: wallpapers.find((item) => item.id === id) || {} });
            setLikedIds(prev => {
                const newLiked = new Set(prev);
                newLiked.add(String(id));
                return newLiked;
            });
            setFavoriteIdByWallpaper(prev => ({ ...prev, [String(id)]: favorite._id }));
            toast.success('Added to favorites.');
        } catch (error) {
            console.error('Failed to favorite wallpaper:', error);
            toast.error('Could not add to favorites.');
        }
    };

    /**
     * 📥 DIRECT SYSTEM FILE DOWNLOAD
     */
    const triggerDownload = async (imgUrl, filename) => {
        try {
            toast.loading("Processing premium wallpaper download streams...");
            const response = await fetch(imgUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            const cleanName = filename.replace(/\s+/g, '-').toLowerCase();
            link.download = `${cleanName}-puffy-trending.jpg`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            
            toast.dismiss();
            toast.success("Wallpaper saved to system filesystem! 🎉");
        } catch (err) {
            console.error("Download failed to initiate:", err);
            toast.dismiss();
            toast.error("Download channel interrupted.");
        }
    };

    const openSaveModal = (wallpaper, event) => {
        event.stopPropagation();
        setSelectedWallpaperForSave(wallpaper);
        setShowCollectionModal(true);

        if (!user) {
            const currentCollections = loadLocalCollections();
            setCollectionNames(Object.keys(currentCollections));
            return;
        }

        setCollectionNames(collections.map((collection) => collection.name));
    };

    const closeSaveModal = () => {
        setShowCollectionModal(false);
        setSelectedWallpaperForSave(null);
        setNewCollectionName('');
    };

    const saveWallpaperToCollection = async (collectionName) => {
        if (!selectedWallpaperForSave) return;

        if (!user) {
            const currentCollections = loadLocalCollections();
            const collection = currentCollections[collectionName] || [];
            if (collection.some((item) => item.id === selectedWallpaperForSave.id)) {
                toast.error(`Already saved to ${collectionName}`);
                return;
            }

            currentCollections[collectionName] = [...collection, selectedWallpaperForSave];
            window.localStorage.setItem('user_collections', JSON.stringify(currentCollections));
            toast.success(`Saved to ${collectionName}`);
            closeSaveModal();
            return;
        }

        const targetCollection = collections.find((collection) => collection.name === collectionName);
        if (!targetCollection) {
            toast.error('Collection could not be found.');
            return;
        }

        const existing = targetCollection.wallpapers?.some((item) => item.wallpaperId === selectedWallpaperForSave.id);
        if (existing) {
            toast.error(`Already saved to ${collectionName}`);
            return;
        }

        const updatedWallpapers = [
            ...(targetCollection.wallpapers || []),
            {
                wallpaperId: selectedWallpaperForSave.id,
                addedAt: new Date().toISOString(),
                metadata: selectedWallpaperForSave,
            },
        ];

        try {
            await updateCollection(targetCollection._id, { wallpapers: updatedWallpapers });
            logEngagement({ userId: user.uid, eventType: 'save_wallpaper', metadata: { wallpaperId: selectedWallpaperForSave.id, collectionName } });
            const refreshed = await fetchUserCollections(user.uid);
            setCollections(refreshed);
            setCollectionNames(refreshed.map((collection) => collection.name));
            toast.success(`Saved to ${collectionName}`);
            closeSaveModal();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Could not save wallpaper to your collection.');
        }
    };

    const handleCreateCollectionAndSave = async (event) => {
        event.preventDefault();
        const trimmed = newCollectionName.trim();
        if (!trimmed || !selectedWallpaperForSave) return;

        if (!user) {
            const currentCollections = loadLocalCollections();
            if (currentCollections[trimmed]) {
                toast.error('A collection with this name already exists.');
                return;
            }

            currentCollections[trimmed] = [selectedWallpaperForSave];
            window.localStorage.setItem('user_collections', JSON.stringify(currentCollections));
            setNewCollectionName('');
            setCollectionNames(Object.keys(currentCollections));
            toast.success(`Created ${trimmed} and saved wallpaper.`);
            closeSaveModal();
            return;
        }

        if (collections.some((collection) => collection.name === trimmed)) {
            toast.error('A collection with this name already exists.');
            return;
        }

        try {
            const created = await createCollection({
                ownerId: user.uid,
                name: trimmed,
                wallpapers: [
                    {
                        wallpaperId: selectedWallpaperForSave.id,
                        addedAt: new Date().toISOString(),
                        metadata: selectedWallpaperForSave,
                    },
                ],
            });

            logEngagement({ userId: user.uid, eventType: 'create_collection_and_save', metadata: { wallpaperId: selectedWallpaperForSave.id, collectionName: trimmed } });
            setCollections((prev) => [created, ...prev]);
            setCollectionNames((prev) => [created.name, ...prev]);
            setNewCollectionName('');
            toast.success(`Created ${trimmed} and saved wallpaper.`);
            closeSaveModal();
        } catch (error) {
            console.error('Create collection failed:', error);
            toast.error('Could not create collection at this time.');
        }
    };

    return (
        <div className="trending-page">
            {/* HERO BANNER SECTION */}
            <div className="trending-hero">
                <div className="trending-hero-overlay"></div>
                <div className="trending-hero-content">
                    <div className="trending-badge">
                        <Flame size={14} className="tag-flame" /> Live Hot Metrics
                    </div>
                    <h1>Discover What&apos;s <span className="gradient-text">Trending</span></h1>
                    <p>The most viewed, downloaded, and highly rated creations this week</p>
                    
                    {/* INTEGRATED APPLICATION SEARCH BAR */}
                    <div style={{ maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                        <SearchBar onSearch={handleSearch} />
                    </div>

                    {/* TARGETED POPULAR CATEGORY CHIPS */}
                    <div className="trending-tags-row">
                        {TRENDING_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryClick(cat)}
                                className={`trend-tag ${currentQuery === cat ? 'active' : ''}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* REAL-TIME STATS DECK */}
            <div className="trending-stats-bar">
                <div className="stat-item">
                    <span>Showing: <strong>{currentQuery}</strong></span>
                </div>
                <div className="stat-item">
                    <span>Refresh Rate: <strong>Live Dynamic</strong></span>
                </div>
            </div>

            {/* WALLPAPER CARD GRID RENDERING LAYER */}
            <div className="trending-content">
                {loading ? (
                    <div className="loading-container">
                        <div className="flame-spinner">
                            <Flame size={40} className="spinner-flame" />
                        </div>
                        <p>Aggregating trending visual statistics...</p>
                    </div>
                ) : (
                    <div className="trending-grid">
                        {wallpapers.map((wallpaper, index) => {
                            const isLiked = likedIds.has(String(wallpaper.id));
                            const isFeatured = index < 3;

                            return (
                                <div 
                                    key={wallpaper.id} 
                                    className={`trending-card ${isFeatured ? 'featured-card' : ''}`}
                                    onClick={() => openModal(wallpaper)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* DYNAMIC METRIC ACCENT BADGES */}
                                    <div className="rank-badge rank-badge--hot">
                                        #{index + 1} HOT
                                    </div>

                                    {/* WALLPAPER RENDER IMAGE */}
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                        <Image 
                                            src={wallpaper?.src?.[imageFormat] || wallpaper?.src?.large || ''} 
                                            alt={wallpaper.alt || 'Trending Artwork'} 
                                            fill
                                            className="trending-img"
                                            style={{ objectFit: 'cover' }}
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    </div>

                                    {/* INTERACTIVE HOVER OVERLAY BOX */}
                                    <div className="trending-overlay">
                                        <div className="trending-info">
                                            <h3>{wallpaper.alt || 'Premium Canvas Collection'}</h3>
                                            <p className="photographer-tag">📸 {wallpaper.photographer || 'Unknown'}</p>
                                        </div>
                                        
                                        {/* EXPANDED ACTION ITEM DECK */}
                                        <div className="trending-actions">
                                            {/* LIKE SYSTEM CONTROL */}
                                            <button 
                                                type="button"
                                                className={`trend-btn ${isLiked ? 'liked' : ''}`}
                                                title="Like Asset" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleLike(wallpaper.id);
                                                }}
                                            >
                                                <Heart 
                                                    size={18}
                                                    fill={isLiked ? "#ff4757" : "transparent"} 
                                                    color={isLiked ? "#ff4757" : "#ffffff"}
                                                />
                                            </button>
                                            
                                            {/* SYSTEM SAVING OVERLAY */}
                                            <button 
                                                type="button"
                                                className="trend-btn"
                                                title="Save to Vault"
                                                onClick={(e) => openSaveModal(wallpaper, e)}
                                            >
                                                <FolderPlus size={18} />
                                            </button>
                                            
                                            {/* HARD FILESYSTEM DOWNLOAD PIPELINE */}
                                            <button 
                                                type="button"
                                                className="trend-btn download-btn"
                                                title="Download Original Asset"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    triggerDownload(wallpaper?.src?.original, wallpaper.alt || 'trending-file');
                                                }}
                                            >
                                                <Download size={18} />
                                            </button>
                                            
                                            {/* PUBLIC SYSTEM OVERLAY MODAL */}
                                            <button 
                                                type="button"
                                                className="trend-btn"
                                                title="Share Asset" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModal(wallpaper);
                                                }}
                                            >
                                                <Share size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Collection Save Modal */}
            {showCollectionModal && (
                <div className="collection-modal-backdrop" onClick={closeSaveModal}>
                    <div className="collection-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="collection-modal-header">
                            <h2>Save to Collection</h2>
                            <p>Choose an existing collection or create a new one</p>
                        </div>
                        <div className="collection-list">
                            {collectionNames.length > 0 ? (
                                collectionNames.map((name) => (
                                    <button 
                                        key={name} 
                                        className="collection-choice-btn"
                                        onClick={() => saveWallpaperToCollection(name)}
                                    >
                                        {name}
                                    </button>
                                ))
                            ) : (
                                <p className="collection-empty">No collections yet. Create one below.</p>
                            )}
                        </div>

                        <div className="collection-create-form">
                            <input
                                value={newCollectionName}
                                onChange={(event) => setNewCollectionName(event.target.value)}
                                placeholder="New collection name"
                                className="collection-input"
                                maxLength={24}
                            />
                            <button 
                                className="collection-submit-btn"
                                onClick={handleCreateCollectionAndSave}
                                disabled={!newCollectionName.trim()}
                            >
                                Create & Save
                            </button>
                        </div>

                        <button type="button" className="collection-cancel-btn" onClick={closeSaveModal}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
