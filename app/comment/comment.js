// for commenting and project details

// manifest.js: controls how the app will behave

// all the icon files are in the public folder for cleaner project structure 

// layout.js: metadata tag is used in the manifest.js so that it catch the icon
// and array of the following icons is written in the file.

// next.config.mjs: This file contains the PWA builder where register: true injects the service worker automatically

// lucide-react is used for icons used in the whole project like search etc.

// InstallButton.js (in components/): A client component that listens for the 'beforeinstallprompt' event to show a PWA install button to the user.

// API Routes: We use Next.js App Router API routes under app/api/. For example, app/api/wallpapers/categories/route.js handles the /api/wallpapers/categories endpoint. 
// Previously we used app/categories/page.js, but API routes are the standard way to expose JSON endpoints in Next.js App Router.

// use any for chrome to identify the app icon 

// created a installButton: it is to trigger the default browser install prompt it use react hooks, component state management, used useEffect to fire the event listener it will also reset when the app is installed and hide the button.  

// install button will only shown wh
