'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export default function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        /**
         * onAuthStateChanged returns an UNSUBSCRIBE function.
         * We call it on cleanup to prevent memory leaks when the
         * component is unmounted (e.g., during Next.js route changes).
         */
        const unsubscribed = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);   // null when signed out, Firebase User object when signed in
            setLoading(false);      // auth state resolved — safe to render protected UI
        });
        return () => unsubscribed(); // cleanup: stop listening when component unmounts
    }, [])  // empty array — run only once on mount, not on every re-render

    return (
        <AuthContext.Provider value={{user, loading}}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * useAuth — convenience hook
 * Shorthand so components don't need to import useContext + AuthContext directly.
 *
 * Usage:
 *   const { user, loading } = useAuth();
 */
export const useAuth = () => useContext(AuthContext);
