'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Trash2, ArrowLeft, Download, Share, Edit3, Search, FolderPlus, FolderInput } from 'lucide-react';
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

    // movePanelFor stores the photo ID that has its move popover open
    const [movePanelFor, setMovePanelFor] = useState(null);
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
            console.error("Critical error parsing collections:", error);
            toast.error("Unable to access local wallpaper storage.");
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
            toast.error('Unable to load your saved collections.');
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
            if (movePanelRef.current && !movePanelRef.current.contains(e.target)) {
                setMovePanelFor(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [movePanelFor]);

    // Filter wallpapers by title, photographer, or avg_color
    const filteredWallpapers = useMemo(() => {
        if (!selectedFolder || !collections[selectedFolder]) return [];
        const items = collections[selectedFolder];
        const query = searchQuery.trim().toLowerCase();
        if (!query) return items;

        return items.filter(photo => {
            const altText = (photo.alt || '').toLowerCase();
            const photographerName = (photo.photographer || '').toLowerCase();
            const matchesText = altText.includes(query) || photographerName.includes(query);
            const matchesFormat = photo.avg_color?.toLowerCase().includes(query) || false;
            return matchesText || matchesFormat;
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
            return toast.error("A folder with this name already exists.");
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
                toast.error('Could not create collection.');
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

    // Renames an existing collection folder
    const handleRenameFolder = async (e) => {
        e.preventDefault();
        const trimmedNewName = renameValue.trim();
        if (!trimmedNewName || trimmedNewName === folderToManage) {
            setShowManageModal(false);
            return;
        }
        if (collections[trimmedNewName]) {
            return toast.error("A folder with this name already exists.");
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
                toast.error('Could not rename collection.');
            }
        }

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
        if (!window.confirm(`Delete "${folderKey}" permanently?`)) return;

        if (user && collectionMeta[folderKey]) {
            try {
                await deleteCollection(collectionMeta[folderKey]._id);
                await reloadCollections();
                setShowManageModal(false);
                if (selectedFolder === folderKey) setSelectedFolder(null);
                toast.success(`"${folderKey}" deleted.`);
                return;
            } catch (error) {
                console.error('Delete failed:', error);
                toast.error('Could not delete collection.');
                return;
            }
        }

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
                toast.success("Wallpaper removed.");
                return;
            } catch (error) {
                console.error('Remove failed:', error);
                toast.error('Could not remove wallpaper.');
                return;
            }
        }

        const updatedVaults = { ...collections, [selectedFolder]: filteredPayload };
        setCollections(updatedVaults);
        localStorage.setItem('user_collections', JSON.stringify(updatedVaults));
        extractDynamicBackdrop(updatedVaults);
        toast.success("Wallpaper removed.");
    };

    // Moves a wallpaper from current folder to a target folder
    const moveWallpaperToFolder = async (photo, targetFolderName, event) => {
        event.stopPropagation();
        const photoId = photo.id || photo.wallpaperId;

        // Don't allow moving to the same folder
        if (targetFolderName === selectedFolder) {
            toast.error("Wallpaper is already in this folder.");
            setMovePanelFor(null);
            return;
        }

        // Check if wallpaper already exists in target folder
        const targetItems = collections[targetFolderName] || [];
        const alreadyExists = targetItems.some(
            item => (item.id || item.wallpaperId) === photoId
        );
        if (alreadyExists) {
            toast.error(`Already in "${targetFolderName}".`);
            setMovePanelFor(null);
            return;
        }

        if (user && collectionMeta[selectedFolder] && collectionMeta[targetFolderName]) {
            try {
                // Remove from source folder
                const sourceCol = collectionMeta[selectedFolder];
                const sourceRemaining = (sourceCol.wallpapers || []).filter(
                    item => item.wallpaperId !== photoId
                );
                await updateCollection(sourceCol._id, { wallpapers: sourceRemaining });

                // Add to target folder
                const targetCol = collectionMeta[targetFolderName];
                const targetUpdated = [
                    ...(targetCol.wallpapers || []),
                    {
                        wallpaperId: String(photoId),
                        addedAt: new Date().toISOString(),
                        metadata: photo,
                    },
                ];
                await updateCollection(targetCol._id, { wallpapers: targetUpdated });

                await reloadCollections();
                toast.success(`Moved to "${targetFolderName}".`);
            } catch (error) {
                console.error('Move failed:', error);
                toast.error('Could not move wallpaper.');
            }
        } else {
            // Guest localStorage move
            const updatedVaults = { ...collections };

            // Remove from source
            updatedVaults[selectedFolder] = (updatedVaults[selectedFolder] || []).filter(
                item => (item.id || item.wallpaperId) !== photoId
            );

            // Add to target
            updatedVaults[targetFolderName] = [...(updatedVaults[targetFolderName] || []), photo];

            setCollections(updatedVaults);
            localStorage.setItem('user_collections', JSON.stringify(updatedVaults));
            extractDynamicBackdrop(updatedVaults);
            toast.success(`Moved to "${targetFolderName}".`);
        }

        setMovePanelFor(null);
    };

    // Downloads a wallpaper as a blob
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
            toast.error("Download failed.");
        }
    };

    // Other folder names (excluding the current one) for the move popover
    const otherFolders = Object.keys(collections).filter(k => k !== selectedFolder);

    return (
        <div className="collections-page">
            <div
                className={`fullscreen-bg-canvas ${bgImage ? 'has-image' : 'gradient-only'}`}
                style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}
            />
            <div className="fullscreen-bg-overlay" />

            {/* Hero */}
            <div className="collections-hero">
                <div className="collections-hero-content">
                    <h1>Your Saved <span className="collections-gradient">Collections</span></h1>
                    <p>Organize, review, and manage your curated wallpaper sets</p>
                    <button className="btn-new-collection" onClick={() => setShowCreateModal(true)}>
                        <Plus size={22} color="#0f1115" strokeWidth={2.5} />
                        New Collection
                    </button>
                </div>
            </div>

            {/* Stats bar */}
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
                            const previewPhotos = (collections[folderKey] || []).slice(0, 4);
                            const placeholderCount = Math.max(0, 4 - previewPhotos.length);

                            return (
                                <div
                                    key={folderKey}
                                    className="folder-card"
                                    onClick={() => setSelectedFolder(folderKey)}
                                >
                                    {/* 2x2 mosaic preview */}
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
                                                    <div className="folder-preview-tile placeholder" />
                                                )}
                                            </div>
                                        ))}
                                        {Array.from({ length: placeholderCount }).map((_, i) => (
                                            <div key={`ph-${i}`} className="folder-preview-tile placeholder" />
                                        ))}
                                    </div>

                                    <div className="folder-info">
                                        <h3>{folderKey}</h3>
                                        <p>{collections[folderKey].length} wallpapers</p>
                                    </div>

                                    {/* Edit button — stops propagation so folder doesn't open */}
                                    <button
                                        className="folder-manage-btn"
                                        onClick={(e) => openManageModal(folderKey, e)}
                                    >
                                        <Edit3 size={18} color="#ffffff" strokeWidth={2} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                ) : (

                    /* ── ASSET LIST VIEW ── */
                    <div className="assets-view">
                        <div className="assets-header">
                            <button className="btn-back" onClick={() => setSelectedFolder(null)}>
                                <ArrowLeft size={18} color="#ffffff" strokeWidth={2} />
                                Back to Folders
                            </button>
                            <div className="assets-title-group">
                                <h2>{selectedFolder}</h2>
                                <p>Viewing {filteredWallpapers.length} items</p>
                            </div>
                            <div className="assets-search-wrapper">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by title or photographer..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {filteredWallpapers.length === 0 ? (
                            <div className="empty-assets">
                                <FolderPlus size={56} color="#64748b" />
                                <p>{searchQuery ? "No matching wallpapers found." : "This collection is empty."}</p>
                            </div>
                        ) : (
                            <div className="assets-grid">
                                {filteredWallpapers.map((photo) => {
                                    const photoId = photo.id || photo.wallpaperId;
                                    const isMoveOpen = movePanelFor === photoId;

                                    return (
                                        <div
                                            key={photoId}
                                            className="asset-card"
                                            onClick={() => openModal(photo)}
                                        >
                                            {/* Image — clipped by its own wrapper */}
                                            <div className="asset-image-wrapper">
                                                <Image
                                                    src={photo.src?.[imageFormat] || photo.src?.large || ''}
                                                    alt={photo.alt || 'Wallpaper'}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            </div>

                                            {/* Action overlay — visible on hover */}
                                            <div className="asset-overlay">
                                                <div className="asset-actions">
                                                    {/* Download */}
                                                    <button
                                                        className="asset-btn"
                                                        title="Download"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            processBinarySystemDownload(photo.src?.original, photo.alt || 'wallpaper');
                                                        }}
                                                    >
                                                        <Download size={20} color="#ffffff" strokeWidth={2} />
                                                    </button>

                                                    {/* Share */}
                                                    <button
                                                        className="asset-btn"
                                                        title="Share"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openModal(photo);
                                                        }}
                                                    >
                                                        <Share size={20} color="#ffffff" strokeWidth={2} />
                                                    </button>

                                                    {/* Move to another folder — shows popover with folder list */}
                                                    <div className="move-btn-wrapper" ref={isMoveOpen ? movePanelRef : null}>
                                                        <button
                                                            className="asset-btn"
                                                            title="Move to folder"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Toggle the move popover for this specific card
                                                                setMovePanelFor(isMoveOpen ? null : photoId);
                                                            }}
                                                        >
                                                            <FolderInput size={20} color="#ffffff" strokeWidth={2} />
                                                        </button>

                                                        {/* Move popover — lists all other folders */}
                                                        {isMoveOpen && (
                                                            <div className="move-popover" onClick={(e) => e.stopPropagation()}>
                                                                <p className="move-popover-title">Move to folder</p>
                                                                {otherFolders.length === 0 ? (
                                                                    <p className="move-popover-empty">No other folders available.</p>
                                                                ) : (
                                                                    otherFolders.map((folderName) => (
                                                                        <button
                                                                            key={folderName}
                                                                            className="move-target-btn"
                                                                            onClick={(e) => moveWallpaperToFolder(photo, folderName, e)}
                                                                        >
                                                                            <FolderPlus size={14} color="#94a3b8" strokeWidth={2} />
                                                                            {folderName}
                                                                        </button>
                                                                    ))
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Remove from collection */}
                                                    <button
                                                        className="asset-btn btn-delete"
                                                        title="Remove from collection"
                                                        onClick={(e) => extractItemFromFolder(photoId, e)}
                                                    >
                                                        <Trash2 size={20} color="#ffffff" strokeWidth={2} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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

            {/* Manage Collection Modal */}
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
                                    <Trash2 size={18} color="#ef4444" strokeWidth={2} />
                                    Delete Collection
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