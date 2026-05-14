# Design System Documentation

## Typography

### Fonts

**Body Font:** Dosis (Google Fonts)
- Used for all body text and general content
- Loaded from Google Fonts CDN
- Weights: 300, 400, 500, 600, 700

**Heading Font:** Garet (Self-hosted)
- Used via `.font-heading` class
- Weight 400 = Garet Book
- Weight 800 = Garet Heavy
- Always uppercase with letter-spacing: 0.04em

### Usage

```tsx
// Body text (default)
<p>This uses Dosis font</p>

// Headings
<h1 className="font-heading">This uses Garet font</h1>
```

## Color Palette

### Brand Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Sand | `#f5f1e9` | Light backgrounds |
| Green Light | `#a4c853` | Success states, UP direction |
| Green Dark | `#67943f` | Darker green accents |
| Blue Light | `#4279a0` | Info states |
| Blue Dark | `#0c4f70` | Primary dark, sidebar |
| Peach | `#f88c64` | Warning/error states |
| Gold | `#f5c842` | CTA buttons, earnings highlights |
| Body Text | `#57534e` | Default text color |

### Color Scales

**Atlantis (Greens)** - Primary UI Color
- 50 to 950 scale
- Used for success states, UP capacity indicators
- CSS: `bg-atlantis-400`, `text-atlantis-900`, etc.

**Orient (Blues)**
- 50 to 950 scale
- Used for primary UI elements, DOWN capacity indicators
- CSS: `bg-orient-600`, `text-orient-50`, etc.

**Sand (Neutrals)**
- 50 to 950 scale
- Used for backgrounds, borders, subtle elements
- CSS: `bg-sand-50`, `border-sand-200`, etc.

**Gold (Yellows)**
- 50 to 950 scale
- Used for CTAs, earnings displays, premium accents
- CSS: `bg-gold-400`, `text-gold-900`, etc.

## Light / Dark Mode

### Light Mode
- Background: `sand-50` / `sand-100`
- Text: `body-text` (#57534e)

### Dark Mode
- Background: Gradient from `#07293a` → `#0a3c55` → `#0c4f70`
- Sidebar: `#0c4f70` (blue-dark)
- Text: `sand-50` (#f5f1e9)

### Usage

```tsx
// Automatic dark mode support
<div className="bg-sand-50 dark:bg-orient-800">
  <p className="text-body-text dark:text-sand-50">Content</p>
</div>
```

## Animations

### Available Animations

**heartbeat-ping**
- Pulsing glow effect
- 2s loop, ease-in-out
- Usage: `animate-heartbeat-ping`

**float-slow**
- Gentle vertical float
- 6s loop, ease-in-out
- Usage: `animate-float-slow`

**shimmer**
- Gradient shimmer for premium accents
- 3s loop, linear
- Usage: `animate-shimmer`

**stat-pop**
- Count-up pop-in effect
- 0.6s, cubic-bezier bounce
- Usage: `animate-stat-pop`

**draw-line**
- SVG line drawing animation
- Usage: `animate-draw-line`

### Example

```tsx
<div className="animate-float-slow">
  <h1>Floating Title</h1>
</div>

<div className="animate-stat-pop">
  <p>£1,234.56</p>
</div>
```

## Scroll Reveal System

### Available Reveal Types

- `data-reveal="up"` - Slide up from bottom
- `data-reveal="left"` - Slide in from left
- `data-reveal="right"` - Slide in from right
- `data-reveal="scale"` - Scale up from 90%
- `data-reveal="fade"` - Simple fade in

### Stagger Support

Add inline styles for staggered animations:

```tsx
{items.map((item, index) => (
  <div 
    key={index}
    data-reveal="up"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    {item}
  </div>
))}
```

### Usage

```tsx
<div data-reveal="up">
  <h2>This will slide up when scrolled into view</h2>
</div>

<div data-reveal="scale">
  <p>This will scale up when visible</p>
</div>
```

## Component Patterns

### Form Inputs

```tsx
<input
  type="text"
  className="w-full px-5 py-3 bg-sand-50 dark:bg-orient-700 border-2 border-sand-300 dark:border-orient-500 rounded-lg focus:ring-4 focus:ring-atlantis-300 dark:focus:ring-atlantis-600 focus:border-atlantis-500 transition-all text-body-text dark:text-sand-50 font-medium"
/>
```

### CTA Buttons

```tsx
<button className="bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-orient-900 font-heading font-bold py-4 px-8 rounded-xl focus:outline-none focus:ring-4 focus:ring-gold-300 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
  Calculate Earnings
</button>
```

### Cards

```tsx
<div className="bg-white dark:bg-orient-600/30 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-sand-200 dark:border-orient-500">
  {/* Card content */}
</div>
```

### Stat Displays

```tsx
<div className="bg-gradient-to-br from-atlantis-100 to-atlantis-200 dark:from-atlantis-700 dark:to-atlantis-800 border-2 border-atlantis-400 dark:border-atlantis-500 rounded-xl p-6 animate-stat-pop shadow-lg">
  <p className="font-heading text-sm text-atlantis-800 dark:text-atlantis-100 mb-2">
    Label
  </p>
  <p className="text-4xl font-bold text-atlantis-900 dark:text-atlantis-50">
    Value
  </p>
</div>
```

## Best Practices

1. **Always use font-heading for headings** - Ensures consistent Garet font usage
2. **Provide dark mode variants** - Use `dark:` prefix for all color classes
3. **Use semantic color names** - `atlantis` for success, `orient` for primary, `gold` for CTAs
4. **Add transitions** - Use `transition-all` for smooth state changes
5. **Leverage animations** - Use scroll reveals and stat animations for engagement
6. **Maintain spacing** - Use consistent padding/margin scales (4, 6, 8, 12)
7. **Round corners generously** - Use `rounded-xl` or `rounded-2xl` for modern feel
