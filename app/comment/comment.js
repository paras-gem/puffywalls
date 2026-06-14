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
 */
