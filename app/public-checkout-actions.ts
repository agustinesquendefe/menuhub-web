'use server';

import { redirect } from 'next/navigation';
import { stripe } from '@/lib/payments/stripe';

export async function publicServiceCheckoutAction() {
  const subscriptionPriceId = process.env.PRICE_ID;
  const setupPriceId = process.env.SETUP_PRICE_ID;

  if (!subscriptionPriceId) {
    redirect('/pricing');
  }

  const lineItems = [];
  if (setupPriceId) {
    lineItems.push({
      price: setupPriceId,
      quantity: 1,
    });
  }
  lineItems.push({
    price: subscriptionPriceId,
    quantity: 1,
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'subscription',
    success_url: `${process.env.BASE_URL}/sign-up?service=paid&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/`,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        source: 'public_service_checkout',
      },
    },
    metadata: {
      source: 'public_service_checkout',
    },
  });

  redirect(session.url!);
}
