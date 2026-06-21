// this file is importing all the components and rendering them

"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar";

export default function Header() {
  const pathname = usePathname();
  
  // We check if the current path is the home page
  const isHomePage = pathname === "/";
  const isAboutPage = pathname === "/about";
  const isCollectionsPage = pathname === "/collections";
  
  // Hide navbar on the collections page
  if (isCollectionsPage) {
    return null;
  }

  return (
    <header className="site-header" style={{ position: 'relative', zIndex: 10 }}>
      <Navbar />
    </header>
  );
}
