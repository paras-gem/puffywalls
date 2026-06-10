
// the metaData export is coming from public folder as all the icon files are there only

export const metadata = {
  title: 'PuffyWalls',
  description: 'A wallpaper app',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png' },
    ],
  },
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
