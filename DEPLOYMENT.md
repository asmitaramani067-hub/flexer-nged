# Deployment Guide

## Vercel Deployment

### Prerequisites

1. GitHub repository: `https://github.com/asmitaramani067-hub/flexer-nged.git`
2. Neon PostgreSQL database (already configured)
3. Vercel account

### Steps

#### 1. Import Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import from GitHub: `asmitaramani067-hub/flexer-nged`
4. Select the `nged-cmz-estimator` directory as the root

#### 2. Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://neondb_owner:npg_4xuzRdIin6Vc@ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Important:** Add this for all environments (Production, Preview, Development)

#### 3. Configure Build Settings

- **Framework Preset:** Next.js
- **Root Directory:** `nged-cmz-estimator`
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

#### 4. Deploy

Click "Deploy" and wait for the build to complete.

### Post-Deployment

#### Seed the Database (First Time Only)

After the first deployment, you need to seed the database with sample data:

**Option 1: Local seeding (recommended)**
```bash
npm run seed-db
```

**Option 2: Via Vercel CLI**
```bash
vercel env pull .env.local
npm run seed-db
```

#### Verify Deployment

1. Visit your Vercel deployment URL
2. Test with sample data:
   - CMZ Code: `CMZ_T10A_EM_0097`
   - Battery: 20 kWh
   - Inverter: 5 kW
   - Solar: 4 kW
   - EV: 8 kW
   - Heat Pump: 20 kW

3. You should see earnings calculations with competition results

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Monitoring

- **Logs:** Vercel Dashboard → Deployments → [Select deployment] → Logs
- **Analytics:** Vercel Dashboard → Analytics
- **Database:** Neon Dashboard at [console.neon.tech](https://console.neon.tech)

### Troubleshooting

#### Database Connection Issues

If you see "connection is insecure" errors:
- Verify `DATABASE_URL` includes `?sslmode=require`
- Check Neon database is active (not paused)

#### Build Failures

- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript has no errors: `npm run build` locally

#### API Route Errors

- Check function logs in Vercel dashboard
- Verify environment variables are set correctly
- Test API endpoint: `https://your-domain.vercel.app/api/estimate`

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |

### Database Maintenance

#### Backup

Neon provides automatic backups. To create a manual backup:
1. Go to Neon Console
2. Select your project
3. Go to "Backups" tab
4. Click "Create backup"

#### Update Data

To refresh competition data:
```bash
npm run seed-db
```

Or run the migration script if you have access to staging DB:
```bash
npx tsx scripts/migrate-to-neon.ts
```

### Performance Optimization

The app is configured with:
- Connection pooling (max 5 connections)
- 30-second idle timeout
- 5-second connection timeout
- Automatic SSL with Neon

For production, consider:
- Adding Redis caching for competition data
- Implementing rate limiting on API routes
- Adding monitoring with Sentry or similar

### Continuous Deployment

Vercel automatically deploys:
- **Production:** Pushes to `main` branch
- **Preview:** Pull requests and other branches

To disable auto-deployment:
1. Project Settings → Git
2. Configure deployment branches

### Cost Considerations

- **Vercel:** Free tier includes 100GB bandwidth/month
- **Neon:** Free tier includes 0.5GB storage, 1 compute unit
- Monitor usage in respective dashboards

### Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Neon Docs: [neon.tech/docs](https://neon.tech/docs)
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)
