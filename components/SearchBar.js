'use client';
import { useState } from "react"; 
import { Search } from "lucide-react";
import "./SearchBar.css";

// useSearch prop so the explore page know that the user has typed something
export default function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState(''); 

  // triggered when user submits the form (hits enter or clicks the button)
  const handleSearch = (e) => {
    e.preventDefault();

    // only trigger search if the input isn't empty
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    } 
  };

  return (
    <form className="search-form" onSubmit={handleSearch}>
      <div className="search-input-wrapper">
        <Search className="search-icon" size={20} />
        <input 
          type="text"
          className="search-input"
          placeholder="Search wallpapers (e.g., Cyberpunk)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <button type="submit" className="search-button">
        Search
      </button>
    </form>
  );
}
