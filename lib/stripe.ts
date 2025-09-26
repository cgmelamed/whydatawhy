import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export const getStripe = () => {
  if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }
  return stripeInstance!;
};

export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    return getStripe()[prop as keyof Stripe];
  }
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