# Font Setup Instructions

## Required Fonts

This application uses two font families:

1. **Dosis** (Google Fonts) - Automatically loaded ✅
2. **Garet** (Self-hosted) - Requires manual setup ⚠️

## Setting Up Garet Fonts

### Step 1: Obtain Font Files

You need to obtain the Garet font files in `.woff2` format:
- Garet Book (Weight 400)
- Garet Heavy (Weight 800)

### Step 2: Add Font Files

Place the font files in the `public/fonts/` directory with these exact names:

```
public/fonts/
├── garet-book.woff2
└── garet-heavy.woff2
```

### Step 3: Verify Setup

The fonts are already configured in `app/globals.css`:

```css
@font-face {
  font-family: 'Garet';
  src: url('/fonts/garet-book.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Garet';
  src: url('/fonts/garet-heavy.woff2') format('woff2');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}
```

### Step 4: Test

Run the development server and check that headings display in Garet font:

```bash
npm run dev
```

Open http://localhost:3000 and inspect the heading elements. They should use the Garet font family.

## Fallback Behavior

If Garet fonts are not available:
- The application will fall back to system sans-serif fonts
- Dosis will still load for body text
- The layout and functionality remain intact

## Font Licensing

⚠️ **Important:** Ensure you have the proper license to use Garet fonts in your project. Check with the font provider for licensing terms.

## Alternative: Using a Different Heading Font

If you cannot obtain Garet fonts, you can substitute with another font:

### Option 1: Use Google Fonts Alternative

Edit `app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;800&display=swap');

/* Update the theme */
@theme inline {
  --font-heading: 'Montserrat', sans-serif;
}
```

### Option 2: Use System Fonts

Edit `app/globals.css`:

```css
@theme inline {
  --font-heading: system-ui, -apple-system, sans-serif;
}
```

## Troubleshooting

### Fonts Not Loading

1. Check browser console for 404 errors
2. Verify file paths are correct
3. Clear browser cache
4. Restart development server

### Fonts Look Different

1. Verify you have the correct font weights (400 and 800)
2. Check that `.font-heading` class is applied to heading elements
3. Inspect computed styles in browser DevTools

### Performance Issues

1. Ensure you're using `.woff2` format (best compression)
2. Check that `font-display: swap` is set
3. Consider preloading fonts in `app/layout.tsx`:

```tsx
<link
  rel="preload"
  href="/fonts/garet-book.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```
