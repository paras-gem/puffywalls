'use client'

import './reset-password.css';       
import { Lock, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';   
import { useRouter, useSearchParams } from 'next/navigation';    
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner'; // next.js library for toast notification 

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [oobCode, setOobCode] = useState(null);
    const router = useRouter();

    // Use URL search params safely
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('oobCode');
        if (code) {
            setOobCode(code);
        }
    }, []);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!oobCode) {
            setError("Invalid or missing reset code. Please click the link in your email again.");
            return;
        }

        try {
            await confirmPasswordReset(auth, oobCode, password);
            toast.success("Password reset successfully! Redirecting to login...");
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err) {
            setError("Failed to reset password. The link might be expired.");
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

                {/* New Password field */}
                <div className="input-group">
                    <Lock size={18} className="input-icon" />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="New Password" 
                        className="input-field" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className="eye-btn" type="button" onClick={() => setShowPassword(!showPassword)}>
                        <Eye size={18} />
                    </button>
                </div>
                
                {/* Confirm Password field */}
                <div className="input-group">
                    <Lock size={18} className="input-icon" />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Confirm Password" 
                        className="input-field" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>  

                <button className="login-btn" onClick={handleResetPassword}>
                    Reset Password
                </button>

                <div className="forgot-text">
                    <a href="/login">Back to Login</a>
                </div>      
            </div>  
        </div>
    );
}