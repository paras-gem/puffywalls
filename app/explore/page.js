'use client';

import { useEffect, useState } from "react";
import SearchBar from "../../components/SearchBar"; 
import { Heart, Download, FolderPlus, Share } from "lucide-react";
import { useAuth } from "@/lib/AuthContext"; 
import { toast } from "sonner";
import { useImageFormat } from "@/hooks/useImageFormat";
import { useShareModal } from "../../lib/ShareModalContext"; // Import our global modal context
import './ExplorePage.css'; 

// Pre-defined wallpaper collections for the top filter pill-row
const CATEGORIES = ["Abstract", "AMOLED", "Nature", "Minimalist", "Gaming", "Anime", "Architecture", "Cars"];

export default function ExplorePage() {
    // === STATE MANAGEMENT ===
    const { user } = useAuth();
    const [wallpapers, setWallpapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuery, setCurrentQuery] = useState('Abstract'); 
    
    // We use a Set to keep track of which wallpapers the user has 'liked'.
    // A Set is fast and efficient for checking existence (e.g., likedIds.has(id)).
    const [likedIds, setLikedIds] = useState(new Set());
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [selectedWallpaperForSave, setSelectedWallpaperForSave] = useState(null);
    const [collectionNames, setCollectionNames] = useState([]);
    const [newCollectionName, setNewCollectionName] = useState('');

    // Hook from our custom ShareModalContext to globally trigger the share modal overlay
    const { openModal } = useShareModal();

    const imageFormat = useImageFormat();

    /**
     * 🌐 PEXELS API CALL
     * Hits your Next.js internal backend API endpoint to securely fetch wallpaper arrays.
     */
    const fetchWallpapers = async (queryToFetch) => {
        setLoading(true); 
        try {
            const response = await fetch(`/api/wallpapers?query=${queryToFetch}&per_page=30`);
            const data = await response.json();
            setWallpapers(data.photos || []);
        } catch(error) {
            console.error("Failed to load wallpapers:", error);
            toast.error("Network communication failure fetching wall sources.");
        } finally {
            setLoading(false); 
        }
    };

    // Load initial category feed on page render
    useEffect(() => {
        fetchWallpapers(currentQuery);
    }, [currentQuery]); 

    const loadCollections = () => {
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
    };

    const openSaveModal = (wallpaper, event) => {
        event.stopPropagation();
        setSelectedWallpaperForSave(wallpaper);
        setShowCollectionModal(true);
        const currentCollections = loadCollections();
        setCollectionNames(Object.keys(currentCollections));
    };

    const closeSaveModal = () => {
        setShowCollectionModal(false);
        setSelectedWallpaperForSave(null);
        setNewCollectionName('');
    };

    const saveWallpaperToCollection = (collectionName) => {
        if (!selectedWallpaperForSave) return;

        const currentCollections = loadCollections();
        const collection = currentCollections[collectionName] || [];
        if (collection.some((item) => item.id === selectedWallpaperForSave.id)) {
            toast.error(`Already saved to ${collectionName}`);
            return;
        }

        currentCollections[collectionName] = [...collection, selectedWallpaperForSave];
        window.localStorage.setItem('user_collections', JSON.stringify(currentCollections));
        toast.success(`Saved to ${collectionName}`);
        closeSaveModal();
    };

    const handleCreateCollectionAndSave = (event) => {
        event.preventDefault();
        const trimmed = newCollectionName.trim();
        if (!trimmed || !selectedWallpaperForSave) return;

        const currentCollections = loadCollections();
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
    };

    // === EVENT HANDLERS ===

    // Triggered when a user completes a text search
    const handleSearch = (searchTerm) => {
        setCurrentQuery(searchTerm); 
        fetchWallpapers(searchTerm); 
    };

    // Triggered when a user clicks on any category chip
    const handleCategoryClick = (category) => {
        setCurrentQuery(category);
        fetchWallpapers(category);
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

    /**
     * 📥 BYPASS LINK FORCED DOWNLOAD
     * Standard links open images in a new browser tab. 
     * This converts the image path to bytes (Blob) to force a native filesystem download save box.
     */
    const triggerDownload = async (imgUrl, filename) => {
        try {
            toast.loading("Preparing high-res asset download...");

            // 1. Fetch raw picture data streams directly from server paths
            const response = await fetch(imgUrl);
            
            // 2. Convert incoming binary network packet streams into a raw file Blob object
            const blob = await response.blob();
            
            // 3. Create a unique, temporary virtual memory URL pointing to that Blob
            const blobUrl = window.URL.createObjectURL(blob);
            
            // 4. Generate an in-memory virtual <a> HTML tag to simulate download targeting
            const link = document.createElement('a');
            link.href = blobUrl;
            
            // Reformat filename space characters into filesystem dashes
            const cleanName = filename.replace(/\s+/g, '-').toLowerCase();
            link.download = `${cleanName}-puffywalls.jpg`;
            
            // 5. Append node to DOM framework structure, click it programmatically, then wipe it
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 6. Instantly free up system browser memory caches
            window.URL.revokeObjectURL(blobUrl);
            
            toast.dismiss();
            toast.success("Download started! 🚀");
        } catch (err) {
            console.error("Download pipeline broke:", err);
            toast.dismiss();
            toast.error("Could not complete asset download.");
        }
    };

    return (
        <div className="explore-page-container">
            {/* HERO BANNER BLOCK CONTAINER */}
            <div className="explore-hero">
                <div className="explore-hero-overlay"></div>
                <div className="explore-hero-content">
                    <h1>Explore the Best Wallpapers</h1>
                    <p>Curated high-quality backgrounds for your screens</p>
                    <div className="hero-search-wrapper">
                        <SearchBar onSearch={handleSearch} />
                    </div>
                </div>
            </div>

            {/* INTERACTIVE CATEGORY ROW PILLS */}
            <div className="categories-container">
                {CATEGORIES.map((cat) => (
                    <button 
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className={`category-pill ${currentQuery === cat ? 'active' : ''}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* MAIN CONTENT GALLERY GRID FEED */}
            <div className="explore-content">
                <h3 className="query-title">Showing results for: <span>{currentQuery}</span></h3>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Fetching beautiful wallpapers...</p>
                    </div>
                ) : (
                    <div className="wallpaper-grid">
                        {wallpapers.map((wallpaper) => {
                            // Check if this specific wallpaper is currently liked
                            const isLiked = likedIds.has(wallpaper.id);

                            return (
                                <div 
                                    key={wallpaper.id} 
                                    className="wallpaper-card"
                                    // Clicking anywhere on the card opens the Share modal globally
                                    onClick={() => openModal(wallpaper)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <img 
                                        // Dynamic object keys select 'portrait', 'large', or 'large2x' depending on layout state
                                        src={wallpaper.src[imageFormat] || wallpaper.src.large} 
                                        alt={wallpaper.alt || 'Wallpaper'} 
                                        className="wallpaper-image"
                                        loading="lazy" // Native performance booster: only downloads images when scrolled into view
                                    />
                                    
                                    {/* HOVER INTERFACES OVERLAY CARD CONTAINER */}
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openSaveModal(wallpaper, e);
                                                }}
                                            > 
                                                <FolderPlus size={20}/> 
                                            </button>
                                            
                                            {/* DOWNLOAD BUTTON */}
                                            <button 
                                                className="wallpaper-btn" 
                                                title="Download"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    triggerDownload(wallpaper.src.original, wallpaper.alt || 'download');
                                                }}
                                            > 
                                                <Download size={20}/> 
                                            </button>  

                                              {/* PUBLIC SYSTEM OVERLAY MODAL */}
                                              <button 
                                                  className="wallpaper-btn"
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

            {showCollectionModal && (
                <div className="collection-modal-backdrop" onClick={closeSaveModal}>
                    <div className="collection-modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="collection-modal-header">
                            <h2>Save Wallpaper</h2>
                            <p>Choose an existing collection or create a new one.</p>
                        </div>

                        <div className="collection-list">
                            {collectionNames.length > 0 ? (
                                collectionNames.map((name) => (
                                    <button
                                        key={name}
                                        type="button"
                                        className="collection-choice-btn"
                                        onClick={() => saveWallpaperToCollection(name)}
                                    >
                                        {name}
                                    </button>
                                ))
                            ) : (
                                <p className="collection-empty">No collections found yet. Create one below.</p>
                            )}
                        </div>

                        <form className="collection-create-form" onSubmit={handleCreateCollectionAndSave}>
                            <input
                                value={newCollectionName}
                                onChange={(event) => setNewCollectionName(event.target.value)}
                                placeholder="New collection name"
                                className="collection-input"
                                maxLength={24}
                                required
                            />
                            <button type="submit" className="collection-submit-btn">
                                Create & Save
                            </button>
                        </form>

                        <button type="button" className="collection-cancel-btn" onClick={closeSaveModal}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}