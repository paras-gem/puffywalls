'use client'

import './SignupPage.css'   
import { useState } from 'react';
import { User, Lock, Eye, LogIn } from 'lucide-react';

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                    <input type={showPassword ? "text" : "password"} placeholder="  Password" className="input-field" />
                    <button className="eye-btn" type="button" onClick={() => setShowPassword(!showPassword)} title="Toggle password">
                        <Eye size={18} />
                    </button>
                </div>

                <div className="input-group">
                <Lock size={18} className="input-icon" />
                    <input type={showConfirmPassword ? "text" : "password"} placeholder="  Confirm Password" className="input-field" />
                    <button className="eye-btn" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title="Toggle password">
                        <Eye size={18} />
                    </button>
                </div>

                <button className="login-btn">
                    <LogIn size={18} /> Signup
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
