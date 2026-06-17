'use client';

import { createContext, useContext, useEffect, useState } from "react"; 
import { auth } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export default function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribed = onAuthStateChanged (auth, (currentUser)    => {
            setUser(currentUser)
            setLoading(false)   
        })
        return () => unsubscribed()  //unsubscribe from the auth listener when the component unmount 
    },[])   

    return (
        <AuthContext.Provider value={{user,loading}}>
            {children}
        </AuthContext.Provider> 
    )
} // <--- Notice the function closes HERE

// The export must be OUTSIDE the function block
export const useAuth = () => useContext(AuthContext);
