'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Trash2, ArrowLeft, Download, Share, Pencil, Search, FolderPlus, CloudUpload, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useShareModal } from '@/lib/ShareModalContext';
import { useImageFormat } from "@/hooks/useImageFormat";
import { toast } from "sonner";
import { fetchUserCollections, createCollection, updateCollection, deleteCollection } from '@/lib/api';
import './collections.css';

export default function Collections() {
    const { user, googleToken } = useAuth(); 
    const [collections, setCollections] = useState({});
    const [collectionMeta, setCollectionMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [bgImage, setBgImage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Tracking active sync states per folder key
    const [syncingFolders, setSyncingFolders] = useState({});

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);

    // Input fields
    const [newFolderName, setNewFolderName] = useState('');
    const [folderToManage, setFolderToManage] = useState('');
    const [renameValue, setRenameValue] = useState('');

    const imageFormat = useImageFormat();
    const { openModal } = useShareModal();

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
        if (user) return loadRemoteCollections();
        return loadLocalCollections();
    }, [user, loadRemoteCollections, loadLocalCollections]);

    useEffect(() => {
        setCollections({});
        reloadCollections();
    }, [reloadCollections]);

    // Batch upload an entire collection folder to Google Drive
    const handleSyncFolderToDrive = async (folderName, event) => {
        event.stopPropagation(); // Prevents clicking the button from opening the directory page view

        if (!user) {
            toast.error("Please sign in with Google to sync collections to your cloud storage.");
            return;
        }

        // Check contextual token locations 
        const activeToken = googleToken || localStorage.getItem("gdrive_access_token");

        if (!activeToken) {
            toast.error("Google account authorization scope missing. Please log out and sign back in.");
            return;
        }

        const assetsToUpload = collections[folderName] || [];
        if (assetsToUpload.length === 0) {
            toast.error(`Cannot sync an empty collection folder.`);
            return;
        }

        // Lock button processing state
        setSyncingFolders(prev => ({ ...prev, [folderName]: true }));
        const toastId = toast.loading(`Syncing "${folderName}" assets to Drive...`);

        try {
            // FIX: Pointing cleanly to '/api/drive' directly matching your flat file structure
            const response = await fetch('/api/drive', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeToken}`
                },
                body: JSON.stringify({
                    folderName: folderName,
                    wallpapers: assetsToUpload.map(w => ({
                        url: w.src?.original || w.src?.large2x || w.src?.large,
                        filename: `${w.alt?.replace(/\s+/g, '-').toLowerCase() || 'wallpaper'}-${w.id || w.wallpaperId}.jpg`
                    }))
                })
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server engine returned bad HTML format payload instead of operational JSON.");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed directory synchronization.");
            }

            toast.success(`"${folderName}" synced securely to Drive!`, { id: toastId });
        } catch (error) {
            console.error("Google Drive connection failure:", error);
            toast.error(error.message || "Failed driving asset updates.", { id: toastId });
        } finally {
            setSyncingFolders(prev => ({ ...prev, [folderName]: false }));
        }
    };

    const filteredWallpapers = useMemo(() => {
        if (!selectedFolder || !collections[selectedFolder]) return [];
        const items = collections[selectedFolder];
        const query = searchQuery.trim().toLowerCase();
        if (!query) return items;

        return items.filter(photo => {
            const searchString = JSON.stringify(photo).toLowerCase();
            return searchString.includes(query);
        });
    }, [selectedFolder, collections, searchQuery]);

    const calculatedTotalItems = useMemo(() =>
        Object.values(collections).reduce((sum, itemArr) => sum + itemArr.length, 0),
        [collections]
    );

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

    const purgeCollectionFolder = async (folderKey) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${folderKey}"?`)) return;

        if (user && collectionMeta[folderKey]) {
            try {
                await deleteCollection(collectionMeta[folderKey]._id, user.uid);
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

        const updatedVaults = { ...collections };
        delete updatedVaults[folderKey];
        setCollections(updatedVaults);
        localStorage.setItem('user_collections', JSON.stringify(updatedVaults));
        extractDynamicBackdrop(updatedVaults);
        toast.success(`"${folderKey}" deleted.`);
        setShowManageModal(false);
        if (selectedFolder === folderKey) setSelectedFolder(null);
    };

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

        const updatedVaults = { ...collections, [selectedFolder]: filteredPayload };
        setCollections(updatedVaults);
        localStorage.setItem('user_collections', JSON.stringify(updatedVaults));
        extractDynamicBackdrop(updatedVaults);
        toast.success("Wallpaper removed from collection.");
    };

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
            <div
                className={`fullscreen-bg-canvas ${bgImage ? 'has-image' : 'gradient-only'}`}
                style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}
            />
            <div className="fullscreen-bg-overlay" />

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
                    <div className="folders-grid">
                        {Object.keys(collections).map((folderKey) => {
                            const previewPhotos = (collections[folderKey] || []).slice(0, 4);
                            const placeholderCount = Math.max(0, 4 - previewPhotos.length);
                            const isSyncing = !!syncingFolders[folderKey];

                            return (
                                <div
                                    key={folderKey}
                                    className="folder-card"
                                    onClick={() => setSelectedFolder(folderKey)}
                                >
                                    {/* PREVIEW CONTAINER SECTION */}
                                    <div className="folder-preview-container" style={{ position: 'relative' }}>
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

                                        {/* INTEGRATED DRIVE OVERLAY UTILITY ICON GRID */}
                                        <div className="folder-preview-overlay-controls" style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            display: 'flex',
                                            gap: '6px',
                                            zIndex: 20
                                        }}>
                                            <button
                                                className={`folder-sync-action-btn ${isSyncing ? 'loading' : ''}`}
                                                title="Sync collection batch directly to Google Drive"
                                                onClick={(e) => handleSyncFolderToDrive(folderKey, e)}
                                                disabled={isSyncing}
                                                style={{
                                                    backgroundColor: 'rgba(15, 17, 21, 0.85)',
                                                    backdropFilter: 'blur(4px)',
                                                    padding: '8px',
                                                    borderRadius: '50%',
                                                    border: '1px solid rgba(255,255,255,0.12)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                                                    transition: 'transform 0.2s ease, background-color 0.2s'
                                                }}
                                            >
                                                {isSyncing ? (
                                                    <Loader2 size={16} className="animate-spin" color="#eab308" />
                                                ) : (
                                                    <CloudUpload size={16} color="#22c55e" strokeWidth={2.5} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* FOLDER METADATA INFOBAR */}
                                    <div className="folder-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3>{folderKey}</h3>
                                            <p>{collections[folderKey].length} wallpapers</p>
                                        </div>
                                        <button
                                            className="folder-manage-btn"
                                            onClick={(e) => openManageModal(folderKey, e)}
                                            style={{
                                                backgroundColor: 'transparent',
                                                padding: '6px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Pencil size={16} color="#94a3b8" strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="assets-view">
                        <div className="assets-header">
                            <button className="btn-back" onClick={() => setSelectedFolder(null)}>
                                <ArrowLeft size={22} color="#ffffff" strokeWidth={2} />
                                Back to Folders
                            </button>
                            <div className="assets-title-group">
                                <h2>{selectedFolder}</h2>
                                <p>Viewing {filteredWallpapers.length} items</p>
                            </div>
                            <div className="assets-search-wrapper">
                                <Search size={22} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by keywords or creator..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {filteredWallpapers.length === 0 ? (
                            <div className="empty-assets">
                                <FolderPlus size={56} color="#cbd5e1" />
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
                                        <div className="asset-image-wrapper">
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
                                                    <Download size={22} color="#ffffff" strokeWidth={2} />
                                                </button>
                                                <button
                                                    className="asset-btn"
                                                    title="Share"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openModal(photo);
                                                    }}
                                                >
                                                    <Share size={22} color="#ffffff" strokeWidth={2} />
                                                </button>
                                                <button
                                                    className="asset-btn btn-delete"
                                                    title="Remove from collection"
                                                    onClick={(e) => extractItemFromFolder(photo.id || photo.wallpaperId, e)}
                                                >
                                                    <Trash2 size={22} color="#ffffff" strokeWidth={2} />
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
                                    <Trash2 size={20} color="#ef4444" strokeWidth={2} />
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