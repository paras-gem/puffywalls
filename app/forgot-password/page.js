'use client'

import './ForgotPage.css'
import { User, Key } from 'lucide-react';
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSendResetEmail = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Check your email for the reset link!");
        } catch (err) {
            setError("Failed to send reset email. Ensure the email is correct.");
        }
    };

    return (
        <div className="page-container">
            <div className="fullscreen-bg animate-bg"></div>
            <div className="login-container animate">

                <div className="welcome-section">
                    <h1>Reset Password</h1>
                    <p>Enter your email to receive a reset link</p>
                </div>

                {message && <p style={{ color: '#10b981', fontSize: '13px', margin: '0' }}>{message}</p>}
                {error && <p style={{ color: '#ec4899', fontSize: '13px', margin: '0' }}>{error}</p>}

                {/* Email field */}
                <div className="input-group">
                    <User size={18} className="input-icon" />
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        className="input-field" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <button className="login-btn" onClick={handleSendResetEmail}>
                    <Key size={18} /> Send Reset Link
                </button>

            

                <p className="forgot-text">
                    <a href="/login">Back to Login</a>
                </p>

            </div>
        </div>
    );
}
