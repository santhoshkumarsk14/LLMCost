import Stripe from 'stripe';

let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
  });
}

export default stripe;