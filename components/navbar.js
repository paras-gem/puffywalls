'use client';

import { useRouter } from "next/navigation"; 


export default function Navbar() {
    const router = useRouter();
    return (
        <div className="glassmorphism">
            <div className="button">
        <h1>PuffyWalls</h1>
            <nav>
                <span><button onClick={()=> router.push("/")} >Home</button></span>
              <span><button onClick={()=> router.push("/explore")} >Explore</button></span>     
              <span><button onClick={()=> router.push("/trending")} >Trending</button></span>
              <span><button onClick={()=> router.push("/collections")} >Collections</button></span>
              <span><button onClick={()=> router.push("/about")} >About</button></span>
            </nav>
        </div>
        </div>
    )       
}