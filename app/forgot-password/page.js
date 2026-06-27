'use client'

import './ForgotPage.css'
import { User, Key } from 'lucide-react';
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendResetEmail = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');

        if (!email.trim()) {
            setError('Email is required.');
            return;
        }

        const actionCodeSettings = {
            url: `${window.location.origin}/reset-password`,
            handleCodeInApp: true,
        };

        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
            setMessage('Check your email for the reset link!');
            toast.success('Password reset link sent.');
        } catch (err) {
            if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account exists for this email.');
            } else {
                setError(err.message || 'Failed to send reset email. Please try again.');
            }
        } finally {
            setIsLoading(false);
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

                <form className="auth-form" onSubmit={handleSendResetEmail}>
                    <div className="input-group">
                        <User size={18} className="input-icon" />
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    <button className="login-btn" type="submit" disabled={isLoading}>
                        <Key size={18} /> {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p className="forgot-text">
                    <a href="/login">Back to Login</a>
                </p>

            </div>
        </div>
    );
}
