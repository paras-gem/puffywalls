'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext({});

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);