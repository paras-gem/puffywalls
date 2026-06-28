'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const AuthContext = createContext({});

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [googleToken, setGoogleToken] = useState(null); // Holds the active Google API session token
    const [loading, setLoading] = useState(true);

    // Hydrate token from storage on mount if it exists to maintain session stability
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedToken = localStorage.getItem("gdrive_access_token");
            if (savedToken) setGoogleToken(savedToken);
        }
    }, []);

    // Custom login method ensuring the application requests the correct Google Drive scope access
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        // Request exclusive authorization to view/manage files created by this application
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        
        try {
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;

            if (token) {
                setGoogleToken(token);
                localStorage.setItem("gdrive_access_token", token);
            }
            return result.user;
        } catch (error) {
            console.error("Google Authentication scope configuration error:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await auth.signOut();
            setGoogleToken(null);
            localStorage.removeItem("gdrive_access_token");
        } catch (error) {
            console.error("Signout error:", error);
        }
    };

    useEffect(() => {
        const unsubscribed = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            // Save user to MongoDB whenever they sign in
            if (currentUser) {
                try {
                    await fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: currentUser.uid,
                            email: currentUser.email,
                            displayName: currentUser.displayName || '',
                            photoURL: currentUser.photoURL || '',
                            provider: currentUser.providerData?.[0]?.providerId || 'firebase',
                        }),
                    });
                } catch (err) {
                    console.error('Failed to save user to DB:', err);
                }
            }
        });

        return () => unsubscribed();
    }, []);

    return (
        <AuthContext.Provider value={{ user, googleToken, signInWithGoogle, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);