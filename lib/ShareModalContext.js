'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import ShareModal from '../components/ShareModal';

const ShareModalContext = createContext();

export function ShareModalProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [wallpaper, setWallpaper] = useState(null);
    const [isClosing, setIsClosing] = useState(false);

    const openModal = useCallback((wallpaperData) => {
        setWallpaper(wallpaperData);
        setIsOpen(true);
        setIsClosing(false);
    }, []);

    const closeModal = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
            setWallpaper(null);
        }, 300); // Matches the CSS closing animation duration
    }, []);

    return (
        <ShareModalContext.Provider value={{ isOpen, wallpaper, openModal, closeModal, isClosing }}>
            {children}
            {(isOpen || isClosing) && (
                <ShareModal 
                    wallpaper={wallpaper} 
                    onClose={closeModal} 
                    isClosing={isClosing} 
                />
            )}
        </ShareModalContext.Provider>
    );
}

export function useShareModal() {
    return useContext(ShareModalContext);
}
