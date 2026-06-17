// this file is importing all the components and rendering them

"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar";
import SearchBar from "./SearchBar";

export default function Header() {
  const pathname = usePathname();
  
  // We check if the current path is the home page
  const isHomePage = pathname === "/";

  return (
    <header className="site-header" style={{ position: 'relative', zIndex: 10 }}>
      
      <Navbar />
      {/* Conditionally render SearchBar ONLY if we are NOT on the home page */}
      {!isHomePage && <SearchBar />}
    </header>
  );
}
