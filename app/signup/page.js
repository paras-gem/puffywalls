'use client'

import './SignupPage.css'
import { useState } from 'react';
import { User, Lock, Eye, LogIn, Mail } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (event) => {
        event.preventDefault();
        setError('');

        if (!firstName.trim()) {
            setError('First name is required.');
            return;
        }
        if (!email.trim()) {
            setError('Email is required.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
            await updateProfile(userCredential.user, { displayName });

            toast.success(`Welcome to PuffyWalls, ${displayName}!`);
            router.push('/');
        } catch (err) {
            console.error('Signup failed:', err.message);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Try logging in instead.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Use at least 6 characters.');
            } else {
                setError(err.message || 'Signup failed. Please try again.');
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
                    <h1>Welcome to PuffyWalls</h1>
                    <p>Create an account to save and download wallpapers</p>
                </div>

                {error && <p style={{ color: '#ec4899', fontSize: '13px', margin: '0 0 0.5rem 0' }}>{error}</p>}

                <form className="auth-form" onSubmit={handleSignup}>
                    <div className="input-group">
                        <User size={18} className="input-icon" />
                        <input
                            type="text"
                            placeholder="First name"
                            className="input-field"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            autoComplete="given-name"
                        />
                    </div>

                    <div className="input-group">
                        <User size={18} className="input-icon" />
                        <input
                            type="text"
                            placeholder="Last name"
                            className="input-field"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            autoComplete="family-name"
                        />
                    </div>

                    <div className="input-group">
                        <Mail size={18} className="input-icon" />
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
                            autoComplete="new-password"
                        />
                        <button className="eye-btn" type="button" onClick={() => setShowPassword(!showPassword)} title="Toggle password">
                            <Eye size={18} />
                        </button>
                    </div>

                    <div className="input-group">
                        <Lock size={18} className="input-icon" />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm Password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                        <button className="eye-btn" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title="Toggle password">
                            <Eye size={18} />
                        </button>
                    </div>

                    <button className="login-btn" type="submit" disabled={isLoading}>
                        <LogIn size={18} /> {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

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
