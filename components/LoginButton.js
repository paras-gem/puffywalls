'use client'

import { User } from 'lucide-react';
import './LoginButton.css';
import { useRouter } from 'next/navigation';

export default function LoginButton() {  
    const router = useRouter();
    return (  
        <button className="login-button" onClick={() => router.push("/login")}> 
            <User size={16} />
            Login
        </button>   
    )   
}