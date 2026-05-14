# NGED CMZ Earning Estimator - Frontend

A Next.js frontend application for calculating potential earnings from energy assets in NGED CMZ zones.

## Features

- Clean, responsive UI built with Next.js 15 and Tailwind CSS
- Custom design system with Garet/Dosis fonts
- Brand color palette (Atlantis greens, Orient blues, Sand neutrals, Gold accents)
- Dark mode support with gradient backgrounds
- Smooth animations (float, shimmer, stat-pop, heartbeat-ping)
- Scroll reveal effects for engaging UX
- Input form for hardware specifications (battery, inverter, solar, EV, heat pump)
- CMZ code selection
- Real-time earnings calculation
- Detailed results display showing eligible competitions and projected earnings
- Animated earnings counter

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Installation

```bash
npm install
```

### Font Setup

The application uses the Garet font (self-hosted). Place your Garet font files in `public/fonts/`:
- `garet-book.woff2` (Weight 400)
- `garet-heavy.woff2` (Weight 800)

See `public/fonts/README.md` for details. The Dosis font loads automatically from Google Fonts.

### Configuration

Create a `.env.local` file in the root directory:

```env
BACKEND_API_URL=http://localhost:8000/api/estimate
```

Replace the URL with your actual backend API endpoint.

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
nged-cmz-estimator/
├── app/
│   ├── api/
│   │   └── estimate/
│   │       └── route.ts          # API route proxy to backend
│   ├── layout.tsx
│   └── page.tsx                  # Main page
├── components/
│   ├── EstimatorForm.tsx         # Input form component
│   └── ResultsDisplay.tsx        # Results display component
├── types/
│   └── estimator.ts              # TypeScript interfaces
└── .env.local                    # Environment variables
```

## API Integration

The frontend communicates with the backend through the `/api/estimate` endpoint, which proxies requests to your backend service. Update the `BACKEND_API_URL` environment variable to point to your backend.

### Expected Backend Response Format

```json
{
  "total_up_capacity_mw": 0.015,
  "total_down_capacity_mw": 0.010,
  "eligible_competitions": [
    {
      "competition_name": "Peak Demand Response",
      "window_start": "2024-01-15T17:00:00Z",
      "window_end": "2024-01-15T19:00:00Z",
      "direction": "UP",
      "reward_rate_per_mwh": 150.00,
      "capacity_mw": 0.015,
      "duration_hours": 2.0,
      "earnings_gbp": 4.50
    }
  ],
  "total_earnings_gbp": 4.50
}
```

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling with custom design system
- **@tailwindcss/typography** - Enhanced typography
- **React** - UI components
- **Custom Design System** - Garet/Dosis fonts, brand colors, animations

## Design System

See [DESIGN.md](./DESIGN.md) for complete design system documentation including:
- Typography (Garet/Dosis fonts)
- Color palette (Atlantis, Orient, Sand, Gold)
- Light/Dark mode
- Animations (heartbeat-ping, float-slow, shimmer, stat-pop)
- Scroll reveal system
- Component patterns

## License

MIT
