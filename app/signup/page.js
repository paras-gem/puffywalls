'use client'

import './SignupPage.css'   
import { useRef, useEffect } from 'react';
import { User, Lock, Eye, LogIn } from 'lucide-react';

export default function SignupPage() {
    const passwordRef = useRef(null);
    const eyeBtnRef = useRef(null);

    useEffect(() => {
        const btn = eyeBtnRef.current;  
        const input = passwordRef.current; 

        
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
            <div className="login-container animate">

                <div className="welcome-section">
                    <h1>Welcome to PuffyWalls</h1>
                    <p>Login to download and set wallpapers</p>
                </div>

                {/* Username field */}
                <div className="input-group">
                    <User size={18} className="input-icon" />
                    <input type="text" placeholder="First name" className="input-field" />
                </div>

                <div className="input-group">
                    <User size={18} className="input-icon" />
                    <input type="text" placeholder="Last name" className="input-field" />
                </div>

                <div className="input-group">
                    <User size={18} className="input-icon" />
                    <input type="email" placeholder="Email" className="input-field" />
                </div>

                
                {/* Password field — Eye button sits inside to toggle visibility */}
                <div className="input-group">
                    <Lock size={18} className="input-icon" />
                    <input ref={passwordRef} type="password" placeholder="  Password" className="input-field" />
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
             Already a member? <a href="/login">Login</a>   
                </p>

                <p className="forgot-text">
                    Forgot Password? <a href="/forgot-password">Reset Password</a>   
                </p>    

            </div>
        </div>
    );
}
