'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, ImageIcon, Trash2, ArrowLeft, Download, Share, FolderHeart, Edit3, Search, Image as ImageIconSec, FolderPlus } from 'lucide-react';
import { useShareModal } from '../../lib/ShareModalContext';
import { useImageFormat } from "@/hooks/useImageFormat";
import { toast } from "sonner";
import './collections.css';

export default function Collections() {
    // === STATE MANAGEMENT ===
    const [collections, setCollections] = useState({});
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
     * 📥 INTEGRATED FILE RECOVERY DECK
     */
    const loadUserVaults = () => {
        setLoading(true);
        try {
            const vaultPayload = localStorage.getItem('user_collections');
            if (vaultPayload) {
                const parsedData = JSON.parse(vaultPayload);
                setCollections(parsedData);
                extractDynamicBackdrop(parsedData);
            } else {
                const seedData = {
                    "Favorites": [],
                    "Aesthetic Themes": [],
                    "Neon Horizon Setup": []
                };
                localStorage.setItem('user_collections', JSON.stringify(seedData));
                setCollections(seedData);
            }
        } catch (error) {
            console.error("Critical error parsing internal collections context:", error);
            toast.error("Unable to access local client wallpaper storage vault.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * 🌌 DYNAMIC BACKDROP EXTRACTOR
     * Selects a high-quality preview asset from your real collections to map onto the fullscreen canvas
     */
    const extractDynamicBackdrop = (vaultData) => {
        const folderKeys = Object.keys(vaultData);
        for (const key of folderKeys) {
            if (vaultData[key] && vaultData[key].length > 0) {
                // Find the first valid high-res image path available
                const firstAsset = vaultData[key][0];
                const targetSrc = firstAsset.src?.large2x || firstAsset.src?.original || firstAsset.src?.large;
                if (targetSrc) {
                    setBgImage(targetSrc);
                    break;
                }
            }
        }
    };

    useEffect(() => {
        loadUserVaults();
        window.addEventListener('storage', loadUserVaults);
        return () => window.removeEventListener('storage', loadUserVaults);
    }, []);

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

    const calculatedTotalItems = Object.values(collections).reduce((sum, itemArr) => sum + itemArr.length, 0);

    // === MUTATION CONTROLS ===

    const createCollectionSubmit = (e) => {
        e.preventDefault();
        const trimmedName = newFolderName.trim();
        
        if (!trimmedName) return;
        if (collections[trimmedName]) {
            return toast.error("A directory matching this structural name already exists.");
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

    const handleRenameFolder = (e) => {
        e.preventDefault();
        const trimmedNewName = renameValue.trim();

        if (!trimmedNewName || trimmedNewName === folderToManage) {
            setShowManageModal(false);
            return;
        }

        if (collections[trimmedNewName]) {
            return toast.error("A folder named inside this directory already exists.");
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

    const purgeCollectionFolder = (folderKey) => {
        if (window.confirm(`Are you sure you want to permanently delete "${folderKey}" and remove its contents?`)) {
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
        }
    };

    const extractItemFromFolder = (photoId, event) => {
        event.stopPropagation();
        const currentTargetFiles = collections[selectedFolder] || [];
        const filteredPayload = currentTargetFiles.filter(item => item.id !== photoId);
        
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

            {/* MAIN CONTENT HUB */}
            <div className="collections-content">
                <div className="collections-search-global">
                    <input
                        type="text"
                        className="wallpaper-search-input"
                        placeholder={selectedFolder ? `Search saved wallpapers in ${selectedFolder}...` : 'Search saved wallpapers...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {loading ? (
                    <div className="collections-loading">
                        <div className="spinner"></div>
                        <p>Synchronizing internal wallpaper files...</p>
                    </div>
                ) : !selectedFolder ? (
                    /* =========================================================================
                       🗂️ MAIN VIEW LAYER: ARCHITECTURE FOLDER TILES
                       ========================================================================= */
                    <>
                        <h2 className="section-title">
                            <span>Library Folders</span>
                        </h2>
                        
                        {Object.keys(collections).length === 0 ? (
                            <div className="collections-empty">
                                <div className="empty-icon">
                                    <FolderHeart size={36} />
                                </div>
                                <h2>No Collection Folders Found</h2>
                                <p>Click the "New Collection" button above to get started, or save direct assets inside the wallpaper detail layouts.</p>
                            </div>
                        ) : (
                            <div className="collections-grid">
                                {Object.keys(collections).map((folderName, idx) => {
                                    const savedAssets = collections[folderName] || [];
                                    const assetsLength = savedAssets.length;
                                    const previewAssets = savedAssets.slice(0, 4);

                                    return (
                                        <div 
                                            key={folderName} 
                                            className="collection-card"
                                            onClick={() => setSelectedFolder(folderName)}
                                            style={{ animationDelay: `${idx * 0.05}s` }}
                                        >
                                            {/* IMAGE PREVIEW FRAME BLOCK */}
                                            {assetsLength >= 1 ? (
                                                <div className="collection-preview">
                                                    {previewAssets.map((photo, pIdx) => (
                                                        <img 
                                                            key={photo.id || pIdx} 
                                                            src={photo.src?.medium || photo.src?.large} 
                                                            alt="Directory Sample Cover" 
                                                        />
                                                    ))}
                                                    {assetsLength < 4 && Array.from({ length: 4 - assetsLength }).map((_, padIdx) => (
                                                        <div key={`pad-${padIdx}`} style={{ background: 'rgba(255,255,255,0.02)' }}></div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="collection-preview-placeholder">
                                                    <ImageIcon size={32} />
                                                </div>
                                            )}

                                            {/* DIRECTORY BOTTOM BAR META ENTRY */}
                                            <div className="collection-footer">
                                                <div>
                                                    <h3 className="collection-name">{folderName}</h3>
                                                    <p className="collection-count">{assetsLength} items saved</p>
                                                </div>
                                                
                                                <button 
                                                    className="collection-menu-btn"
                                                    title="Manage Folder"
                                                    onClick={(e) => openManageModal(folderName, e)}
                                                >
                                                    <Edit3 size={15} color="#a6c1ee" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    /* =========================================================================
                       🖼️ NESTED VIEW LAYER: DRILLDOWN WALLPAPER CANVAS BLOCKS
                       ========================================================================= */
                    <>
                        <button className="btn-back" onClick={() => { setSelectedFolder(null); setSearchQuery(''); }}>
                            <ArrowLeft size={16} /> Return to Directory List
                        </button>
                        
                        <h2 className="section-title">
                            Folder Content: <span>{selectedFolder}</span>
                        </h2>

                        {(!collections[selectedFolder] || collections[selectedFolder].length === 0) ? (
                            <div className="collections-empty">
                                <div className="empty-icon">
                                    <ImageIconSec size={36} />
                                </div>
                                <h2>This folder is empty</h2>
                                <p>Open a wallpaper's full detail screen elsewhere in the application, and save items into your custom "{selectedFolder}" folder to populate this page.</p>
                            </div>
                        ) : (
                            <>
                                {/* per-item search moved to global search above */}
                                <div className="collection-wallpapers-grid">
                                {filteredWallpapers.length === 0 ? (
                                    <div className="collections-empty">
                                        <div className="empty-icon">
                                            <Search size={36} />
                                        </div>
                                        <h2>No Saved Wallpapers Match</h2>
                                        <p>Try another keyword or remove the search filter to view all saved wallpapers.</p>
                                    </div>
                                ) : (
                                    filteredWallpapers.map((photo, itemIdx) => (
                                        <div 
                                            key={photo.id} 
                                            className="saved-wallpaper-card"
                                            onClick={() => openModal(photo)}
                                            style={{ animationDelay: `${itemIdx * 0.04}s` }}
                                        >
                                                <div className="saved-wallpaper-inner">
                                                    <img 
                                                        src={photo.src[imageFormat] || photo.src.large} 
                                                        alt={photo.alt || 'Personal Curation Asset'} 
                                                        loading="lazy"
                                                    />
                                                </div>

                                            <div className="saved-wallpaper-overlay">
                                                <button 
                                                    className="collection-menu-btn"
                                                    title="Delete item from folder"
                                                    style={{ opacity: 1, backgroundColor: 'rgba(15,17,21,0.75)' }}
                                                    onClick={(e) => extractItemFromFolder(photo.id, e)}
                                                >
                                                    <Trash2 size={15} color="#ff4757" />
                                                </button>
                                                
                                                <button 
                                                    className="collection-menu-btn"
                                                    title="Download raw source file"
                                                    style={{ opacity: 1, backgroundColor: 'rgba(15,17,21,0.75)' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        processBinarySystemDownload(photo.src.original, photo.alt || 'curated-wallpaper');
                                                    }}
                                                >
                                                    <Download size={15} color="#ffffff" />
                                                </button>

                                                <button 
                                                    className="collection-menu-btn"
                                                    title="Inspect details"
                                                    style={{ opacity: 1, backgroundColor: 'rgba(15,17,21,0.75)' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openModal(photo);
                                                    }}
                                                >
                                                    <Share size={15} color="#ffffff" />
                                                </button>
                                                
                                                <button
                                                    className="collection-menu-btn move-btn"
                                                    title="Move to another folder"
                                                    style={{ opacity: 1, backgroundColor: 'rgba(15,17,21,0.75)' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMovePanelFor(photo.id);
                                                        const firstOther = Object.keys(collections).find(k => k !== selectedFolder) || '';
                                                        setMoveTarget(firstOther);
                                                    }}
                                                >
                                                    <FolderPlus size={14} color="#fff" />
                                                </button>

                                                {movePanelFor === photo.id && (
                                                    <div className="move-popover" ref={movePanelRef} onClick={(e) => e.stopPropagation()}>
                                                        <div className="move-popover-title">Move to</div>
                                                        <div className="move-popover-list">
                                                            {Object.keys(collections).filter(k => k !== selectedFolder).length === 0 ? (
                                                                <div className="move-empty">No other folders</div>
                                                            ) : (
                                                                Object.keys(collections).filter(k => k !== selectedFolder).map((k) => (
                                                                    <button
                                                                        key={k}
                                                                        className={`move-target-btn ${moveTarget === k ? 'active' : ''}`}
                                                                        onClick={() => setMoveTarget(k)}
                                                                    >
                                                                        {k}
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                        <div className="move-popover-actions">
                                                            <button
                                                                className="btn-modal-cancel"
                                                                onClick={() => { setMovePanelFor(null); setMoveTarget(''); }}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                className="btn-modal-confirm"
                                                                onClick={() => {
                                                                    if (!moveTarget) return toast.error('Select a target folder first.');
                                                                    const from = selectedFolder;
                                                                    const to = moveTarget;
                                                                    if (from === to) return toast.error('Already in selected folder.');
                                                                    const items = collections[from] || [];
                                                                    const moving = items.find(i => i.id === photo.id);
                                                                    if (!moving) return toast.error('Item not found.');
                                                                    const updatedFrom = items.filter(i => i.id !== photo.id);
                                                                    const updatedVaults = { ...collections, [from]: updatedFrom, [to]: [...(collections[to]||[]), moving] };
                                                                    setCollections(updatedVaults);
                                                                    localStorage.setItem('user_collections', JSON.stringify(updatedVaults));
                                                                    setMovePanelFor(null);
                                                                    setMoveTarget('');
                                                                    extractDynamicBackdrop(updatedVaults);
                                                                    toast.success(`Moved to ${to}`);
                                                                }}
                                                            >
                                                                Move
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* =========================================================================
               📂 MODAL DIALOG COMPONENT: COMPILING NEW COLLECTIONS
               ========================================================================= */}
            {showCreateModal && (
                <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
                    <div className="collection-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Create New Collection</h2>
                        <p>Enter a unique directory tag name to organize your saved device wallpapers</p>
                        
                        <form onSubmit={createCollectionSubmit}>
                            <input 
                                type="text" 
                                placeholder="e.g., Ultra Dark Setups..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                maxLength={24}
                                required
                                autoFocus
                            />
                            
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn-modal-cancel" 
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel Selection
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-modal-confirm"
                                >
                                    Build Folder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================================================
               ⚙️ MODAL DIALOG COMPONENT: MANAGE / RENAME COLLECTIONS
               ========================================================================= */}
            {showManageModal && (
                <div className="modal-backdrop" onClick={() => setShowManageModal(false)}>
                    <div className="collection-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Manage Collection</h2>
                        <p>Modify settings or rename the directory reference token for "{folderToManage}"</p>
                        
                        <form onSubmit={handleRenameFolder}>
                            <input 
                                type="text" 
                                placeholder="Rename folder..."
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                maxLength={24}
                                required
                                autoFocus
                            />
                            
                            <div className="modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                <button 
                                    type="button" 
                                    style={{ border: 'none', background: 'transparent', color: '#ff4757', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
                                    onClick={() => purgeCollectionFolder(folderToManage)}
                                >
                                    <Trash2 size={16} /> Delete Folder
                                </button>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button 
                                        type="button" 
                                        className="btn-modal-cancel" 
                                        onClick={() => setShowManageModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn-modal-confirm"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}