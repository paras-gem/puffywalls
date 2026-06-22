'use client'

import './Footer.css';

export default function Footer() {
    return (
        <footer className="puffy-footer">
            <div className="footer-top">
                {/* Brand Section */}
                <div className="footer-brand">
                    <h2>PuffyWalls</h2>
                    <p>Discover stunning, high-quality aesthetic wallpapers. Handpicked and updated daily to give your screens a fresh new look.</p>
                </div>

                {/* Navigation & Support Links */}
                <div className="footer-links-group">
                    <h4>Explore & Support</h4>
                    <a href="/explore">Discover</a>
                    <a href="/trending">Trending</a>
                    <a href="/collections">Collections</a>
                    <a href="/about">About Us</a>
                </div>
            </div>

            {/* Bottom Copyright & Pexels Credit */}
            <div className="footer-bottom">
                <p>
                    Images provided by <a href="https://www.pexels.com" target="_blank" rel="noreferrer" style={{ color: '#ff69b4', textDecoration: 'none', fontWeight: 'bold' }}>Pexels</a>.
                    <br />
                    <br />
                    © {new Date().getFullYear()} PuffyWalls. All rights reserved.
                </p>
            </div>   
        </footer>
    );
}
