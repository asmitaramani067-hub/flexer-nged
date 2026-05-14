# Quick Start Guide

## 1. Install Dependencies

```bash
cd nged-cmz-estimator
npm install
```

## 2. Configure Backend API

Edit `.env.local` and set your backend API URL:

```env
BACKEND_API_URL=http://localhost:8000/api/estimate
```

## 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 4. Using the Estimator

1. Select a CMZ code from the dropdown
2. Enter your hardware specifications:
   - Battery capacity in kWh
   - Inverter capacity in kW
   - Solar panel capacity in kW
   - EV charger capacity in kW
   - Heat pump capacity in kW
3. Click "Calculate Earnings"
4. View your results showing:
   - Total UP and DOWN capacity
   - Eligible competitions
   - Projected earnings

## What-If Scenarios

Try different configurations to see how changes affect your earnings:
- "What if I upgrade my battery from 5kWh to 10kWh?"
- "What if I add solar panels?"
- "How much more could I earn with a larger inverter?"

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Follow the prompts to deploy your application.

### Environment Variables

Make sure to set `BACKEND_API_URL` in your production environment.

## Troubleshooting

### API Connection Issues

If you see "Failed to calculate earnings":
1. Check that your backend is running
2. Verify the `BACKEND_API_URL` in `.env.local`
3. Check browser console for detailed error messages

### No Eligible Competitions

If no competitions appear:
1. Verify your backend has active competitions for the selected CMZ code
2. Check that your capacities meet minimum requirements
3. Ensure the backend is returning data in the expected format
