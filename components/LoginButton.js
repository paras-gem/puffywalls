'use client'

import { User, LogOut, PlusCircle, Settings as SettingsIcon} from 'lucide-react';
import './LoginButton.css';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';    
import { useState, useRef, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function LoginButton() {  
    const router = useRouter();
    const {user, loading} = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if(loading) return null;    // don't show anything while checking the auth

    const handleLogout = async () => {
        await signOut(auth);
        setIsDropdownOpen(false);
        router.push("/");
    };

    const handleAddAccount = async () => {
        await signOut(auth);
        setIsDropdownOpen(false);
        router.push("/login");
    };

    // 🟢 FIXED: Removed unnecessary 'async' keyword and added state reset 
    const handleSettings = () => {
        setIsDropdownOpen(false); // 🟢 FIXED: Closes the dropdown menu on click
        router.push("/settings");
    };

    // if the user is logged in, show their initials in the place of login text 
    if(user) {
        const initial = user.email ? user.email.charAt(0).toUpperCase() : "U";  
        return (
            <div className="user-menu-container" ref={dropdownRef}>
                <button 
                    className="login-button user-initial-btn" 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >   
                    {initial}
                </button>   

                {isDropdownOpen && (
                    <div className="user-dropdown">
                        <p className="user-email">{user.email}</p>
                        <hr />
                        <button onClick={handleAddAccount} className="dropdown-item">
                            <PlusCircle size={16} /> Add Account
                        </button>
                        <button onClick={handleLogout} className="dropdown-item logout-item">
                            <LogOut size={16} /> Logout
                        </button>
                        <button onClick={handleSettings} className="dropdown-item settings-item">
                            {/* 🟢 FIXED: Changed <Settings /> to <SettingsIcon /> to match your import mapping */}
                            <SettingsIcon size={16} /> Settings
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (  
        <button className="login-button" onClick={() => router.push("/login")}> 
            <User size={16} />
            Login
        </button>   
    )   
}