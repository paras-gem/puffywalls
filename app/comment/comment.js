/**
 * PROJECT ARCHITECTURE EXPLANATION
 * * 1. The `lib` Directory (Library)
 * - Purpose: Houses reusable utility functions, configurations, and core setup logic.
 * - Why we need it: We placed `mongodb.js` here because establishing a database 
 * connection is a core utility. Centralizing it here means any API route can 
 * cleanly import `connectDB()` without repeating connection logic across multiple files.
 * * 2. The `models` Directory
 * - Purpose: Contains Mongoose schemas that define the structure of our database collections.
 * - Why we need it: Since MongoDB is a NoSQL database (no strict tables), Mongoose models
 * act as the blueprint for our data (e.g., ensuring every `Wallpaper` has a title and an imageUrl).
 * Keeping them in a dedicated folder keeps database definitions organized and easy to maintain.
 * * 3. The `app` Directory (Next.js App Router)
 * - Purpose: Defines the routing and pages of our application.
 * - Structure: Your current structure is excellent. Folders like `/about`, `/collections`, 
 * and `/explore` automatically become frontend pages. The `/api` folder cleanly separates 
 * your backend server logic from the frontend.
 * * 4. CSS Architecture (DarkModeToggle)
 * - Strategy: We are using a separate CSS file (`DarkModeToggle.module.css`) specifically 
 * for the Dark Mode component.
 * - Why we did this: Using CSS Modules scopes the styles locally to the toggle component. 
 * This prevents the dark mode switch styles from accidentally affecting or clashing with 
 * the rest of the application's global styles, ensuring a modular and bug-free design.
 * * 5. Login Page Refresh
 * - Code Cleanup: Condensed login/page.js, removed unused social icons, simplified password toggle.
 * - Theming: Updated LoginPage.css to a "Warm Peach" (#cfa899) frosted glass effect. Prevented scrolling with overflow: hidden.
 * - Cinematic Background: Generated a mountain/river image, set it as a full-screen fixed background behind the navbar, and added a 30s slow panning animation to simulate a drone camera.
 * * 6. Authentication & Firebase Setup
 * - Core Setup: Configured `lib/firebase.js` to initialize the Firebase App and Authentication service.
 * - Global State: Created `lib/AuthContext.js` to wrap the app and provide the user's auth state globally.
 * - Login Flows: Implemented Email/Password login and Google popup sign-in on `app/login/page.js`.
 * - Password Recovery: Built a "Forgot Password" page to send reset emails via Firebase.
 * - Reset Flow: Created a dedicated "Reset Password" page (`app/reset-password/page.js`) that safely parses the `oobCode` from the email link and updates the password securely.
 * * 7. Premium Notifications (Sonner Toasts)
 * - Setup: Installed the `sonner` library to provide premium, smooth toast notifications.
 * - Global Integration: Added the `<Toaster richColors position="top-center" />` component to `app/layout.js` so it's accessible anywhere.
 * - UX Polish: Replaced basic error texts and console logs with elegant `toast.success()` and `toast.error()` popups to greet the user upon successful login or password reset.
 * * 8. Backend API Directories Setup
 * - API Routes Created: Initialized `app/api/wallpapers` and `app/api/favorites` directories.
 * - Why: These folders house our Next.js backend API routes (e.g., `route.js`) to securely communicate with the Pexels API and MongoDB, separating backend logic from frontend pages.
 * * 9. Global Share Modal & Context Setup
 * - Strategy: We built a fully featured Share Modal that can be opened from anywhere in the app.
 * - Implementation: Created `lib/ShareModalContext.js` to manage the modal's global state (`isOpen`, `wallpaperData`). We wrapped `app/layout.js` with `<ShareModalProvider>` so the modal sits globally above the entire app and can be triggered by calling `openModal(wallpaper)` from any page.
 * - CSS Enhancements: Refactored `ShareModal.css` using modern CSS variables (e.g., `--share-bg`), added glassmorphism blur effects, `@keyframes` animations for both opening and closing (`shareModalIn` / `shareModalOut`), and used real SVG social brand icons.
 * - Features: Added UI for downloading, changing orientation aspect ratios, and placeholder actions for Comment, Rate, Report, and Save to Collection.
 * * 10. Feed Interactivity (Like & Share functionality)
 * - Pages Updated: Applied interactivity to `app/page.js` (Home), `app/explore/page.js`, and `app/trending/page.js`.
 * - Like Button Logic: Implemented a fast React `Set` hook (`const [likedIds, setLikedIds] = useState(new Set())`) to efficiently track liked wallpapers locally. The `<Heart>` icon dynamically updates its `fill` and `color` props based on its liked state.
 * - Event Bubbling Handling: Attached `onClick={() => openModal(wallpaper)}` to the entire wallpaper card wrapper, while using `e.stopPropagation()` on the individual overlay action buttons (Like, Download, Share) so clicking a button doesn't accidentally trigger the background card click as well.
 * * 11. Share Modal Interactivity & Toasts
 * - Made action buttons (Download, Comment, Rate, Report, Save to Collection) active in ShareModal.
 * - Added smooth sonner toast notifications for all interactions (sharing, downloading, reporting, copying link).
 * * 12. Google Drive Cloud Synchronization Pipeline
 * - Endpoint: `app/api/drive/route.js` (Flattened out from `/upload` folder to map perfectly to Next.js strict file-based routing architecture).
 * - Operation: Captures explicit user Google OAuth tokens, extracts assets, and streams raw image buffers directly to a specialized `Puffy Wallpapers` cloud bucket folder using batch multi-file synchronization handlers.
 * - UI Trigger: Fully integrated a clean utility toggle in `CollectionsClient.js` that triggers background chunk loading and displays dynamic tracking hooks (`Loader2` & `CloudLightning`) for active uploads.
 * * 13. Tenant Data Privacy Isolation & Security Hardening
 * - Bug Fixed: Eliminated a cross-user collection leak where cross-tenant data assets were incorrectly displaying globally across multiple accounts.
 * - Implementation: Patched database query parameters to enforce strict user matching against the active Firebase authenticated `user.uid`. Data contexts now enforce an implicit ownership boundary, fully securing the multi-tenant layout.
 * * 14. Repository Branding & Social Enhancements
 * - Strategy: Uploaded a compressed, tailored 1280x640px visual dashboard display to GitHub's OpenGraph Repository settings. 
 * - Impact: Enables beautiful link metadata generation and branding cards when shared across external developer tools and production portfolio channels.
 */