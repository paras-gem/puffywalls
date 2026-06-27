'use client'

import './reset-password.css';
import { Lock, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [oobCode, setOobCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setOobCode(params.get('oobCode') || '');
    }, []);

    const handleResetPassword = async (event) => {
        event.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!oobCode) {
            setError('Invalid or missing reset code. Please click the link in your email again.');
            return;
        }

        setIsLoading(true);
        try {
            await confirmPasswordReset(auth, oobCode, password);
            toast.success('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            if (err.code === 'auth/expired-action-code') {
                setError('This reset link has expired. Please request a new one.');
            } else if (err.code === 'auth/invalid-action-code') {
                setError('This reset link is invalid or has already been used.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Use at least 6 characters.');
            } else {
                setError(err.message || 'Failed to reset password. Please try again.');
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
                    <p>Enter your new password below</p>
                </div>

                {error && <p style={{ color: '#ec4899', fontSize: '13px', margin: '0' }}>{error}</p>}

                <form className="auth-form" onSubmit={handleResetPassword}>
                    <div className="input-group">
                        <Lock size={18} className="input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="New Password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                        <button className="eye-btn" type="button" onClick={() => setShowPassword(!showPassword)}>
                            <Eye size={18} />
                        </button>
                    </div>

                    <div className="input-group">
                        <Lock size={18} className="input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm Password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                    </div>

                    <button className="login-btn" type="submit" disabled={isLoading}>
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="forgot-text">
                    <a href="/login">Back to Login</a>
                </div>
            </div>
        </div>
    );
}
