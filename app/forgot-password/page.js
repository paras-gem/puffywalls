'use client'

import './ForgotPage.css'   
import { User, Key } from 'lucide-react';

export default function ForgotPasswordPage() {
    return (
        <div className="page-container">
            <div className="fullscreen-bg animate-bg"></div>
            <div className="login-container animate">

                <div className="welcome-section">
                    <h1>Welcome to PuffyWalls</h1>
                    <p>Reset your password</p>
                </div>

                {/* Username field */}
                <div className="input-group">
                    <User size={18} className="input-icon" />
                    <input type="text" placeholder="Email Address" className="input-field" />
                </div>

               

                <button className="login-btn">
                    <Key size={18} /> Reset Password
                </button>

               <p className="forgot-text">
                    <a href="/login">Back to Login</a>   
                </p>    

            </div>
        </div>
    );
}
