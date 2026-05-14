# NGED CMZ Earning Estimator

A Next.js application for calculating potential earnings from energy assets in NGED CMZ zones. Built with TypeScript, Tailwind CSS, and PostgreSQL.

## Features

- **Modern UI** - Clean, responsive design with Decent Energy brand theme
- **Real-time Calculations** - Instant earnings estimates based on asset specifications
- **Database Integration** - Neon PostgreSQL with historical competition data
- **Asset Support** - Battery, Solar, EV Charger, Heat Pump, Inverter
- **Competition Analysis** - UP/DOWN trade opportunities with detailed breakdowns
- **Pagination** - Load more functionality for competition results
- **Custom Design System** - Garet/Dosis fonts, brand colors, smooth animations
- **TypeScript** - Full type safety across the application

## Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Neon PostgreSQL database (configured)

### Installation

```bash
# Clone the repository
git clone https://github.com/asmitaramani067-hub/flexer-nged.git
cd flexer-nged/nged-cmz-estimator

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your DATABASE_URL

# Seed the database
npm run seed-db

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=postgresql://neondb_owner:npg_4xuzRdIin6Vc@ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
```

See [DATABASE.md](./DATABASE.md) for detailed database configuration.

## Usage

1. Enter your **CMZ Code** (e.g., `CMZ_T10A_EM_0097`) - **Required**
2. Enter asset capacities (all optional):
   - Battery Capacity (kWh)
   - Inverter Capacity (kW)
   - Solar Capacity (kW)
   - EV Charger Capacity (kW)
   - Heat Pump Capacity (kW)
3. Click **Calculate Earnings**
4. View results:
   - Total UP/DOWN capacity
   - Eligible competitions
   - Earnings breakdown
   - Grand total earnings

## Project Structure

```
nged-cmz-estimator/
├── app/
│   ├── api/
│   │   └── estimate/
│   │       └── route.ts          # API endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main page
│   └── globals.css               # Global styles
├── components/
│   ├── EstimatorForm.tsx         # Input form
│   ├── ResultsDisplay.tsx        # Results display
│   ├── Header.tsx                # Header component
│   └── LoadingSpinner.tsx        # Loading state
├── lib/
│   ├── estimator.ts              # Earnings calculation logic
│   └── db.ts                     # Database connection
├── scripts/
│   ├── seed-neon.ts              # Database seeding
│   ├── test-db.ts                # Connection testing
│   ├── check-schema.ts           # Schema inspection
│   └── migrate-to-neon.ts        # Data migration
├── types/
│   └── estimator.ts              # TypeScript types
└── public/
    └── fonts/                    # Garet font files
```

## Database

The application uses **Neon PostgreSQL** with three main tables:
- `trade_opportunity_versions` - Competition opportunities
- `nged_windows` - Competition windows
- `nged_delivery_periods` - Delivery time slots

See [DATABASE.md](./DATABASE.md) for:
- Schema details
- Seeding instructions
- Query examples
- Migration guide

## Deployment

Deploy to Vercel in minutes:

1. Import project from GitHub
2. Set `DATABASE_URL` environment variable
3. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run seed-db    # Seed database with sample data
npm run test-db    # Test database connection
```

## Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **PostgreSQL** - Database (Neon)
- **pg** - PostgreSQL client
- **React 19** - UI library

## Design System

The application follows the Decent Energy brand theme:

- **Fonts:** Garet (headings), Dosis (body)
- **Colors:** Blue Dark (#0c4f70), Green Light (#a4c853), Gold (#f5c842), Sand (#f5f1e9)
- **Animations:** Heartbeat-ping, float-slow, shimmer, stat-pop
- **Scroll Reveals:** Up, left, right, scale, fade

See [DESIGN.md](./DESIGN.md) for complete design documentation.

## Documentation

- [QUICKSTART.md](./QUICKSTART.md) - Quick setup guide
- [DATABASE.md](./DATABASE.md) - Database configuration
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [DESIGN.md](./DESIGN.md) - Design system
- [FONTS_SETUP.md](./FONTS_SETUP.md) - Font configuration

## License

MIT
