'use client'

import { auth } from '@/lib/firebase';    
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; 
import './LoginPage.css';
import { useState } from 'react';
import { User, Lock, Eye, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);

    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleEmailLogin = async(event) => {
        event.preventDefault();
        setError(""); // clear previous errors

        try {
            await signInWithEmailAndPassword(auth, email, password); 
            toast.success("Welcome back! You've successfully logged in.");
            router.push('/');
        } catch (err) {
            console.log("login failed:", err.message);
            setError("Invalid email or password");
        }
    }

    const handleGoogleLogin = async (event) => {
        event.preventDefault();
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            toast.success(`Welcome back, ${user.displayName || 'User'}!`);
            router.push('/');
        } catch (error) {
            console.error("Google Login Failed: ", error.message);
            toast.error("Google Login Failed: " + error.message);
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

                {/* Optional: Show error message if login fails */}
                {error && <p style={{ color: '#ec4899', fontSize: '13px', margin: '0' }}>{error}</p>}                {/* Email field */}
                <div className="input-group">
                    <User size={18} className="input-icon" />
                    <input 
                        type="email" 
                        placeholder="Email" 
                        className="input-field" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {/* Password field */}
                <div className="input-group">
                    <Lock size={18} className="input-icon" />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password" 
                        className="input-field" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className="eye-btn" type="button" onClick={() => setShowPassword(!showPassword)} title="Toggle password">
                        <Eye size={18} />
                    </button>
                </div>

                {/* Login Button */}
                <button className="login-btn" onClick={handleEmailLogin}>
                    <LogIn size={18} /> Login
                </button>

                {/* Google login — lucide-react has no Google icon so we use a styled G */}
                <button className="google-btn" onClick={handleGoogleLogin}>
                    <span className="google-g">G</span> Continue with Google
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