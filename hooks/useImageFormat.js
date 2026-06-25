'use client';

import { useState, useEffect } from 'react';

export function useImageFormat() {
    // Default to 'large' for SSR — window is unavailable on the server,
    // so we pick a safe middle-ground size before hydration kicks in.
    const [imageFormat, setImageFormat] = useState('large');

    useEffect(() => {
        /**
         * Reads the current viewport width and sets the correct Pexels
         * image size key. Called immediately on mount and on every resize.
         */
        const handleResize = () => {
            const width = window.innerWidth;

            if (width <= 640) {
                setImageFormat('portrait');   // tall crop for mobile portrait screens
            } else if (width <= 1024) {
                setImageFormat('large');      // balanced for tablets and small desktops
            } else {
                setImageFormat('large2x');    // crisp double-res for large monitors
            }
        };

        // Run once immediately so the correct format is set before the first render
        handleResize();

        // Re-evaluate when the user resizes the browser window
        window.addEventListener('resize', handleResize);

        // Cleanup: remove the listener to prevent memory leaks on unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []); // empty deps — set up once, cleaned up once

    return imageFormat;
}
