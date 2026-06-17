/**
 * PROJECT ARCHITECTURE EXPLANATION
 * 
 * 1. The `lib` Directory (Library)
 *    - Purpose: Houses reusable utility functions, configurations, and core setup logic.
 *    - Why we need it: We placed `mongodb.js` here because establishing a database 
 *      connection is a core utility. Centralizing it here means any API route can 
 *      cleanly import `connectDB()` without repeating connection logic across multiple files.
 * 
 * 2. The `models` Directory
 *    - Purpose: Contains Mongoose schemas that define the structure of our database collections.
 *    - Why we need it: Since MongoDB is a NoSQL database (no strict tables), Mongoose models
 *      act as the blueprint for our data (e.g., ensuring every `Wallpaper` has a title and an imageUrl).
 *      Keeping them in a dedicated folder keeps database definitions organized and easy to maintain.
 * 
 * 3. The `app` Directory (Next.js App Router)
 *    - Purpose: Defines the routing and pages of our application.
 *    - Structure: Your current structure is excellent. Folders like `/about`, `/collections`, 
 *      and `/explore` automatically become frontend pages. The `/api` folder cleanly separates 
 *      your backend server logic from the frontend.
 * 
 * 4. CSS Architecture (DarkModeToggle)
 *    - Strategy: We are using a separate CSS file (`DarkModeToggle.module.css`) specifically 
 *      for the Dark Mode component.
 *    - Why we did this: Using CSS Modules scopes the styles locally to the toggle component. 
 *      This prevents the dark mode switch styles from accidentally affecting or clashing with 
 *      the rest of the application's global styles, ensuring a modular and bug-free design.
 * 
 * 5. Login Page Refresh
 *    - Code Cleanup: Condensed login/page.js, removed unused social icons, simplified password toggle.
 *    - Theming: Updated LoginPage.css to a "Warm Peach" (#cfa899) frosted glass effect. Prevented scrolling with overflow: hidden.
 *    - Cinematic Background: Generated a mountain/river image, set it as a full-screen fixed background behind the navbar, and added a 30s slow panning animation to simulate a drone camera.
 * 
 * 6. Authentication & Firebase Setup
 *    - Core Setup: Configured `lib/firebase.js` to initialize the Firebase App and Authentication service.
 *    - Global State: Created `lib/AuthContext.js` to wrap the app and provide the user's auth state globally.
 *    - Login Flows: Implemented Email/Password login and Google popup sign-in on `app/login/page.js`.
 *    - Password Recovery: Built a "Forgot Password" page to send reset emails via Firebase.
 *    - Reset Flow: Created a dedicated "Reset Password" page (`app/reset-password/page.js`) that safely parses the `oobCode` from the email link and updates the password securely.
 * 
 * 7. Premium Notifications (Sonner Toasts)
 *    - Setup: Installed the `sonner` library to provide premium, smooth toast notifications.
 *    - Global Integration: Added the `<Toaster richColors position="top-center" />` component to `app/layout.js` so it's accessible anywhere.
 *    - UX Polish: Replaced basic error texts and console logs with elegant `toast.success()` and `toast.error()` popups to greet the user upon successful login or password reset.
 * 
 * 8. Backend API Directories Setup
 *    - API Routes Created: Initialized `app/api/wallpapers` and `app/api/favorites` directories.
 *    - Why: These folders will house our Next.js backend API routes (e.g., `route.js`) to securely communicate with the Pexels API and MongoDB, separating backend logic from frontend pages.
 */

