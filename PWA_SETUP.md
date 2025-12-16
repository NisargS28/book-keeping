# PWA Icons Setup

Your CashBook app is now configured as a Progressive Web App! 

## Required Icons

You need to create the following icon files in the `public/` folder:

### App Icons
- **icon-192x192.png** - 192x192px (for mobile home screen)
- **icon-512x512.png** - 512x512px (for splash screens)

### Optional Icons (for better compatibility)
- **apple-icon.png** - 180x180px (for iOS home screen)
- **icon-light-32x32.png** - 32x32px (browser favicon for light mode)
- **icon-dark-32x32.png** - 32x32px (browser favicon for dark mode)
- **icon.svg** - SVG version (scalable)

### Screenshots (Optional but recommended)
- **screenshot-mobile.png** - 540x720px (mobile app store preview)
- **screenshot-desktop.png** - 1280x720px (desktop app store preview)

## Quick Icon Generation

You can create these icons from a single high-resolution logo (at least 512x512px):

### Option 1: Use an online tool
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

### Option 2: Use ImageMagick (if installed)
```bash
# From a 512x512 source image
convert icon-source.png -resize 192x192 public/icon-192x192.png
convert icon-source.png -resize 512x512 public/icon-512x512.png
convert icon-source.png -resize 180x180 public/apple-icon.png
```

## PWA Features Enabled

✅ **Offline Support** - App works without internet connection
✅ **Install Prompt** - Users can install the app on their device
✅ **Service Worker** - Automatic caching of assets
✅ **Mobile Optimized** - Native app-like experience on mobile
✅ **App Shortcuts** - Quick access to Dashboard and Books
✅ **Theme Color** - Purple theme color (#8b5cf6)

## Testing PWA

1. Build the production app: `pnpm build`
2. Start production server: `pnpm start`
3. Open in browser and check DevTools > Application > Manifest
4. Look for "Install" button in browser address bar
5. Test offline by going to DevTools > Application > Service Workers > Offline

## Deployment

When deploying, make sure your hosting platform supports PWA features:
- Vercel: ✅ Full PWA support
- Netlify: ✅ Full PWA support
- Custom servers: Ensure HTTPS is enabled (required for service workers)
