

'use client';

import { useRouter } from "next/navigation";
import DarkModeToggle from "./DarkModeToggle";
import LoginButton from "./LoginButton";


export default function Navbar() {

    const router = useRouter();

    return (

        <div className="glassmorphism">

            {/* LEFT: App logo — styled via .nav-logo in globals.css
                Uses a gradient text effect to match the app's premium look */}
            <h1 className="nav-logo">PuffyWalls</h1>
            <button onClick={() => router.push("/")}>Home</button>
            <button onClick={() => router.push("/explore")}>Explore</button>
            <button onClick={() => router.push("/trending")}>Trending</button>
            <button onClick={() => router.push("/about")}>About</button>


            {/* RIGHT: Action buttons grouped in .nav-actions flex container
                DarkModeToggle  — toggles light/dark theme via next-themes
                LoginButton     — navigates to /login page on click
                Kept here so they sit flush inside the glass bar */}
            <div className="nav-actions">

                <DarkModeToggle />
                <LoginButton />
            </div>

        </div>
    );
}