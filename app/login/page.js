'use client'

import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/lib/AuthContext'; // FIX: Bring in our centralized context hook
import './LoginPage.css';
import { useState } from 'react';
import { User, Lock, Eye, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const router = useRouter();

    // FIX: Extract our updated custom scoped sign-in trigger method
    const { signInWithGoogle } = useAuth();

    const handleEmailLogin = async (event) => {
        event.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Email is required.');
            return;
        }
        if (!password) {
            setError('Password is required.');
            return;
        }

        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            toast.success("Welcome back! You've successfully logged in.");
            router.push('/');
        } catch (err) {
            console.log('login failed:', err.message);
            if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (
                err.code === 'auth/invalid-credential' ||
                err.code === 'auth/user-not-found' ||
                err.code === 'auth/wrong-password'
            ) {
                setError('Invalid email or password.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsGoogleLoading(true);

        try {
            // FIX: Call our context workflow to enforce the Drive scope popup permissions
            const user = await signInWithGoogle();
            toast.success(`Welcome back, ${user.displayName || 'User'}!`);
            router.push('/');
        } catch (err) {
            console.error("Google Auth Failure Details:", err);
            toast.error(err.message || 'Google Sign-In failed.');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="fullscreen-bg animate-bg"></div>
            <div className="login-container animate">

                <div className="welcome-section">
                    <h1>Welcome to PuffyWalls</h1>
                    <p>Login to download and set wallpapers</p>
                </div>

                {error && <p style={{ color: '#ec4899', fontSize: '13px', margin: '0' }}>{error}</p>}

                <form className="auth-form" onSubmit={handleEmailLogin}>
                    <div className="input-group">
                        <User size={18} className="input-icon" />
                        <input
                            type="email"
                            placeholder="Email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-group">
                        <Lock size={18} className="input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                        <button className="eye-btn" type="button" onClick={() => setShowPassword(!showPassword)} title="Toggle password">
                            <Eye size={18} />
                        </button>
                    </div>

                    <button className="login-btn" type="submit" disabled={isLoading || isGoogleLoading}>
                        <LogIn size={18} /> {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <button className="google-btn" type="button" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
                    <span className="google-g">G</span> {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                </button>

                <p className="signup-text">
                    Not a member? <a href="/signup">Sign Up</a>
                </p>

                <p className="forgot-text">
                    Forgot Password? <a href="/forgot-password">Reset Password</a>
                </p>

            </div>
        </div>
    );
}