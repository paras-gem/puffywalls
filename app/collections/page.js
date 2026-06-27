'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Trash2, ArrowLeft, Download, Share, Edit3, Search, FolderPlus } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useShareModal } from '@/lib/ShareModalContext';
import { useImageFormat } from "@/hooks/useImageFormat";
import { toast } from "sonner";
import { fetchUserCollections, createCollection, updateCollection, deleteCollection } from '@/lib/api';
import './collections.css';

export default function Collections() {
    // === STATE MANAGEMENT ===
    const { user } = useAuth();
    const [collections, setCollections] = useState({});
    const [collectionMeta, setCollectionMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [bgImage, setBgImage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [movePanelFor, setMovePanelFor] = useState(null);
    const [moveTarget, setMoveTarget] = useState('');
    const movePanelRef = useRef(null);
    
    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    
    // Input Fields
    const [newFolderName, setNewFolderName] = useState('');
    const [folderToManage, setFolderToManage] = useState('');
    const [renameValue, setRenameValue] = useState('');

    // Layout hooks for global asset workflows
    const imageFormat = useImageFormat();
    const { openModal } = useShareModal();

    /**
     * 🌌 DYNAMIC BACKDROP EXTRACTOR
     */
    const extractDynamicBackdrop = useCallback((vaultData) => {
        const folderKeys = Object.keys(vaultData);
        for (const key of folderKeys) {
            if (vaultData[key] && vaultData[key].length > 0) {
                const firstAsset = vaultData[key][0];
                const targetSrc = firstAsset.src?.large2x || firstAsset.src?.original || firstAsset.src?.large;
                if (targetSrc) {
                    setBgImage(targetSrc);
                    return;
                }
            }
        }
    }, []);

    /**
     * 📥 INTEGRATED FILE RECOVERY DECK
     */
    const loadLocalCollections = useCallback(() => {
        setLoading(true);
        try {
            const vaultPayload = localStorage.getItem('user_collections');
            if (vaultPayload) {
                const parsedData = JSON.parse(vaultPayload);
                setCollections(parsedData);
                setCollectionMeta({});
                extractDynamicBackdrop(parsedData);
                return parsedData;
            }

            const seedData = {
                "Favorites": [],
                "Aesthetic Themes": [],
                "Neon Horizon Setup": []
            };
            localStorage.setItem('user_collections', JSON.stringify(seedData));
            setCollections(seedData);
            setCollectionMeta({});
            return seedData;
        } catch (error) {
            console.error("Critical error parsing internal collections context:", error);
            toast.error("Unable to access local client wallpaper storage vault.");
            return {};
        } finally {
            setLoading(false);
        }
    }, [extractDynamicBackdrop]);

    const loadRemoteCollections = useCallback(async () => {
        setLoading(true);
        try {
            const remoteCollections = await fetchUserCollections(user.uid);
            if (Array.isArray(remoteCollections)) {
                const collectionObject = {};
                const meta = {};
                remoteCollections.forEach((col) => {
                    const wallpapers = (col.wallpapers || []).map((item) => item.metadata || {
                        id: item.wallpaperId,
                        wallpaperId: item.wallpaperId,
                        src: {},
                    });
                    collectionObject[col.name] = wallpapers;
                    meta[col.name] = col;
                });
                setCollections(collectionObject);
                setCollectionMeta(meta);
                extractDynamicBackdrop(collectionObject);
                return collectionObject;
            }
        } catch (error) {
            console.error('Unable to load remote collections:', error);
            toast.error('Unable to load your saved collections from the database.');
        } finally {
            setLoading(false);
        }
        return {};
    }, [user, extractDynamicBackdrop]);

    const reloadCollections = useCallback(async () => {
        if (user) {
            return loadRemoteCollections();
        }
        return loadLocalCollections();
    }, [user, loadRemoteCollections, loadLocalCollections]);

    useEffect(() => {
        reloadCollections();
    }, [reloadCollections]);

    useEffect(() => {
        const handleStorage = () => {
            if (!user) {
                loadLocalCollections();
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [user, loadLocalCollections]);

    // Close any open move popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!movePanelFor) return;
            const el = movePanelRef.current;
            if (el && !el.contains(e.target)) {
                setMovePanelFor(null);
                setMoveTarget('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [movePanelFor]);

    const filteredWallpapers = useMemo(() => {
        if (!selectedFolder || !collections[selectedFolder]) return [];
        const items = collections[selectedFolder];
        if (!searchQuery.trim()) return items;

        return items.filter(photo => {
            const normalizedTitle = (photo.alt || 'curated wallpaper').toLowerCase();
            const normalizedQuery = searchQuery.toLowerCase().trim();
            return normalizedTitle.includes(normalizedQuery);
        });
    }, [selectedFolder, collections, searchQuery]);

    const calculatedTotalItems = useMemo(() => 
        Object.values(collections).reduce((sum, itemArr) => sum + itemArr.length, 0),
        [collections]
    );

    // === MUTATION CONTROLS ===

    const createCollectionSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = newFolderName.trim();
        
        if (!trimmedName) return;
        if (collections[trimmedName]) {
            return toast.error("A directory matching this structural name already exists.");
        }

        if (user) {
            try {
                await createCollection({
                    ownerId: user.uid,
                    name: trimmedName,
                    wallpapers: [],
                });
                await reloadCollections();
                setNewFolderName('');
                setShowCreateModal(false);
                toast.success(`Folder "${trimmedName}" created successfully.`);
            } catch (error) {
                console.error('Create collection failed:', error);
                toast.error('Could not create a new collection folder.');
            }
            return;
        }

        const updatedVaults = { ...collections, [trimmedName]: [] };
        setCollections(updatedVaults);
        localStorage.setItem('user_collections', JSON.stringify(updatedVaults));
        
        setNewFolderName('');
        setShowCreateModal(false);
        toast.success(`Folder "${trimmedName}" created successfully.`);
    };

    const openManageModal = (folderKey, event) => {
        event.stopPropagation();
        setFolderToManage(folderKey);
        setRenameValue(folderKey);
        setShowManageModal(true);
    };

    const handleRenameFolder = async (e) => {
        e.preventDefault();
        const trimmedNewName = renameValue.trim();

        if (!trimmedNewName || trimmedNewName === folderToManage) {
            setShowManageModal(false);
            return;
        }

        if (collections[trimmedNewName]) {
            return toast.error("A folder named inside this directory already exists.");
        }

        if (user && collectionMeta[folderToManage]) {
            try {
                const collection = collectionMeta[folderToManage];
                await updateCollection(collection._id, { name: trimmedNewName });
                await reloadCollections();
                setShowManageModal(false);
                if (selectedFolder === folderToManage) {
                    setSelectedFolder(trimmedNewName);
                }
                toast.success(`Renamed directory map to "${trimmedNewName}"`);
                return;
            } catch (error) {
                console.error('Rename failed:', error);
                toast.error('Could not rename the collection.');
            }
        }

        const updatedVaults = { ...collections };
        updatedVaults[trimmedNewName] = updatedVaults[folderToManage];
        delete updatedVaults[folderToManage];

        setCollections(updatedVaults);
        localStorage.setItem('user_collections', JSON.stringify(updatedVaults));
        extractDynamicBackdrop(updatedVaults);
        toast.success(`Renamed directory map to "${trimmedNewName}"`);
        setShowManageModal(false);

        if (selectedFolder === folderToManage) {
            setSelectedFolder(trimmedNewName);
        }
    };

    const purgeCollectionFolder = async (folderKey) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${folderKey}" and remove its contents?`)) {
            return;
        }

        if (user && collectionMeta[folderKey]) {
            try {
                await deleteCollection(collectionMeta[folderKey]._id);
                await reloadCollections();
                setShowManageModal(false);
                if (selectedFolder === folderKey) {
                    setSelectedFolder(null);
                }
                toast.success(`"${folderKey}" removed safely.`);
                return;
            } catch (error) {
                console.error('Delete collection failed:', error);
                toast.error('Could not delete the collection.');
                return;
            }
        }

        const updatedVaults = { ...collections };
        delete updatedVaults[folderKey];
        
        setCollections(updatedVaults);
        localStorage.setItem('user_collections', JSON.stringify(updatedVaults));
        extractDynamicBackdrop(updatedVaults);
        toast.success(`"${folderKey}" removed safely.`);
        setShowManageModal(false);
        
        if (selectedFolder === folderKey) {
            setSelectedFolder(null);
        }
    };

    const extractItemFromFolder = async (photoId, event) => {
        event.stopPropagation();
        const currentTargetFiles = collections[selectedFolder] || [];
        const filteredPayload = currentTargetFiles.filter(item => item.id !== photoId && item.wallpaperId !== photoId);

        if (user && collectionMeta[selectedFolder]) {
            try {
                const collection = collectionMeta[selectedFolder];
                const remoteWallpapers = (collection.wallpapers || []).filter(item => item.wallpaperId !== photoId);
                await updateCollection(collection._id, { wallpapers: remoteWallpapers });
                await reloadCollections();
                toast.success("Wallpaper removed from this collection folder.");
                return;
            } catch (error) {
                console.error('Remove wallpaper failed:', error);
                toast.error('Could not remove wallpaper from the collection.');
                return;
            }
        }

        const updatedVaults = { ...collections, [selectedFolder]: filteredPayload };
        setCollections(updatedVaults);
        localStorage.setItem('user_collections', JSON.stringify(updatedVaults));
        extractDynamicBackdrop(updatedVaults);
        toast.success("Wallpaper removed from this collection folder.");
    };

    const processBinarySystemDownload = async (assetUrl, alternativeText) => {
        try {
            toast.loading("Establishing download connection array...");
            const response = await fetch(assetUrl);
            const rawBlob = await response.blob();
            const localizedBlobUrl = window.URL.createObjectURL(rawBlob);
            
            const actionNode = document.createElement('a');
            actionNode.href = localizedBlobUrl;
            actionNode.download = `${alternativeText.replace(/\s+/g, '-').toLowerCase()}-puffy-saved.jpg`;
            
            document.body.appendChild(actionNode);
            actionNode.click();
            document.body.removeChild(actionNode);
            window.URL.revokeObjectURL(localizedBlobUrl);
            
            toast.dismiss();
            toast.success("Wallpaper cached successfully!");
        } catch (error) {
            console.error("Pipeline failure fetching raw image buffer array:", error);
            toast.dismiss();
            toast.error("Asset download path interrupted.");
        }
    };

    return (
        <div className="collections-page">
            
            {/* 🌌 FULLSCREEN ANIMATING BACKDROP CANVAS LAYER */}
            <div 
                className={`fullscreen-bg-canvas ${bgImage ? 'has-image' : 'gradient-only'}`}
                style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}
            />
            <div className="fullscreen-bg-overlay" />

            {/* HERO BAR CONTAINER */}
            <div className="collections-hero">
                <div className="collections-hero-content">
                    <h1>Your Saved <span className="collections-gradient">Collections</span></h1>
                    <p>Organize, review, and handle the custom artwork sets you have pinned across your app journeys</p>
                    <button className="btn-new-collection" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> New Collection
                    </button>
                </div>
            </div>

            {/* LIVE DATA STATISTICS METRICS BAR */}
            <div className="collections-stats-bar">
                <div className="collections-stat">
                    <span>Total Folders: <strong>{Object.keys(collections).length} Directories</strong></span>
                </div>
                <div className="collections-stat">
                    <span>Total Wallpapers: <strong>{calculatedTotalItems} Assets</strong></span>
                </div>
            </div>

            {/* MAIN CONTENT WORKSPACE */}
            <div className="collections-content">
                {!selectedFolder ? (
                    /* FOLDER GRID VIEW */
                    <div className="folders-grid">
                        {Object.keys(collections).map((folderKey) => (
                            <div 
                                key={folderKey} 
                                className="folder-card"
                                onClick={() => setSelectedFolder(folderKey)}
                            >
                                <div className="folder-icon-wrapper">
                                    <div className="folder-icon-main" />
                                    <div className="folder-icon-tab" />
                                </div>
                                <div className="folder-info">
                                    <h3>{folderKey}</h3>
                                    <p>{collections[folderKey].length} wallpapers</p>
                                </div>
                                <button 
                                    className="folder-manage-btn"
                                    onClick={(e) => openManageModal(folderKey, e)}
                                >
                                    <Edit3 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* ASSET LIST VIEW */
                    <div className="assets-view">
                        <div className="assets-header">
                            <button className="btn-back" onClick={() => setSelectedFolder(null)}>
                                <ArrowLeft size={18} /> Back to Folders
                            </button>
                            <div className="assets-title-group">
                                <h2>{selectedFolder}</h2>
                                <p>Viewing {filteredWallpapers.length} items in this collection</p>
                            </div>
                            <div className="assets-search-wrapper">
                                <Search size={18} className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder="Search in folder..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {filteredWallpapers.length === 0 ? (
                            <div className="empty-assets">
                                <FolderPlus size={48} />
                                <p>{searchQuery ? "No matching wallpapers found." : "This collection folder is currently empty."}</p>
                            </div>
                        ) : (
                            <div className="assets-grid">
                                {filteredWallpapers.map((photo) => (
                                    <div key={photo.id || photo.wallpaperId} className="asset-card" onClick={() => openModal(photo)}>
                                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                            <Image 
                                                src={photo.src?.[imageFormat] || photo.src?.large || ''} 
                                                alt={photo.alt || 'Wallpaper'} 
                                                fill
                                                style={{ objectFit: 'cover' }}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>
                                        <div className="asset-overlay">
                                            <div className="asset-actions">
                                                <button 
                                                    className="asset-btn" 
                                                    title="Download"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        processBinarySystemDownload(photo.src?.original, photo.alt || 'wallpaper');
                                                    }}
                                                >
                                                    <Download size={18} />
                                                </button>
                                                <button 
                                                    className="asset-btn" 
                                                    title="Share"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openModal(photo);
                                                    }}
                                                >
                                                    <Share size={18} />
                                                </button>
                                                <button 
                                                    className="asset-btn btn-delete" 
                                                    title="Remove"
                                                    onClick={(e) => extractItemFromFolder(photo.id || photo.wallpaperId, e)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODALS SECTION */}
            
            {/* Create Folder Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
                        <h2>Create New Collection</h2>
                        <form onSubmit={createCollectionSubmit}>
                            <input 
                                type="text" 
                                placeholder="Folder name (e.g., Summer Vibes)" 
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                autoFocus
                                maxLength={24}
                                required
                            />
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn-confirm">Create Folder</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Folder Modal */}
            {showManageModal && (
                <div className="modal-overlay" onClick={() => setShowManageModal(false)}>
                    <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
                        <h2>Manage Collection</h2>
                        <form onSubmit={handleRenameFolder}>
                            <label>Rename Folder</label>
                            <input 
                                type="text" 
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                autoFocus
                                maxLength={24}
                                required
                            />
                            <div className="modal-actions">
                                <button type="button" className="btn-delete-full" onClick={() => purgeCollectionFolder(folderToManage)}>
                                    <Trash2 size={16} /> Delete Collection
                                </button>
                                <div className="right-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowManageModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-confirm">Save Changes</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
