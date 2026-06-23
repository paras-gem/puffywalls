import './about.css';

export default function About() {
    return (
        <div className="about-page">
            <div className="about-container">
                <div className="about-hero">
                    <div className="hero-icon">
                        {/* A dreamy cloud icon */}
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                        </svg>
                    </div>
                    <h1>About Puffywalls</h1>
                    <p className="hero-subtitle">Discover stunning, dreamy and high quality wallpapers.</p>
                </div>  

                <div className="about-content">
                    <div className="about-card">
                        <div className="card-header">
                            <span className="icon">✨</span>
                            <h2>Our Mission</h2>
                        </div>
                        <div className="card-body">
                            <p>To provide the most dreamy, beautiful, and high-quality wallpapers for your devices. We believe your screen should reflect your style and bring you joy every day.</p>
                        </div>
                    </div>

                    <div className="about-card">
                        <div className="card-header">
                            <span className="icon">💻</span>
                            <h2>Tech Stack</h2>
                        </div>
                        <div className="card-body">
                            <ul className="tech-list">
                                <li>Next.js - Framework</li>
                                <li>React - UI Library</li>
                                <li>Plain CSS - Styling</li>
                                <li>MongoDB - Database </li>
                                <li> Firebase - Authentication</li>
                            </ul>
                        </div>
                    </div>

                    <div className="about-card db-structure">
                        <div className="card-header">
                            <span className="icon">🗄️</span>
                            <h2>Database Structure</h2>
                        </div>
                        <div className="card-body">
                            <h3>Users</h3>
                            <p>Stores user profiles, preferences, and authentication data.</p>
                            <h3>Wallpapers</h3>
                            <p>Contains image metadata, tags, uploaders, and download counts.</p>
                        </div>
                    </div>

                    
                    
                </div>
            </div>
        </div>
    );
}
