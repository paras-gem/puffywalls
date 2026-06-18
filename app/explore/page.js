'use client';

import { useEffect, useState } from "react";
import SearchBar from "../../components/SearchBar"; 
import './ExplorePage.css'; 

const CATEGORIES = ["Abstract", "AMOLED", "Nature", "Minimalist", "Gaming", "Anime", "Architecture", "Cars"];

export default function ExplorePage() {
    const [wallpapers, setWallpapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuery, setCurrentQuery] = useState('Abstract'); 

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

    useEffect(() => {
        fetchWallpapers(currentQuery);
    }, []); 

    const handleSearch = (searchTerm) => {
        setCurrentQuery(searchTerm); 
        fetchWallpapers(searchTerm); 
    };

    const handleCategoryClick = (category) => {
        setCurrentQuery(category);
        fetchWallpapers(category);
    };

    return (
        <div className="explore-page-container">
            
            {/* HERO SECTION WITH BACKGROUND IMAGE */}
            <div className="explore-hero">
                <div className="explore-hero-overlay"></div>
                <div className="explore-hero-content">
                    <h1>Explore the Best Wallpapers</h1>
                    <p>Curated high-quality backgrounds for your screens</p>
                    
                    {/* Search Bar is now inside the Hero Section, perfectly spaced */}
                    <div className="hero-search-wrapper">
                        <SearchBar onSearch={handleSearch} />
                    </div>
                </div>
            </div>

            {/* CATEGORIES ROW */}
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

            <div className="explore-content">
                <h3 className="query-title">Showing results for: <span>{currentQuery}</span></h3>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Fetching beautiful wallpapers...</p>
                    </div>
                ) : (
                    <div className="wallpaper-grid">
                        {wallpapers.map((wallpaper) => (
                            <div key={wallpaper.id} className="wallpaper-card">
                                <img 
                                    src={wallpaper.src.large} // optimized for mobile phones
                                    alt={wallpaper.alt || 'Wallpaper'} 
                                    className="wallpaper-image"
                                />
                                <div className="wallpaper-overlay">
                                    <p className="photographer-name">📸 {wallpaper.photographer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
