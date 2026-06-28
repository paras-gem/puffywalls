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

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);

    // Input fields
    const [newFolderName, setNewFolderName] = useState('');
    const [folderToManage, setFolderToManage] = useState('');
    const [renameValue, setRenameValue] = useState('');

    const imageFormat = useImageFormat();
    const { openModal } = useShareModal();

    // Picks the first available wallpaper image to use as the animated page backdrop
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

    // Loads collections from localStorage for guest users
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

            // Seed with default folders if nothing exists yet
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

    // Loads collections from MongoDB Atlas for logged-in users
    const loadRemoteCollections = useCallback(async () => {
        setLoading(true);
        try {
            const remoteCollections = await fetchUserCollections(user.uid);
            if (Array.isArray(remoteCollections)) {
                const collectionObject = {};
                const meta = {};
                remoteCollections.forEach((col) => {
                    // Extract the metadata blob saved alongside each wallpaper
                    const wallpapers = (col.wallpapers || []).map((item) => item.metadata || {
                        id: item.wallpaperId,
                        wallpaperId: item.wallpaperId,
                        src: {},
                    });
                    collectionObject[col.name] = wallpapers;
                    meta[col.name] = col; // keep full DB doc for update/delete operations
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

    // Decides which loader to use based on auth state
    const reloadCollections = useCallback(async () => {
        if (user) return loadRemoteCollections();
        return loadLocalCollections();
    }, [user, loadRemoteCollections, loadLocalCollections]);

    // Initial load on mount or when user changes
    useEffect(() => {
        reloadCollections();
    }, [reloadCollections]);

    // Re-sync local collections if another tab modifies localStorage
    useEffect(() => {
        const handleStorage = () => {
            if (!user) loadLocalCollections();
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [user, loadLocalCollections]);

    // Close move popover when clicking outside it
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

    // Filter wallpapers inside a folder by search query
    const filteredWallpapers = useMemo(() => {
        if (!selectedFolder || !collections[selectedFolder]) return [];
        const items = collections[selectedFolder];
        if (!searchQuery.trim()) return items;
        return items.filter(photo => {
            const normalizedTitle = (photo.alt || 'curated wallpaper').toLowerCase();
            return normalizedTitle.includes(searchQuery.toLowerCase().trim());
        });
    }, [selectedFolder, collections, searchQuery]);

    // Total wallpaper count across all folders
    const calculatedTotalItems = useMemo(() =>
        Object.values(collections).reduce((sum, itemArr) => sum + itemArr.length, 0),
        [collections]
    );

    // Creates a new empty collection folder
    const createCollectionSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = newFolderName.trim();
        if (!trimmedName) return;
        if (collections[trimmedName]) {
            return toast.error("A directory matching this structural name already exists.");
        }

        if (user) {
            try {
                await createCollection({ ownerId: user.uid, name: trimmedName, wallpapers: [] });
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

        // Guest: save to localStorage
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

    // Renames an existing collection folder
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
                await updateCollection(collectionMeta[folderToManage]._id, { name: trimmedNewName });
                await reloadCollections();
                setShowManageModal(false);
                if (selectedFolder === folderToManage) setSelectedFolder(trimmedNewName);
                toast.success(`Renamed to "${trimmedNewName}"`);
                return;
            } catch (error) {
                console.error('Rename failed:', error);
                toast.error('Could not rename the collection.');
            }
        }

        // Guest: update key in localStorage
        const updatedVaults = { ...collections };
        updatedVaults[trimmedNewName] = updatedVaults[folderToManage];
        delete updatedVaults[folderToManage];
        setCollections(updatedVaults);
        localStorage.setItem('user_collections', JSON.stringify(updatedVaults));
        extractDynamicBackdrop(updatedVaults);
        toast.success(`Renamed to "${trimmedNewName}"`);
        setShowManageModal(false);
        if (selectedFolder === folderToManage) setSelectedFolder(trimmedNewName);
    };

    // Deletes a collection folder and all its wallpapers
    const purgeCollectionFolder = async (folderKey) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${folderKey}"?`)) return;

        if (user && collectionMeta[folderKey]) {
            try {
                await deleteCollection(collectionMeta[folderKey]._id);
                await reloadCollections();
                setShowManageModal(false);
                if (selectedFolder === folderKey) setSelectedFolder(null);
                toast.success(`"${folderKey}" deleted.`);
                return;
            } catch (error) {
                console.error('Delete collection failed:', error);
                toast.error('Could not delete the collection.');
                return;
            }
        }

        // Guest: remove key from localStorage
        const updatedVaults = { ...collections };
        delete updatedVaults[folderKey];
        setCollections(updatedVaults);
        localStorage.setItem('user_collections', JSON.stringify(updatedVaults));
        extractDynamicBackdrop(updatedVaults);
        toast.success(`"${folderKey}" deleted.`);
        setShowManageModal(false);
        if (selectedFolder === folderKey) setSelectedFolder(null);
    };

    // Removes a single wallpaper from the currently open folder
    const extractItemFromFolder = async (photoId, event) => {
        event.stopPropagation();
        const currentTargetFiles = collections[selectedFolder] || [];
        const filteredPayload = currentTargetFiles.filter(
            item => item.id !== photoId && item.wallpaperId !== photoId
        );

        if (user && collectionMeta[selectedFolder]) {
            try {
                const collection = collectionMeta[selectedFolder];
                const remoteWallpapers = (collection.wallpapers || []).filter(
                    item => item.wallpaperId !== photoId
                );
                await updateCollection(collection._id, { wallpapers: remoteWallpapers });
                await reloadCollections();
                toast.success("Wallpaper removed from collection.");
                return;
            } catch (error) {
                console.error('Remove wallpaper failed:', error);
                toast.error('Could not remove wallpaper from the collection.');
                return;
            }
        }

        // Guest: filter out and save back to localStorage
        const updatedVaults = { ...collections, [selectedFolder]: filteredPayload };
        setCollections(updatedVaults);
        localStorage.setItem('user_collections', JSON.stringify(updatedVaults));
        extractDynamicBackdrop(updatedVaults);
        toast.success("Wallpaper removed from collection.");
    };

    // Downloads a wallpaper as a blob to bypass browser download restrictions
    const processBinarySystemDownload = async (assetUrl, alternativeText) => {
        try {
            toast.loading("Preparing download...");
            const response = await fetch(assetUrl);
            const rawBlob = await response.blob();
            const localizedBlobUrl = window.URL.createObjectURL(rawBlob);
            const actionNode = document.createElement('a');
            actionNode.href = localizedBlobUrl;
            actionNode.download = `${alternativeText.replace(/\s+/g, '-').toLowerCase()}-puffy.jpg`;
            document.body.appendChild(actionNode);
            actionNode.click();
            document.body.removeChild(actionNode);
            window.URL.revokeObjectURL(localizedBlobUrl);
            toast.dismiss();
            toast.success("Wallpaper downloaded!");
        } catch (error) {
            console.error("Download failed:", error);
            toast.dismiss();
            toast.error("Download failed. Please try again.");
        }
    };

    return (
        <div className="collections-page">

            {/* Animated fullscreen backdrop — uses first saved wallpaper or gradient fallback */}
            <div
                className={`fullscreen-bg-canvas ${bgImage ? 'has-image' : 'gradient-only'}`}
                style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}
            />
            <div className="fullscreen-bg-overlay" />

            {/* Hero section with page title and new collection CTA */}
            <div className="collections-hero">
                <div className="collections-hero-content">
                    <h1>Your Saved <span className="collections-gradient">Collections</span></h1>
                    <p>Organize, review, and manage your curated wallpaper sets</p>
                    <button className="btn-new-collection" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> New Collection
                    </button>
                </div>
            </div>

            {/* Stats bar showing folder and wallpaper counts */}
            <div className="collections-stats-bar">
                <div className="collections-stat">
                    <span>Total Folders: <strong>{Object.keys(collections).length} Directories</strong></span>
                </div>
                <div className="collections-stat">
                    <span>Total Wallpapers: <strong>{calculatedTotalItems} Assets</strong></span>
                </div>
            </div>

            <div className="collections-content">
                {!selectedFolder ? (

                    /* ── FOLDER GRID VIEW ── */
                    <div className="folders-grid">
                        {Object.keys(collections).map((folderKey) => {
                            // Get up to 4 wallpapers to show as a 2x2 preview mosaic
                            const previewPhotos = (collections[folderKey] || []).slice(0, 4);
                            // Fill remaining slots with placeholders so the grid always has 4 cells
                            const placeholderCount = Math.max(0, 4 - previewPhotos.length);

                            return (
                                <div
                                    key={folderKey}
                                    className="folder-card"
                                    onClick={() => setSelectedFolder(folderKey)}
                                >
                                    {/* 2x2 wallpaper mosaic preview */}
                                    <div className="folder-preview-grid">
                                        {previewPhotos.map((photo, i) => (
                                            <div key={i} className="folder-preview-tile">
                                                {(photo.src?.medium || photo.src?.large) ? (
                                                    <Image
                                                        src={photo.src?.medium || photo.src?.large}
                                                        alt={photo.alt || 'wallpaper'}
                                                        fill
                                                        style={{ objectFit: 'cover' }}
                                                        sizes="120px"
                                                    />
                                                ) : (
                                                    /* No image available — show gradient placeholder */
                                                    <div className="folder-preview-tile placeholder" />
                                                )}
                                            </div>
                                        ))}
                                        {/* Fill remaining grid cells with empty placeholders */}
                                        {Array.from({ length: placeholderCount }).map((_, i) => (
                                            <div key={`ph-${i}`} className="folder-preview-tile placeholder" />
                                        ))}
                                    </div>

                                    {/* Folder name, count, and manage button */}
                                    <div className="folder-info">
                                        <h3>{folderKey}</h3>
                                        <p>{collections[folderKey].length} wallpapers</p>
                                    </div>

                                    {/* Edit button — stops click propagation so it doesn't open the folder */}
                                    <button
                                        className="folder-manage-btn"
                                        onClick={(e) => openManageModal(folderKey, e)}
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                ) : (

                    /* ── ASSET LIST VIEW (inside a folder) ── */
                    <div className="assets-view">
                        <div className="assets-header">
                            <button className="btn-back" onClick={() => setSelectedFolder(null)}>
                                <ArrowLeft size={18} /> Back to Folders
                            </button>
                            <div className="assets-title-group">
                                <h2>{selectedFolder}</h2>
                                <p>Viewing {filteredWallpapers.length} items</p>
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
                                <p>{searchQuery ? "No matching wallpapers found." : "This collection is empty."}</p>
                            </div>
                        ) : (
                            <div className="assets-grid">
                                {filteredWallpapers.map((photo) => (
                                    <div
                                        key={photo.id || photo.wallpaperId}
                                        className="asset-card"
                                        onClick={() => openModal(photo)}
                                    >
                                        {/* Wallpaper image — clipped inside its own wrapper so overlay can escape */}
                                        <div className="asset-image-wrapper">
                                            <Image
                                                src={photo.src?.[imageFormat] || photo.src?.large || ''}
                                                alt={photo.alt || 'Wallpaper'}
                                                fill
                                                style={{ objectFit: 'cover' }}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>

                                        {/* Action overlay — appears on hover with download, share, delete */}
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
                                                    title="Remove from collection"
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

            {/* Create Collection Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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

            {/* Manage Collection Modal (rename / delete) */}
            {showManageModal && (
                <div className="modal-overlay" onClick={() => setShowManageModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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

/* CSS additions to append to collections.css */