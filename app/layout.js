import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import Header from '../components/Header';

// the metaData export is coming from public folder as all the icon files are there only

export const metadata = {
  title: 'PuffyWalls',
  description: 'A wallpaper app',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png' },
    ],
  },
};

// here it will automatically all the pages in the app no need to import

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          {children} 
        </ThemeProvider>
      </body>
    </html>
  );
}
