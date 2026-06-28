'use client';

import { useEffect, useState, memo, useCallback } from "react";
import Image from "next/image";
import SearchBar from "../../components/SearchBar"; 
import { Heart, Download, FolderPlus, Share } from "lucide-react";
import { useAuth } from "@/lib/AuthContext"; 
import { toast } from "sonner";
import { useImageFormat } from "@/hooks/useImageFormat";
import { useShareModal } from "@/lib/ShareModalContext"; 
import { fetchUserCollections, createCollection, updateCollection, logEngagement, fetchFavorites, postFavorite, deleteFavorite } from "@/lib/api";
import './ExplorePage.css'; 

const CATEGORIES = ["Abstract", "AMOLED", "Nature", "Minimalist", "Gaming", "Anime", "Architecture", "Cars"];

const WallpaperCard = memo(({ wallpaper, isLiked, imageFormat, onOpenModal, onOpenSaveModal, onToggleLike, onTriggerDownload }) => {
    return (
        <div 
            className="wallpaper-card"
            onClick={() => onOpenModal(wallpaper)}
            style={{ cursor: 'pointer', position: 'relative' }}
        >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Image 
                    src={wallpaper.src[imageFormat] || wallpaper.src.large} 
                    alt={wallpaper.alt || 'Wallpaper'} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="wallpaper-image"
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
                    
                    <button 
                        className="wallpaper-btn" 
                        title="Save"
                        onClick={(e) => onOpenSaveModal(wallpaper, e)}
                    > 
                        <FolderPlus size={20}/> 
                    </button>
                    
                    <button 
                        className="wallpaper-btn" 
                        title="Download"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTriggerDownload(wallpaper.src.original, wallpaper.alt || 'download');
                        }}
                    > 
                        <Download size={20}/> 
                    </button>  

                    <button 
                        className="wallpaper-btn"
                        title="Share Asset" 
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenModal(wallpaper);
                        }}
                    >
                        <Share size={18} />
                    </button> 
                </div>
            </div>
        </div>
    );
});

WallpaperCard.displayName = "WallpaperCard";


export default function ExplorePage() {
    const { user } = useAuth();
    const [wallpapers, setWallpapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuery, setCurrentQuery] = useState('Abstract'); 
    
    const [likedIds, setLikedIds] = useState(new Set());
    const [favoriteIdByWallpaper, setFavoriteIdByWallpaper] = useState({});
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [selectedWallpaperForSave, setSelectedWallpaperForSave] = useState(null);
    const [collections, setCollections] = useState([]);
    const [collectionNames, setCollectionNames] = useState([]);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [collectionsLoading, setCollectionsLoading] = useState(false);

    const { openModal } = useShareModal();
    const imageFormat = useImageFormat();

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

    const fetchWallpapers = useCallback(async (queryToFetch) => {
        setLoading(true); 
        try {
            const response = await fetch(`/api/wallpapers?query=${queryToFetch}&per_page=30`);
            const data = await response.json();
            setWallpapers(data.photos || []);
        } catch(error) {
            console.error("Failed to load wallpapers:", error);
            toast.error("Network communication failure fetching wallpaper sources.");
        } finally {
            setLoading(false); 
        }
    }, []);

    useEffect(() => {
        fetchWallpapers(currentQuery);
    }, [currentQuery, fetchWallpapers]); 

    useEffect(() => {
        if (!user) {
            const local = loadLocalCollections();
            setCollectionNames(Object.keys(local));
            return;
        }

        const getCollections = async () => {
            setCollectionsLoading(true);
            try {
                const data = await fetchUserCollections(user.uid);
                if (Array.isArray(data)) {
                    setCollections(data);
                    setCollectionNames(data.map((collection) => collection.name));
                }
            } catch (error) {
                console.error('Failed to load collections:', error);
                toast.error('Unable to load your collections from the server.');
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

    const handleSearch = (searchTerm) => {
        setCurrentQuery(searchTerm); 
    };

    const handleCategoryClick = (category) => {
        setCurrentQuery(category);
    };

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
                logEngagement({ userId: user.uid, eventType: 'unfavorite_wallpaper', metadata: { wallpaperId: String(id) } });
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
            logEngagement({ userId: user.uid, eventType: 'favorite_wallpaper', metadata: { wallpaperId: String(id) } });
            toast.success('Added to favorites.');
        } catch (error) {
            console.error('Failed to favorite wallpaper:', error);
            toast.error('Could not add to favorites.');
        }
    };

    const triggerDownload = async (imgUrl, filename) => {
        try {
            toast.loading("Preparing your download...");
            const response = await fetch(imgUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${filename.replace(/\s+/g, '-').toLowerCase()}-puffy.jpg`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            
            toast.dismiss();
            toast.success("Wallpaper saved successfully! 🎉");
        } catch (err) {
            console.error("Download failed:", err);
            toast.dismiss();
            toast.error("Download failed. Please try again.");
        }
    };

    return (
        <div className="explore-page-container">
            <div className="explore-hero">
                <div className="explore-hero-overlay"></div>
                <div className="explore-hero-content">
                    <h1>Explore Premium Wallpapers</h1>
                    <p>Discover hand-picked collections for your devices</p>
                    <div className="hero-search-wrapper">
                        <SearchBar onSearch={handleSearch} />
                    </div>
                </div>
            </div>

            <div className="categories-container">
                {CATEGORIES.map((category) => (
                    <button 
                        key={category} 
                        className={`category-pill ${currentQuery === category ? 'active' : ''}`}
                        onClick={() => handleCategoryClick(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className="explore-content">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Curating your gallery...</p>
                    </div>
                ) : wallpapers.length > 0 ? (
                    <div className="wallpaper-grid">
                        {wallpapers.map((wallpaper) => (
                            <WallpaperCard 
                                key={wallpaper.id} 
                                wallpaper={wallpaper}
                                isLiked={likedIds.has(String(wallpaper.id))}
                                imageFormat={imageFormat}
                                onOpenModal={openModal}
                                onOpenSaveModal={openSaveModal}
                                onToggleLike={toggleLike}
                                onTriggerDownload={triggerDownload}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>No wallpapers found for &quot;{currentQuery}&quot;</p>
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