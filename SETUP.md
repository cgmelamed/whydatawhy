# WhyDataWhy Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud like Supabase/Neon)
- Google Cloud Console account for OAuth
- Stripe account
- OpenAI API key

## Setup Steps

### 1. Database Setup

#### Option A: Using Supabase (Recommended for quick setup)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy the connection string

#### Option B: Local PostgreSQL
```bash
createdb whydatawhy
```

### 2. Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in the values:

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth Client ID
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

### 4. Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard → Developers → API keys
3. Create a product and price:
   ```bash
   # Using Stripe CLI
   stripe products create --name="Pro Plan"
   stripe prices create --product=PRODUCT_ID --unit-amount=500 --currency=usd --recurring[interval]=month
   ```
4. Copy the price ID to `STRIPE_PRICE_ID` in `.env.local`
5. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 5. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 6. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Production Deployment (Vercel)

1. Push code to GitHub
2. Import project on Vercel
3. Add environment variables in Vercel dashboard:
   - All variables from `.env.local`
   - Set `NEXTAUTH_URL` to your production URL
   - Update Google OAuth redirect URI to include production URL
4. Deploy

### Post-Deployment

1. Update Stripe webhook URL to production
2. Update Google OAuth redirect URIs
3. Run database migrations on production:
   ```bash
   npx prisma migrate deploy
   ```

## Testing Payments

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format: `postgresql://user:password@host:port/database`

### Auth Issues
- Verify NEXTAUTH_SECRET is set (generate with `openssl rand -base64 32`)
- Check Google OAuth redirect URIs match your domain

### Stripe Issues
- Ensure webhook secret is from the correct endpoint
- Check Stripe CLI is logged in for local testing: `stripe login`

## Support

For issues, check:
- Console logs in browser
- Server logs in terminal
- Vercel function logs (for production)