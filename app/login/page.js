'use client'

import './LoginPage.css';
import { useRef, useEffect } from 'react';
import { User, Lock, Eye, LogIn } from 'lucide-react';

export default function LoginPage() {
    const passwordRef = useRef(null);
    const eyeBtnRef = useRef(null);

    useEffect(() => {
        const btn = eyeBtnRef.current;   // the eye icon button element
        const input = passwordRef.current; // the password input element

        // toggle() — called every time the user clicks the eye icon
        // The ternary flips between the two states on each click
        const toggle = () => {
            input.type = input.type === 'password' ? 'text' : 'password';
        };

        btn.addEventListener('click', toggle);

        // Cleanup: when the component unmounts (e.g. user navigates away),
        // we remove the listener to prevent memory leaks
        return () => btn.removeEventListener('click', toggle);

    }, []); 

    return (
        <div className="page-container">
            <div className="fullscreen-bg animate-bg"></div>
            <div className="login-container">

                <div className="welcome-section">
                    <h1>Welcome to PuffyWalls</h1>
                    <p>Login to download and set wallpapers</p>
                </div>

                {/* Username field */}
                <div className="input-group">
                    <User size={18} className="input-icon" />
                    <input type="text" placeholder="Username" className="input-field" />
                </div>

                {/* Password field — Eye button sits inside to toggle visibility */}
                <div className="input-group">
                    <Lock size={18} className="input-icon" />
                    <input ref={passwordRef} type="password" placeholder="Password" className="input-field" />
                    <button ref={eyeBtnRef} className="eye-btn" type="button" title="Toggle password">
                        <Eye size={18} />
                    </button>
                </div>

                <button className="login-btn">
                    <LogIn size={18} /> Login
                </button>

                {/* Google login — lucide-react has no Google icon so we use a styled G */}
                <button className="google-btn">
                    <span className="google-g">G</span> Continue with Google
                </button>

                <p className="signup-text">
                    Not a member? <a href="/signup">Sign Up</a>   
                </p>

                <p className="forgot-text">
                    <a href="/forgot-password">Forgot Password?</a>   
                </p>    

            </div>
        </div>
    );
}
