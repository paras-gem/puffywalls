'use client';

import { useEffect, useState } from "react";
import { Download, FolderPlus, Heart } from "lucide-react";
import './home.css'; // Using the styling from your homepage structure

const CATEGORIES = ["All", "Anime", "Nature"];

export default function Page() {
    const [wallpapers, setWallpapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuery, setCurrentQuery] = useState('All'); 

    const fetchWallpapers = async (queryToFetch) => {
        setLoading(true); 
        try {
            const response = await fetch(`/api/wallpapers?query=${queryToFetch}&per_page=30`);
            const data = await response.json();
            setWallpapers(data.photos || []);
        } catch(error) {
            console.error("Failed to load wallpapers:", error);
        } finally {
            setLoading(false); 
        }
    };

    // Correct dependency array: ensures it syncs if currentQuery updates
    useEffect(() => {
        fetchWallpapers(currentQuery);
    }, [currentQuery]); 

    const handleCategoryClick = (category) => {
        setCurrentQuery(category);
    };

    return (
        <main className='home-page'>
            {/* HERO SECTION */}
            <section className='hero'>
                <h1 className='hero-title'> Welcome To Puffywalls </h1>
                <p className='hero-subtitle'> Discover Stunning, Dreamy and high quality wallpapers.</p>

                {/* DYNAMIC CATEGORIES ROW */}
                <div className="categories-container">
                    {CATEGORIES.map((cat) => (
                        <button 
                            key={cat}
                            onClick={() => handleCategoryClick(cat)}
                            className={`category-btn ${currentQuery === cat ? 'active' : ''}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            {/* DYNAMIC WALLPAPERS SECTION */}
            <div className="explore-content" style={{ padding: '0 2rem' }}>
                <h3 className="query-title" style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                    Showing results for: <span style={{ color: '#ff69b4', fontWeight: 'bold' }}>{currentQuery}</span>
                </h3>

                {loading ? (
                    /* LOADING STATE */
                    <div className="loading-container" style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <div className="spinner"></div>
                        <p style={{ marginTop: '1rem', color: '#666' }}>Fetching beautiful wallpapers...</p>
                    </div>
                ) : (
                    /* STANDARD GRID MAPPED FROM API */
                    <section className="wallpapers-grid">
                        {wallpapers.map((wallpaper) => (
                            <div key={wallpaper.id} className="wallpaper-card">
                                <img 
                                    src={wallpaper.src.large} 
                                    alt={wallpaper.alt || 'Wallpaper'} 
                                    className="wallpaper-img" 
                                    loading="lazy" 
                                />
                                
                                <div className="wallpaper-overlay">
                                    <div className="wallpaper-info">
                                        <h3>{wallpaper.alt || 'Untitled Artwork'}</h3>
                                        {/* Display photographer tag as requested */}
                                        <p className="photographer-name">📸 {wallpaper.photographer}</p>
                                    </div>
                                    <div className="wallpaper-actions">
                                        <button className="wallpaper-btn" title="like"> <Heart size={20}/> </button>
                                        <button className="wallpaper-btn" title="Save"> <FolderPlus size={20}/> </button>
                                        <button className="wallpaper-btn" title="download"> <Download size={20}/> </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>
                )}
            </div>
        </main>    
    );
}