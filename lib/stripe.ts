import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: 'Free',
    queries: 10,
    price: 0,
  },
  PRO: {
    name: 'Pro',
    queries: -1, // Unlimited
    price: 5,
    stripePriceId: process.env.STRIPE_PRICE_ID!, // Monthly price ID from Stripe
  },
};