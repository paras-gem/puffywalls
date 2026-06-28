'use client';

import { useRouter } from "next/navigation";
import DarkModeToggle from "./DarkModeToggle";
import LoginButton from "./LoginButton";

export default function Navbar() {
    const router = useRouter();

    return (
        <div className="glassmorphism">
            {/* LEFT: App logo */}
            <h1 className="nav-logo" onClick={() => router.push("/")} style={{ cursor: 'pointer' }}>
                PuffyWalls
            </h1>

            {/* CENTER: Navigation Links grouped together */}
            <div className="nav-links">
                <button onClick={() => router.push("/")}>Home</button>
                <button onClick={() => router.push("/explore")}>Explore</button>
                <button onClick={() => router.push("/trending")}>Trending</button>
                <button onClick={() => router.push("/about")}>About</button>
            </div>

            {/* RIGHT: Action buttons */}
            <div className="nav-actions">
                <DarkModeToggle />
                <LoginButton />
            </div>
        </div>
    );
}