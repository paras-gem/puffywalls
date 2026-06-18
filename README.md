# 🌸 PuffyWalls — The Cute, Aesthetic Wallpaper Hub

PuffyWalls is a minimalist, fast, and responsive web application designed for browsing, filtering, and downloading cute, high-quality aesthetic wallpapers. Built using React, Vite, and Tailwind CSS, the platform leverages the Wallhaven and Unsplash APIs to provide an endless grid of visual inspiration, complete with automated color palettes, interactive live previews, and a localized favorites system.

---

## ✨ Features

- **🌸 Pastel & Cute Aesthetic:** A soft, modern user interface utilizing smooth glassmorphic elements and micro-interactions.
- **🔄 Infinite Scroll:** Seamlessly loads subsequent rows of images automatically as the user scrolls, utilizing React Query and the Intersection Observer API.
- **🔍 Live Filtered Search:** Instantly filters wallpapers by text queries, tags, and categories with real-time debounced updates.
- **🎨 Color Palette Explorer:** Extract and view the primary Hex color palettes directly from the wallpaper metadata.
- **📱 Live Mockup Previews:** Open a detailed modal to see exactly how a wallpaper looks applied directly behind an interactive phone or desktop chassis before downloading.
- **❤️ Localized Favorites:** Save, remove, and track favorite wallpapers instantly via global state, persistently synced across browser refreshes via Zustand middleware.
- **🌗 Native Dark/Light Modes:** Automatic theme adjustment based on system preferences, with full manual override capabilities.

---

## 🛠️ Tech Stack

- **Framework & Core Tooling:** Vite + React (JavaScript/TypeScript)
- **Styling & Presentation:** Tailwind CSS + Framer Motion
- **Data Fetching & State Caching:** React Query (TanStack Query)
- **Global State & Local Persistence:** Zustand + LocalStorage Middleware
- **Client-Side Routing:** React Router v6
- **Primary Data Sources:** Wallhaven API & Unsplash API (Fallback)
- **Deployment:** Vercel
